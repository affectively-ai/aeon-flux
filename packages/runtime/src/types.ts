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
