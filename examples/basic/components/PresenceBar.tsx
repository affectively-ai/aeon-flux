import type { PresenceUser } from '@affectively/aeon-pages/react';

interface PresenceBarProps {
  users: PresenceUser[];
}

export function PresenceBar({ users }: PresenceBarProps) {
  const onlineUsers = users.filter((u) => u.status === 'online');
  const awayUsers = users.filter((u) => u.status === 'away');

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200">
      {/* Online indicator */}
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-gray-600">{onlineUsers.length} online</span>
      </div>

      {awayUsers.length > 0 && (
        <>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-sm text-gray-500">{awayUsers.length} away</span>
          </div>
        </>
      )}

      {/* User avatars */}
      <div className="w-px h-4 bg-gray-200 ml-2" />
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <UserAvatar key={user.userId} user={user} />
        ))}
        {users.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 border-2 border-white">
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}

function UserAvatar({ user }: { user: PresenceUser }) {
  const isAgent = user.role === 'assistant';
  const statusColor = user.status === 'online' ? 'bg-green-500' : user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400';

  return (
    <div
      className="relative w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium"
      style={{
        backgroundColor: isAgent ? '#8b5cf6' : '#3b82f6',
        color: 'white',
      }}
      title={`${user.userId.slice(0, 8)} (${user.role})`}
    >
      {isAgent ? '🤖' : user.userId.slice(0, 2).toUpperCase()}

      {/* Status indicator */}
      <div
        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${statusColor} border border-white`}
      />
    </div>
  );
}

export default PresenceBar;
