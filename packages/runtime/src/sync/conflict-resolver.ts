/**
 * Aeon Pages Conflict Resolver
 *
 * Handles conflict detection and resolution for offline-first applications.
 * Optimized for edge environments with configurable resolution strategies.
 *
 * Features:
 * - Multiple resolution strategies (local-wins, remote-wins, merge, last-modified)
 * - Automatic resolution for low-severity conflicts
 * - Manual resolution queue for high-severity conflicts
 * - Conflict statistics and history
 */

import type {
  OfflineOperation,
  StoredConflict,
  ConflictDetectionResult,
  ResolutionStrategy,
  SyncCoordinatorEvents,
} from '../offline/types';

// ============================================================================
// Types
// ============================================================================

export interface ConflictResolverConfig {
  /** Default resolution strategy */
  defaultStrategy: ResolutionStrategy;

  /** Enable automatic merging for similar updates */
  enableAutoMerge: boolean;

  /** Enable local-wins fallback */
  enableLocalWins: boolean;

  /** Maximum conflicts to cache */
  maxConflictCacheSize: number;

  /** Conflict resolution timeout in ms */
  conflictTimeoutMs: number;

  /** Similarity threshold (0-100) for auto-merge */
  mergeThreshold: number;
}

export interface ConflictStats {
  totalConflicts: number;
  resolvedConflicts: number;
  unresolvedConflicts: number;
  conflictsByType: {
    'update_update': number;
    'delete_update': number;
    'update_delete': number;
    'concurrent': number;
  };
  resolutionsByStrategy: {
    'local-wins': number;
    'remote-wins': number;
    'merge': number;
    'manual': number;
    'last-modified': number;
  };
  averageResolutionTimeMs: number;
}

// ============================================================================
// Event Emitter (minimal implementation)
// ============================================================================

type EventHandler<T> = (data: T) => void;

class EventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> {
  private handlers = new Map<string, Set<EventHandler<unknown>>>();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    const key = event as string;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }
    this.handlers.get(key)!.add(handler as EventHandler<unknown>);
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    this.handlers.get(event as string)?.delete(handler as EventHandler<unknown>);
  }

  emit<K extends keyof Events>(event: K, data?: Events[K]): void {
    this.handlers.get(event as string)?.forEach((handler) => handler(data));
  }
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ConflictResolverConfig = {
  defaultStrategy: 'last-modified',
  enableAutoMerge: true,
  enableLocalWins: true,
  maxConflictCacheSize: 1000,
  conflictTimeoutMs: 30000,
  mergeThreshold: 70,
};

// ============================================================================
// Conflict Resolver
// ============================================================================

