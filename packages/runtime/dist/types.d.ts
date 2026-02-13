/**
 * Aeon Pages Type Definitions
 */
export interface AeonConfig {
    /** Directory containing pages (default: './pages') */
    pagesDir: string;
    /** Directory containing components (default: './components') */
    componentsDir?: string;
    /** Runtime target: 'bun' or 'cloudflare' */
    runtime: 'bun' | 'cloudflare';
    /** Server port (default: 3000) */
    port?: number;
    /** Aeon-specific configuration */
    aeon?: AeonOptions;
    /** Component configuration */
    components?: ComponentOptions;
    /** Next.js compatibility mode */
    nextCompat?: boolean;
    /** Build output configuration */
    output?: OutputOptions;
}
export interface AeonOptions {
    /** Distributed sync configuration */
    sync?: SyncOptions;
    /** Schema versioning configuration */
    versioning?: VersioningOptions;
    /** Presence tracking configuration */
    presence?: PresenceOptions;
    /** Offline support configuration */
    offline?: OfflineOptions;
    /** Push notification configuration */
    push?: PushOptions;
    /** PWA install prompt configuration */
    install?: InstallOptions;
    /** Allow dynamic route creation for unclaimed paths */
    dynamicRoutes?: boolean;
    /** Zero-CLS Skeleton configuration */
    skeleton?: SkeletonOptions;
}
export interface SkeletonOptions {
    /** Enable automatic skeleton generation */
    enabled: boolean;
    /** Minimum confidence to generate skeletons (0-1) */
    minConfidence?: number;
    /** Enable fade animation when swapping content */
    fadeAnimation?: boolean;
    /** Fade animation duration in ms */
    fadeDuration?: number;
    /** Components that always need skeletons (dynamic content) */
    alwaysDynamic?: string[];
    /** Components that never need skeletons (static containers) */
    neverDynamic?: string[];
}
export interface SyncOptions {
    /** Sync mode: 'distributed' for multi-node, 'local' for single-node */
    mode: 'distributed' | 'local';
    /** Number of replicas for distributed mode */
    replicationFactor?: number;
    /** Consistency level for reads/writes */
    consistencyLevel?: 'strong' | 'eventual' | 'read-after-write';
}
export interface VersioningOptions {
    /** Enable schema versioning */
    enabled: boolean;
    /** Automatically run migrations */
    autoMigrate?: boolean;
}
export interface PresenceOptions {
    /** Enable presence tracking */
    enabled: boolean;
    /** Track cursor positions */
    cursorTracking?: boolean;
    /** Track focused node/element paths */
    focusTracking?: boolean;
    /** Track text selection ranges */
    selectionTracking?: boolean;
    /** Track typing activity */
    typingTracking?: boolean;
    /** Track scroll depth and scroll coordinates */
    scrollTracking?: boolean;
    /** Track viewport size changes */
    viewportTracking?: boolean;
    /** Track input state (focus, caret, length) */
    inputTracking?: boolean;
    /** Track optional emotional state channel */
    emotionTracking?: boolean;
    /** Inactivity timeout in milliseconds */
    inactivityTimeout?: number;
    /** Throttle frequency for high-churn presence signals */
    eventThrottleMs?: number;
}
export interface OfflineOptions {
    /** Enable offline support */
    enabled: boolean;
    /** Maximum operations to queue offline (default: 1000) */
    maxQueueSize?: number;
    /** Encryption configuration for offline queue */
    encryption?: {
        /** Enable encryption for queued operations */
        enabled: boolean;
        /** Key derivation method: 'ucan' for UCAN-derived keys, 'session' for session-based */
        keyDerivation?: 'ucan' | 'session';
    };
    /** Sync configuration */
    sync?: {
        /** Maximum operations per batch (default: 100) */
        maxBatchSize?: number;
        /** Maximum bytes per batch (default: 5MB) */
        maxBatchBytes?: number;
        /** Batch timeout in ms (default: 5000) */
        batchTimeoutMs?: number;
        /** Enable compression for batches (default: true) */
        enableCompression?: boolean;
        /** Enable delta sync (default: true) */
        enableDeltaSync?: boolean;
        /** Enable adaptive batch sizing based on network (default: true) */
        adaptiveBatching?: boolean;
    };
    /** Storage configuration */
    storage?: {
        /** Maximum local storage capacity in bytes (default: 50MB) */
        maxLocalCapacity?: number;
        /** Interval for D1 sync in ms (default: 5 minutes) */
        d1SyncInterval?: number;
    };
}
/** Push notification configuration */
export interface PushOptions {
    /** Enable push notifications */
    enabled: boolean;
    /** VAPID public key for push subscription */
    vapidPublicKey?: string;
    /** Default notification icon */
    defaultIcon?: string;
    /** Default notification badge */
    defaultBadge?: string;
}
/** PWA install prompt configuration */
export interface InstallOptions {
    /** Show install prompt when available */
    showPrompt: boolean;
    /** Show iOS-specific installation instructions */
    iosInstructions: boolean;
}
export interface ComponentOptions {
    /** Auto-discover components from componentsDir */
    autoDiscover?: boolean;
    /** Explicit list of components to include */
    include?: string[];
    /** Components to exclude from auto-discovery */
    exclude?: string[];
}
export interface OutputOptions {
    /** Output directory for built assets */
    dir?: string;
}
/** Route definition */
export interface RouteDefinition {
    /** Pattern like "/blog/[slug]" */
    pattern: string;
    /** Session ID template */
    sessionId: string;
    /** Component ID */
    componentId: string;
    /** Layout wrapper */
    layout?: string;
    /** Whether this route uses 'use aeon' */
    isAeon: boolean;
}
/** Route match result */
export interface RouteMatch {
    /** The matched route */
    route: RouteDefinition;
    /** Extracted parameters */
    params: Record<string, string>;
    /** Resolved session ID */
    sessionId: string;
    /** Component ID shorthand */
    componentId: string;
    /** Is this an Aeon page? */
    isAeon: boolean;
}
/** Route metadata for registry */
export interface RouteMetadata {
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
}
/** Route operation for sync */
export interface RouteOperation {
    type: 'route-add' | 'route-update' | 'route-remove';
    path: string;
    component?: string;
    metadata?: RouteMetadata;
    timestamp: string;
    nodeId: string;
}
/** Shape types for skeleton rendering */
export type SkeletonShape = 'rect' | 'circle' | 'text-line' | 'text-block' | 'container';
/** Source of skeleton inference */
export type SkeletonSource = 'tailwind' | 'prop-defaults' | 'hint' | 'measured';
/** Skeleton dimensions extracted from Tailwind classes or props */
export interface SkeletonDimensions {
    /** Width CSS value: '256px', '100%', 'auto' */
    width?: string;
    /** Height CSS value: '48px', 'auto' */
    height?: string;
    /** Min height CSS value */
    minHeight?: string;
    /** Aspect ratio: '16/9', '1/1' */
    aspectRatio?: string;
    /** Padding CSS value */
    padding?: string;
    /** Margin CSS value */
    margin?: string;
    /** Border radius CSS value */
    borderRadius?: string;
    /** Gap for flex/grid containers */
    gap?: string;
}
/** Skeleton metadata attached to component nodes */
export interface SkeletonMetadata {
    /** Computed dimensions from Tailwind/props/hints */
    dimensions: SkeletonDimensions;
    /** Shape hint for skeleton rendering */
    shape: SkeletonShape;
    /** Number of skeleton lines for text-block shape */
    lines?: number;
    /** Whether this node has dynamic content that needs skeleton */
    isDynamic: boolean;
    /** Confidence score (0-1) for inferred dimensions */
    confidence: number;
    /** Source of skeleton data */
    source: SkeletonSource;
}
/** Skeleton hint parsed from data-skeleton-* attributes */
export interface SkeletonHint {
    /** Explicit shape override */
    shape?: SkeletonShape;
    /** Explicit width override */
    width?: string;
    /** Explicit height override */
    height?: string;
    /** Number of lines for text-block */
    lines?: number;
    /** Skip skeleton generation for this element */
    ignore?: boolean;
}
/** Serialized component tree */
export interface SerializedComponent {
    type: string;
    props?: Record<string, unknown>;
    children?: (SerializedComponent | string)[];
    /** Skeleton metadata for zero-CLS rendering (computed at build time) */
    _skeleton?: SkeletonMetadata;
}
/** Page session stored in Aeon */
export interface PageSession {
    /** Route this session serves */
    route: string;
    /** Current component state */
    tree: SerializedComponent;
    /** Page data */
    data: Record<string, unknown>;
    /** Schema version */
    schema: {
        version: string;
    };
    /** Active presence info */
    presence: PresenceInfo[];
    /** Session version number (increments on each edit) */
    version?: number;
    /** Last modified timestamp */
    updatedAt?: string;
    /** Last modified by user/agent ID */
    updatedBy?: string;
}
/** Webhook configuration for sync callbacks */
export interface WebhookConfig {
    /** URL to call when session changes */
    url: string;
    /** Secret for HMAC signature verification */
    secret?: string;
    /** Events to trigger webhook: 'edit', 'publish', 'all' */
    events: ('edit' | 'publish' | 'merge' | 'all')[];
}
/** Webhook payload sent to callback URLs */
export interface WebhookPayload {
    /** Event type */
    event: 'session.updated' | 'session.published' | 'session.merged' | 'github.push';
    /** Session ID */
    sessionId: string;
    /** Route */
    route: string;
    /** Session version */
    version: number;
    /** Timestamp */
    timestamp: string;
    /** GitHub PR number (for publish/merge events) */
    prNumber?: number;
    /** User who triggered the event */
    triggeredBy?: string;
}
/** Presence info for a user/agent */
export interface PresenceSelection {
    start: number;
    end: number;
    direction?: 'forward' | 'backward' | 'none';
    path?: string;
}
export interface PresenceTyping {
    isTyping: boolean;
    field?: string;
    isComposing?: boolean;
    startedAt?: string;
    stoppedAt?: string;
}
export interface PresenceScroll {
    depth: number;
    y?: number;
    viewportHeight?: number;
    documentHeight?: number;
    path?: string;
}
export interface PresenceViewport {
    width: number;
    height: number;
}
export interface PresenceInputState {
    field: string;
    hasFocus: boolean;
    valueLength?: number;
    selectionStart?: number;
    selectionEnd?: number;
    isComposing?: boolean;
    inputMode?: string;
}
export interface PresenceEmotion {
    primary?: string;
    secondary?: string;
    confidence?: number;
    intensity?: number;
    valence?: number;
    arousal?: number;
    dominance?: number;
    source?: 'self-report' | 'inferred' | 'sensor' | 'hybrid';
    updatedAt?: string;
}
export interface PresenceInfo {
    /** User or agent ID */
    userId: string;
    /** User or agent role */
    role: 'user' | 'assistant' | 'monitor' | 'admin';
    /** Cursor position */
    cursor?: {
        x: number;
        y: number;
    };
    /** Focused node path */
    focusNode?: string;
    /** Text selection */
    selection?: PresenceSelection;
    /** Typing state */
    typing?: PresenceTyping;
    /** Scroll state */
    scroll?: PresenceScroll;
    /** Viewport dimensions */
    viewport?: PresenceViewport;
    /** Input state */
    inputState?: PresenceInputState;
    /** Optional emotional state */
    emotion?: PresenceEmotion;
    /** Currently editing element path */
    editing?: string;
    /** Online/away/offline status */
    status: 'online' | 'away' | 'offline';
    /** Last activity timestamp */
    lastActivity: string;
}
/**
 * Base capability actions for Aeon pages
 * - aeon:read - Read access to page/node
 * - aeon:write - Write access to page/node
 * - aeon:admin - Full admin access (bypasses all restrictions)
 * - aeon:* - Wildcard (all permissions)
 */
