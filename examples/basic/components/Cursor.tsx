import type { PresenceUser } from '@affectively/aeon-pages/react';

interface CursorProps {
  user: PresenceUser;
}

// Generate a color from user ID
function userColor(userId: string): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#336699', // steel blue
    '#ec4899', // pink
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Cursor({ user }: CursorProps) {
  if (!user.cursor || user.status === 'offline') {
    return null;
  }

  const color = userColor(user.userId);

  return (
    <div
      style={{
        position: 'fixed',
        left: user.cursor.x,
        top: user.cursor.y,
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'left 0.1s ease-out, top 0.1s ease-out',
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.92 2.53a.5.5 0 0 0-.42.68z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User label */}
      <div
        style={{
          marginLeft: '16px',
          marginTop: '-4px',
          padding: '2px 8px',
          backgroundColor: color,
          color: 'white',
          fontSize: '12px',
          fontWeight: 500,
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {user.role === 'assistant' ? '🤖 ' : ''}
        {user.userId.slice(0, 8)}
        {user.editing && (
          <span style={{ marginLeft: '4px', opacity: 0.8 }}>
            editing
          </span>
        )}
      </div>
    </div>
  );
}

export default Cursor;
