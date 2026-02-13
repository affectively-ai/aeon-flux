'use client';

import {
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
}

export function PresenceScrollBar({
  presence,
  localUserId,
  height = 220,
  className,
}: PresenceScrollBarProps) {
  const users = presence.filter((user) => user.scroll);

  return (
    <div className={className} style={panelStyle()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
        Scroll Presence
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div
          style={{
            position: 'relative',
            width: 12,
            height,
            borderRadius: 999,
            background: '#e5e7eb',
            overflow: 'hidden',
          }}
        >
          {users.map((user) => {
            const depth = clampDepth(user.scroll?.depth ?? 0);
            const color = hashColor(user.userId);
            const isLocal = user.userId === localUserId;
            return (
              <div
                key={user.userId}
                title={`${displayUser(user.userId)}: ${Math.round(depth * 100)}%`}
                style={{
                  position: 'absolute',
                  left: isLocal ? 0 : 1,
                  right: isLocal ? 0 : 1,
                  height: isLocal ? 4 : 3,
                  top: `calc(${depth * 100}% - ${isLocal ? 2 : 1.5}px)`,
                  borderRadius: 999,
                  background: color,
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'grid', gap: 6, fontSize: 12, flex: 1 }}>
          {users.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No scroll telemetry yet</div>
          ) : (
            users.map((user) => {
              const depth = clampDepth(user.scroll?.depth ?? 0);
              return (
                <div key={user.userId} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 600, minWidth: 68 }}>
                    {displayUser(user.userId)}
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    {Math.round(depth * 100)}%
                  </span>
                </div>
              );
            })
          )}
        </div>
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
}

export function PresenceElementsPanel({
  presence,
  localUserId,
  className,
  showCursorLayer = true,
  cursorLayerHeight = 220,
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
      <PresenceScrollBar presence={presence} localUserId={localUserId} />
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
  onScrollStateChange?: (scroll: PresenceScroll) => void;
}

export function CollaborativePresenceScrollContainer({
  children,
  presence,
  localUserId,
  height = 320,
  className,
  style,
  onScrollStateChange,
}: CollaborativePresenceScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [localDepth, setLocalDepth] = useState(0);

  const markers = useMemo(
    () => presence.filter((user) => user.scroll),
    [presence],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const denominator = Math.max(1, element.scrollHeight - element.clientHeight);
      const depth = clampDepth(element.scrollTop / denominator);
      setLocalDepth(depth);
      onScrollStateChange?.({
        depth,
        y: element.scrollTop,
        viewportHeight: element.clientHeight,
        documentHeight: element.scrollHeight,
      });
    };

    update();
    element.addEventListener('scroll', update, { passive: true });
    return () => {
      element.removeEventListener('scroll', update);
    };
  }, [onScrollStateChange]);

  return (
    <div
      className={className}
      style={{
        ...panelStyle({
          position: 'relative',
          height,
          overflow: 'hidden',
          padding: 0,
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
          paddingRight: 22,
          padding: 12,
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 10,
          bottom: 10,
          right: 6,
          width: 10,
          borderRadius: 999,
          background: '#e5e7eb',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            top: `calc(${localDepth * 100}% - 2px)`,
            borderRadius: 999,
            background: '#111827',
          }}
          title={localUserId ? `${displayUser(localUserId)} (you)` : 'you'}
        />

        {markers.map((user) => {
          const depth = clampDepth(user.scroll?.depth ?? 0);
          return (
            <div
              key={user.userId}
              title={`${displayUser(user.userId)}: ${Math.round(depth * 100)}%`}
              style={{
                position: 'absolute',
                left: 1,
                right: 1,
                height: 3,
                borderRadius: 999,
                top: `calc(${depth * 100}% - 1.5px)`,
                background: hashColor(user.userId),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
