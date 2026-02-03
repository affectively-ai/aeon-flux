/**
 * @affectively/aeon-pages/react
 *
 * React bindings for Aeon Pages - collaborative editing with hooks.
 *
 * @example
 * ```tsx
 * 'use aeon';
 *
 * import { useAeonPage, usePresence, useAeonData } from '@affectively/aeon-pages/react';
 *
 * export default function Page() {
 *   const { presence, localUser, updateCursor } = usePresence();
 *   const [title, setTitle] = useAeonData<string>('title');
 *
 *   return (
 *     <div onMouseMove={(e) => updateCursor({ x: e.clientX, y: e.clientY })}>
 *       <h1 contentEditable onInput={(e) => setTitle(e.currentTarget.textContent)}>
 *         {title || 'Untitled'}
 *       </h1>
 *
 *       {presence.map((user) => (
 *         <Cursor key={user.userId} user={user} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

// Provider and main hook
export {
  AeonPageProvider,
  useAeonPage,
  type AeonPageProviderProps,
  type AeonPageContextValue,
  type PresenceUser,
  type SyncState,
  type VersionInfo,
} from './provider';

// Convenience hooks
export { usePresence, useAeonSync, useAeonData } from './provider';

// Re-export hooks file if it exists
export * from './hooks';
