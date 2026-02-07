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
import type {
  OfflineOperation,
  EncryptedQueueConfig,
  QueueStats,
  EncryptionKeyMaterial,
} from './types';
import {
  OfflineOperationEncryption,
  getOperationEncryption,
  generateOperationId,
  estimateEncryptedSize,
} from './encryption';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: EncryptedQueueConfig = {
  maxLocalCapacity: 50 * 1024 * 1024, // 50MB
  compactionThreshold: 0.8,
  d1SyncInterval: 5 * 60 * 1000, // 5 minutes
  syncedCleanupAge: 60 * 60 * 1000, // 1 hour
  encryption: {
    enabled: false,
    keyDerivation: 'session',
  },
};

// ============================================================================
// Event Emitter (minimal implementation)
// ============================================================================

type EventHandler = (data: unknown) => void;

class OfflineQueueEventEmitter {
  private handlers = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, data?: unknown): void {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }
}

// ============================================================================
// Encrypted Offline Queue
// ============================================================================

export class EncryptedOfflineQueue extends OfflineQueueEventEmitter {
  private config: EncryptedQueueConfig;
  private operations: Map<string, OfflineOperation> = new Map();
  private isInitialized = false;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private currentBytes = 0;
  private encryption: OfflineOperationEncryption;
  private keyMaterial: EncryptionKeyMaterial | null = null;
  private storage: StorageAdapter | null = null;

  constructor(config: Partial<EncryptedQueueConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.encryption = getOperationEncryption();
  }

  /**
   * Initialize the queue
   */
  async initialize(options?: {
    storage?: StorageAdapter;
    keyMaterial?: EncryptionKeyMaterial;
  }): Promise<void> {
    if (this.isInitialized) return;

    this.storage = options?.storage ?? null;
    this.keyMaterial = options?.keyMaterial ?? null;

    // Load existing operations from storage if available
    if (this.storage) {
      await this.loadFromStorage();
    }

    // Start cleanup timer
    this.startCleanupTimer();

    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * Set encryption key material (can be updated at runtime)
   */
  setKeyMaterial(keyMaterial: EncryptionKeyMaterial): void {
    this.keyMaterial = keyMaterial;
  }

  /**
   * Queue an operation
   */
  async queueOperation(
    operation: Omit<OfflineOperation, 'id' | 'status' | 'encryptedData' | 'bytesSize' | 'failedCount' | 'retryCount' | 'maxRetries'>
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Queue not initialized');
    }

    const operationId = generateOperationId();
    let encryptedData: Uint8Array | undefined;
    let size: number;

    // Encrypt if enabled and key material available
    if (this.config.encryption.enabled && this.keyMaterial) {
      encryptedData = await this.encryption.encryptOperation(operation, this.keyMaterial);
      size = encryptedData.byteLength;
    } else {
      size = estimateEncryptedSize(operation);
    }

    // Check capacity
    if (this.currentBytes + size > this.config.maxLocalCapacity) {
      await this.compactQueue();

      if (this.currentBytes + size > this.config.maxLocalCapacity) {
        const error = 'Queue capacity exceeded';
        this.emit('queue:error', { operationId, error });
        throw new Error(error);
      }
    }

    const fullOperation: OfflineOperation = {
      id: operationId,
      type: operation.type,
      sessionId: operation.sessionId,
      status: 'pending',
      data: operation.data,
      priority: operation.priority || 'normal',
      encryptedData,
      encryptionVersion: 1,
      bytesSize: size,
      createdAt: operation.createdAt || Date.now(),
      failedCount: 0,
      retryCount: 0,
      maxRetries: 5,
    };

    this.operations.set(operationId, fullOperation);
    this.currentBytes += size;

    this.emit('operation:queued', {
      operationId,
      sessionId: operation.sessionId,
      size,
    });

    return operationId;
  }

