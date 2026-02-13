'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { PresenceScroll, PresenceUser } from '../provider';

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

function hashColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function displayUser(userId: string): string {
  return userId.length > 10 ? userId.slice(0, 8) : userId;
}

function clampDepth(depth: number): number {
  return Math.max(0, Math.min(1, depth));
}

function formatLastActivity(lastActivity?: string): string {
  if (!lastActivity) return 'unknown activity';
  const ts = Date.parse(lastActivity);
  if (Number.isNaN(ts)) return lastActivity;
  const deltaMs = Date.now() - ts;
  const deltaSec = Math.max(0, Math.floor(deltaMs / 1000));
  if (deltaSec < 10) return 'just now';
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHour = Math.floor(deltaMin / 60);
  if (deltaHour < 24) return `${deltaHour}h ago`;
  const deltaDay = Math.floor(deltaHour / 24);
  return `${deltaDay}d ago`;
}

function panelStyle(base?: CSSProperties): CSSProperties {
  return {
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 12,
    background: '#ffffff',
    ...base,
  };
}

const DEFAULT_SCROLL_ACCENT = '#3b82f6';
const DEFAULT_SCROLL_MARKER_LIMIT = 32;
const SCROLL_DENSITY_BUCKETS = 16;
const SCROLL_ACTIVITY_WINDOW_MS = 120000;
const LOCAL_SCROLL_DEPTH_EPSILON = 0.0025;

interface PresenceScrollSignal {
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

function hashLaneOffset(
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

function computeScrollActivity(user: PresenceUser, now: number): number {
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
    const freshness = 1 - Math.min(1, ageMs / SCROLL_ACTIVITY_WINDOW_MS);
    activity *= 0.35 + freshness * 0.65;
  }

  return clampDepth(activity);
}

function summarizeScrollSignal(user: PresenceUser): string {
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

function buildScrollSignals(
  presence: PresenceUser[],
  localUserId?: string,
  markerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
): PresenceScrollSignal[] {
  const now = Date.now();
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
      const shortLabel = displayUser(user.userId);
      return {
        user,
        userId: user.userId,
        label: shortLabel,
        shortLabel,
        depth: clampDepth(user.scroll.depth),
        color: hashColor(user.userId),
        isLocal: user.userId === localUserId,
        activity: computeScrollActivity(user, now),
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
      : hashLaneOffset(signal.userId, 4, 5) + ((index % 3) - 1),
  }));
}

function buildScrollDensityMap(
  signals: PresenceScrollSignal[],
  bucketCount = SCROLL_DENSITY_BUCKETS,
): number[] {
  const buckets = Array.from({ length: bucketCount }, () => 0);

  if (signals.length === 0) {
    return buckets;
  }

  for (const signal of signals) {
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.max(0, Math.round(signal.depth * (bucketCount - 1))),
    );
    const weight = 0.2 + signal.activity * 0.8;
    buckets[bucketIndex] += weight;

    if (bucketIndex > 0) {
      buckets[bucketIndex - 1] += weight * 0.28;
    }
    if (bucketIndex < bucketCount - 1) {
      buckets[bucketIndex + 1] += weight * 0.28;
    }
  }

  const peak = Math.max(1, ...buckets);
  return buckets.map((value) => clampDepth(value / peak));
}

export interface PresenceCursorLayerProps {
  presence: PresenceUser[];
  localUserId?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function PresenceCursorLayer({
  presence,
  localUserId,
  width = '100%',
  height = 320,
  className,
}: PresenceCursorLayerProps) {
  const users = presence.filter((user) => user.userId !== localUserId && user.cursor);

  return (
    <div
      className={className}
      style={panelStyle({
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
      })}
    >
      {users.map((user) => {
        if (!user.cursor) return null;
        const color = hashColor(user.userId);

        return (
          <div
            key={user.userId}
            style={{
              position: 'absolute',
              left: user.cursor.x,
              top: user.cursor.y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid #ffffff',
                background: color,
                boxShadow: '0 1px 6px rgba(0,0,0,0.2)',
              }}
            />
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: '#111827',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 999,
                background: '#ffffff',
                border: `1px solid ${color}`,
                whiteSpace: 'nowrap',
              }}
            >
              {displayUser(user.userId)}
            </div>
          </div>
        );
      })}
      {users.length === 0 && (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No remote cursors</div>
      )}
    </div>
  );
}

export interface PresenceFocusListProps {
  presence: PresenceUser[];
  localUserId?: string;
  maxItems?: number;
  className?: string;
}

