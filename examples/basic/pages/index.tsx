'use aeon';

import {
  usePresence,
  useAeonData,
  useCursorTracking,
} from '@affectively/aeon-pages/react';
import { Cursor } from '../components/Cursor';
import { PresenceBar } from '../components/PresenceBar';
import { OfflineIndicator } from '../components/OfflineIndicator';

export default function HomePage() {
  const { presence, localUser } = usePresence();
  const [title, setTitle] = useAeonData<string>('title');
  const [description, setDescription] = useAeonData<string>('description');

  // Auto-track cursor movement
  useCursorTracking(true);

  // Filter out self from presence
  const otherUsers = presence.filter((u) => u.userId !== localUser?.userId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Presence bar showing who's viewing */}
      <PresenceBar users={presence} />

      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Main content - editable in place */}
      <main className="max-w-4xl mx-auto mt-8">
        <h1
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => setTitle(e.currentTarget.textContent || '')}
          className="text-4xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          {title || 'Welcome to Aeon Pages'}
        </h1>

        <p
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => setDescription(e.currentTarget.textContent || '')}
          className="mt-4 text-xl text-gray-600 outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          {description || 'Click any text to edit. Changes sync in real-time.'}
        </p>

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800">Features</h2>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>Real-time collaborative editing</li>
            <li>See other editors cursors</li>
            <li>Works offline, syncs when back online</li>
            <li>Version history with rollback</li>
            <li>~20KB runtime</li>
          </ul>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          {otherUsers.length > 0 ? (
            <p>
              {otherUsers.length} other{' '}
              {otherUsers.length === 1 ? 'person' : 'people'} viewing this page
            </p>
          ) : (
            <p>You're the only one here</p>
          )}
        </div>
      </main>

      {/* Render other users' cursors */}
      {otherUsers.map((user) => (
        <Cursor key={user.userId} user={user} />
      ))}
    </div>
  );
}
