/**
 * @affectively/aeon-pages/react
 *
 * React bindings for Aeon Pages - collaborative editing with hooks.
 *
 * The Aeon architecture is recursive (fractal):
 * - Component = Aeon entity
 * - Page = Aeon session
 * - Site = Aeon of sessions (routes are collaborative)
 * - Federation = Aeon of Aeons (cross-site sync)
 *
 * @example
 * ```tsx
 * 'use aeon';
 *
 * import { Link, useAeonPage, usePresence, useAeonData } from '@affectively/aeon-pages/react';
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
 *       <Link href="/about" prefetch="visible" showPresence>
 *         About (3 viewing)
 *       </Link>
 *
 *       {presence.map((user) => (
 *         <Cursor key={user.userId} user={user} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

// Link component with prefetch/transitions/presence
export { Link, type LinkProps, type TransitionType, type PrefetchStrategy, type PresenceRenderProps } from './Link';

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

// Convenience hooks (page-level editing)
export { usePresence, useAeonSync, useAeonData } from './provider';

// Navigation hooks (route-level navigation)
export {
  useAeonNavigation,
  useNavigationPrediction,
  useLinkObserver,
  useTotalPreload,
  useRoutePresence,
  AeonNavigationContext,
  type AeonNavigationContextValue,
} from './hooks/useAeonNavigation';

// Service worker hooks (total preload)
export {
  useAeonServiceWorker,
  usePreloadProgress,
  useCacheStatus,
  useManualPreload,
  usePrefetchRoute,
  useClearCache,
  type PreloadProgress,
  type CacheStatus,
} from './hooks/useServiceWorker';

// Re-export additional hooks
export * from './hooks';
