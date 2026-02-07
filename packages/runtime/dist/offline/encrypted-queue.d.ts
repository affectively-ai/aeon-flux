/**
 * Aeon Pages Encrypted Offline Queue
 *
 * Persistent, encrypted operation queue for offline-first applications.
 *
 * Features:
 * - Priority queuing (high/normal/low)
 * - Configurable local capacity with overflow handling
 * - Optional UCAN-based or session-based encryption
 * - Automatic cleanup of synced operations
 * - O(1) lookups via Map index
 * - Works with any storage adapter
 */
import type { StorageAdapter } from '../storage';
import type { OfflineOperation, EncryptedQueueConfig, QueueStats, EncryptionKeyMaterial } from './types';
type EventHandler = (data: unknown) => void;
declare class OfflineQueueEventEmitter {
    private handlers;
    on(event: string, handler: EventHandler): void;
    off(event: string, handler: EventHandler): void;
    emit(event: string, data?: unknown): void;
}
export declare class EncryptedOfflineQueue extends OfflineQueueEventEmitter {
    private config;
    private operations;
    private isInitialized;
    private cleanupTimer;
    private currentBytes;
    private encryption;
    private keyMaterial;
    private storage;
    constructor(config?: Partial<EncryptedQueueConfig>);
    /**
     * Initialize the queue
     */
    initialize(options?: {
        storage?: StorageAdapter;
        keyMaterial?: EncryptionKeyMaterial;
    }): Promise<void>;
    /**
     * Set encryption key material (can be updated at runtime)
     */
    setKeyMaterial(keyMaterial: EncryptionKeyMaterial): void;
    /**
     * Queue an operation
     */
    queueOperation(operation: Omit<OfflineOperation, 'id' | 'status' | 'encryptedData' | 'bytesSize' | 'failedCount' | 'retryCount' | 'maxRetries'>): Promise<string>;
    /**
     * Get pending operations ready for sync
     */
    getPendingOperations(sessionId?: string, limit?: number): OfflineOperation[];
    /**
     * Get decrypted operation data
     */
    getDecryptedOperation(operationId: string): Promise<Omit<OfflineOperation, 'id' | 'status' | 'encryptedData' | 'bytesSize' | 'failedCount' | 'retryCount' | 'maxRetries'> | null>;
    /**
     * Mark operation as syncing
     */
    markSyncing(operationId: string): void;
    /**
     * Mark operation as synced
     */
    markSynced(operationId: string): void;
    /**
     * Mark operation as failed with retry logic
     */
    markFailed(operationId: string, error: string): void;
    /**
     * Remove an operation from the queue
     */
    removeOperation(operationId: string): boolean;
    /**
     * Get queue statistics
     */
    getStats(): QueueStats;
    /**
     * Clear all operations
     */
    clear(): void;
    /**
     * Compact queue by removing old synced operations
     */
    private compactQueue;
    /**
     * Load operations from storage
     */
    private loadFromStorage;
    /**
     * Start automatic cleanup timer
     */
    private startCleanupTimer;
    /**
     * Shutdown the queue
     */
    shutdown(): void;
}
/**
 * Get the singleton queue instance
 */
export declare function getOfflineQueue(): EncryptedOfflineQueue;
/**
 * Create a new queue with custom configuration
 */
export declare function createOfflineQueue(config?: Partial<EncryptedQueueConfig>): EncryptedOfflineQueue;
/**
 * Reset the singleton queue (for testing)
 */
export declare function resetOfflineQueue(): void;
export {};
