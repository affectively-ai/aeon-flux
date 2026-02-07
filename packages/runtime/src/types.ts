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

  /** Allow dynamic route creation for unclaimed paths */
  dynamicRoutes?: boolean;
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

  /** Inactivity timeout in milliseconds */
  inactivityTimeout?: number;
}

export interface OfflineOptions {
  /** Enable offline support */
  enabled: boolean;

  /** Maximum operations to queue offline */
  maxQueueSize?: number;
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

/** Serialized component tree */
export interface SerializedComponent {
  type: string;
  props?: Record<string, unknown>;
  children?: (SerializedComponent | string)[];
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
  schema: { version: string };

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
export interface PresenceInfo {
  /** User or agent ID */
  userId: string;

  /** User or agent role */
  role: 'user' | 'assistant' | 'monitor' | 'admin';

  /** Cursor position */
  cursor?: { x: number; y: number };

  /** Currently editing element path */
  editing?: string;

  /** Online/away/offline status */
  status: 'online' | 'away' | 'offline';

  /** Last activity timestamp */
  lastActivity: string;
}

/** UCAN capability for Aeon pages */
export interface AeonCapability {
  can: 'aeon:read' | 'aeon:write' | 'aeon:admin' | 'aeon:*';
  with: string;
}

/** Alias for PresenceInfo - used by react package */
export type PresenceUser = PresenceInfo;

// =============================================================================
// API ROUTES - Server-side request handling
// =============================================================================

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
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  getWithMetadata<T = unknown>(key: string): Promise<{ value: string | null; metadata: T | null }>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number; metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
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
  run<T = unknown>(model: string, inputs: unknown, options?: { gateway?: { id: string } }): Promise<T>;
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
export type ApiRouteHandler<E extends AeonEnv = AeonEnv> = (
  context: AeonContext<E>
) => Response | Promise<Response>;

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
