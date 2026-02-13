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
export type { GTMConfig, AnalyticsConfig, ClickTrackingOptions, MerkleNode, MerkleTree, ComponentNode, ComponentTree, SerializedMerkleInfo, UserTier, ConnectionType, EmotionState, ESIState, ESIStateFeatures, AeonEventBase, ElementInfo, PositionInfo, ContextEvent, PageViewEvent, ClickEvent, DataLayerEvent, } from './types';
export { MERKLE_ATTR, PATH_ATTR, PATH_HASHES_ATTR, TYPE_ATTR } from './types';
export { hashNodeAsync, buildMerkleTree, hashNodeSync, buildMerkleTreeSync, getMerkleAttributes, parseMerkleFromElement, findNearestMerkleElement, verifyMerkleTree, diffMerkleTrees, } from './merkle-tree';
export { ANALYTICS_VERSION, ensureDataLayer, pushToDataLayer, getDataLayer, clearDataLayer, buildContextEvent, buildPageViewEvent, buildClickEvent, extractElementInfo, extractPositionInfo, pushContextEvent, pushPageViewEvent, pushClickEvent, setDebugMode, } from './data-layer';
export { injectGTM, injectGTMNoScript, initializeGTM, generateGTMScriptTag, generateGTMNoScriptTag, generateDataLayerScript, isGTMInjected, isGTMReady, waitForGTM, resetGTMState, } from './gtm-loader';
export { getESIState, hasESIState, getESIProperty, subscribeToESIChanges, syncESIToDataLayer, pushPageView, watchESIChanges, initContextBridge, waitForESIState, initContextBridgeWithRetry, getESIContextSnapshot, isAdmin, hasFeature, meetsTierRequirement, getUserTier, getEmotionState, } from './context-bridge';
export { initClickTracker, stopClickTracker, isClickTrackerActive, trackClick, trackInteraction, } from './click-tracker';
export { useAeonAnalytics, type UseAnalyticsReturn, useESIState, useTrackMount, useTrackVisibility, } from './use-analytics';
export { AeonAnalyticsProvider, type AeonAnalyticsProviderProps, useAnalytics, useAnalyticsOptional, withAnalytics, Analytics, MerkleTreeProvider, Track, } from './provider';
