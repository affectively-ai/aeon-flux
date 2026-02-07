/**
 * useConflicts Hook
 *
 * React hook for managing conflicts in offline-first applications.
 * Provides access to conflict list, resolution methods, and statistics.
 */
export type ResolutionStrategy = 'local-wins' | 'remote-wins' | 'merge' | 'last-modified' | 'manual';
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
    resolveConflict: (conflictId: string, strategy: ResolutionStrategy, customData?: Record<string, unknown>) => Promise<void>;
    /** Dismiss a conflict (remove without resolution) */
    dismissConflict: (conflictId: string) => void;
    /** Clear all resolved conflicts */
    clearResolved: () => void;
    /** Refresh conflicts from source */
    refresh: () => void;
    /** Whether conflicts are loading */
    isLoading: boolean;
}
/**
 * Hook to manage conflicts in offline-first applications
 */
export declare function useConflicts(sessionId?: string): UseConflictsResult;
/**
 * Add a conflict to the store (for testing or external integration)
 */
export declare function addConflict(conflict: Conflict): void;
/**
 * Get all conflicts from the store
 */
export declare function getAllConflicts(): Conflict[];
/**
 * Clear all conflicts
 */
export declare function clearAllConflicts(): void;
export default useConflicts;
