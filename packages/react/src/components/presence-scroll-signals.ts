import type { PresenceUser } from '../provider';

export const DEFAULT_SCROLL_ACCENT = '#3b82f6';
export const DEFAULT_SCROLL_MARKER_LIMIT = 32;
export const DEFAULT_SCROLL_DENSITY_BUCKETS = 16;
export const DEFAULT_SCROLL_ACTIVITY_WINDOW_MS = 120000;
export const DEFAULT_LOCAL_SCROLL_DEPTH_EPSILON = 0.0025;

const USER_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#14b8a6',
  '#f97316',
  '#ec4899',
  '#84cc16',
];

export interface PresenceScrollSignal {
  user: PresenceUser;
  userId: string;
  label: string;
  shortLabel: string;
  depth: number;
  color: string;
  isLocal: boolean;
  activity: number;
  laneOffsetPx: number;
  socialSignal: string;
}

export interface BuildScrollSignalsOptions {
  localUserId?: string;
  markerLimit?: number;
  now?: number;
  laneSpacingPx?: number;
  laneCount?: number;
  activityWindowMs?: number;
}

export function clampDepth(depth: number): number {
  return Math.max(0, Math.min(1, depth));
}

export function hashPresenceColor(userId: string): string {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index);
    hash |= 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function displayPresenceUser(userId: string): string {
  return userId.length > 10 ? userId.slice(0, 8) : userId;
}

export function hashLaneOffset(
  userId: string,
  laneSpacingPx = 4,
  laneCount = 5,
): number {
  if (laneCount <= 1) {
    return 0;
  }

  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index);
    hash |= 0;
  }

  const lane = Math.abs(hash) % laneCount;
  const centeredLane = lane - (laneCount - 1) / 2;
  return Math.round(centeredLane * laneSpacingPx);
}

export function summarizeScrollSignal(user: PresenceUser): string {
  const signals: string[] = [];

  if (user.typing?.isTyping) {
    signals.push('typing');
  }
  if (user.focusNode) {
    signals.push('focused');
  }
  if (user.selection) {
    signals.push('selecting');
  }
  if (user.inputState?.hasFocus) {
    signals.push('editing');
  }
  if (user.emotion?.primary) {
    signals.push(user.emotion.primary);
  }

  if (signals.length === 0) {
    signals.push(user.status);
  }

  return signals.join(' · ');
}

export function computeScrollActivity(
  user: PresenceUser,
  now: number,
  activityWindowMs = DEFAULT_SCROLL_ACTIVITY_WINDOW_MS,
): number {
  let activity = 0.15;

  if (user.status === 'online') activity += 0.2;
  if (user.status === 'away') activity += 0.06;
  if (user.typing?.isTyping) activity += 0.22;
  if (user.focusNode) activity += 0.12;
  if (user.selection) activity += 0.08;
  if (user.inputState?.hasFocus) activity += 0.1;
  if (user.editing) activity += 0.08;

  if (user.emotion) {
    const emotionIntensity = clampDepth(
      user.emotion.intensity ?? user.emotion.confidence ?? 0.3,
    );
    activity += 0.08 + emotionIntensity * 0.12;
  }

  const lastActivityAt = Date.parse(user.lastActivity);
  if (!Number.isNaN(lastActivityAt)) {
    const ageMs = Math.max(0, now - lastActivityAt);
    const freshness = 1 - Math.min(1, ageMs / activityWindowMs);
    activity *= 0.35 + freshness * 0.65;
  }

  return clampDepth(activity);
}

export function buildScrollSignals(
  presence: PresenceUser[],
  {
    localUserId,
    markerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
    now = Date.now(),
    laneSpacingPx = 4,
    laneCount = 5,
    activityWindowMs = DEFAULT_SCROLL_ACTIVITY_WINDOW_MS,
  }: BuildScrollSignalsOptions = {},
): PresenceScrollSignal[] {
  const normalizedLimit = Math.max(0, Math.trunc(markerLimit));

  if (normalizedLimit === 0) {
    return [];
  }

  const signals = presence
    .filter(
      (
        user,
      ): user is PresenceUser & {
        scroll: NonNullable<PresenceUser['scroll']>;
      } => Boolean(user.scroll),
    )
    .map((user) => {
      const shortLabel = displayPresenceUser(user.userId);
      return {
        user,
        userId: user.userId,
        label: shortLabel,
        shortLabel,
        depth: clampDepth(user.scroll.depth),
        color: hashPresenceColor(user.userId),
        isLocal: user.userId === localUserId,
        activity: computeScrollActivity(user, now, activityWindowMs),
        laneOffsetPx: 0,
        socialSignal: summarizeScrollSignal(user),
      };
    })
    .sort((left, right) => {
      if (left.isLocal !== right.isLocal) {
        return left.isLocal ? -1 : 1;
      }
      if (right.activity !== left.activity) {
        return right.activity - left.activity;
      }
      return left.userId.localeCompare(right.userId);
    })
    .slice(0, normalizedLimit);

  return signals.map((signal, index) => ({
    ...signal,
    laneOffsetPx: signal.isLocal
      ? 0
      : hashLaneOffset(signal.userId, laneSpacingPx, laneCount) + ((index % 3) - 1),
  }));
}

export function sortScrollSignalsForRail(
  signals: PresenceScrollSignal[],
): PresenceScrollSignal[] {
  return [...signals].sort((left, right) => left.depth - right.depth);
}

export function sortScrollSignalsForLegend(
  signals: PresenceScrollSignal[],
  limit = 8,
): PresenceScrollSignal[] {
  return [...signals]
    .sort((left, right) => {
      if (right.activity !== left.activity) {
        return right.activity - left.activity;
      }
      return left.depth - right.depth;
    })
    .slice(0, Math.max(0, Math.trunc(limit)));
}

export function buildScrollDensityMap(
  signals: PresenceScrollSignal[],
  bucketCount = DEFAULT_SCROLL_DENSITY_BUCKETS,
): number[] {
  const buckets = Array.from(
    { length: Math.max(1, Math.trunc(bucketCount)) },
    () => 0,
  );

  if (signals.length === 0) {
    return buckets;
  }

  const normalizedBucketCount = buckets.length;
  for (const signal of signals) {
    const bucketIndex = Math.min(
      normalizedBucketCount - 1,
      Math.max(0, Math.round(signal.depth * (normalizedBucketCount - 1))),
    );
    const weight = 0.2 + signal.activity * 0.8;
    buckets[bucketIndex] += weight;

    if (bucketIndex > 0) {
      buckets[bucketIndex - 1] += weight * 0.28;
    }
    if (bucketIndex < normalizedBucketCount - 1) {
      buckets[bucketIndex + 1] += weight * 0.28;
    }
  }

  const peak = Math.max(1, ...buckets);
  return buckets.map((value) => clampDepth(value / peak));
}

export function shouldCommitLocalDepthUpdate(
  previousDepth: number,
  nextDepth: number,
  epsilon = DEFAULT_LOCAL_SCROLL_DEPTH_EPSILON,
): boolean {
  const delta = Math.abs(nextDepth - previousDepth);
  return delta >= epsilon || nextDepth === 0 || nextDepth === 1;
}
