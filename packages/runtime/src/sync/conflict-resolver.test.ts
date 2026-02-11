/**
 * Tests for Conflict Resolver
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  ConflictResolver,
  getConflictResolver,
  createConflictResolver,
  resetConflictResolver,
} from './conflict-resolver';
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

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resetConflictResolver();
    resolver = new ConflictResolver();
  });

  describe('detectConflict', () => {
    test('detects update-update conflict', () => {
      const localOp = createMockOperation({
        type: 'update',
        data: { value: 'local' },
      });

      const remoteOp = createMockOperation({
        type: 'update',
        data: { value: 'remote' },
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      expect(conflict).not.toBeNull();
      expect(conflict!.type).toBe('update_update');
    });

    test('detects delete-update conflict', () => {
      const localOp = createMockOperation({
        type: 'delete',
        data: { id: '123' },
      });

      const remoteOp = createMockOperation({
        type: 'update',
        data: { value: 'updated' },
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      expect(conflict).not.toBeNull();
      expect(conflict!.type).toBe('delete_update');
    });

    test('detects update-delete conflict', () => {
      const localOp = createMockOperation({
        type: 'update',
        data: { value: 'updated' },
      });

      const remoteOp = createMockOperation({
        type: 'delete',
        data: { id: '123' },
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      expect(conflict).not.toBeNull();
      expect(conflict!.type).toBe('update_delete');
    });

    test('returns null for different sessions', () => {
      const localOp = createMockOperation({
        sessionId: 'session-1',
      });

      const remoteOp = createMockOperation({
        sessionId: 'session-2',
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      expect(conflict).toBeNull();
    });

    test('returns null for both deletes', () => {
      const localOp = createMockOperation({
        type: 'delete',
      });

      const remoteOp = createMockOperation({
        type: 'delete',
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      expect(conflict).toBeNull();
    });

    test('emits conflict:detected event', () => {
      let eventReceived = false;

      resolver.on('conflict:detected', () => {
        eventReceived = true;
      });

      const localOp = createMockOperation({ data: { value: 'local' } });
      const remoteOp = createMockOperation({ data: { value: 'remote' } });

      resolver.detectConflict(localOp, remoteOp);

      expect(eventReceived).toBe(true);
    });

    test('assigns high severity to delete conflicts', () => {
      const localOp = createMockOperation({ type: 'delete' });
      const remoteOp = createMockOperation({ type: 'update' });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      expect(conflict!.severity).toBe('high');
    });

    test('assigns low severity to similar updates', () => {
      const localOp = createMockOperation({
        data: { value: 'test', extra: 'local' },
      });
      const remoteOp = createMockOperation({
        data: { value: 'test', extra: 'remote' },
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      expect(conflict!.severity).toBe('low');
    });

    test('updates statistics', () => {
      const localOp = createMockOperation({ data: { value: 'local' } });
      const remoteOp = createMockOperation({ data: { value: 'remote' } });

      resolver.detectConflict(localOp, remoteOp);

      const stats = resolver.getStats();
      expect(stats.totalConflicts).toBe(1);
      expect(stats.conflictsByType['update_update']).toBe(1);
    });

    test('auto-resolves low severity conflicts', () => {
      const resolver = createConflictResolver({
        defaultStrategy: 'local-wins',
      });

      const localOp = createMockOperation({
        data: { value: 'test', extra: 'local' },
      });
      const remoteOp = createMockOperation({
        data: { value: 'test', extra: 'remote' },
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      // Low severity should be auto-resolved
      expect(conflict!.resolution).toBeDefined();
    });
  });

  describe('resolveConflict', () => {
    test('resolves with local-wins strategy', () => {
      const localOp = createMockOperation({ data: { value: 'local' } });
      const remoteOp = createMockOperation({ data: { value: 'remote' } });

      const conflict = resolver.detectConflict(localOp, remoteOp);
      // Clear auto-resolution to test manual resolution
      conflict!.resolution = undefined;

      const resolution = resolver.resolveConflict(conflict!.id, 'local-wins');

      expect(resolution).not.toBeNull();
      expect(resolution!.strategy).toBe('local-wins');
      expect(resolution!.resolvedData).toEqual({ value: 'local' });
    });

    test('resolves with remote-wins strategy', () => {
      const localOp = createMockOperation({ data: { value: 'local' } });
      const remoteOp = createMockOperation({ data: { value: 'remote' } });

      const conflict = resolver.detectConflict(localOp, remoteOp);
      conflict!.resolution = undefined;

      const resolution = resolver.resolveConflict(conflict!.id, 'remote-wins');

      expect(resolution).not.toBeNull();
      expect(resolution!.strategy).toBe('remote-wins');
      expect(resolution!.resolvedData).toEqual({ value: 'remote' });
    });

    test('resolves with merge strategy', () => {
      const resolver = createConflictResolver({ enableAutoMerge: true });

      const localOp = createMockOperation({
        data: { localField: 'local', shared: 'local-value' },
      });
      const remoteOp = createMockOperation({
        data: { remoteField: 'remote', shared: 'remote-value' },
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);
      conflict!.resolution = undefined;

      const resolution = resolver.resolveConflict(conflict!.id, 'merge');

      expect(resolution).not.toBeNull();
      expect(resolution!.strategy).toBe('merge');
      // Merge should include both fields, with local winning on conflicts
      expect(resolution!.resolvedData).toHaveProperty('localField', 'local');
      expect(resolution!.resolvedData).toHaveProperty('remoteField', 'remote');
      expect(resolution!.resolvedData).toHaveProperty('shared', 'local-value');
    });

    test('returns null for manual strategy', () => {
      const localOp = createMockOperation({ data: { value: 'local' } });
      const remoteOp = createMockOperation({ data: { value: 'remote' } });

      const conflict = resolver.detectConflict(localOp, remoteOp);
      conflict!.resolution = undefined;

      const resolution = resolver.resolveConflict(conflict!.id, 'manual');

      expect(resolution).toBeNull();
    });

    test('returns null for non-existent conflict', () => {
      const resolution = resolver.resolveConflict(
        'non-existent-id',
        'local-wins',
      );

      expect(resolution).toBeNull();
    });

    test('emits conflict:resolved event', () => {
      let eventReceived = false;

      resolver.on('conflict:resolved', () => {
        eventReceived = true;
      });

      const localOp = createMockOperation({ data: { value: 'local' } });
      const remoteOp = createMockOperation({ data: { value: 'remote' } });

      const conflict = resolver.detectConflict(localOp, remoteOp);
      conflict!.resolution = undefined;

      resolver.resolveConflict(conflict!.id, 'local-wins');

      expect(eventReceived).toBe(true);
    });

    test('updates statistics on resolution', () => {
      // Use high severity conflict to avoid auto-resolution
      const localOp = createMockOperation({
        type: 'delete',
        data: { id: '123' },
      });
      const remoteOp = createMockOperation({
        type: 'update',
        data: { value: 'updated' },
      });

      const conflict = resolver.detectConflict(localOp, remoteOp);
      // High severity conflicts are not auto-resolved

      resolver.resolveConflict(conflict!.id, 'local-wins');

      const stats = resolver.getStats();
      expect(stats.resolvedConflicts).toBe(1);
      expect(stats.resolutionsByStrategy['local-wins']).toBe(1);
    });

    test('uses default strategy when none specified', () => {
      const resolver = createConflictResolver({
        defaultStrategy: 'remote-wins',
      });

      const localOp = createMockOperation({ data: { value: 'local' } });
      const remoteOp = createMockOperation({ data: { value: 'remote' } });

      const conflict = resolver.detectConflict(localOp, remoteOp);
      conflict!.resolution = undefined;

      const resolution = resolver.resolveConflict(conflict!.id);

      expect(resolution!.strategy).toBe('remote-wins');
    });
  });

  describe('getConflict', () => {
    test('returns conflict by ID', () => {
      const localOp = createMockOperation({ data: { value: 'local' } });
      const remoteOp = createMockOperation({ data: { value: 'remote' } });

      const conflict = resolver.detectConflict(localOp, remoteOp);

      const retrieved = resolver.getConflict(conflict!.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(conflict!.id);
    });

    test('returns undefined for non-existent conflict', () => {
      const retrieved = resolver.getConflict('non-existent-id');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getUnresolvedConflicts', () => {
    test('returns only unresolved conflicts', () => {
      const localOp1 = createMockOperation({ data: { value: 'local1' } });
      const remoteOp1 = createMockOperation({ data: { value: 'remote1' } });
      const conflict1 = resolver.detectConflict(localOp1, remoteOp1);
      conflict1!.resolution = undefined;

      const localOp2 = createMockOperation({ data: { value: 'local2' } });
      const remoteOp2 = createMockOperation({ data: { value: 'remote2' } });
      const conflict2 = resolver.detectConflict(localOp2, remoteOp2);
      conflict2!.resolution = undefined;

      // Resolve one conflict
      resolver.resolveConflict(conflict1!.id, 'local-wins');

      const unresolved = resolver.getUnresolvedConflicts();

      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].id).toBe(conflict2!.id);
    });
  });

  describe('getConflictsForSession', () => {
    test('returns conflicts for specific session', () => {
      const localOp1 = createMockOperation({
        sessionId: 'session-1',
        data: { v: 'l1' },
      });
      const remoteOp1 = createMockOperation({
        sessionId: 'session-1',
        data: { v: 'r1' },
      });
      resolver.detectConflict(localOp1, remoteOp1);

      const localOp2 = createMockOperation({
        sessionId: 'session-1',
        data: { v: 'l2' },
      });
      const remoteOp2 = createMockOperation({
        sessionId: 'session-1',
        data: { v: 'r2' },
      });
      resolver.detectConflict(localOp2, remoteOp2);

      const conflicts = resolver.getConflictsForSession('session-1');

      expect(conflicts).toHaveLength(2);
    });

    test('returns empty array for session with no conflicts', () => {
      const conflicts = resolver.getConflictsForSession('non-existent-session');

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('getHighSeverityConflicts', () => {
    test('returns only high severity unresolved conflicts', () => {
      // Create high severity conflict (delete-update)
      const deleteOp = createMockOperation({ type: 'delete' });
      const updateOp = createMockOperation({ type: 'update' });
      const highConflict = resolver.detectConflict(deleteOp, updateOp);

      // Create low severity conflict (similar updates)
      const localOp = createMockOperation({ data: { value: 'test', x: 1 } });
      const remoteOp = createMockOperation({ data: { value: 'test', x: 2 } });
      resolver.detectConflict(localOp, remoteOp);

      const highSeverity = resolver.getHighSeverityConflicts();

      expect(highSeverity).toHaveLength(1);
      expect(highSeverity[0].id).toBe(highConflict!.id);
    });
  });

  describe('getStats', () => {
    test('returns correct statistics', () => {
      // Use high severity conflicts to avoid auto-resolution
      const localOp1 = createMockOperation({
        type: 'delete',
        data: { id: '1' },
      });
      const remoteOp1 = createMockOperation({
        type: 'update',
        data: { v: 'r1' },
      });
      const conflict = resolver.detectConflict(localOp1, remoteOp1);

      resolver.resolveConflict(conflict!.id, 'local-wins');

      const localOp2 = createMockOperation({
        type: 'delete',
        data: { id: '2' },
      });
      const remoteOp2 = createMockOperation({
        type: 'update',
        data: { v: 'r2' },
      });
      resolver.detectConflict(localOp2, remoteOp2);

      const stats = resolver.getStats();

      expect(stats.totalConflicts).toBe(2);
      expect(stats.resolvedConflicts).toBe(1);
      expect(stats.unresolvedConflicts).toBe(1);
    });
  });

  describe('configure', () => {
    test('updates configuration', () => {
      resolver.configure({
        defaultStrategy: 'remote-wins',
        mergeThreshold: 80,
      });

      const config = resolver.getConfig();

      expect(config.defaultStrategy).toBe('remote-wins');
      expect(config.mergeThreshold).toBe(80);
    });

    test('emits config:updated event', () => {
      let eventReceived = false;

      resolver.on('config:updated', () => {
        eventReceived = true;
      });

      resolver.configure({ defaultStrategy: 'merge' });

      expect(eventReceived).toBe(true);
    });
  });

  describe('clear', () => {
    test('clears all conflicts', () => {
      const localOp = createMockOperation({ data: { v: 'l' } });
      const remoteOp = createMockOperation({ data: { v: 'r' } });
      resolver.detectConflict(localOp, remoteOp);

      resolver.clear();

      const unresolved = resolver.getUnresolvedConflicts();
      expect(unresolved).toHaveLength(0);
    });
  });

  describe('reset', () => {
    test('resets all state and statistics', () => {
      const localOp = createMockOperation({ data: { v: 'l' } });
      const remoteOp = createMockOperation({ data: { v: 'r' } });
      resolver.detectConflict(localOp, remoteOp);

      resolver.reset();

      const stats = resolver.getStats();
      expect(stats.totalConflicts).toBe(0);
      expect(stats.resolvedConflicts).toBe(0);
    });
  });
});

describe('getConflictResolver', () => {
  beforeEach(() => {
    resetConflictResolver();
  });

  test('returns singleton instance', () => {
    const instance1 = getConflictResolver();
    const instance2 = getConflictResolver();

    expect(instance1).toBe(instance2);
  });
});

describe('createConflictResolver', () => {
  test('creates resolver with custom config', () => {
    const resolver = createConflictResolver({
      defaultStrategy: 'merge',
      enableAutoMerge: false,
      mergeThreshold: 90,
    });

    const config = resolver.getConfig();

    expect(config.defaultStrategy).toBe('merge');
    expect(config.enableAutoMerge).toBe(false);
    expect(config.mergeThreshold).toBe(90);
  });
});
