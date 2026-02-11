/**
 * useConflicts Hook
 *
 * React hook for managing conflicts in offline-first applications.
 * Provides access to conflict list, resolution methods, and statistics.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ResolutionStrategy =
  | 'local-wins'
  | 'remote-wins'
  | 'merge'
  | 'last-modified'
  | 'manual';

export interface Conflict {
  id: string;
  operationId: string;
  sessionId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  type: 'update_update' | 'delete_update' | 'update_delete' | 'concurrent';
  severity: 'low' | 'medium' | 'high';
  detectedAt: number;
  resolution?: {
    strategy: ResolutionStrategy;
    resolvedData: Record<string, unknown>;
    resolvedAt: number;
    resolvedBy?: string;
  };
}

export interface ConflictStats {
  total: number;
  unresolved: number;
  highSeverity: number;
  byType: Record<Conflict['type'], number>;
  byStrategy: Record<ResolutionStrategy, number>;
}

export interface UseConflictsResult {
  /** All conflicts */
  conflicts: Conflict[];
  /** Unresolved conflicts only */
  unresolvedConflicts: Conflict[];
  /** High severity conflicts */
  highSeverityConflicts: Conflict[];
  /** Conflict statistics */
  stats: ConflictStats;
  /** Resolve a conflict */
  resolveConflict: (
    conflictId: string,
    strategy: ResolutionStrategy,
    customData?: Record<string, unknown>,
  ) => Promise<void>;
  /** Dismiss a conflict (remove without resolution) */
  dismissConflict: (conflictId: string) => void;
  /** Clear all resolved conflicts */
  clearResolved: () => void;
  /** Refresh conflicts from source */
  refresh: () => void;
  /** Whether conflicts are loading */
  isLoading: boolean;
}

// ============================================================================
// Mock conflict resolver (would connect to actual ConflictResolver in production)
// ============================================================================

const conflictStore: Map<string, Conflict> = new Map();
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to manage conflicts in offline-first applications
 */
export function useConflicts(sessionId?: string): UseConflictsResult {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConflicts = useCallback(() => {
    const allConflicts = Array.from(conflictStore.values());
    const filtered = sessionId
      ? allConflicts.filter((c) => c.sessionId === sessionId)
      : allConflicts;
    setConflicts(filtered);
  }, [sessionId]);

  useEffect(() => {
    loadConflicts();

    const listener = () => loadConflicts();
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, [loadConflicts]);

  const unresolvedConflicts = useMemo(
    () => conflicts.filter((c) => !c.resolution),
    [conflicts],
  );

  const highSeverityConflicts = useMemo(
    () => conflicts.filter((c) => !c.resolution && c.severity === 'high'),
    [conflicts],
  );

  const stats = useMemo<ConflictStats>(() => {
    const byType: Record<Conflict['type'], number> = {
      update_update: 0,
      delete_update: 0,
      update_delete: 0,
      concurrent: 0,
    };

    const byStrategy: Record<ResolutionStrategy, number> = {
      'local-wins': 0,
      'remote-wins': 0,
      merge: 0,
      'last-modified': 0,
      manual: 0,
    };

    let unresolved = 0;
    let highSeverity = 0;

    for (const conflict of conflicts) {
      byType[conflict.type]++;

      if (!conflict.resolution) {
        unresolved++;
        if (conflict.severity === 'high') {
          highSeverity++;
        }
      } else {
        byStrategy[conflict.resolution.strategy]++;
      }
    }

    return {
      total: conflicts.length,
      unresolved,
      highSeverity,
      byType,
      byStrategy,
    };
  }, [conflicts]);

  const resolveConflict = useCallback(
    async (
      conflictId: string,
      strategy: ResolutionStrategy,
      customData?: Record<string, unknown>,
    ) => {
      setIsLoading(true);

      try {
        const conflict = conflictStore.get(conflictId);
        if (!conflict) {
          throw new Error(`Conflict ${conflictId} not found`);
        }

        let resolvedData: Record<string, unknown>;

        switch (strategy) {
          case 'local-wins':
            resolvedData = conflict.localData;
            break;
          case 'remote-wins':
            resolvedData = conflict.remoteData;
            break;
          case 'merge':
            // Simple merge - combine both, local wins for conflicts
            resolvedData = { ...conflict.remoteData, ...conflict.localData };
            break;
          case 'last-modified':
            // Default to local
            resolvedData = conflict.localData;
            break;
          case 'manual':
            if (!customData) {
              throw new Error('Manual resolution requires customData');
            }
            resolvedData = customData;
            break;
          default:
            resolvedData = conflict.localData;
        }

        conflict.resolution = {
          strategy,
          resolvedData,
          resolvedAt: Date.now(),
        };

        conflictStore.set(conflictId, conflict);
        notifyListeners();
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const dismissConflict = useCallback((conflictId: string) => {
    conflictStore.delete(conflictId);
    notifyListeners();
  }, []);

  const clearResolved = useCallback(() => {
    for (const [id, conflict] of conflictStore) {
      if (conflict.resolution) {
        conflictStore.delete(id);
      }
    }
    notifyListeners();
  }, []);

  const refresh = useCallback(() => {
    loadConflicts();
  }, [loadConflicts]);

  return {
    conflicts,
    unresolvedConflicts,
    highSeverityConflicts,
    stats,
    resolveConflict,
    dismissConflict,
    clearResolved,
    refresh,
    isLoading,
  };
}

// ============================================================================
// Helper functions for external use
// ============================================================================

/**
 * Add a conflict to the store (for testing or external integration)
 */
export function addConflict(conflict: Conflict): void {
  conflictStore.set(conflict.id, conflict);
  notifyListeners();
}

/**
 * Get all conflicts from the store
 */
export function getAllConflicts(): Conflict[] {
  return Array.from(conflictStore.values());
}

/**
 * Clear all conflicts
 */
export function clearAllConflicts(): void {
  conflictStore.clear();
  notifyListeners();
}

export default useConflicts;
