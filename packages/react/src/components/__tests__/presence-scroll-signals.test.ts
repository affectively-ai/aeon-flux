import { describe, expect, test } from 'bun:test';
import type { PresenceUser } from '../../provider';
import {
  buildScrollDensityMap,
  buildScrollSignals,
  shouldCommitLocalDepthUpdate,
  sortScrollSignalsForLegend,
  sortScrollSignalsForRail,
} from '../presence-scroll-signals';

const FIXED_NOW = Date.UTC(2026, 1, 13, 12, 0, 0);

function createPresenceUser(
  userId: string,
  depth: number,
  overrides: Partial<PresenceUser> = {},
): PresenceUser {
  return {
    userId,
    role: 'user',
    status: 'online',
    lastActivity: new Date(FIXED_NOW).toISOString(),
    scroll: { depth },
    ...overrides,
  };
}

describe('presence scroll signal model', () => {
  test('buildScrollSignals is deterministic and prioritizes local + active users', () => {
    const users: PresenceUser[] = [
      createPresenceUser('remote-idle', 0.22),
      createPresenceUser('local-user', 0.41),
      createPresenceUser('remote-typing', 0.65, {
        typing: { isTyping: true, field: 'title' },
      }),
      createPresenceUser('remote-focused', 0.53, {
        focusNode: 'node:alpha',
      }),
    ];

    const first = buildScrollSignals(users, {
      localUserId: 'local-user',
      markerLimit: 8,
      now: FIXED_NOW,
    });
    const second = buildScrollSignals(users, {
      localUserId: 'local-user',
      markerLimit: 8,
      now: FIXED_NOW,
    });

    expect(
      first.map((signal) => ({
        userId: signal.userId,
        laneOffsetPx: signal.laneOffsetPx,
        activity: Number(signal.activity.toFixed(6)),
      })),
    ).toEqual(
      second.map((signal) => ({
        userId: signal.userId,
        laneOffsetPx: signal.laneOffsetPx,
        activity: Number(signal.activity.toFixed(6)),
      })),
    );
    expect(first[0]?.userId).toBe('local-user');

    const remoteTyping = first.find((signal) => signal.userId === 'remote-typing');
    const remoteIdle = first.find((signal) => signal.userId === 'remote-idle');
    expect(remoteTyping).toBeDefined();
    expect(remoteIdle).toBeDefined();
    expect((remoteTyping?.activity ?? 0) > (remoteIdle?.activity ?? 0)).toBe(
      true,
    );
  });

  test('buildScrollDensityMap peaks near clustered collaborator depths', () => {
    const users: PresenceUser[] = [
      createPresenceUser('cluster-a', 0.48),
      createPresenceUser('cluster-b', 0.5),
      createPresenceUser('cluster-c', 0.52),
      createPresenceUser('cluster-d', 0.55),
      createPresenceUser('outlier-top', 0.08),
    ];

    const signals = sortScrollSignalsForRail(
      buildScrollSignals(users, { now: FIXED_NOW, markerLimit: 16 }),
    );
    const density = buildScrollDensityMap(signals, 16);
    const peak = Math.max(...density);
    const peakIndex = density.findIndex((value) => value === peak);

    expect(peak).toBeGreaterThan(0.8);
    expect(peakIndex).toBeGreaterThanOrEqual(6);
    expect(peakIndex).toBeLessThanOrEqual(10);
  });

  test('commit-budget gating avoids high-frequency local depth commits', () => {
    const epsilon = 0.0025;
    let previousDepth = 0;
    let commitCount = 0;

    for (let index = 1; index <= 2000; index += 1) {
      const nextDepth = index / 2000;
      if (shouldCommitLocalDepthUpdate(previousDepth, nextDepth, epsilon)) {
        previousDepth = nextDepth;
        commitCount += 1;
      }
    }

    expect(commitCount).toBeGreaterThan(300);
    expect(commitCount).toBeLessThan(450);
  });

  test('stress budget supports 50-200 marker rails within frame budget', () => {
    const measureAverageFrameMs = (count: number, iterations: number): number => {
      const users = Array.from({ length: count }, (_, index) =>
        createPresenceUser(`load-user-${index}`, (index + 1) / (count + 2), {
          lastActivity: new Date(FIXED_NOW - index * 1400).toISOString(),
          typing:
            index % 17 === 0 ? { isTyping: true, field: 'note' } : undefined,
          focusNode: index % 9 === 0 ? `node:${index}` : undefined,
          selection:
            index % 11 === 0
              ? { start: 0, end: 4, direction: 'forward' }
              : undefined,
          inputState:
            index % 13 === 0
              ? { field: 'composer', hasFocus: true, valueLength: 8 }
              : undefined,
        }),
      );

      const start = performance.now();
      for (let iteration = 0; iteration < iterations; iteration += 1) {
        const signals = buildScrollSignals(users, {
          markerLimit: count,
          now: FIXED_NOW + iteration * 10,
        });
        const rail = sortScrollSignalsForRail(signals);
        const legend = sortScrollSignalsForLegend(signals, 8);
        const density = buildScrollDensityMap(rail, 20);
        expect(density.length).toBe(20);
        expect(legend.length).toBeLessThanOrEqual(8);
      }

      return (performance.now() - start) / iterations;
    };

    const avg50 = measureAverageFrameMs(50, 400);
    const avg200 = measureAverageFrameMs(200, 250);

    expect(avg50).toBeLessThan(2.5);
    expect(avg200).toBeLessThan(6);
  });
});
