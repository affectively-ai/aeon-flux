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
export { AeonNavigationEngine, getNavigator, setNavigator } from './navigation';
export type {
  NavigationOptions,
  PrefetchOptions,
  NavigationState,
  PresenceInfo as RoutePresenceInfo,
} from './navigation';

// Navigation cache (total preload strategy)
export {
  NavigationCache,
  getNavigationCache,
  setNavigationCache,
  // Skeleton cache for zero-CLS rendering
  SkeletonCache,
  getSkeletonCache,
  setSkeletonCache,
  getWithSkeleton,
} from './cache';
export type {
  CachedSession,
  CacheStats,
  NavigationCacheOptions,
  // Skeleton cache types
  CachedSkeleton,
  SkeletonCacheOptions,
  SkeletonWithContent,
} from './cache';

// Skeleton hydration - client-side swap
export {
  initSkeleton,
  swapToContent,
  isSkeletonVisible,
  generateSkeletonInitScript,
  generateSkeletonPageStructure,
  generateAsyncSwapScript,
} from './skeleton-hydrate';
export type { SkeletonSwapOptions } from './skeleton-hydrate';

// Navigation predictor (ML-based)
export { NavigationPredictor, getPredictor, setPredictor } from './predictor';
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
export type { PreRenderedPage, SpeculativeRendererConfig } from './speculation';

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

// ============================================================================
// Offline Luxury Features
// ============================================================================

// Offline types
export type {
  OperationType,
  OperationPriority,
  OperationStatus,
  OfflineOperation,
  EncryptedQueueConfig,
  QueueStats,
  EncryptedPayload,
  EncryptionKeyMaterial,
  SyncBatch,
  SyncResult,
  ConflictDetectionResult,
  ResolutionStrategy,
  StoredConflict,
  NetworkState,
  BandwidthProfile,
  NetworkStateEvent,
  SyncCoordinatorConfig,
  SyncProgressEvent,
  OfflineQueueEvents,
  SyncCoordinatorEvents,
} from './offline/types';

// Encryption service
export {
  OfflineOperationEncryption,
  getOperationEncryption,
  resetOperationEncryption,
  generateOperationId,
  estimateEncryptedSize,
} from './offline/encryption';

// Encrypted offline queue
export {
  EncryptedOfflineQueue,
  getOfflineQueue,
  createOfflineQueue,
  resetOfflineQueue,
} from './offline/encrypted-queue';

// Conflict resolver
export {
  ConflictResolver,
  getConflictResolver,
  createConflictResolver,
  resetConflictResolver,
  type ConflictResolverConfig,
  type ConflictStats as ConflictResolverStats,
} from './sync/conflict-resolver';

// Sync coordinator
export {
  SyncCoordinator,
  getSyncCoordinator,
  createSyncCoordinator,
  resetSyncCoordinator,
  type SyncStats,
} from './sync/coordinator';

// Service worker push handler
export {
  handlePush,
  handleNotificationClick,
  handleNotificationClose,
  handleSync,
  handleMessage,
  registerPushHandlers,
  registerSyncHandlers,
  registerMessageHandlers,
  urlBase64ToUint8Array,
  serializePushSubscription,
  type PushNotificationData,
  type PushHandlerConfig,
  type ServiceWorkerMessage,
} from './service-worker-push';

// Type exports
export type {
  // Config types
  AeonConfig,
  AeonOptions,
  SyncOptions,
  VersioningOptions,
  PresenceOptions,
  OfflineOptions,
  PushOptions,
  InstallOptions,
  SkeletonOptions,
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
  // UCAN Capability types
  AeonCapability,
  AeonCapabilityAction,
  AeonNodeCapability,
  AeonNodeCapabilityAction,
  AeonCapabilityActionType,
  AeonAnyCapability,
  AeonResourceType,
  ParsedResource,
  MerkleAccessRequest,
  // Skeleton types
  SkeletonShape,
  SkeletonSource,
  SkeletonDimensions,
  SkeletonMetadata,
  SkeletonHint,
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
  // Merkle-Based UCAN Capability Verification
  parseResource,
  formatResource,
  capabilityGrantsAccess,
  createNodeCapabilityVerifier,
  createNodeReadCapability,
  createNodeWriteCapability,
  createTreeCapability,
  createPathCapability,
  createWildcardNodeCapability,
  checkNodeAccess,
  filterAccessibleNodes,
  getMostSpecificCapability,
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
  // Merkle Capability Verification
  NodeCapabilityVerifier,
  NodeVerifierOptions,
} from './router/index';

// Version
export const VERSION = '1.0.0';
