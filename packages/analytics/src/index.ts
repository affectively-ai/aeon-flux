/**
 * @affectively/aeon-pages-analytics
 *
 * Automatic click tracking and GTM integration for aeon-pages.
 *
 * Features:
 * - Merkle tree-based node identification
 * - Zero-instrumentation click tracking
 * - ESI context → GTM dataLayer sync
 * - Full tree path with every click event
 *
 * @example
 * ```tsx
 * import { AeonAnalyticsProvider } from '@affectively/aeon-pages-analytics/react';
 *
 * export default function App({ Component, pageProps }) {
 *   return (
 *     <AeonAnalyticsProvider
 *       gtmContainerId="GTM-XXXXXX"
 *       trackClicks={true}
 *       syncESIContext={true}
 *     >
 *       <Component {...pageProps} />
 *     </AeonAnalyticsProvider>
 *   );
 * }
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Configuration
  GTMConfig,
  AnalyticsConfig,
  ClickTrackingOptions,

  // Merkle Tree
  MerkleNode,
  MerkleTree,
  ComponentNode,
  ComponentTree,
  SerializedMerkleInfo,

  // ESI State
  UserTier,
  ConnectionType,
  EmotionState,
  ESIState,
  ESIStateFeatures,

  // DataLayer Events
  AeonEventBase,
  ElementInfo,
  PositionInfo,
  ContextEvent,
  PageViewEvent,
  ClickEvent,
  DataLayerEvent,
} from './types';

// Constants
export { MERKLE_ATTR, PATH_ATTR, PATH_HASHES_ATTR, TYPE_ATTR } from './types';

// ============================================================================
// Merkle Tree
// ============================================================================

export {
  // Async builders
  hashNodeAsync,
  buildMerkleTree,

  // Sync builders
  hashNodeSync,
  buildMerkleTreeSync,

  // DOM helpers
  getMerkleAttributes,
  parseMerkleFromElement,
  findNearestMerkleElement,

  // Verification
  verifyMerkleTree,
  diffMerkleTrees,
} from './merkle-tree';

// ============================================================================
// DataLayer
// ============================================================================

export {
  // Version
  ANALYTICS_VERSION,

  // DataLayer management
  ensureDataLayer,
  pushToDataLayer,
  getDataLayer,
  clearDataLayer,

  // Event builders
  buildContextEvent,
  buildPageViewEvent,
  buildClickEvent,

  // Element/position extraction
  extractElementInfo,
  extractPositionInfo,

  // Push helpers
  pushContextEvent,
  pushPageViewEvent,
  pushClickEvent,

  // Debug
  setDebugMode,
} from './data-layer';

// ============================================================================
// GTM Loader
// ============================================================================

export {
  // Injection
  injectGTM,
  injectGTMNoScript,
  initializeGTM,

  // SSR helpers
  generateGTMScriptTag,
  generateGTMNoScriptTag,
  generateDataLayerScript,

  // Status
  isGTMInjected,
  isGTMReady,
  waitForGTM,

  // Testing
  resetGTMState,
} from './gtm-loader';

// ============================================================================
// Context Bridge
// ============================================================================

export {
  // ESI state access
  getESIState,
  hasESIState,
  getESIProperty,

  // Subscription
  subscribeToESIChanges,

  // DataLayer sync
  syncESIToDataLayer,
  pushPageView,

  // Watch mode
  watchESIChanges,
  initContextBridge,

  // Retry logic
  waitForESIState,
  initContextBridgeWithRetry,

  // Utilities
  getESIContextSnapshot,
  isAdmin,
  hasFeature,
  meetsTierRequirement,
  getUserTier,
  getEmotionState,
} from './context-bridge';

// ============================================================================
// Click Tracker
// ============================================================================

export {
  // Initialization
  initClickTracker,
  stopClickTracker,
  isClickTrackerActive,

  // Manual tracking
  trackClick,
  trackInteraction,
} from './click-tracker';

// ============================================================================
// React
// ============================================================================

export {
  // Main hook
  useAeonAnalytics,
  type UseAnalyticsReturn,

  // Utility hooks
  useESIState,
  useTrackMount,
  useTrackVisibility,
} from './use-analytics';

export {
  // Provider
  AeonAnalyticsProvider,
  type AeonAnalyticsProviderProps,

  // Context hooks
  useAnalytics,
  useAnalyticsOptional,

  // HOC
  withAnalytics,

  // Render props
  Analytics,

  // Merkle tree provider
  MerkleTreeProvider,

  // Track component
  Track,
} from './provider';
