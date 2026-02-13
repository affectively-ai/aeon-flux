'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import type { PresenceScroll, PresenceUser } from '../provider';
import {
  buildScrollDensityMap,
  buildScrollSignals,
  clampDepth,
  DEFAULT_LOCAL_SCROLL_DEPTH_EPSILON,
  DEFAULT_SCROLL_ACCENT,
  DEFAULT_SCROLL_MARKER_LIMIT,
  displayPresenceUser,
  hashPresenceColor,
  shouldCommitLocalDepthUpdate,
  sortScrollSignalsForLegend,
  sortScrollSignalsForRail,
  type PresenceScrollSignal,
} from './presence-scroll-signals';

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

const SR_ONLY_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export interface PresenceScrollThemeTokens {
  accentColor?: string;
  railSurfaceColor?: string;
  railBorderColor?: string;
  textColor?: string;
  mutedTextColor?: string;
}

type PresenceScrollRailVars = CSSProperties & {
  '--aeon-presence-rail-accent': string;
  '--aeon-presence-rail-surface': string;
  '--aeon-presence-rail-border': string;
  '--aeon-presence-rail-text': string;
  '--aeon-presence-rail-muted': string;
};

function resolvePresenceScrollRailVars(
  accentColor: string,
  theme?: PresenceScrollThemeTokens,
): PresenceScrollRailVars {
  const accent = theme?.accentColor ?? accentColor;
  return {
    '--aeon-presence-rail-accent': accent,
    '--aeon-presence-rail-surface':
      theme?.railSurfaceColor ??
      `color-mix(in srgb, ${accent} 8%, #f8fafc)`,
    '--aeon-presence-rail-border':
      theme?.railBorderColor ??
      `color-mix(in srgb, ${accent} 24%, #d1d5db)`,
    '--aeon-presence-rail-text': theme?.textColor ?? '#111827',
    '--aeon-presence-rail-muted': theme?.mutedTextColor ?? '#6b7280',
  };
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);
    return () => {
      mediaQuery.removeEventListener('change', syncPreference);
    };
  }, []);

  return prefersReducedMotion;
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
        const color = hashPresenceColor(user.userId);

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
              {displayPresenceUser(user.userId)}
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
                border: `1px solid ${hashPresenceColor(user.userId)}44`,
                borderRadius: 8,
                padding: '6px 8px',
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 600 }}>{displayPresenceUser(user.userId)}</span>{' '}
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
                  background: hashPresenceColor(user.userId),
                }}
              />
              <span style={{ fontWeight: 600 }}>{displayPresenceUser(user.userId)}</span>
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
                borderLeft: `4px solid ${hashPresenceColor(user.userId)}`,
                paddingLeft: 8,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600 }}>{displayPresenceUser(user.userId)}</div>
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
  theme?: PresenceScrollThemeTokens;
}

