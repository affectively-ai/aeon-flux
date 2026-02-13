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
export { Link, type LinkProps, type TransitionType, type PrefetchStrategy, type PresenceRenderProps, } from './Link';
export { AeonPageProvider, useAeonPage, type AeonPageProviderProps, type AeonPageContextValue, type PresenceUser, type PresenceSelection, type PresenceTyping, type PresenceScroll, type PresenceViewport, type PresenceInputState, type PresenceEmotion, type SyncState, type VersionInfo, } from './provider';
export { usePresence, useAeonSync, useAeonData } from './provider';
export { useAeonVersion, useAeonTree, useCursorTracking, useEditableElement, useOtherCursors, useOfflineStatus, useEmotionPresence, useCollaborativeInput, useScrollPresenceTracking, useViewportPresenceTracking, useAeonEffect, useSessionId, useRoute, } from './hooks';
export { useAeonNavigation, useNavigationPrediction, useLinkObserver, useTotalPreload, useRoutePresence, AeonNavigationContext, type AeonNavigationContextValue, } from './hooks/useAeonNavigation';
export { useAeonServiceWorker, usePreloadProgress, useCacheStatus, useManualPreload, usePrefetchRoute, useClearCache, type PreloadProgress, type CacheStatus, } from './hooks/useServiceWorker';
export { usePilotNavigation, parseNavigationTags, stripNavigationTags, type PilotNavigationIntent, type PilotNavigationOptions, type PilotNavigationState, } from './hooks/usePilotNavigation';
export { useNetworkState, type NetworkState, type BandwidthProfile, type NetworkStateResult, } from './hooks/useNetworkState';
export { useConflicts, addConflict, getAllConflicts, clearAllConflicts, type Conflict, type ConflictStats, type ResolutionStrategy, type UseConflictsResult, } from './hooks/useConflicts';
export { InstallPrompt, useInstallPrompt, type InstallPromptProps, type InstallPromptState, } from './components/InstallPrompt';
export { PushNotifications, usePushNotifications, type PushNotificationsProps, type PushSubscriptionData, type PushNotificationState, type UsePushNotificationsConfig, } from './components/PushNotifications';
export { OfflineDiagnostics, NetworkStatusPanel, ServiceWorkerPanel, CacheManagementPanel, QueueStatsPanel, ConflictsPanel, type OfflineDiagnosticsProps, type ServiceWorkerState, type CacheInfo, type QueueStats, } from './components/OfflineDiagnostics';
export { PresenceCursorLayer, PresenceFocusList, PresenceTypingList, PresenceSelectionList, PresenceScrollBar, PresenceViewportList, PresenceInputStateList, PresenceEmotionList, PresenceEditingList, PresenceStatusList, PresenceElementsPanel, CollaborativePresenceScrollContainer, type PresenceCursorLayerProps, type PresenceFocusListProps, type PresenceTypingListProps, type PresenceSelectionListProps, type PresenceScrollBarProps, type PresenceViewportListProps, type PresenceInputStateListProps, type PresenceEmotionListProps, type PresenceEditingListProps, type PresenceStatusListProps, type PresenceElementsPanelProps, type CollaborativePresenceScrollContainerProps, type PresenceScrollThemeTokens, } from './components/PresenceKit';
export { DEFAULT_SCROLL_ACCENT, DEFAULT_SCROLL_MARKER_LIMIT, DEFAULT_SCROLL_DENSITY_BUCKETS, DEFAULT_SCROLL_ACTIVITY_WINDOW_MS, DEFAULT_LOCAL_SCROLL_DEPTH_EPSILON, clampDepth, hashPresenceColor, displayPresenceUser, hashLaneOffset, summarizeScrollSignal, computeScrollActivity, buildScrollSignals, sortScrollSignalsForRail, sortScrollSignalsForLegend, buildScrollDensityMap, shouldCommitLocalDepthUpdate, type PresenceScrollSignal, type BuildScrollSignalsOptions, } from './components/presence-scroll-signals';