export type AeonCapabilityAction = 'aeon:read' | 'aeon:write' | 'aeon:admin' | 'aeon:*';
/**
 * Node-level capability actions (Merkle hash-based)
 * - aeon:node:read - Read access to specific node by Merkle hash
 * - aeon:node:write - Write access to specific node by Merkle hash
 * - aeon:node:* - All permissions on specific node
 */
export type AeonNodeCapabilityAction = 'aeon:node:read' | 'aeon:node:write' | 'aeon:node:*';
/** All capability action types */
export type AeonCapabilityActionType = AeonCapabilityAction | AeonNodeCapabilityAction;
/** UCAN capability for Aeon pages */
export interface AeonCapability {
    can: AeonCapabilityAction;
    with: string;
}
/**
 * UCAN capability for node-level access (Merkle hash-based)
 *
 * @example
 * ```ts
 * // Grant read access to a specific node by Merkle hash
 * const capability: AeonNodeCapability = {
 *   can: 'aeon:node:read',
 *   with: 'merkle:a1b2c3d4e5f6',
 * };
 *
 * // Grant write access to all nodes under a path
 * const pathCapability: AeonNodeCapability = {
 *   can: 'aeon:node:write',
 *   with: 'path:/dashboard/*',
 * };
 *
 * // Grant access to node and all children (tree access)
 * const treeCapability: AeonNodeCapability = {
 *   can: 'aeon:node:*',
 *   with: 'tree:a1b2c3d4e5f6',
 * };
 * ```
 */
