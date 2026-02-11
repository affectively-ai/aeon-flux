/**
 * Aeon Pages Sync Coordinator
 *
 * Coordinates synchronization of offline operations with server.
 * Handles bandwidth optimization, batching, and network state management.
 *
 * Features:
 * - Adaptive batch sizing based on network conditions
 * - Network state tracking and monitoring
 * - Bandwidth profiling
 * - Sync progress tracking
 * - Configurable compression and delta sync
 */

import type {
  OfflineOperation,
  SyncBatch,
  SyncResult,
  SyncCoordinatorConfig,
  SyncProgressEvent,
  NetworkState,
  NetworkStateEvent,
  BandwidthProfile,
  OperationPriority,
} from '../offline/types';

// ============================================================================
// Types
// ============================================================================

export interface SyncStats {
  totalSyncsAttempted: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalOperationsSynced: number;
  averageSyncDurationMs: number;
  lastSyncTime?: number;
  networkStateHistory: Array<{ state: NetworkState; timestamp: number }>;
  bandwidthHistory: BandwidthProfile[];
}

// ============================================================================
// Event Emitter (minimal implementation)
// ============================================================================

type EventHandler<T> = (data: T) => void;

class EventEmitter<
  Events extends Record<string, unknown> = Record<string, unknown>,
> {
  private handlers = new Map<string, Set<EventHandler<unknown>>>();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    const key = event as string;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }
    this.handlers.get(key)!.add(handler as EventHandler<unknown>);
  }

  off<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): void {
    this.handlers
      .get(event as string)
      ?.delete(handler as EventHandler<unknown>);
  }

  emit<K extends keyof Events>(event: K, data?: Events[K]): void {
    this.handlers.get(event as string)?.forEach((handler) => handler(data));
  }
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SyncCoordinatorConfig = {
  maxBatchSize: 100,
  maxBatchBytes: 5 * 1024 * 1024, // 5MB
  batchTimeoutMs: 5000,
  maxRetries: 5,
  retryDelayMs: 1000,
  enableCompression: true,
  enableDeltaSync: true,
  adaptiveBatching: true,
};

// ============================================================================
// Sync Coordinator
// ============================================================================

