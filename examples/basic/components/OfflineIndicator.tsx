import { useOfflineStatus } from '@affectively/aeon-pages/react';

export function OfflineIndicator() {
  const { isOffline, isSyncing, pendingOperations, lastSyncAt } = useOfflineStatus();

  if (!isOffline && !isSyncing && pendingOperations === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      {/* Offline banner */}
      {isOffline && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 shadow-lg">
          <svg
            className="w-5 h-5 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">You're offline</p>
            <p className="text-xs text-yellow-600">Changes will sync when back online</p>
          </div>
        </div>
      )}

      {/* Pending operations */}
      {pendingOperations > 0 && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-lg">
          <div className="w-5 h-5">
            <svg className="animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">
              {isSyncing ? 'Syncing...' : `${pendingOperations} pending`}
            </p>
            <p className="text-xs text-blue-600">
              {pendingOperations} {pendingOperations === 1 ? 'change' : 'changes'} to sync
            </p>
          </div>
        </div>
      )}

      {/* Last sync time */}
      {lastSyncAt && !isOffline && pendingOperations === 0 && (
        <div className="text-xs text-gray-400 text-right">
          Last synced: {formatRelativeTime(lastSyncAt)}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}

export default OfflineIndicator;
