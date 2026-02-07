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
import type { OfflineOperation, SyncBatch, SyncResult, SyncCoordinatorConfig, SyncProgressEvent, NetworkState, NetworkStateEvent, BandwidthProfile } from '../offline/types';
export interface SyncStats {
    totalSyncsAttempted: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalOperationsSynced: number;
    averageSyncDurationMs: number;
    lastSyncTime?: number;
    networkStateHistory: Array<{
        state: NetworkState;
        timestamp: number;
    }>;
    bandwidthHistory: BandwidthProfile[];
}
type EventHandler<T> = (data: T) => void;
declare class EventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> {
    private handlers;
    on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
    off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
    emit<K extends keyof Events>(event: K, data?: Events[K]): void;
}
export declare class SyncCoordinator extends EventEmitter<{
    'network:changed': NetworkStateEvent;
    'network:online': void;
    'network:offline': void;
    'bandwidth:updated': BandwidthProfile;
    'batch:created': SyncBatch;
    'batch:started': {
        batchId: string;
    };
    'batch:progress': SyncProgressEvent;
    'batch:completed': {
        batch: SyncBatch;
        result: SyncResult;
    };
    'batch:failed': {
        batch: SyncBatch;
        error: string;
    };
    'batch:retry': {
        batch: SyncBatch;
        attempt: number;
    };
    'config:updated': SyncCoordinatorConfig;
}> {
    private networkState;
    private bandwidthProfile;
    private batches;
    private progress;
    private currentSyncBatchId;
    private config;
    private syncTimings;
    private stats;
    constructor(config?: Partial<SyncCoordinatorConfig>);
    /**
     * Initialize network state detection
     */
    private initNetworkDetection;
    /**
     * Update bandwidth profile from Network Information API
     */
    private updateBandwidthFromConnection;
    /**
     * Update network state
     */
    setNetworkState(state: NetworkState): void;
    /**
     * Get current network state
     */
    getNetworkState(): NetworkState;
    /**
     * Update bandwidth profile
     */
    updateBandwidthProfile(profile: Partial<BandwidthProfile>): void;
    /**
     * Get current bandwidth profile
     */
    getBandwidthProfile(): BandwidthProfile;
    /**
     * Create a sync batch from operations
     */
    createSyncBatch(operations: OfflineOperation[]): SyncBatch;
    /**
     * Start syncing a batch
     */
    startSyncBatch(batchId: string): void;
    /**
     * Update sync progress
     */
    updateProgress(batchId: string, syncedOperations: number, bytesSynced: number): void;
    /**
     * Complete a sync batch
     */
    completeSyncBatch(batchId: string, result: SyncResult): void;
    /**
     * Mark batch as failed
     */
    failSyncBatch(batchId: string, error: string, retryable?: boolean): void;
    /**
     * Get batch by ID
     */
    getBatch(batchId: string): SyncBatch | undefined;
    /**
     * Get all pending batches
     */
    getPendingBatches(): SyncBatch[];
    /**
     * Get current sync progress
     */
    getCurrentProgress(): SyncProgressEvent | undefined;
    /**
     * Estimate sync time for given bytes
     */
    estimateSyncTime(bytes: number): number;
    /**
     * Adapt batch sizes based on bandwidth
     */
    private adaptBatchSizes;
    /**
     * Get sync statistics
     */
    getStats(): SyncStats;
    /**
     * Configure the coordinator
     */
    configure(config: Partial<SyncCoordinatorConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): SyncCoordinatorConfig;
    /**
     * Clear all batches
     */
    clear(): void;
    /**
     * Reset service (for testing)
     */
    reset(): void;
}
/**
 * Get the singleton sync coordinator instance
 */
export declare function getSyncCoordinator(): SyncCoordinator;
/**
 * Create a new sync coordinator with custom configuration
 */
export declare function createSyncCoordinator(config?: Partial<SyncCoordinatorConfig>): SyncCoordinator;
/**
 * Reset the singleton coordinator (for testing)
 */
export declare function resetSyncCoordinator(): void;
export {};
