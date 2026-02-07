/**
 * Aeon Pages Offline Types
 *
 * Type definitions for the offline-first operation queue system.
 * Supports encrypted storage, priority queuing, and sync coordination.
 */

// ============================================================================
// Operation Types
// ============================================================================

/**
 * Operation type - what action is being performed
 */
export type OperationType =
  | 'create'
  | 'update'
  | 'delete'
  | 'session_update'
  | 'tree_update'
  | 'data_update'
  | 'presence_update'
  | string; // Allow custom types

/**
 * Operation priority for sync ordering
 */
export type OperationPriority = 'high' | 'normal' | 'low';

/**
 * Operation sync status
 */
export type OperationStatus = 'pending' | 'syncing' | 'synced' | 'failed';

/**
 * Queued operation for offline-first collaboration
 */
export interface OfflineOperation {
  /** Unique operation identifier */
  id: string;

  /** Operation type */
  type: OperationType;

  /** Associated session ID */
  sessionId: string;

  /** Current sync status */
  status: OperationStatus;

  /** Operation payload (unencrypted in memory, encrypted at rest) */
  data: Record<string, unknown>;

  /** Priority for sync ordering */
  priority: OperationPriority;

  /** Encrypted data (when stored) */
  encryptedData?: Uint8Array;

  /** Encryption version */
  encryptionVersion?: number;

  /** Size in bytes */
  bytesSize: number;

  /** Creation timestamp */
  createdAt: number;

  /** Sync completion timestamp */
  syncedAt?: number;

  /** Number of failed attempts */
  failedCount: number;

  /** Last error message */
  lastError?: string;

  /** Current retry count */
  retryCount: number;

  /** Maximum allowed retries */
  maxRetries: number;
}

// ============================================================================
// Queue Configuration
// ============================================================================

/**
 * Encrypted queue configuration
 */
export interface EncryptedQueueConfig {
  /** Maximum local storage capacity in bytes (default: 50MB) */
  maxLocalCapacity: number;

  /** Threshold (0-1) at which compaction is triggered (default: 0.8) */
  compactionThreshold: number;

  /** Interval for D1 sync in ms (default: 5 minutes) */
  d1SyncInterval: number;

  /** Age after which synced operations are cleaned up in ms (default: 1 hour) */
  syncedCleanupAge: number;

  /** Encryption configuration */
  encryption: {
    /** Whether encryption is enabled */
    enabled: boolean;
    /** Key derivation method: 'ucan' for UCAN-derived keys, 'session' for session-based */
    keyDerivation: 'ucan' | 'session';
  };
}

/**
 * Queue statistics
 */
export interface QueueStats {
  /** Total operations in queue */
  total: number;

  /** Operations pending sync */
  pending: number;

  /** Operations currently syncing */
  syncing: number;

  /** Successfully synced operations */
  synced: number;

  /** Failed operations */
  failed: number;

  /** Total bytes used */
  totalBytes: number;

  /** Whether compaction is needed */
  compactionNeeded: boolean;
}

// ============================================================================
// Encryption Types
// ============================================================================

/**
 * Encrypted payload structure
 */
export interface EncryptedPayload {
  /** Encryption version */
  version: number;

  /** Nonce/IV (12 bytes for AES-GCM) */
  nonce: Uint8Array;

  /** Encrypted data with auth tag appended */
  ciphertext: Uint8Array;
}

/**
 * Encryption key material
 */
export interface EncryptionKeyMaterial {
  /** Raw key bytes */
  key: CryptoKey;

  /** Key derivation context */
  context: string;

  /** User ID the key is bound to */
  userId: string;
}

// ============================================================================
// Sync Types
// ============================================================================

/**
 * Sync batch for uploading multiple operations
 */
export interface SyncBatch {
  /** Unique batch identifier */
  batchId: string;

  /** Operations in this batch */
  operations: OfflineOperation[];

  /** Total size in bytes */
  totalSize: number;

  /** Batch creation timestamp */
  createdAt: number;

  /** Batch priority (highest priority of contained operations) */
  priority: OperationPriority;

  /** Whether batch is compressed */
  compressed: boolean;
}

/**
 * Sync result from server
 */
export interface SyncResult {
  /** Whether sync completed successfully */
  success: boolean;

  /** Successfully synced operation IDs */
  synced: string[];

  /** Failed operations with errors */
  failed: Array<{
    operationId: string;
    error: string;
    retryable: boolean;
  }>;

  /** Detected conflicts */
  conflicts: Array<{
    operationId: string;
    remoteVersion: Record<string, unknown>;
    strategy: ResolutionStrategy;
  }>;

  /** Server timestamp */
  serverTimestamp: number;
}