export class SyncCoordinator extends EventEmitter<{
  'network:changed': NetworkStateEvent;
  'network:online': void;
  'network:offline': void;
  'bandwidth:updated': BandwidthProfile;
  'batch:created': SyncBatch;
  'batch:started': { batchId: string };
  'batch:progress': SyncProgressEvent;
  'batch:completed': { batch: SyncBatch; result: SyncResult };
  'batch:failed': { batch: SyncBatch; error: string };
  'batch:retry': { batch: SyncBatch; attempt: number };
  'config:updated': SyncCoordinatorConfig;
}> {
  private networkState: NetworkState = 'unknown';
  private bandwidthProfile: BandwidthProfile = {
    speedKbps: 1024,
    latencyMs: 50,
    timestamp: Date.now(),
    reliability: 1,
    effectiveType: 'unknown',
  };

  private batches: Map<string, SyncBatch> = new Map();
  private progress: Map<string, SyncProgressEvent> = new Map();
  private currentSyncBatchId: string | null = null;
  private config: SyncCoordinatorConfig;
  private syncTimings: number[] = [];

  private stats: SyncStats = {
    totalSyncsAttempted: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalOperationsSynced: 0,
    averageSyncDurationMs: 0,
    networkStateHistory: [],
    bandwidthHistory: [],
  };

  constructor(config: Partial<SyncCoordinatorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize network state detection
    if (typeof navigator !== 'undefined') {
      this.initNetworkDetection();
    }
  }

  /**
   * Initialize network state detection
   */
  private initNetworkDetection(): void {
    // Check initial state
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      this.setNetworkState(navigator.onLine ? 'online' : 'offline');
    }

    // Listen for changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setNetworkState('online'));
      window.addEventListener('offline', () => this.setNetworkState('offline'));
    }

    // Check connection quality if available
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (
        navigator as Navigator & { connection?: NetworkInformation }
      ).connection;
      if (conn) {
        this.updateBandwidthFromConnection(conn);
        conn.addEventListener?.('change', () =>
          this.updateBandwidthFromConnection(conn),
        );
      }
    }
  }

  /**
   * Update bandwidth profile from Network Information API
   */
  private updateBandwidthFromConnection(conn: NetworkInformation): void {
    const effectiveType =
      conn.effectiveType as BandwidthProfile['effectiveType'];

    let speedKbps = 1024; // Default 1 Mbps
    let latencyMs = 50;

    switch (effectiveType) {
      case 'slow-2g':
        speedKbps = 50;
        latencyMs = 2000;
        break;
      case '2g':
        speedKbps = 150;
        latencyMs = 1000;
        break;
      case '3g':
        speedKbps = 750;
        latencyMs = 400;
        break;
      case '4g':
        speedKbps = 5000;
        latencyMs = 50;
        break;
    }

    // Use actual downlink if available
    if (conn.downlink) {
      speedKbps = conn.downlink * 1024; // Convert Mbps to Kbps
    }

    // Use RTT if available
    if (conn.rtt) {
      latencyMs = conn.rtt;
    }

    this.updateBandwidthProfile({
      speedKbps,
      latencyMs,
      effectiveType,
      reliability:
        effectiveType === '4g' ? 0.95 : effectiveType === '3g' ? 0.85 : 0.7,
    });

    // Update network state based on connection quality
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.setNetworkState('poor');
    }
  }

  /**
   * Update network state
   */
  setNetworkState(state: NetworkState): void {
    const previousState = this.networkState;
    if (previousState === state) return;

    this.networkState = state;

    const event: NetworkStateEvent = {
      previousState,
      newState: state,
      bandwidth: this.bandwidthProfile,
      timestamp: Date.now(),
    };

    this.stats.networkStateHistory.push({ state, timestamp: Date.now() });
    if (this.stats.networkStateHistory.length > 100) {
      this.stats.networkStateHistory.shift();
    }

    this.emit('network:changed', event);

    if (previousState !== 'online' && state === 'online') {
      this.emit('network:online');
    } else if (previousState === 'online' && state !== 'online') {
      this.emit('network:offline');
    }
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return this.networkState;
  }

  /**
   * Update bandwidth profile
   */
  updateBandwidthProfile(profile: Partial<BandwidthProfile>): void {
    this.bandwidthProfile = {
      ...this.bandwidthProfile,
      ...profile,
      timestamp: Date.now(),
    };

    this.stats.bandwidthHistory.push(this.bandwidthProfile);
    if (this.stats.bandwidthHistory.length > 50) {
      this.stats.bandwidthHistory.shift();
    }

    // Adapt batch sizes if enabled
    if (this.config.adaptiveBatching) {
      this.adaptBatchSizes();
    }

    this.emit('bandwidth:updated', this.bandwidthProfile);
  }

  /**
   * Get current bandwidth profile
   */
  getBandwidthProfile(): BandwidthProfile {
    return { ...this.bandwidthProfile };
  }

  /**
   * Create a sync batch from operations
   */
  createSyncBatch(operations: OfflineOperation[]): SyncBatch {
    // Limit to max batch size
    const batchOps = operations.slice(0, this.config.maxBatchSize);

    // Calculate total size
    let totalSize = 0;
    const sizedOps: OfflineOperation[] = [];

    for (const op of batchOps) {
      const opSize = op.bytesSize || JSON.stringify(op).length;
      if (totalSize + opSize > this.config.maxBatchBytes) {
        break;
      }
      totalSize += opSize;
      sizedOps.push(op);
    }

    // Determine highest priority in batch
    const priorityOrder: Record<OperationPriority, number> = {
      high: 0,
      normal: 1,
      low: 2,
    };
    const highestPriority = sizedOps.reduce<OperationPriority>(
      (highest, op) =>
        priorityOrder[op.priority] < priorityOrder[highest]
          ? op.priority
          : highest,
      'low',
    );

    const batch: SyncBatch = {
      batchId: `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      operations: sizedOps,
      totalSize,
      createdAt: Date.now(),
      priority: highestPriority,
      compressed: this.config.enableCompression,
    };

    this.batches.set(batch.batchId, batch);
    this.emit('batch:created', batch);

    return batch;
  }

  /**
   * Start syncing a batch
   */
  startSyncBatch(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    this.currentSyncBatchId = batchId;
    this.stats.totalSyncsAttempted++;

    this.progress.set(batchId, {
      batchId,
      totalOperations: batch.operations.length,
      syncedOperations: 0,
      bytesSynced: 0,
      totalBytes: batch.totalSize,
    });

    this.emit('batch:started', { batchId });
  }

  /**
   * Update sync progress
   */
  updateProgress(
    batchId: string,
    syncedOperations: number,
    bytesSynced: number,
  ): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    const progress: SyncProgressEvent = {
      batchId,
      totalOperations: batch.operations.length,
      syncedOperations,
      bytesSynced,
      totalBytes: batch.totalSize,
      estimatedTimeRemaining: this.estimateSyncTime(
        batch.totalSize - bytesSynced,
      ),
    };

    this.progress.set(batchId, progress);
    this.emit('batch:progress', progress);
  }

  /**
   * Complete a sync batch
   */
  completeSyncBatch(batchId: string, result: SyncResult): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    if (result.success) {
      this.stats.successfulSyncs++;
      this.stats.totalOperationsSynced += result.synced.length;
      this.stats.lastSyncTime = Date.now();
    } else {
      this.stats.failedSyncs++;
    }

    this.currentSyncBatchId = null;
    this.emit('batch:completed', { batch, result });
  }

  /**
   * Mark batch as failed
   */
  failSyncBatch(batchId: string, error: string, retryable = true): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    const attemptCount =
      (batch as SyncBatch & { attemptCount?: number }).attemptCount || 0;

    if (retryable && attemptCount < this.config.maxRetries) {
      (batch as SyncBatch & { attemptCount: number }).attemptCount =
        attemptCount + 1;
      this.emit('batch:retry', { batch, attempt: attemptCount + 1 });
    } else {
      this.stats.failedSyncs++;
      this.emit('batch:failed', { batch, error });
    }

    this.currentSyncBatchId = null;
  }

  /**
   * Get batch by ID
   */
  getBatch(batchId: string): SyncBatch | undefined {
    return this.batches.get(batchId);
  }

  /**
   * Get all pending batches
   */
  getPendingBatches(): SyncBatch[] {
    return Array.from(this.batches.values());
  }

  /**
   * Get current sync progress
   */
  getCurrentProgress(): SyncProgressEvent | undefined {
    if (this.currentSyncBatchId) {
      return this.progress.get(this.currentSyncBatchId);
    }
    return undefined;
  }

  /**
   * Estimate sync time for given bytes
   */
  estimateSyncTime(bytes: number): number {
    const secondsNeeded =
      (bytes * 8) / (this.bandwidthProfile.speedKbps * 1024);
    return Math.round(
      (secondsNeeded + this.bandwidthProfile.latencyMs / 1000) * 1000,
    );
  }

  /**
   * Adapt batch sizes based on bandwidth
   */
  private adaptBatchSizes(): void {
    const speed = this.bandwidthProfile.speedKbps;

    // Poor connection - reduce batch size
    if (speed < 512) {
      this.config.maxBatchSize = Math.max(
        10,
        Math.floor(DEFAULT_CONFIG.maxBatchSize / 4),
      );
      this.config.maxBatchBytes = Math.max(
        512 * 1024,
        Math.floor(DEFAULT_CONFIG.maxBatchBytes / 4),
      );
    } else if (speed < 1024) {
      this.config.maxBatchSize = Math.max(
        25,
        Math.floor(DEFAULT_CONFIG.maxBatchSize / 2),
      );
      this.config.maxBatchBytes = Math.max(
        1024 * 1024,
        Math.floor(DEFAULT_CONFIG.maxBatchBytes / 2),
      );
    } else if (speed > 5000) {
      // Good connection - increase batch size
      this.config.maxBatchSize = Math.min(500, DEFAULT_CONFIG.maxBatchSize * 2);
      this.config.maxBatchBytes = Math.min(
        50 * 1024 * 1024,
        DEFAULT_CONFIG.maxBatchBytes * 2,
      );
    } else {
      // Normal connection - use defaults
      this.config.maxBatchSize = DEFAULT_CONFIG.maxBatchSize;
      this.config.maxBatchBytes = DEFAULT_CONFIG.maxBatchBytes;
    }
  }

  /**
   * Get sync statistics
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Configure the coordinator
   */
  configure(config: Partial<SyncCoordinatorConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): SyncCoordinatorConfig {
    return { ...this.config };
  }

  /**
   * Clear all batches
   */
  clear(): void {
    this.batches.clear();
    this.progress.clear();
    this.currentSyncBatchId = null;
  }

  /**
   * Reset service (for testing)
   */
  reset(): void {
    this.clear();
    this.networkState = 'unknown';
    this.syncTimings = [];
    this.stats = {
      totalSyncsAttempted: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalOperationsSynced: 0,
      averageSyncDurationMs: 0,
      networkStateHistory: [],
      bandwidthHistory: [],
    };
  }
}

// ============================================================================
// Network Information API types
// ============================================================================

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (event: string, callback: () => void) => void;
}

// ============================================================================
// Singleton Instance
// ============================================================================

let _instance: SyncCoordinator | null = null;

/**
 * Get the singleton sync coordinator instance
 */
export function getSyncCoordinator(): SyncCoordinator {
  if (!_instance) {
    _instance = new SyncCoordinator();
  }
  return _instance;
}

/**
 * Create a new sync coordinator with custom configuration
 */
export function createSyncCoordinator(
  config?: Partial<SyncCoordinatorConfig>,
): SyncCoordinator {
  return new SyncCoordinator(config);
}

/**
 * Reset the singleton coordinator (for testing)
 */
export function resetSyncCoordinator(): void {
  if (_instance) {
    _instance.reset();
  }
  _instance = null;
}
