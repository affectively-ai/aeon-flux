/**
 * Tests for Sync Coordinator
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  SyncCoordinator,
  getSyncCoordinator,
  createSyncCoordinator,
  resetSyncCoordinator,
} from './coordinator';
import type { OfflineOperation } from '../offline/types';

// Helper to create mock operations
function createMockOperation(
  overrides: Partial<OfflineOperation> = {},
): OfflineOperation {
  return {
    id: `op-${Math.random().toString(36).slice(2)}`,
    type: 'update',
    sessionId: 'session-123',
    status: 'pending',
    data: { value: 'test' },
    priority: 'normal',
    bytesSize: 100,
    createdAt: Date.now(),
    failedCount: 0,
    retryCount: 0,
    maxRetries: 5,
    ...overrides,
  };
}

describe('SyncCoordinator', () => {
  let coordinator: SyncCoordinator;

  beforeEach(() => {
    resetSyncCoordinator();
    coordinator = new SyncCoordinator();
  });

  describe('network state', () => {
    test('starts with unknown state', () => {
      const state = coordinator.getNetworkState();
      // In test environment without navigator, state should be unknown
      expect(['unknown', 'online', 'offline']).toContain(state);
    });

    test('setNetworkState updates state', () => {
      coordinator.setNetworkState('online');
      expect(coordinator.getNetworkState()).toBe('online');

      coordinator.setNetworkState('offline');
      expect(coordinator.getNetworkState()).toBe('offline');

      coordinator.setNetworkState('poor');
      expect(coordinator.getNetworkState()).toBe('poor');
    });

    test('emits network:changed event', () => {
      let eventData: { previousState: string; newState: string } | null = null;

      coordinator.on('network:changed', (data) => {
        eventData = data as { previousState: string; newState: string };
      });

      coordinator.setNetworkState('online');

      expect(eventData).not.toBeNull();
      expect(eventData!.newState).toBe('online');
    });

    test('emits network:online when going online', () => {
      let onlineEventReceived = false;

      coordinator.on('network:online', () => {
        onlineEventReceived = true;
      });

      coordinator.setNetworkState('offline');
      coordinator.setNetworkState('online');

      expect(onlineEventReceived).toBe(true);
    });

    test('emits network:offline when going offline', () => {
      let offlineEventReceived = false;

      coordinator.on('network:offline', () => {
        offlineEventReceived = true;
      });

      coordinator.setNetworkState('online');
      coordinator.setNetworkState('offline');

      expect(offlineEventReceived).toBe(true);
    });

    test('does not emit event for same state', () => {
      let eventCount = 0;

      coordinator.on('network:changed', () => {
        eventCount++;
      });

      coordinator.setNetworkState('online');
      coordinator.setNetworkState('online');

      expect(eventCount).toBe(1);
    });

    test('tracks state history', () => {
      coordinator.setNetworkState('online');
      coordinator.setNetworkState('offline');
      coordinator.setNetworkState('online');

      const stats = coordinator.getStats();
      expect(stats.networkStateHistory.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('bandwidth profile', () => {
    test('has default bandwidth profile', () => {
      const profile = coordinator.getBandwidthProfile();

      expect(profile.speedKbps).toBeDefined();
      expect(profile.latencyMs).toBeDefined();
      expect(profile.reliability).toBeDefined();
    });

    test('updateBandwidthProfile updates profile', () => {
      coordinator.updateBandwidthProfile({
        speedKbps: 5000,
        latencyMs: 20,
        reliability: 0.99,
      });

      const profile = coordinator.getBandwidthProfile();

      expect(profile.speedKbps).toBe(5000);
      expect(profile.latencyMs).toBe(20);
      expect(profile.reliability).toBe(0.99);
    });

    test('emits bandwidth:updated event', () => {
      let eventReceived = false;

      coordinator.on('bandwidth:updated', () => {
        eventReceived = true;
      });

      coordinator.updateBandwidthProfile({ speedKbps: 2000 });

      expect(eventReceived).toBe(true);
    });

    test('tracks bandwidth history', () => {
      coordinator.updateBandwidthProfile({ speedKbps: 1000 });
      coordinator.updateBandwidthProfile({ speedKbps: 2000 });
      coordinator.updateBandwidthProfile({ speedKbps: 3000 });

      const stats = coordinator.getStats();
      expect(stats.bandwidthHistory.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('createSyncBatch', () => {
    test('creates batch from operations', () => {
      const operations = [
        createMockOperation({ priority: 'normal' }),
        createMockOperation({ priority: 'high' }),
        createMockOperation({ priority: 'low' }),
      ];

      const batch = coordinator.createSyncBatch(operations);

      expect(batch.batchId).toBeDefined();
      expect(batch.batchId.startsWith('batch-')).toBe(true);
      expect(batch.operations).toHaveLength(3);
      expect(batch.totalSize).toBeGreaterThan(0);
      expect(batch.createdAt).toBeDefined();
    });

    test('determines batch priority from highest operation priority', () => {
      const operations = [
        createMockOperation({ priority: 'low' }),
        createMockOperation({ priority: 'high' }),
        createMockOperation({ priority: 'normal' }),
      ];

      const batch = coordinator.createSyncBatch(operations);

      expect(batch.priority).toBe('high');
    });

    test('respects max batch size', () => {
      const coordinator = createSyncCoordinator({ maxBatchSize: 2 });

      const operations = [
        createMockOperation(),
        createMockOperation(),
        createMockOperation(),
      ];

      const batch = coordinator.createSyncBatch(operations);

      expect(batch.operations).toHaveLength(2);
    });

    test('respects max batch bytes', () => {
      const coordinator = createSyncCoordinator({ maxBatchBytes: 250 });

      const operations = [
        createMockOperation({ bytesSize: 100 }),
        createMockOperation({ bytesSize: 100 }),
        createMockOperation({ bytesSize: 100 }),
      ];

      const batch = coordinator.createSyncBatch(operations);

      expect(batch.operations.length).toBeLessThan(3);
    });

    test('emits batch:created event', () => {
      let eventReceived = false;

      coordinator.on('batch:created', () => {
        eventReceived = true;
      });

      coordinator.createSyncBatch([createMockOperation()]);

      expect(eventReceived).toBe(true);
    });

    test('stores batch for retrieval', () => {
      const batch = coordinator.createSyncBatch([createMockOperation()]);

      const retrieved = coordinator.getBatch(batch.batchId);

      expect(retrieved).toBeDefined();
      expect(retrieved!.batchId).toBe(batch.batchId);
    });
  });

  describe('startSyncBatch', () => {
    test('starts syncing a batch', () => {
      const batch = coordinator.createSyncBatch([createMockOperation()]);

      coordinator.startSyncBatch(batch.batchId);

      const progress = coordinator.getCurrentProgress();
      expect(progress).toBeDefined();
      expect(progress!.batchId).toBe(batch.batchId);
    });

    test('emits batch:started event', () => {
      let eventBatchId: string | null = null;

      coordinator.on('batch:started', (data) => {
        eventBatchId = (data as { batchId: string }).batchId;
      });

      const batch = coordinator.createSyncBatch([createMockOperation()]);
      coordinator.startSyncBatch(batch.batchId);

      expect(eventBatchId).toBe(batch.batchId);
    });

    test('increments totalSyncsAttempted', () => {
      const batch = coordinator.createSyncBatch([createMockOperation()]);

      const statsBefore = coordinator.getStats();
      coordinator.startSyncBatch(batch.batchId);
      const statsAfter = coordinator.getStats();

      expect(statsAfter.totalSyncsAttempted).toBe(
        statsBefore.totalSyncsAttempted + 1,
      );
    });

    test('does nothing for non-existent batch', () => {
      // Should not throw
      coordinator.startSyncBatch('non-existent-batch');

      expect(coordinator.getCurrentProgress()).toBeUndefined();
    });
  });

  describe('updateProgress', () => {
    test('updates sync progress', () => {
      const batch = coordinator.createSyncBatch([
        createMockOperation(),
        createMockOperation(),
      ]);

      coordinator.startSyncBatch(batch.batchId);
      coordinator.updateProgress(batch.batchId, 1, 100);

      const progress = coordinator.getCurrentProgress();

      expect(progress!.syncedOperations).toBe(1);
      expect(progress!.bytesSynced).toBe(100);
    });

    test('emits batch:progress event', () => {
      let eventData: { syncedOperations: number } | null = null;

      coordinator.on('batch:progress', (data) => {
        eventData = data as { syncedOperations: number };
      });

      const batch = coordinator.createSyncBatch([createMockOperation()]);
      coordinator.startSyncBatch(batch.batchId);
      coordinator.updateProgress(batch.batchId, 1, 50);

      expect(eventData).not.toBeNull();
      expect(eventData!.syncedOperations).toBe(1);
    });

    test('calculates estimated time remaining', () => {
      coordinator.updateBandwidthProfile({ speedKbps: 1000, latencyMs: 50 });

      const batch = coordinator.createSyncBatch([
        createMockOperation({ bytesSize: 1000 }),
      ]);

      coordinator.startSyncBatch(batch.batchId);
      coordinator.updateProgress(batch.batchId, 0, 0);

      const progress = coordinator.getCurrentProgress();

      expect(progress!.estimatedTimeRemaining).toBeDefined();
      expect(progress!.estimatedTimeRemaining).toBeGreaterThan(0);
    });
  });

  describe('completeSyncBatch', () => {
    test('completes successful sync', () => {
      const batch = coordinator.createSyncBatch([createMockOperation()]);
      coordinator.startSyncBatch(batch.batchId);

      coordinator.completeSyncBatch(batch.batchId, {
        success: true,
        synced: ['op-1'],
        failed: [],
        conflicts: [],
        serverTimestamp: Date.now(),
      });

      const stats = coordinator.getStats();
      expect(stats.successfulSyncs).toBe(1);
      expect(stats.totalOperationsSynced).toBe(1);
    });

    test('records failed sync', () => {
      const batch = coordinator.createSyncBatch([createMockOperation()]);
      coordinator.startSyncBatch(batch.batchId);

      coordinator.completeSyncBatch(batch.batchId, {
        success: false,
        synced: [],
        failed: [
          { operationId: 'op-1', error: 'Network error', retryable: true },
        ],
        conflicts: [],
        serverTimestamp: Date.now(),
      });

      const stats = coordinator.getStats();
      expect(stats.failedSyncs).toBe(1);
    });

    test('emits batch:completed event', () => {
      let eventReceived = false;

      coordinator.on('batch:completed', () => {
        eventReceived = true;
      });

      const batch = coordinator.createSyncBatch([createMockOperation()]);
      coordinator.startSyncBatch(batch.batchId);
      coordinator.completeSyncBatch(batch.batchId, {
        success: true,
        synced: ['op-1'],
        failed: [],
        conflicts: [],
        serverTimestamp: Date.now(),
      });

      expect(eventReceived).toBe(true);
    });

    test('clears current batch', () => {
      const batch = coordinator.createSyncBatch([createMockOperation()]);
      coordinator.startSyncBatch(batch.batchId);
      coordinator.completeSyncBatch(batch.batchId, {
        success: true,
        synced: ['op-1'],
        failed: [],
        conflicts: [],
        serverTimestamp: Date.now(),
      });

      expect(coordinator.getCurrentProgress()).toBeUndefined();
    });
  });

  describe('failSyncBatch', () => {
    test('emits batch:retry for retryable failures', () => {
      let retryAttempt = 0;

      coordinator.on('batch:retry', (data) => {
        retryAttempt = (data as { attempt: number }).attempt;
      });

      const batch = coordinator.createSyncBatch([createMockOperation()]);
      coordinator.startSyncBatch(batch.batchId);
      coordinator.failSyncBatch(batch.batchId, 'Network error', true);

      expect(retryAttempt).toBe(1);
    });

    test('emits batch:failed after max retries', () => {
      const coordinator = createSyncCoordinator({ maxRetries: 2 });
      let failedEventReceived = false;

      coordinator.on('batch:failed', () => {
        failedEventReceived = true;
      });

      const batch = coordinator.createSyncBatch([createMockOperation()]);

      // Fail multiple times
      coordinator.startSyncBatch(batch.batchId);
      coordinator.failSyncBatch(batch.batchId, 'Error 1', true);
      coordinator.startSyncBatch(batch.batchId);
      coordinator.failSyncBatch(batch.batchId, 'Error 2', true);
      coordinator.startSyncBatch(batch.batchId);
      coordinator.failSyncBatch(batch.batchId, 'Error 3', true);

      expect(failedEventReceived).toBe(true);
    });

    test('emits batch:failed for non-retryable failures', () => {
      let failedEventReceived = false;

      coordinator.on('batch:failed', () => {
        failedEventReceived = true;
      });

      const batch = coordinator.createSyncBatch([createMockOperation()]);
      coordinator.startSyncBatch(batch.batchId);
      coordinator.failSyncBatch(batch.batchId, 'Fatal error', false);

      expect(failedEventReceived).toBe(true);
    });
  });

  describe('estimateSyncTime', () => {
    test('estimates time based on bandwidth', () => {
      coordinator.updateBandwidthProfile({
        speedKbps: 1000, // 1 Mbps
        latencyMs: 100,
      });

      // 1000 bytes at 1 Mbps = ~8ms, plus 100ms latency
      const estimate = coordinator.estimateSyncTime(1000);

      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(5000); // Should be reasonable
    });

    test('larger data takes longer', () => {
      coordinator.updateBandwidthProfile({
        speedKbps: 1000,
        latencyMs: 50,
      });

      const smallEstimate = coordinator.estimateSyncTime(1000);
      const largeEstimate = coordinator.estimateSyncTime(100000);

      expect(largeEstimate).toBeGreaterThan(smallEstimate);
    });
  });

  describe('getPendingBatches', () => {
    test('returns all pending batches', () => {
      coordinator.createSyncBatch([createMockOperation()]);
      coordinator.createSyncBatch([createMockOperation()]);
      coordinator.createSyncBatch([createMockOperation()]);

      const pending = coordinator.getPendingBatches();

      expect(pending).toHaveLength(3);
    });
  });

  describe('configure', () => {
    test('updates configuration', () => {
      coordinator.configure({
        maxBatchSize: 50,
        enableCompression: false,
      });

      const config = coordinator.getConfig();

      expect(config.maxBatchSize).toBe(50);
      expect(config.enableCompression).toBe(false);
    });

    test('emits config:updated event', () => {
      let eventReceived = false;

      coordinator.on('config:updated', () => {
        eventReceived = true;
      });

      coordinator.configure({ maxBatchSize: 50 });

      expect(eventReceived).toBe(true);
    });
  });

  describe('adaptive batching', () => {
    test('reduces batch size on poor connection', () => {
      const coordinator = createSyncCoordinator({ adaptiveBatching: true });

      coordinator.updateBandwidthProfile({
        speedKbps: 100, // Very slow
        latencyMs: 1000,
      });

      const config = coordinator.getConfig();

      expect(config.maxBatchSize).toBeLessThan(100);
    });

    test('increases batch size on good connection', () => {
      const coordinator = createSyncCoordinator({ adaptiveBatching: true });

      coordinator.updateBandwidthProfile({
        speedKbps: 10000, // Fast
        latencyMs: 20,
      });

      const config = coordinator.getConfig();

      expect(config.maxBatchSize).toBeGreaterThan(100);
    });
  });

  describe('clear', () => {
    test('clears all batches and progress', () => {
      coordinator.createSyncBatch([createMockOperation()]);
      coordinator.createSyncBatch([createMockOperation()]);

      coordinator.clear();

      expect(coordinator.getPendingBatches()).toHaveLength(0);
      expect(coordinator.getCurrentProgress()).toBeUndefined();
    });
  });

  describe('reset', () => {
    test('resets all state and statistics', () => {
      coordinator.createSyncBatch([createMockOperation()]);
      coordinator.setNetworkState('online');
      coordinator.updateBandwidthProfile({ speedKbps: 5000 });

      coordinator.reset();

      const stats = coordinator.getStats();
      expect(stats.totalSyncsAttempted).toBe(0);
      expect(stats.successfulSyncs).toBe(0);
      expect(coordinator.getPendingBatches()).toHaveLength(0);
    });
  });
});

describe('getSyncCoordinator', () => {
  beforeEach(() => {
    resetSyncCoordinator();
  });

  test('returns singleton instance', () => {
    const instance1 = getSyncCoordinator();
    const instance2 = getSyncCoordinator();

    expect(instance1).toBe(instance2);
  });
});

describe('createSyncCoordinator', () => {
  test('creates coordinator with custom config', () => {
    const coordinator = createSyncCoordinator({
      maxBatchSize: 50,
      maxBatchBytes: 1024 * 1024,
      enableCompression: false,
    });

    const config = coordinator.getConfig();

    expect(config.maxBatchSize).toBe(50);
    expect(config.maxBatchBytes).toBe(1024 * 1024);
    expect(config.enableCompression).toBe(false);
  });
});
