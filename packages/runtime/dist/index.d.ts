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
export { AeonNavigationEngine, getNavigator, setNavigator } from './navigation';
export type { NavigationOptions, PrefetchOptions, NavigationState, PresenceInfo as RoutePresenceInfo, } from './navigation';
export { NavigationCache, getNavigationCache, setNavigationCache, SkeletonCache, getSkeletonCache, setSkeletonCache, getWithSkeleton, } from './cache';
export type { CachedSession, CacheStats, NavigationCacheOptions, CachedSkeleton, SkeletonCacheOptions, SkeletonWithContent, } from './cache';
export { initSkeleton, swapToContent, isSkeletonVisible, generateSkeletonInitScript, generateSkeletonPageStructure, generateAsyncSwapScript, } from './skeleton-hydrate';
export type { SkeletonSwapOptions } from './skeleton-hydrate';
export { NavigationPredictor, getPredictor, setPredictor } from './predictor';
export type { PredictedRoute, NavigationRecord, CommunityPattern, PredictorConfig, } from './predictor';
export { SpeculativeRenderer, getSpeculativeRenderer, setSpeculativeRenderer, initSpeculativeRendering, } from './speculation';
export type { PreRenderedPage, SpeculativeRendererConfig } from './speculation';
export { createStorageAdapter, FileStorageAdapter, D1StorageAdapter, DurableObjectStorageAdapter, HybridStorageAdapter, DashStorageAdapter, } from './storage';
export type { StorageAdapter } from './storage';
export { AeonPageSession, AeonRoutesRegistry } from './durable-object';
export { ApiRouter, createApiRouter, json, redirect, error, notFound, badRequest, unauthorized, forbidden, composeMiddleware, cors, requireAuth, rateLimit, } from './api-routes';
export type { Middleware } from './api-routes';
export { createAeonWorker } from './worker';
export type { AeonWorkerOptions } from './worker';
export { adaptRequest, adaptHandler, adaptRouteModule, NextResponse, } from './nextjs-adapter';
export type { NextRequest, NextRouteHandler, NextRouteModule, } from './nextjs-adapter';
export type { OperationType, OperationPriority, OperationStatus, OfflineOperation, EncryptedQueueConfig, QueueStats, EncryptedPayload, EncryptionKeyMaterial, SyncBatch, SyncResult, ConflictDetectionResult, ResolutionStrategy, StoredConflict, NetworkState, BandwidthProfile, NetworkStateEvent, SyncCoordinatorConfig, SyncProgressEvent, OfflineQueueEvents, SyncCoordinatorEvents, } from './offline/types';
export { OfflineOperationEncryption, getOperationEncryption, resetOperationEncryption, generateOperationId, estimateEncryptedSize, } from './offline/encryption';
export { EncryptedOfflineQueue, getOfflineQueue, createOfflineQueue, resetOfflineQueue, } from './offline/encrypted-queue';
export { ConflictResolver, getConflictResolver, createConflictResolver, resetConflictResolver, type ConflictResolverConfig, type ConflictStats as ConflictResolverStats, } from './sync/conflict-resolver';
export { SyncCoordinator, getSyncCoordinator, createSyncCoordinator, resetSyncCoordinator, type SyncStats, } from './sync/coordinator';
export { handlePush, handleNotificationClick, handleNotificationClose, handleSync, handleMessage, registerPushHandlers, registerSyncHandlers, registerMessageHandlers, urlBase64ToUint8Array, serializePushSubscription, type PushNotificationData, type PushHandlerConfig, type ServiceWorkerMessage, } from './service-worker-push';
export type { AeonConfig, AeonOptions, SyncOptions, VersioningOptions, PresenceOptions, OfflineOptions, PushOptions, InstallOptions, SkeletonOptions, ComponentOptions, OutputOptions, RouteDefinition, RouteMatch, RouteMetadata, RouteOperation, SerializedComponent, PageSession, PresenceInfo, PresenceUser, PresenceSelection, PresenceTyping, PresenceScroll, PresenceViewport, PresenceInputState, PresenceEmotion, AeonCapability, AeonCapabilityAction, AeonNodeCapability, AeonNodeCapabilityAction, AeonCapabilityActionType, AeonAnyCapability, AeonResourceType, ParsedResource, MerkleAccessRequest, SkeletonShape, SkeletonSource, SkeletonDimensions, SkeletonMetadata, SkeletonHint, HttpMethod, AeonEnv, AeonContext, ExecutionContext, ApiRouteHandler, ApiRouteModule, ApiRoute, ApiRouteMatch, ApiRouteSegment, ServerRouteModule, ServerLoaderResult, ServerActionResult, D1Database, D1PreparedStatement, D1Result, D1ExecResult, KVNamespace, DurableObjectNamespace, DurableObjectId, DurableObjectStub, Ai, } from './types';
export { DEFAULT_ROUTER_CONFIG, DEFAULT_ESI_CONFIG, HeuristicAdapter, EdgeWorkersESIProcessor, extractUserContext, createContextMiddleware, setContextCookies, addSpeculationHeaders, esiInfer, esiEmbed, esiEmotion, esiVision, esiWithContext, parseResource, formatResource, capabilityGrantsAccess, createNodeCapabilityVerifier, createNodeReadCapability, createNodeWriteCapability, createTreeCapability, createPathCapability, createWildcardNodeCapability, checkNodeAccess, filterAccessibleNodes, getMostSpecificCapability, } from './router/index';
export type { EmotionState, Viewport, ConnectionType, UserTier, UserContext, ThemeMode, LayoutDensity, LayoutType, SkeletonHints, RouteDecision, ComponentNode, ComponentTree, ComponentTreeSchema, RouterAdapter, HeuristicAdapterConfig, TierFeatures, SignalProcessor, ContextExtractorOptions, AIRouterConfig, SpeculationConfig, PersonalizationConfig, RouterConfig, RouterConfigWithESI, ESIModel, ESIContentType, ESIParams, ESIContent, ESIDirective, ESIResult, ESIProcessor, ESIConfig, NodeCapabilityVerifier, NodeVerifierOptions, } from './router/index';
export declare const VERSION = "1.0.0";
