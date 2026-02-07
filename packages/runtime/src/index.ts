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
export { AeonRouter } from './router.js';
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

// Speculative pre-rendering (zero-latency navigation)
export {
  SpeculativeRenderer,
  getSpeculativeRenderer,
  setSpeculativeRenderer,
  initSpeculativeRendering,
} from './speculation';
export type {
  PreRenderedPage,
  SpeculativeRendererConfig,
} from './speculation';

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

// API Routes - server-side request handling
export {
  ApiRouter,
  createApiRouter,
  // Response helpers
  json,
  redirect,
  error,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  // Middleware
  composeMiddleware,
  cors,
  requireAuth,
  rateLimit,
} from './api-routes';
export type { Middleware } from './api-routes';

// Worker factory
export { createAeonWorker } from './worker';
export type { AeonWorkerOptions } from './worker';

// Next.js adapter - run Next.js API routes on Cloudflare Workers
export {
  adaptRequest,
  adaptHandler,
  adaptRouteModule,
  NextResponse,
} from './nextjs-adapter';
export type {
  NextRequest,
  NextRouteHandler,
  NextRouteModule,
} from './nextjs-adapter';

// Type exports
export type {
  // Config types
  AeonConfig,
  AeonOptions,
  SyncOptions,
  VersioningOptions,
  PresenceOptions,
  OfflineOptions,
  ComponentOptions,
  OutputOptions,
  // Route types
  RouteDefinition,
  RouteMatch,
  RouteMetadata,
  RouteOperation,
  // Component types
  SerializedComponent,
  PageSession,
  PresenceInfo,
  PresenceUser,
  AeonCapability,
  // API Route types
  HttpMethod,
  AeonEnv,
  AeonContext,
  ExecutionContext,
  ApiRouteHandler,
  ApiRouteModule,
  ApiRoute,
  ApiRouteMatch,
  ApiRouteSegment,
  ServerRouteModule,
  ServerLoaderResult,
  ServerActionResult,
  // Cloudflare binding types
  D1Database,
  D1PreparedStatement,
  D1Result,
  D1ExecResult,
  KVNamespace,
  DurableObjectNamespace,
  DurableObjectId,
  DurableObjectStub,
  Ai,
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
} from './router/index';
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
} from './router/index';

// Version
export const VERSION = '0.2.0';