export function PresenceScrollBar({
  presence,
  localUserId,
  height = 220,
  className,
  accentColor = DEFAULT_SCROLL_ACCENT,
  markerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
  showLegend = true,
  theme,
}: PresenceScrollBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const signals = useMemo(
    () => buildScrollSignals(presence, { localUserId, markerLimit }),
    [localUserId, markerLimit, presence],
  );
  const trackSignals = useMemo(
    () => sortScrollSignalsForRail(signals),
    [signals],
  );
  const density = useMemo(() => buildScrollDensityMap(trackSignals), [trackSignals]);
  const legendSignals = useMemo(
    () => sortScrollSignalsForLegend(signals, 8),
    [signals],
  );
  const railVars = useMemo(
    () => resolvePresenceScrollRailVars(accentColor, theme),
    [accentColor, theme],
  );
  const collaboratorCountLabel =
    signals.length === 1
      ? '1 collaborator shares scroll telemetry.'
      : `${signals.length} collaborators share scroll telemetry.`;

  return (
    <div
      className={className}
      style={{
        ...panelStyle(),
        ...railVars,
      }}
      role="group"
      aria-label="Scroll presence telemetry"
    >
      <span style={SR_ONLY_STYLE}>{collaboratorCountLabel}</span>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Scroll Presence
      </div>
      <div
        className="aeon-presence-scrollbar"
        style={{
          display: 'grid',
          gridTemplateColumns: showLegend ? '24px minmax(0, 1fr)' : '24px',
          gap: 12,
          alignItems: 'start',
        }}
      >
        <div
          className="aeon-presence-scrollbar-rail"
          style={{
            position: 'relative',
            width: 24,
            height,
            borderRadius: 999,
            background:
              'linear-gradient(180deg, var(--aeon-presence-rail-surface), #e5e7eb)',
            boxShadow:
              'inset 0 0 0 1px color-mix(in srgb, var(--aeon-presence-rail-border) 45%, rgba(148, 163, 184, 0.24)), inset 0 12px 20px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
          }}
          aria-hidden="true"
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
                  background: `color-mix(in srgb, var(--aeon-presence-rail-accent) ${(10 + value * 36).toFixed(2)}%, #dbe4f4)`,
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
                className="aeon-presence-scrollbar-marker"
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
                    ? '1px solid color-mix(in srgb, var(--aeon-presence-rail-accent) 72%, #ffffff)'
                    : '1px solid rgba(255,255,255,0.72)',
                  background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${markerColor} 38%, #ffffff), ${markerColor})`,
                  boxShadow: prefersReducedMotion
                    ? '0 0 0 1px rgba(15,23,42,0.32)'
                    : `0 0 0 1px rgba(15,23,42,0.32), 0 0 ${(8 + signal.activity * 14).toFixed(1)}px ${glowColor}`,
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
        {showLegend ? (
          <ul
            className="aeon-presence-scrollbar-legend"
            style={{
              display: 'grid',
              gap: 7,
              fontSize: 12,
              minWidth: 0,
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            {legendSignals.length === 0 ? (
              <li style={{ color: 'var(--aeon-presence-rail-muted)' }}>
                No scroll telemetry yet
              </li>
            ) : (
              legendSignals.map((signal) => {
                const depthPct = Math.round(signal.depth * 100);
                const activityPct = Math.round(signal.activity * 100);
                return (
                  <li
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
                          color: 'var(--aeon-presence-rail-text)',
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
                          background:
                            'color-mix(in srgb, var(--aeon-presence-rail-accent) 10%, #e5e7eb)',
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
                          color: 'var(--aeon-presence-rail-muted)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {depthPct}%
                      </span>
                    </div>
                    <div
                      style={{
                        color: 'var(--aeon-presence-rail-muted)',
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
                  </li>
                );
              })
            )}
          </ul>
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
                  <span style={{ fontWeight: 600 }}>{displayPresenceUser(user.userId)}</span>{' '}
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
                      background: hashPresenceColor(user.userId),
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
                <span style={{ fontWeight: 600 }}>{displayPresenceUser(user.userId)}</span>
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
                  <span style={{ fontWeight: 600 }}>{displayPresenceUser(user.userId)}</span>{' '}
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
                      background: hashPresenceColor(user.userId),
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
              <span style={{ fontWeight: 600 }}>{displayPresenceUser(user.userId)}</span>
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
                <span style={{ fontWeight: 600 }}>{displayPresenceUser(user.userId)}</span>
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
  scrollTheme?: PresenceScrollThemeTokens;
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
  scrollTheme,
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
        theme={scrollTheme}
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
  theme?: PresenceScrollThemeTokens;
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
  theme,
  onScrollStateChange,
}: CollaborativePresenceScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [localDepth, setLocalDepth] = useState(0);
  const localDepthRef = useRef(0);
  const frameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const contentId = useId();
  const prefersReducedMotion = usePrefersReducedMotion();
  const railVars = useMemo(
    () => resolvePresenceScrollRailVars(accentColor, theme),
    [accentColor, theme],
  );

  const markers = useMemo(
    () =>
      sortScrollSignalsForRail(
        buildScrollSignals(presence, { localUserId, markerLimit }).filter(
          (signal) => !signal.isLocal,
        ),
      ),
    [localUserId, markerLimit, presence],
  );
  const density = useMemo(() => buildScrollDensityMap(markers), [markers]);

  const publishScrollState = useCallback(
    (element: HTMLDivElement) => {
      const denominator = Math.max(1, element.scrollHeight - element.clientHeight);
      const depth = clampDepth(element.scrollTop / denominator);

      if (
        shouldCommitLocalDepthUpdate(
          localDepthRef.current,
          depth,
          DEFAULT_LOCAL_SCROLL_DEPTH_EPSILON,
        )
      ) {
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

  const scheduleUpdate = useCallback(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

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
  }, [publishScrollState]);

  const handleRailKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const maxScroll = Math.max(0, element.scrollHeight - element.clientHeight);
      if (maxScroll <= 0) {
        return;
      }

      const lineStep = Math.max(24, element.clientHeight * 0.08);
      const pageStep = Math.max(80, element.clientHeight * 0.85);
      let nextTop = element.scrollTop;

      switch (event.key) {
        case 'ArrowDown':
          nextTop += lineStep;
          break;
        case 'ArrowUp':
          nextTop -= lineStep;
          break;
        case 'PageDown':
          nextTop += pageStep;
          break;
        case 'PageUp':
          nextTop -= pageStep;
          break;
        case 'Home':
          nextTop = 0;
          break;
        case 'End':
          nextTop = maxScroll;
          break;
        default:
          return;
      }

      event.preventDefault();
      const boundedTop = Math.min(maxScroll, Math.max(0, nextTop));
      if (boundedTop !== element.scrollTop) {
        element.scrollTop = boundedTop;
      }
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

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
  }, [scheduleUpdate]);

  const keyboardAriaLabel = useMemo(() => {
    const telemetryCount = markers.length;
    if (telemetryCount === 0) {
      return 'Collaborative scroll rail. No remote telemetry available.';
    }
    return `Collaborative scroll rail. ${telemetryCount} remote collaborators are visible. Use Arrow keys, Page Up, Page Down, Home, or End to scroll.`;
  }, [markers.length]);

  return (
    <div
      className={className}
      style={{
        ...panelStyle({
          position: 'relative',
          height,
          overflow: 'hidden',
          padding: 0,
          border: '1px solid var(--aeon-presence-rail-border)',
          background:
            'linear-gradient(180deg, var(--aeon-presence-rail-surface), #ffffff)',
        }),
        ...railVars,
        ...style,
      }}
    >
      <span style={SR_ONLY_STYLE}>
        Scroll container with collaborative presence rail. Keyboard navigation is
        available on the rail.
      </span>
      <div
        ref={containerRef}
        id={contentId}
        className="aeon-collab-scroll-content"
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
        className="aeon-collab-scroll-rail"
        tabIndex={0}
        role="scrollbar"
        aria-label={keyboardAriaLabel}
        aria-controls={contentId}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(localDepth * 100)}
        aria-valuetext={`${Math.round(localDepth * 100)} percent`}
        onKeyDown={handleRailKeyDown}
        style={{
          position: 'absolute',
          top: 10,
          bottom: 10,
          right: 7,
          width: 16,
          borderRadius: 999,
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--aeon-presence-rail-accent) 6%, #f8fafc), #e5e7eb)',
          boxShadow:
            'inset 0 0 0 1px color-mix(in srgb, var(--aeon-presence-rail-border) 45%, rgba(148, 163, 184, 0.24)), inset 0 8px 16px rgba(15, 23, 42, 0.08)',
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
                background: `color-mix(in srgb, var(--aeon-presence-rail-accent) ${(12 + value * 42).toFixed(2)}%, #dbe4f4)`,
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
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--aeon-presence-rail-accent) 62%, #ffffff), var(--aeon-presence-rail-accent))',
            boxShadow: prefersReducedMotion
              ? '0 0 0 1px rgba(15, 23, 42, 0.36)'
              : '0 0 0 1px rgba(15, 23, 42, 0.36), 0 0 10px color-mix(in srgb, var(--aeon-presence-rail-accent) 35%, transparent)',
          }}
          title={localUserId ? `${displayPresenceUser(localUserId)} (you)` : 'you'}
          aria-hidden="true"
        />

        {markers.map((signal) => {
          const markerSize = 5 + signal.activity * 3.8;
          const glowColor = `color-mix(in srgb, ${signal.color} ${(40 + signal.activity * 42).toFixed(1)}%, transparent)`;
          return (
            <span
              className="aeon-collab-scroll-marker"
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
                boxShadow: prefersReducedMotion
                  ? '0 0 0 1px rgba(15,23,42,0.32)'
                  : `0 0 0 1px rgba(15,23,42,0.32), 0 0 ${(8 + signal.activity * 12).toFixed(1)}px ${glowColor}`,
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}