export function PresenceFocusList({
  presence,
  localUserId,
  maxItems = 8,
  className,
}: PresenceFocusListProps) {
  const focused = presence
    .filter((user) => user.userId !== localUserId && user.focusNode)
    .slice(0, maxItems);

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Focus Nodes
      </div>
      {focused.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No remote focus</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {focused.map((user) => (
            <div
              key={user.userId}
              style={{
                border: `1px solid ${hashColor(user.userId)}44`,
                borderRadius: 8,
                padding: '6px 8px',
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 600 }}>{displayUser(user.userId)}</span>{' '}
              <span style={{ color: '#6b7280' }}>focused</span>{' '}
              <code style={{ color: '#111827' }}>{user.focusNode}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface PresenceTypingListProps {
  presence: PresenceUser[];
  localUserId?: string;
  className?: string;
}

export function PresenceTypingList({
  presence,
  localUserId,
  className,
}: PresenceTypingListProps) {
  const typing = presence.filter(
    (user) => user.userId !== localUserId && user.typing?.isTyping,
  );

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Typing
      </div>
      {typing.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No one is typing</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {typing.map((user) => (
            <div
              key={user.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                borderRadius: 8,
                padding: '6px 8px',
                background: '#f9fafb',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: hashColor(user.userId),
                }}
              />
              <span style={{ fontWeight: 600 }}>{displayUser(user.userId)}</span>
              <span style={{ color: '#6b7280' }}>
                {user.typing?.field ? `typing in ${user.typing.field}` : 'typing'}
              </span>
              {user.typing?.isComposing ? (
                <span style={{ color: '#92400e' }}>(composing)</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface PresenceSelectionListProps {
  presence: PresenceUser[];
  localUserId?: string;
  className?: string;
}

export function PresenceSelectionList({
  presence,
  localUserId,
  className,
}: PresenceSelectionListProps) {
  const selections = presence.filter(
    (user) => user.userId !== localUserId && user.selection,
  );

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Selections
      </div>
      {selections.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No active selections</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {selections.map((user) => (
            <div
              key={user.userId}
              style={{
                borderLeft: `4px solid ${hashColor(user.userId)}`,
                paddingLeft: 8,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600 }}>{displayUser(user.userId)}</div>
              <div style={{ color: '#6b7280' }}>
                {user.selection?.path ?? 'document'}: {user.selection?.start} -{' '}
                {user.selection?.end}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface PresenceScrollBarProps {
  presence: PresenceUser[];
  localUserId?: string;
  height?: number;
  className?: string;
  accentColor?: string;
  markerLimit?: number;
  showLegend?: boolean;
}

export function PresenceScrollBar({
  presence,
  localUserId,
  height = 220,
  className,
  accentColor = DEFAULT_SCROLL_ACCENT,
  markerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
  showLegend = true,
}: PresenceScrollBarProps) {
  const signals = useMemo(
    () => buildScrollSignals(presence, localUserId, markerLimit),
    [localUserId, markerLimit, presence],
  );
  const trackSignals = useMemo(
    () => [...signals].sort((left, right) => left.depth - right.depth),
    [signals],
  );
  const density = useMemo(() => buildScrollDensityMap(trackSignals), [trackSignals]);
  const legendSignals = useMemo(
    () =>
      [...signals]
        .sort((left, right) => {
          if (right.activity !== left.activity) {
            return right.activity - left.activity;
          }
          return left.depth - right.depth;
        })
        .slice(0, 8),
    [signals],
  );

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Scroll Presence
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showLegend ? '24px minmax(0, 1fr)' : '24px',
          gap: 12,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 24,
            height,
            borderRadius: 999,
            background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 8%, #f8fafc), #e5e7eb)`,
            boxShadow:
              'inset 0 0 0 1px rgba(148, 163, 184, 0.28), inset 0 12px 20px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
          }}
        >
          {density.map((value, index) => {
            const top = (index / density.length) * 100;
            const segmentHeight = 100 / density.length + 0.8;
            return (
              <span
                key={`density-${index}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${top.toFixed(3)}%`,
                  height: `${segmentHeight.toFixed(3)}%`,
                  background: `color-mix(in srgb, ${accentColor} ${(10 + value * 36).toFixed(2)}%, #dbe4f4)`,
                  opacity: (0.12 + value * 0.62).toFixed(3),
                  pointerEvents: 'none',
                }}
              />
            );
          })}
          {trackSignals.map((signal) => {
            const markerSize = 6 + signal.activity * (signal.isLocal ? 4 : 3.5);
            const markerScale = 0.84 + signal.activity * 0.36;
            const markerColor = signal.color;
            const glowColor = `color-mix(in srgb, ${markerColor} ${(40 + signal.activity * 42).toFixed(1)}%, transparent)`;
            return (
              <span
                key={signal.userId}
                title={`${signal.label}: ${Math.round(signal.depth * 100)}% · ${signal.socialSignal}`}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${signal.laneOffsetPx}px)`,
                  top: `${(signal.depth * 100).toFixed(3)}%`,
                  width: markerSize,
                  height: markerSize,
                  transform: `translate(-50%, -50%) scale(${markerScale.toFixed(3)})`,
                  borderRadius: 999,
                  border: signal.isLocal
                    ? `1px solid color-mix(in srgb, ${accentColor} 72%, #ffffff)`
                    : '1px solid rgba(255,255,255,0.72)',
                  background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${markerColor} 38%, #ffffff), ${markerColor})`,
                  boxShadow: `0 0 0 1px rgba(15,23,42,0.32), 0 0 ${(8 + signal.activity * 14).toFixed(1)}px ${glowColor}`,
                }}
              />
            );
          })}
        </div>
        {showLegend ? (
          <div style={{ display: 'grid', gap: 7, fontSize: 12, minWidth: 0 }}>
            {legendSignals.length === 0 ? (
              <div style={{ color: '#6b7280' }}>No scroll telemetry yet</div>
            ) : (
              legendSignals.map((signal) => {
                const depthPct = Math.round(signal.depth * 100);
                const activityPct = Math.round(signal.activity * 100);
                return (
                  <div
                    key={`legend-${signal.userId}`}
                    style={{
                      display: 'grid',
                      gap: 3,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(64px, auto) minmax(0, 1fr) auto',
                        gap: 8,
                        alignItems: 'center',
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: signal.isLocal ? 700 : 600,
                          color: signal.isLocal ? '#111827' : '#1f2937',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {signal.shortLabel}
                      </span>
                      <span
                        style={{
                          position: 'relative',
                          height: 5,
                          borderRadius: 999,
                          background: '#e5e7eb',
                          overflow: 'hidden',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${Math.max(6, depthPct)}%`,
                            borderRadius: 999,
                            background: signal.color,
                          }}
                        />
                      </span>
                      <span
                        style={{
                          color: '#6b7280',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {depthPct}%
                      </span>
                    </div>
                    <div
                      style={{
                        color: '#9ca3af',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{signal.socialSignal}</span>
                      <span style={{ color: '#cbd5e1' }}>·</span>
                      <span>{activityPct}% active</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface PresenceViewportListProps {
  presence: PresenceUser[];
  localUserId?: string;
  className?: string;
}

export function PresenceViewportList({
  presence,
  localUserId,
  className,
}: PresenceViewportListProps) {
  const users = presence.filter(
    (user) => user.userId !== localUserId && user.viewport,
  );

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Viewports
      </div>
      {users.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No viewport data</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {users.map((user) => {
            const viewport = user.viewport;
            if (!viewport) return null;
            const ratio = viewport.width / Math.max(1, viewport.height);
            return (
              <div key={user.userId} style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{displayUser(user.userId)}</span>{' '}
                  <span style={{ color: '#6b7280' }}>
                    {viewport.width}x{viewport.height}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: '#e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(10, ratio * 40))}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: hashColor(user.userId),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface PresenceInputStateListProps {
  presence: PresenceUser[];
  localUserId?: string;
  className?: string;
}

export function PresenceInputStateList({
  presence,
  localUserId,
  className,
}: PresenceInputStateListProps) {
  const users = presence.filter(
    (user) => user.userId !== localUserId && user.inputState,
  );

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Input States
      </div>
      {users.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No active input state</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {users.map((user) => {
            const state = user.inputState;
            if (!state) return null;
            return (
              <div
                key={user.userId}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  fontSize: 12,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: '#f9fafb',
                }}
              >
                <span style={{ fontWeight: 600 }}>{displayUser(user.userId)}</span>
                <span style={{ color: '#6b7280' }}>{state.field}</span>
                <span>{state.hasFocus ? 'focused' : 'blurred'}</span>
                {state.selectionStart !== undefined && state.selectionEnd !== undefined ? (
                  <span style={{ color: '#6b7280' }}>
                    caret {state.selectionStart}-{state.selectionEnd}
                  </span>
                ) : null}
                {state.valueLength !== undefined ? (
                  <span style={{ color: '#6b7280' }}>len {state.valueLength}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface PresenceEmotionListProps {
  presence: PresenceUser[];
  localUserId?: string;
  className?: string;
}

export function PresenceEmotionList({
  presence,
  localUserId,
  className,
}: PresenceEmotionListProps) {
  const users = presence.filter(
    (user) => user.userId !== localUserId && user.emotion,
  );

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Emotion Channel
      </div>
      {users.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No emotion signal</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {users.map((user) => {
            const emotion = user.emotion;
            if (!emotion) return null;
            const intensity = Math.max(
              0,
              Math.min(1, emotion.intensity ?? emotion.confidence ?? 0),
            );
            return (
              <div key={user.userId} style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{displayUser(user.userId)}</span>{' '}
                  <span style={{ color: '#6b7280' }}>
                    {emotion.primary ?? 'unspecified'}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: '#e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(intensity * 100)}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: hashColor(user.userId),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface PresenceEditingListProps {
  presence: PresenceUser[];
  localUserId?: string;
  className?: string;
}

export function PresenceEditingList({
  presence,
  localUserId,
  className,
}: PresenceEditingListProps) {
  const users = presence.filter((user) => user.userId !== localUserId && user.editing);

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Editing Targets
      </div>
      {users.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No active edit targets</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {users.map((user) => (
            <div
              key={user.userId}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 600 }}>{displayUser(user.userId)}</span>
              <code style={{ color: '#6b7280' }}>{user.editing}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface PresenceStatusListProps {
  presence: PresenceUser[];
  localUserId?: string;
  className?: string;
}

export function PresenceStatusList({
  presence,
  localUserId,
  className,
}: PresenceStatusListProps) {
  const users = presence.filter((user) => user.userId !== localUserId);

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Status
      </div>
      {users.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No collaborators online</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {users.map((user) => {
            const color =
              user.status === 'online'
                ? '#10b981'
                : user.status === 'away'
                  ? '#f59e0b'
                  : '#9ca3af';
            return (
              <div
                key={user.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                  }}
                />
                <span style={{ fontWeight: 600 }}>{displayUser(user.userId)}</span>
                <span style={{ color: '#6b7280' }}>
                  {user.role} {user.status}
                </span>
                <span style={{ color: '#9ca3af' }}>
                  {formatLastActivity(user.lastActivity)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface PresenceElementsPanelProps {
  presence: PresenceUser[];
  localUserId?: string;
  className?: string;
  showCursorLayer?: boolean;
  cursorLayerHeight?: number | string;
  scrollBarAccentColor?: string;
  scrollBarMarkerLimit?: number;
  showScrollLegend?: boolean;
}

export function PresenceElementsPanel({
  presence,
  localUserId,
  className,
  showCursorLayer = true,
  cursorLayerHeight = 220,
  scrollBarAccentColor = DEFAULT_SCROLL_ACCENT,
  scrollBarMarkerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
  showScrollLegend = true,
}: PresenceElementsPanelProps) {
  return (
    <div className={className} style={{ display: 'grid', gap: 10 }}>
      {showCursorLayer ? (
        <PresenceCursorLayer
          presence={presence}
          localUserId={localUserId}
          height={cursorLayerHeight}
        />
      ) : null}
      <PresenceStatusList presence={presence} localUserId={localUserId} />
      <PresenceEditingList presence={presence} localUserId={localUserId} />
      <PresenceTypingList presence={presence} localUserId={localUserId} />
      <PresenceFocusList presence={presence} localUserId={localUserId} />
      <PresenceSelectionList presence={presence} localUserId={localUserId} />
      <PresenceScrollBar
        presence={presence}
        localUserId={localUserId}
        accentColor={scrollBarAccentColor}
        markerLimit={scrollBarMarkerLimit}
        showLegend={showScrollLegend}
      />
      <PresenceViewportList presence={presence} localUserId={localUserId} />
      <PresenceInputStateList presence={presence} localUserId={localUserId} />
      <PresenceEmotionList presence={presence} localUserId={localUserId} />
    </div>
  );
}

export interface CollaborativePresenceScrollContainerProps {
  children: ReactNode;
  presence: PresenceUser[];
  localUserId?: string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  accentColor?: string;
  markerLimit?: number;
  onScrollStateChange?: (scroll: PresenceScroll) => void;
}

export function CollaborativePresenceScrollContainer({
  children,
  presence,
  localUserId,
  height = 320,
  className,
  style,
  accentColor = DEFAULT_SCROLL_ACCENT,
  markerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
  onScrollStateChange,
}: CollaborativePresenceScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [localDepth, setLocalDepth] = useState(0);
  const localDepthRef = useRef(0);
  const frameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const markers = useMemo(
    () =>
      buildScrollSignals(presence, localUserId, markerLimit).filter(
        (signal) => !signal.isLocal,
      ),
    [localUserId, markerLimit, presence],
  );
  const density = useMemo(() => buildScrollDensityMap(markers), [markers]);

  const publishScrollState = useCallback(
    (element: HTMLDivElement) => {
      const denominator = Math.max(1, element.scrollHeight - element.clientHeight);
      const depth = clampDepth(element.scrollTop / denominator);
      const depthDelta = Math.abs(depth - localDepthRef.current);
      const shouldCommitDepth =
        depthDelta >= LOCAL_SCROLL_DEPTH_EPSILON || depth === 0 || depth === 1;

      if (shouldCommitDepth) {
        localDepthRef.current = depth;
        setLocalDepth(depth);
      }

      onScrollStateChange?.({
        depth,
        y: element.scrollTop,
        viewportHeight: element.clientHeight,
        documentHeight: element.scrollHeight,
      });
    },
    [onScrollStateChange],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const scheduleUpdate = () => {
      if (typeof window === 'undefined') {
        publishScrollState(element);
        return;
      }

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        publishScrollState(element);
      });
    };

    scheduleUpdate();
    element.addEventListener('scroll', scheduleUpdate, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleUpdate();
          })
        : null;
    resizeObserver?.observe(element);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', scheduleUpdate, { passive: true });
    }

    return () => {
      element.removeEventListener('scroll', scheduleUpdate);
      resizeObserver?.disconnect();

      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', scheduleUpdate);
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      }
    };
  }, [publishScrollState]);

  return (
    <div
      className={className}
      style={{
        ...panelStyle({
          position: 'relative',
          height,
          overflow: 'hidden',
          padding: 0,
          border: `1px solid color-mix(in srgb, ${accentColor} 24%, #d1d5db)`,
          background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 5%, #ffffff), #ffffff)`,
        }),
        ...style,
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: 12,
          paddingRight: 30,
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 10,
          bottom: 10,
          right: 7,
          width: 16,
          borderRadius: 999,
          background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 6%, #f8fafc), #e5e7eb)`,
          boxShadow:
            'inset 0 0 0 1px rgba(148, 163, 184, 0.28), inset 0 8px 16px rgba(15, 23, 42, 0.08)',
        }}
      >
        {density.map((value, index) => {
          const top = (index / density.length) * 100;
          const segmentHeight = 100 / density.length + 0.8;
          return (
            <span
              key={`density-${index}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${top.toFixed(3)}%`,
                height: `${segmentHeight.toFixed(3)}%`,
                background: `color-mix(in srgb, ${accentColor} ${(12 + value * 42).toFixed(2)}%, #dbe4f4)`,
                opacity: (0.12 + value * 0.62).toFixed(3),
                pointerEvents: 'none',
              }}
            />
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            width: 11,
            height: 5,
            top: `${(localDepth * 100).toFixed(3)}%`,
            transform: 'translate(-50%, -50%)',
            borderRadius: 999,
            background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 62%, #ffffff), ${accentColor})`,
            boxShadow:
              '0 0 0 1px rgba(15, 23, 42, 0.36), 0 0 10px rgba(59, 130, 246, 0.35)',
          }}
          title={localUserId ? `${displayUser(localUserId)} (you)` : 'you'}
        />

        {markers.map((signal) => {
          const markerSize = 5 + signal.activity * 3.8;
          const glowColor = `color-mix(in srgb, ${signal.color} ${(40 + signal.activity * 42).toFixed(1)}%, transparent)`;
          return (
            <span
              key={signal.userId}
              title={`${signal.label}: ${Math.round(signal.depth * 100)}% · ${signal.socialSignal}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${signal.laneOffsetPx}px)`,
                top: `${(signal.depth * 100).toFixed(3)}%`,
                width: markerSize,
                height: markerSize,
                transform: 'translate(-50%, -50%)',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.7)',
                background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${signal.color} 38%, #ffffff), ${signal.color})`,
                boxShadow: `0 0 0 1px rgba(15,23,42,0.32), 0 0 ${(8 + signal.activity * 12).toFixed(1)}px ${glowColor}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