export class ConflictResolver extends EventEmitter<{
  'conflict:detected': StoredConflict;
  'conflict:resolved': { conflict: StoredConflict; strategy: ResolutionStrategy };
  'config:updated': ConflictResolverConfig;
}> {
  private conflicts: Map<string, StoredConflict> = new Map();
  private conflictsByEntity: Map<string, string[]> = new Map();
  private config: ConflictResolverConfig;
  private resolutionTimings: number[] = [];

  private stats: ConflictStats = {
    totalConflicts: 0,
    resolvedConflicts: 0,
    unresolvedConflicts: 0,
    conflictsByType: {
      'update_update': 0,
      'delete_update': 0,
      'update_delete': 0,
      'concurrent': 0,
    },
    resolutionsByStrategy: {
      'local-wins': 0,
      'remote-wins': 0,
      'merge': 0,
      'manual': 0,
      'last-modified': 0,
    },
    averageResolutionTimeMs: 0,
  };

  constructor(config: Partial<ConflictResolverConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect conflicts between local and remote operations
   */
  detectConflict(
    localOp: OfflineOperation,
    remoteOp: OfflineOperation
  ): StoredConflict | null {
    // Same session, same or overlapping data = potential conflict
    if (localOp.sessionId !== remoteOp.sessionId) {
      return null;
    }

    // Determine conflict type
    const isLocalDelete = localOp.type.includes('delete');
    const isRemoteDelete = remoteOp.type.includes('delete');

    if (isLocalDelete && isRemoteDelete) {
      // Both deleted - not a real conflict
      return null;
    }

    let conflictType: ConflictDetectionResult['type'];
    if (isLocalDelete && !isRemoteDelete) {
      conflictType = 'delete_update';
    } else if (!isLocalDelete && isRemoteDelete) {
      conflictType = 'update_delete';
    } else if (!isLocalDelete && !isRemoteDelete) {
      conflictType = 'update_update';
    } else {
      conflictType = 'concurrent';
    }

    // Calculate severity
    const severity = this.calculateSeverity(conflictType, localOp, remoteOp);

    // Find conflicting fields
    const conflictingFields = this.findConflictingFields(localOp.data, remoteOp.data);

    const conflict: StoredConflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      operationId: localOp.id,
      sessionId: localOp.sessionId,
      localData: localOp.data,
      remoteData: remoteOp.data,
      type: conflictType,
      severity,
      detectedAt: Date.now(),
    };

    this.conflicts.set(conflict.id, conflict);

    // Track by entity
    const entityKey = `${localOp.sessionId}`;
    if (!this.conflictsByEntity.has(entityKey)) {
      this.conflictsByEntity.set(entityKey, []);
    }
    this.conflictsByEntity.get(entityKey)!.push(conflict.id);

    // Update stats
    this.stats.totalConflicts++;
    if (conflictType) {
      this.stats.conflictsByType[conflictType]++;
    }
    this.stats.unresolvedConflicts++;

    this.emit('conflict:detected', conflict);

    // Try auto-resolution for low severity
    if (this.shouldAutoResolve(conflict)) {
      this.resolveConflict(conflict.id, this.config.defaultStrategy);
    }

    return conflict;
  }

  /**
   * Calculate conflict severity
   */
  private calculateSeverity(
    conflictType: ConflictDetectionResult['type'],
    localOp: OfflineOperation,
    remoteOp: OfflineOperation
  ): 'low' | 'medium' | 'high' {
    // Delete conflicts are high severity
    if (conflictType === 'delete_update' || conflictType === 'update_delete') {
      return 'high';
    }

    // Update-update conflicts with significant data differences are high severity
    if (conflictType === 'update_update') {
      const similarity = this.calculateDataSimilarity(localOp.data, remoteOp.data);
      if (similarity < 30) {
        return 'high';
      } else if (similarity < 60) {
        return 'medium';
      }
    }

    return 'low';
  }

  /**
   * Calculate data similarity (0-100)
   */
  private calculateDataSimilarity(data1: unknown, data2: unknown): number {
    if (data1 === data2) return 100;
    if (!data1 || !data2) return 0;

    try {
      const str1 = JSON.stringify(data1);
      const str2 = JSON.stringify(data2);

      // Simple character overlap calculation
      const commonChars = Array.from(str1).filter((char) =>
        str2.includes(char)
      ).length;
      return Math.round(
        (commonChars / Math.max(str1.length, str2.length)) * 100
      );
    } catch {
      return 0;
    }
  }

  /**
   * Find conflicting fields between two data objects
   */
  private findConflictingFields(
    data1: Record<string, unknown>,
    data2: Record<string, unknown>
  ): string[] {
    const conflicts: string[] = [];
    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

    Array.from(allKeys).forEach((key) => {
      const val1 = data1[key];
      const val2 = data2[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        conflicts.push(key);
      }
    });

    return conflicts;
  }

  /**
   * Determine if conflict should auto-resolve
   */
  private shouldAutoResolve(conflict: StoredConflict): boolean {
    // Auto-resolve low severity conflicts
    if (conflict.severity === 'low') {
      return true;
    }

    // Auto-resolve similar updates
    if (conflict.type === 'update_update') {
      const similarity = this.calculateDataSimilarity(
        conflict.localData,
        conflict.remoteData
      );
      return similarity > this.config.mergeThreshold;
    }

    return false;
  }

  /**
   * Resolve a conflict using specified strategy
   */
  resolveConflict(
    conflictId: string,
    strategy?: ResolutionStrategy
  ): StoredConflict['resolution'] | null {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return null;
    }

    const startTime = Date.now();
    const selectedStrategy = strategy || this.config.defaultStrategy;
    let resolvedData: Record<string, unknown>;
    let winner: 'local' | 'remote' | 'merged' | undefined;

    switch (selectedStrategy) {
      case 'local-wins':
        resolvedData = conflict.localData;
        winner = 'local';
        break;

      case 'remote-wins':
        resolvedData = conflict.remoteData;
        winner = 'remote';
        break;

      case 'last-modified':
        // Default to local if we can't determine timestamps
        resolvedData = conflict.localData;
        winner = 'local';
        break;

      case 'merge':
        if (this.config.enableAutoMerge && conflict.type === 'update_update') {
          resolvedData = this.attemptMerge(conflict.localData, conflict.remoteData);
          winner = 'merged';
        } else {
          // Fall back to local-wins
          resolvedData = conflict.localData;
          winner = 'local';
        }
        break;

      case 'manual':
        // Manual resolution - don't auto-resolve
        return null;

      default:
        resolvedData = conflict.localData;
        winner = 'local';
    }

    const resolution: StoredConflict['resolution'] = {
      strategy: selectedStrategy,
      resolvedData,
      resolvedAt: Date.now(),
    };

    conflict.resolution = resolution;

    // Update stats
    this.stats.resolvedConflicts++;
    this.stats.unresolvedConflicts--;
    this.stats.resolutionsByStrategy[selectedStrategy]++;

    const resolutionTime = Date.now() - startTime;
    this.resolutionTimings.push(resolutionTime);
    if (this.resolutionTimings.length > 100) {
      this.resolutionTimings.shift();
    }
    this.stats.averageResolutionTimeMs =
      this.resolutionTimings.reduce((a, b) => a + b, 0) /
      this.resolutionTimings.length;

    this.emit('conflict:resolved', { conflict, strategy: selectedStrategy });
    return resolution;
  }

  /**
   * Attempt to merge conflicting data
   */
  private attemptMerge(
    data1: Record<string, unknown>,
    data2: Record<string, unknown>
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...data1 };

    // Merge non-conflicting fields from data2
    for (const key of Object.keys(data2)) {
      if (!(key in merged)) {
        merged[key] = data2[key];
      } else if (
        typeof merged[key] === 'object' &&
        merged[key] !== null &&
        typeof data2[key] === 'object' &&
        data2[key] !== null
      ) {
        // Recursive merge for nested objects
        merged[key] = this.attemptMerge(
          merged[key] as Record<string, unknown>,
          data2[key] as Record<string, unknown>
        );
      }
      // For conflicting primitive values, keep local (data1)
    }

    return merged;
  }

  /**
   * Get conflict by ID
   */
  getConflict(conflictId: string): StoredConflict | undefined {
    return this.conflicts.get(conflictId);
  }

  /**
   * Get all unresolved conflicts
   */
  getUnresolvedConflicts(): StoredConflict[] {
    return Array.from(this.conflicts.values()).filter((c) => !c.resolution);
  }

  /**
   * Get conflicts for a session
   */
  getConflictsForSession(sessionId: string): StoredConflict[] {
    const conflictIds = this.conflictsByEntity.get(sessionId) || [];
    return conflictIds
      .map((id) => this.conflicts.get(id))
      .filter((c): c is StoredConflict => c !== undefined);
  }

  /**
   * Get high severity unresolved conflicts
   */
  getHighSeverityConflicts(): StoredConflict[] {
    return Array.from(this.conflicts.values()).filter(
      (c) => !c.resolution && c.severity === 'high'
    );
  }

  /**
   * Get statistics
   */
  getStats(): ConflictStats {
    return { ...this.stats };
  }

  /**
   * Configure resolver
   */
  configure(config: Partial<ConflictResolverConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ConflictResolverConfig {
    return { ...this.config };
  }

  /**
   * Clear all conflicts
   */
  clear(): void {
    this.conflicts.clear();
    this.conflictsByEntity.clear();
  }

  /**
   * Reset service (for testing)
   */
  reset(): void {
    this.clear();
    this.resolutionTimings = [];
    this.stats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      unresolvedConflicts: 0,
      conflictsByType: {
        'update_update': 0,
        'delete_update': 0,
        'update_delete': 0,
        'concurrent': 0,
      },
      resolutionsByStrategy: {
        'local-wins': 0,
        'remote-wins': 0,
        'merge': 0,
        'manual': 0,
        'last-modified': 0,
      },
      averageResolutionTimeMs: 0,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let _instance: ConflictResolver | null = null;

/**
 * Get the singleton conflict resolver instance
 */
export function getConflictResolver(): ConflictResolver {
  if (!_instance) {
    _instance = new ConflictResolver();
  }
  return _instance;
}

/**
 * Create a new conflict resolver with custom configuration
 */
export function createConflictResolver(
  config?: Partial<ConflictResolverConfig>
): ConflictResolver {
  return new ConflictResolver(config);
}

/**
 * Reset the singleton resolver (for testing)
 */
export function resetConflictResolver(): void {
  if (_instance) {
    _instance.reset();
  }
  _instance = null;
}