export interface AeonNodeCapability {
    can: AeonNodeCapabilityAction;
    /**
     * Resource identifier. Supports:
     * - `merkle:<hash>` - Specific node by Merkle hash
     * - `tree:<hash>` - Node and all descendants
     * - `path:<route>` - All nodes on a route (supports wildcards)
     * - `*` - All nodes (wildcard)
     */
    with: string;
}
/** Combined capability type (page or node level) */
export type AeonAnyCapability = AeonCapability | AeonNodeCapability;
/**
 * Resource type for capability matching
 */
export type AeonResourceType = 'merkle' | 'tree' | 'path' | 'wildcard';
/**
 * Parsed resource identifier from capability
 */
export interface ParsedResource {
    type: AeonResourceType;
    value: string;
}
/**
 * Merkle node access request
 * Used when verifying access to a specific node
 */
export interface MerkleAccessRequest {
    /** The Merkle hash of the node */
    merkleHash: string;
    /** Full tree path from root to node */
    treePath?: string[];
    /** Merkle hashes of ancestors (for tree-based checks) */
    ancestorHashes?: string[];
    /** The route/page path */
    routePath?: string;
}
/** Alias for PresenceInfo - used by react package */
export type PresenceUser = PresenceInfo;
/** HTTP methods supported for API routes */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
/** Cloudflare Workers environment bindings */
export interface AeonEnv {
    /** Durable Object namespace for page sessions */
    PAGE_SESSIONS?: DurableObjectNamespace;
    /** Durable Object namespace for routes registry */
    ROUTES_REGISTRY?: DurableObjectNamespace;
    /** D1 Database binding */
    DB?: D1Database;
    /** Workers KV namespace for caching */
    CACHE?: KVNamespace;
    /** Workers AI binding */
    AI?: Ai;
    /** Environment name (development, staging, production) */
    ENVIRONMENT?: string;
    /** Allow additional custom bindings */
    [key: string]: unknown;
}
/** D1 Database interface */
export interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<D1ExecResult>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    dump(): Promise<ArrayBuffer>;
}
export interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    run(): Promise<D1Result>;
    first<T = unknown>(colName?: string): Promise<T | null>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
}
export interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    error?: string;
    meta?: {
        duration: number;
        changes: number;
        last_row_id: number;
        served_by: string;
    };
}
export interface D1ExecResult {
    count: number;
    duration: number;
}
/** KV Namespace interface */
export interface KVNamespace {
    get(key: string, options?: {
        type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
    }): Promise<string | null>;
    getWithMetadata<T = unknown>(key: string): Promise<{
        value: string | null;
        metadata: T | null;
    }>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: {
        expirationTtl?: number;
        metadata?: unknown;
    }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
        limit?: number;
        cursor?: string;
    }): Promise<{
        keys: {
            name: string;
        }[];
        list_complete: boolean;
        cursor?: string;
    }>;
}
/** Durable Object Namespace interface */
export interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    newUniqueId(): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
}
export interface DurableObjectId {
    toString(): string;
    equals(other: DurableObjectId): boolean;
}
export interface DurableObjectStub {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
    id: DurableObjectId;
}
/** Workers AI interface */
export interface Ai {
    run<T = unknown>(model: string, inputs: unknown, options?: {
        gateway?: {
            id: string;
        };
    }): Promise<T>;
}
/** Context passed to API route handlers */
export interface AeonContext<E extends AeonEnv = AeonEnv> {
    /** The incoming request */
    request: Request;
    /** Environment bindings (D1, KV, AI, Durable Objects, etc.) */
    env: E;
    /** Extracted URL parameters from dynamic routes */
    params: Record<string, string>;
    /** The request URL parsed */
    url: URL;
    /** Execution context for waitUntil, etc. */
    ctx: ExecutionContext;
}
/** Execution context for Cloudflare Workers */
export interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}
/** API route handler function */
export type ApiRouteHandler<E extends AeonEnv = AeonEnv> = (context: AeonContext<E>) => Response | Promise<Response>;
/** API route module - exports handlers for each HTTP method */
export interface ApiRouteModule<E extends AeonEnv = AeonEnv> {
    GET?: ApiRouteHandler<E>;
    POST?: ApiRouteHandler<E>;
    PUT?: ApiRouteHandler<E>;
    PATCH?: ApiRouteHandler<E>;
    DELETE?: ApiRouteHandler<E>;
    HEAD?: ApiRouteHandler<E>;
    OPTIONS?: ApiRouteHandler<E>;
    /** Catch-all handler for any method */
    default?: ApiRouteHandler<E>;
}
/** Registered API route */
export interface ApiRoute {
    /** Route pattern (e.g., "/api/chat", "/api/users/[id]") */
    pattern: string;
    /** Parsed path segments for matching */
    segments: ApiRouteSegment[];
    /** The route module with handlers */
    module: ApiRouteModule;
}
/** Segment of an API route pattern */
export interface ApiRouteSegment {
    /** The segment text */
    value: string;
    /** Is this a dynamic parameter? */
    isDynamic: boolean;
    /** Is this a catch-all segment? */
    isCatchAll: boolean;
}
/** API route match result */
export interface ApiRouteMatch {
    /** The matched route */
    route: ApiRoute;
    /** Extracted parameters */
    params: Record<string, string>;
    /** The handler for the request method */
    handler: ApiRouteHandler;
}
/** Server route module - for page-level server logic */
export interface ServerRouteModule<E extends AeonEnv = AeonEnv> {
    /** Called before page render - can return data or redirect */
    loader?: (context: AeonContext<E>) => Promise<ServerLoaderResult>;
    /** Called on form submission or POST to the page */
    action?: (context: AeonContext<E>) => Promise<ServerActionResult>;
}
/** Result from a server loader */
export interface ServerLoaderResult {
    /** Data to pass to the page */
    data?: Record<string, unknown>;
    /** Redirect to another URL */
    redirect?: string;
    /** Response status code */
    status?: number;
    /** Additional headers */
    headers?: Record<string, string>;
}
/** Result from a server action */
export interface ServerActionResult {
    /** Data to return */
    data?: Record<string, unknown>;
    /** Errors to display */
    errors?: Record<string, string>;
    /** Redirect after action */
    redirect?: string;
    /** Response status code */
    status?: number;
}
