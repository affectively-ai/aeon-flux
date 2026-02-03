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

// Core exports
export { createAeonServer } from './server';
export { AeonRouter } from './router';
export { AeonRouteRegistry } from './registry';

// Navigation engine (cutting-edge navigation)
export {
  AeonNavigationEngine,
  getNavigator,
  setNavigator,
} from './navigation';
export type {
  NavigationOptions,
  PrefetchOptions,
  NavigationState,
} from './navigation';

// Navigation cache (total preload strategy)
export {
  NavigationCache,
  getNavigationCache,
  setNavigationCache,
} from './cache';
export type {
  CachedSession,
  CacheStats,
  NavigationCacheOptions,
} from './cache';

// Navigation predictor (ML-based)
export {
  NavigationPredictor,
  getPredictor,
  setPredictor,
} from './predictor';
export type {
  PredictedRoute,
  NavigationRecord,
  CommunityPattern,
  PredictorConfig,
} from './predictor';

// Storage adapters
export {
  createStorageAdapter,
  FileStorageAdapter,
  D1StorageAdapter,
  DurableObjectStorageAdapter,
  HybridStorageAdapter,
  DashStorageAdapter,
} from './storage';
export type { StorageAdapter } from './storage';

// Cloudflare Durable Object classes (for deployment)
export { AeonPageSession, AeonRoutesRegistry } from './durable-object';

// Type exports
export type {
  AeonConfig,
  AeonOptions,
  SyncOptions,
  VersioningOptions,
  PresenceOptions,
  OfflineOptions,
  ComponentOptions,
  OutputOptions,
  RouteDefinition,
  RouteMatch,
  RouteMetadata,
  RouteOperation,
  SerializedComponent,
  PageSession,
  PresenceInfo,
  PresenceUser,
  AeonCapability,
} from './types';

// Personalized Router (hyperpersonalized routing)
export {
  DEFAULT_ROUTER_CONFIG,
  DEFAULT_ESI_CONFIG,
  HeuristicAdapter,
  EdgeWorkersESIProcessor,
  extractUserContext,
  createContextMiddleware,
  setContextCookies,
  addSpeculationHeaders,
  esiInfer,
  esiEmbed,
  esiEmotion,
  esiVision,
  esiWithContext,
} from './router';
export type {
  // User context
  EmotionState,
  Viewport,
  ConnectionType,
  UserTier,
  UserContext,
  // Route decision
  ThemeMode,
  LayoutDensity,
  LayoutType,
  SkeletonHints,
  RouteDecision,
  // Component tree
  ComponentNode,
  ComponentTree,
  ComponentTreeSchema,
  // Router adapter
  RouterAdapter,
  // Adapter config
  HeuristicAdapterConfig,
  TierFeatures,
  SignalProcessor,
  ContextExtractorOptions,
  // Configuration
  AIRouterConfig,
  SpeculationConfig,
  PersonalizationConfig,
  RouterConfig,
  RouterConfigWithESI,
  // ESI
  ESIModel,
  ESIContentType,
  ESIParams,
  ESIContent,
  ESIDirective,
  ESIResult,
  ESIProcessor,
  ESIConfig,
} from './router';

// Version
export const VERSION = '0.1.0';