// ============================================================================
// Conflict Types
// ============================================================================

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  /** Whether a conflict was detected */
  hasConflict: boolean;

  /** Type of conflict */
  type?: 'update_update' | 'delete_update' | 'update_delete' | 'concurrent';

  /** Severity level */
  severity?: 'low' | 'medium' | 'high';

  /** Similarity score (0-1) for potential auto-merge */
  similarity?: number;

  /** Conflicting fields */
  conflictingFields?: string[];
}

/**
 * Conflict resolution strategy
 */
export type ResolutionStrategy =
  | 'local-wins'
  | 'remote-wins'
  | 'last-modified'
  | 'merge'
  | 'manual';

/**
 * Stored conflict for manual resolution
 */
export interface StoredConflict {
  /** Unique conflict identifier */
  id: string;

  /** Associated operation ID */
  operationId: string;

  /** Session ID */
  sessionId: string;

  /** Local version of data */
  localData: Record<string, unknown>;

  /** Remote version of data */
  remoteData: Record<string, unknown>;

  /** Conflict type */
  type: ConflictDetectionResult['type'];

  /** Severity */
  severity: ConflictDetectionResult['severity'];

  /** Detection timestamp */
  detectedAt: number;

  /** Resolution (if resolved) */
  resolution?: {
    strategy: ResolutionStrategy;
    resolvedData: Record<string, unknown>;
    resolvedAt: number;
    resolvedBy?: string;
  };
}

// ============================================================================
// Network Types
// ============================================================================

/**
 * Network state for adaptive sync
 */
export type NetworkState = 'online' | 'offline' | 'poor' | 'unknown';

/**
 * Bandwidth profile for sync adaptation
 */
export interface BandwidthProfile {
  /** Estimated bandwidth in Kbps */
  speedKbps: number;

  /** Estimated latency in ms */
  latencyMs: number;

  /** Measurement timestamp */
  timestamp: number;

  /** Reliability score (0-1) */
  reliability: number;

  /** Effective connection type */
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
}

/**
 * Network state event
 */
export interface NetworkStateEvent {
  /** Previous state */
  previousState: NetworkState;

  /** New state */
  newState: NetworkState;

  /** Bandwidth profile (if available) */
  bandwidth?: BandwidthProfile;

  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Coordinator Types
// ============================================================================

/**
 * Sync coordinator configuration
 */
export interface SyncCoordinatorConfig {
  /** Maximum operations per batch (default: 100) */
  maxBatchSize: number;

  /** Maximum bytes per batch (default: 5MB) */
  maxBatchBytes: number;

  /** Batch timeout in ms (default: 5000) */
  batchTimeoutMs: number;

  /** Maximum retry attempts (default: 5) */
  maxRetries: number;

  /** Base retry delay in ms (default: 1000) */
  retryDelayMs: number;

  /** Enable compression for batches (default: true) */
  enableCompression: boolean;

  /** Enable delta sync (default: true) */
  enableDeltaSync: boolean;

  /** Enable adaptive batch sizing based on network (default: true) */
  adaptiveBatching: boolean;
}

/**
 * Sync progress event
 */
export interface SyncProgressEvent {
  /** Current batch being synced */
  batchId: string;

  /** Total operations in batch */
  totalOperations: number;

  /** Operations synced so far */
  syncedOperations: number;

  /** Bytes synced */
  bytesSynced: number;

  /** Total bytes */
  totalBytes: number;

  /** Estimated time remaining in ms */
  estimatedTimeRemaining?: number;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Offline queue events
 */
export type OfflineQueueEvents = {
  /** Queue initialized */
  initialized: undefined;

  /** Operation added to queue */
  'operation:queued': { operationId: string; sessionId: string; size: number };

  /** Operation started syncing */
  'operation:syncing': { operationId: string };

  /** Operation synced successfully */
  'operation:synced': { operationId: string };

  /** Operation failed (will retry) */
  'operation:retry': { operationId: string; attempt: number };

  /** Operation failed permanently */
  'operation:failed_max_retries': { operationId: string; error: string };

  /** Queue capacity error */
  'queue:error': { operationId: string; error: string };

  /** Queue compacted */
  'queue:compacted': undefined;

  /** D1 sync completed */
  'd1:synced': QueueStats;

  /** Queue shutdown */
  shutdown: undefined;

  [key: string]: unknown;
};

/**
 * Sync coordinator events
 */
export interface SyncCoordinatorEvents {
  /** Network state changed */
  'network:changed': NetworkStateEvent;

  /** Sync started */
  'sync:started': { batchId: string };

  /** Sync progress update */
  'sync:progress': SyncProgressEvent;

  /** Sync completed */
  'sync:completed': SyncResult;

  /** Sync failed */
  'sync:failed': { batchId: string; error: string };

  /** Conflict detected */
  'conflict:detected': StoredConflict;

  /** Conflict resolved */
  'conflict:resolved': { conflictId: string; strategy: ResolutionStrategy };
}