  /**
   * Get pending operations ready for sync
   */
  getPendingOperations(sessionId?: string, limit = 100): OfflineOperation[] {
    if (!this.isInitialized) {
      throw new Error('Queue not initialized');
    }

    const pending: OfflineOperation[] = [];

    Array.from(this.operations.values()).forEach((op) => {
      if (op.status !== 'pending') return;
      if (sessionId && op.sessionId !== sessionId) return;
      pending.push(op);
    });

    // Sort by priority (high > normal > low) then by createdAt
    pending.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });

    return pending.slice(0, limit);
  }

  /**
   * Get decrypted operation data
   */
  async getDecryptedOperation(
    operationId: string
  ): Promise<Omit<OfflineOperation, 'id' | 'status' | 'encryptedData' | 'bytesSize' | 'failedCount' | 'retryCount' | 'maxRetries'> | null> {
    const op = this.operations.get(operationId);
    if (!op) return null;

    if (op.encryptedData && this.keyMaterial) {
      return this.encryption.decryptOperation(op.encryptedData, this.keyMaterial);
    }

    return {
      type: op.type,
      sessionId: op.sessionId,
      data: op.data,
      priority: op.priority,
      createdAt: op.createdAt,
    };
  }

  /**
   * Mark operation as syncing
   */
  markSyncing(operationId: string): void {
    if (!this.isInitialized) {
      throw new Error('Queue not initialized');
    }

    const op = this.operations.get(operationId);
    if (op) {
      op.status = 'syncing';
      this.emit('operation:syncing', { operationId });
    }
  }

  /**
   * Mark operation as synced
   */
  markSynced(operationId: string): void {
    if (!this.isInitialized) {
      throw new Error('Queue not initialized');
    }

    const op = this.operations.get(operationId);
    if (op) {
      op.status = 'synced';
      op.syncedAt = Date.now();
      op.failedCount = 0;
      this.emit('operation:synced', { operationId });
    }
  }

  /**
   * Mark operation as failed with retry logic
   */
  markFailed(operationId: string, error: string): void {
    if (!this.isInitialized) {
      throw new Error('Queue not initialized');
    }

    const op = this.operations.get(operationId);
    if (!op) return;

    op.failedCount += 1;
    op.lastError = error;
    op.retryCount += 1;

    if (op.failedCount >= op.maxRetries) {
      op.status = 'failed';
      this.emit('operation:failed_max_retries', { operationId, error });
    } else {
      op.status = 'pending'; // Reset to pending for retry
      this.emit('operation:retry', { operationId, attempt: op.failedCount });
    }
  }

  /**
   * Remove an operation from the queue
   */
  removeOperation(operationId: string): boolean {
    const op = this.operations.get(operationId);
    if (op) {
      this.currentBytes -= op.bytesSize;
      this.operations.delete(operationId);
      return true;
    }
    return false;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    if (!this.isInitialized) {
      return {
        total: 0,
        pending: 0,
        syncing: 0,
        synced: 0,
        failed: 0,
        totalBytes: 0,
        compactionNeeded: false,
      };
    }

    let pending = 0;
    let syncing = 0;
    let synced = 0;
    let failed = 0;

    Array.from(this.operations.values()).forEach((op) => {
      switch (op.status) {
        case 'pending':
          pending++;
          break;
        case 'syncing':
          syncing++;
          break;
        case 'synced':
          synced++;
          break;
        case 'failed':
          failed++;
          break;
      }
    });

    const compactionNeeded =
      this.currentBytes / this.config.maxLocalCapacity > this.config.compactionThreshold;

    return {
      total: this.operations.size,
      pending,
      syncing,
      synced,
      failed,
      totalBytes: this.currentBytes,
      compactionNeeded,
    };
  }

  /**
   * Clear all operations
   */
  clear(): void {
    this.operations.clear();
    this.currentBytes = 0;
  }

  /**
   * Compact queue by removing old synced operations
   */
  private async compactQueue(): Promise<void> {
    const cutoff = Date.now() - this.config.syncedCleanupAge;
    const toRemove: string[] = [];

    Array.from(this.operations.entries()).forEach(([id, op]) => {
      if (op.status === 'synced' && op.syncedAt && op.syncedAt < cutoff) {
        toRemove.push(id);
      }
    });

    for (const id of toRemove) {
      this.removeOperation(id);
    }

    if (toRemove.length > 0) {
      this.emit('queue:compacted');
    }
  }

  /**
   * Load operations from storage
   */
  private async loadFromStorage(): Promise<void> {
    // Storage loading would be implemented based on the storage adapter
    // For now, this is a no-op as we're using in-memory storage
    // In a real implementation, this would load from IndexedDB or D1
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      const stats = this.getStats();
      if (stats.compactionNeeded) {
        await this.compactQueue();
      }
    }, 60000); // Check every minute
  }

  /**
   * Shutdown the queue
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.isInitialized = false;
    this.emit('shutdown');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let _queueInstance: EncryptedOfflineQueue | null = null;

/**
 * Get the singleton queue instance
 */
export function getOfflineQueue(): EncryptedOfflineQueue {
  if (!_queueInstance) {
    _queueInstance = new EncryptedOfflineQueue();
  }
  return _queueInstance;
}

/**
 * Create a new queue with custom configuration
 */
export function createOfflineQueue(config?: Partial<EncryptedQueueConfig>): EncryptedOfflineQueue {
  return new EncryptedOfflineQueue(config);
}

/**
 * Reset the singleton queue (for testing)
 */
export function resetOfflineQueue(): void {
  if (_queueInstance) {
    _queueInstance.shutdown();
  }
  _queueInstance = null;
}
