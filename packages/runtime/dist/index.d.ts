/**
 * @affectively/aeon-pages-runtime
 *
 * Lightweight runtime for Aeon Pages - the CMS IS the website.
 *
 * @example
 * ```typescript
 * import { createAeonServer } from '@affectively/aeon-pages-runtime/server';
 *
 * const server = await createAeonServer({
 *   config: {
 *     pagesDir: './pages',
 *     runtime: 'bun',
 *     aeon: {
 *       sync: { mode: 'distributed' },
 *       presence: { enabled: true },
 *     },
 *   },
 * });
 *
 * console.log(`Aeon Pages running on port ${server.port}`);
 * ```
 */
export { createAeonServer } from './server';
export { AeonRouter } from './router.js';
export { AeonRouteRegistry } from './registry';
export { AeonNavigationEngine, getNavigator, setNavigator, } from './navigation';
export type { NavigationOptions, PrefetchOptions, NavigationState, } from './navigation';
export { NavigationCache, getNavigationCache, setNavigationCache, } from './cache';
export type { CachedSession, CacheStats, NavigationCacheOptions, } from './cache';
export { NavigationPredictor, getPredictor, setPredictor, } from './predictor';
export type { PredictedRoute, NavigationRecord, CommunityPattern, PredictorConfig, } from './predictor';
export { createStorageAdapter, FileStorageAdapter, D1StorageAdapter, DurableObjectStorageAdapter, HybridStorageAdapter, DashStorageAdapter, } from './storage';
export type { StorageAdapter } from './storage';
export { AeonPageSession, AeonRoutesRegistry } from './durable-object';
export type { AeonConfig, AeonOptions, SyncOptions, VersioningOptions, PresenceOptions, OfflineOptions, ComponentOptions, OutputOptions, RouteDefinition, RouteMatch, RouteMetadata, RouteOperation, SerializedComponent, PageSession, PresenceInfo, PresenceUser, AeonCapability, } from './types';
export { DEFAULT_ROUTER_CONFIG, DEFAULT_ESI_CONFIG, HeuristicAdapter, EdgeWorkersESIProcessor, extractUserContext, createContextMiddleware, setContextCookies, addSpeculationHeaders, esiInfer, esiEmbed, esiEmotion, esiVision, esiWithContext, } from './router/index';
export type { EmotionState, Viewport, ConnectionType, UserTier, UserContext, ThemeMode, LayoutDensity, LayoutType, SkeletonHints, RouteDecision, ComponentNode, ComponentTree, ComponentTreeSchema, RouterAdapter, HeuristicAdapterConfig, TierFeatures, SignalProcessor, ContextExtractorOptions, AIRouterConfig, SpeculationConfig, PersonalizationConfig, RouterConfig, RouterConfigWithESI, ESIModel, ESIContentType, ESIParams, ESIContent, ESIDirective, ESIResult, ESIProcessor, ESIConfig, } from './router/index';
export declare const VERSION = "0.1.0";
