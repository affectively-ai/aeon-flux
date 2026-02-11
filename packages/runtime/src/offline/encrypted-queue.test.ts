/**
 * Tests for Encrypted Offline Queue
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  EncryptedOfflineQueue,
  getOfflineQueue,
  createOfflineQueue,
  resetOfflineQueue,
} from './encrypted-queue';
import { getOperationEncryption, resetOperationEncryption } from './encryption';

describe('EncryptedOfflineQueue', () => {
  let queue: EncryptedOfflineQueue;

  beforeEach(async () => {
    resetOfflineQueue();
    resetOperationEncryption();
    queue = new EncryptedOfflineQueue();
    await queue.initialize();
  });

  afterEach(() => {
    queue.shutdown();
  });

  describe('initialization', () => {
    test('initializes successfully', async () => {
      const newQueue = new EncryptedOfflineQueue();
      await newQueue.initialize();

      const stats = newQueue.getStats();
      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);

      newQueue.shutdown();
    });

    test('emits initialized event', async () => {
      const newQueue = new EncryptedOfflineQueue();
      let initialized = false;

      newQueue.on('initialized', () => {
        initialized = true;
      });

      await newQueue.initialize();
      expect(initialized).toBe(true);

      newQueue.shutdown();
    });

    test('only initializes once', async () => {
      const newQueue = new EncryptedOfflineQueue();
      await newQueue.initialize();
      await newQueue.initialize(); // Second call should be no-op

      const stats = newQueue.getStats();
      expect(stats.total).toBe(0);

      newQueue.shutdown();
    });
  });

  describe('queueOperation', () => {
    test('queues an operation and returns ID', async () => {
      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { name: 'test' },
        priority: 'normal',
        createdAt: Date.now(),
      });

      expect(operationId).toBeDefined();
      expect(operationId.startsWith('op_')).toBe(true);
    });

    test('increments queue stats', async () => {
      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { name: 'test' },
        priority: 'normal',
        createdAt: Date.now(),
      });

      const stats = queue.getStats();
      expect(stats.total).toBe(1);
      expect(stats.pending).toBe(1);
    });

    test('emits operation:queued event', async () => {
      let eventData: {
        operationId: string;
        sessionId: string;
        size: number;
      } | null = null;

      queue.on('operation:queued', (data) => {
        eventData = data as {
          operationId: string;
          sessionId: string;
          size: number;
        };
      });

      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { name: 'test' },
        priority: 'normal',
        createdAt: Date.now(),
      });

      expect(eventData).not.toBeNull();
      expect(eventData!.sessionId).toBe('session-123');
      expect(eventData!.size).toBeGreaterThan(0);
    });

    test('throws if queue not initialized', async () => {
      const uninitializedQueue = new EncryptedOfflineQueue();

      await expect(
        uninitializedQueue.queueOperation({
          type: 'create',
          sessionId: 'session-123',
          data: {},
          priority: 'normal',
          createdAt: Date.now(),
        }),
      ).rejects.toThrow('Queue not initialized');
    });

    test('tracks bytes used', async () => {
      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { largeData: 'x'.repeat(1000) },
        priority: 'normal',
        createdAt: Date.now(),
      });

      const stats = queue.getStats();
      expect(stats.totalBytes).toBeGreaterThan(1000);
    });
  });

  describe('getPendingOperations', () => {
    test('returns pending operations', async () => {
      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { name: 'test1' },
        priority: 'normal',
        createdAt: Date.now(),
      });

      await queue.queueOperation({
        type: 'update',
        sessionId: 'session-123',
        data: { name: 'test2' },
        priority: 'normal',
        createdAt: Date.now(),
      });

      const pending = queue.getPendingOperations();
      expect(pending).toHaveLength(2);
    });

    test('filters by sessionId', async () => {
      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-1',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-2',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      const pending = queue.getPendingOperations('session-1');
      expect(pending).toHaveLength(1);
      expect(pending[0].sessionId).toBe('session-1');
    });

    test('respects limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await queue.queueOperation({
          type: 'create',
          sessionId: 'session-123',
          data: { index: i },
          priority: 'normal',
          createdAt: Date.now(),
        });
      }

      const pending = queue.getPendingOperations(undefined, 5);
      expect(pending).toHaveLength(5);
    });

    test('sorts by priority then createdAt', async () => {
      const now = Date.now();

      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { name: 'low' },
        priority: 'low',
        createdAt: now,
      });

      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { name: 'high' },
        priority: 'high',
        createdAt: now + 100,
      });

      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { name: 'normal' },
        priority: 'normal',
        createdAt: now + 50,
      });

      const pending = queue.getPendingOperations();
      expect(pending[0].priority).toBe('high');
      expect(pending[1].priority).toBe('normal');
      expect(pending[2].priority).toBe('low');
    });
  });

  describe('markSyncing', () => {
    test('changes operation status to syncing', async () => {
      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      queue.markSyncing(operationId);

      const stats = queue.getStats();
      expect(stats.pending).toBe(0);
      expect(stats.syncing).toBe(1);
    });

    test('emits operation:syncing event', async () => {
      let eventOperationId: string | null = null;

      queue.on('operation:syncing', (data) => {
        eventOperationId = (data as { operationId: string }).operationId;
      });

      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      queue.markSyncing(operationId);

      expect(eventOperationId).toBe(operationId);
    });
  });

  describe('markSynced', () => {
    test('changes operation status to synced', async () => {
      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      queue.markSyncing(operationId);
      queue.markSynced(operationId);

      const stats = queue.getStats();
      expect(stats.syncing).toBe(0);
      expect(stats.synced).toBe(1);
    });

    test('emits operation:synced event', async () => {
      let eventOperationId: string | null = null;

      queue.on('operation:synced', (data) => {
        eventOperationId = (data as { operationId: string }).operationId;
      });

      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      queue.markSynced(operationId);

      expect(eventOperationId).toBe(operationId);
    });
  });

  describe('markFailed', () => {
    test('increments retry count and keeps pending', async () => {
      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      queue.markFailed(operationId, 'Network error');

      const stats = queue.getStats();
      expect(stats.pending).toBe(1);
      expect(stats.failed).toBe(0);
    });

    test('emits operation:retry event', async () => {
      let retryAttempt = 0;

      queue.on('operation:retry', (data) => {
        retryAttempt = (data as { attempt: number }).attempt;
      });

      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      queue.markFailed(operationId, 'Network error');

      expect(retryAttempt).toBe(1);
    });

    test('marks as failed after max retries', async () => {
      let failedEventReceived = false;

      queue.on('operation:failed_max_retries', () => {
        failedEventReceived = true;
      });

      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      // Fail 5 times (max retries)
      for (let i = 0; i < 5; i++) {
        queue.markFailed(operationId, 'Network error');
      }

      expect(failedEventReceived).toBe(true);

      const stats = queue.getStats();
      expect(stats.failed).toBe(1);
      expect(stats.pending).toBe(0);
    });
  });

  describe('removeOperation', () => {
    test('removes operation from queue', async () => {
      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      const removed = queue.removeOperation(operationId);

      expect(removed).toBe(true);

      const stats = queue.getStats();
      expect(stats.total).toBe(0);
    });

    test('returns false for non-existent operation', () => {
      const removed = queue.removeOperation('non-existent-id');
      expect(removed).toBe(false);
    });

    test('decreases bytes used', async () => {
      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { largeData: 'x'.repeat(1000) },
        priority: 'normal',
        createdAt: Date.now(),
      });

      const statsBefore = queue.getStats();
      queue.removeOperation(operationId);
      const statsAfter = queue.getStats();

      expect(statsAfter.totalBytes).toBeLessThan(statsBefore.totalBytes);
    });
  });

  describe('getDecryptedOperation', () => {
    test('returns operation data without encryption', async () => {
      const operationId = await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { name: 'test' },
        priority: 'high',
        createdAt: Date.now(),
      });

      const decrypted = await queue.getDecryptedOperation(operationId);

      expect(decrypted).not.toBeNull();
      expect(decrypted!.type).toBe('create');
      expect(decrypted!.sessionId).toBe('session-123');
      expect(decrypted!.data).toEqual({ name: 'test' });
      expect(decrypted!.priority).toBe('high');
    });

    test('returns null for non-existent operation', async () => {
      const decrypted = await queue.getDecryptedOperation('non-existent-id');
      expect(decrypted).toBeNull();
    });
  });

  describe('getStats', () => {
    test('returns correct statistics', async () => {
      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      const op2 = await queue.queueOperation({
        type: 'update',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      queue.markSyncing(op2);

      const stats = queue.getStats();
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.syncing).toBe(1);
      expect(stats.synced).toBe(0);
      expect(stats.failed).toBe(0);
    });

    test('indicates compaction needed when threshold exceeded', async () => {
      // Create a queue with very small capacity
      const smallQueue = createOfflineQueue({
        maxLocalCapacity: 1000,
        compactionThreshold: 0.5,
      });
      await smallQueue.initialize();

      // Add operations to exceed threshold
      await smallQueue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { largeData: 'x'.repeat(600) },
        priority: 'normal',
        createdAt: Date.now(),
      });

      const stats = smallQueue.getStats();
      expect(stats.compactionNeeded).toBe(true);

      smallQueue.shutdown();
    });
  });

  describe('clear', () => {
    test('clears all operations', async () => {
      await queue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      await queue.queueOperation({
        type: 'update',
        sessionId: 'session-123',
        data: {},
        priority: 'normal',
        createdAt: Date.now(),
      });

      queue.clear();

      const stats = queue.getStats();
      expect(stats.total).toBe(0);
      expect(stats.totalBytes).toBe(0);
    });
  });

  describe('shutdown', () => {
    test('emits shutdown event', async () => {
      let shutdownReceived = false;

      queue.on('shutdown', () => {
        shutdownReceived = true;
      });

      queue.shutdown();

      expect(shutdownReceived).toBe(true);
    });
  });

  describe('with encryption enabled', () => {
    test('encrypts operations when key material provided', async () => {
      const encryptedQueue = createOfflineQueue({
        encryption: {
          enabled: true,
          keyDerivation: 'session',
        },
      });

      const encryption = getOperationEncryption();
      const keyMaterial = await encryption.deriveKeyFromSession(
        'session-123',
        'queue-test',
      );

      await encryptedQueue.initialize({ keyMaterial });

      const operationId = await encryptedQueue.queueOperation({
        type: 'create',
        sessionId: 'session-123',
        data: { secret: 'data' },
        priority: 'normal',
        createdAt: Date.now(),
      });

      // Operation should have encrypted data
      const pending = encryptedQueue.getPendingOperations();
      expect(pending[0].encryptedData).toBeInstanceOf(Uint8Array);

      // Should still be decryptable
      const decrypted = await encryptedQueue.getDecryptedOperation(operationId);
      expect(decrypted!.data).toEqual({ secret: 'data' });

      encryptedQueue.shutdown();
    });
  });
});

describe('getOfflineQueue', () => {
  beforeEach(() => {
    resetOfflineQueue();
  });

  test('returns singleton instance', () => {
    const instance1 = getOfflineQueue();
    const instance2 = getOfflineQueue();

    expect(instance1).toBe(instance2);
  });
});

describe('createOfflineQueue', () => {
  test('creates queue with custom config', async () => {
    const customQueue = createOfflineQueue({
      maxLocalCapacity: 10 * 1024 * 1024, // 10MB
      compactionThreshold: 0.9,
    });

    await customQueue.initialize();

    const stats = customQueue.getStats();
    expect(stats.total).toBe(0);

    customQueue.shutdown();
  });
});
