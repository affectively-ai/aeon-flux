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
import type { OfflineOperation, StoredConflict, ResolutionStrategy } from '../offline/types';
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
        update_update: number;
        delete_update: number;
        update_delete: number;
        concurrent: number;
    };
    resolutionsByStrategy: {
        'local-wins': number;
        'remote-wins': number;
        merge: number;
        manual: number;
        'last-modified': number;
    };
    averageResolutionTimeMs: number;
}
type EventHandler<T> = (data: T) => void;
declare class EventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> {
    private handlers;
    on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
    off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
    emit<K extends keyof Events>(event: K, data?: Events[K]): void;
}
export declare class ConflictResolver extends EventEmitter<{
    'conflict:detected': StoredConflict;
    'conflict:resolved': {
        conflict: StoredConflict;
        strategy: ResolutionStrategy;
    };
    'config:updated': ConflictResolverConfig;
}> {
    private conflicts;
    private conflictsByEntity;
    private config;
    private resolutionTimings;
    private stats;
    constructor(config?: Partial<ConflictResolverConfig>);
    /**
     * Detect conflicts between local and remote operations
     */
    detectConflict(localOp: OfflineOperation, remoteOp: OfflineOperation): StoredConflict | null;
    /**
     * Calculate conflict severity
     */
    private calculateSeverity;
    /**
     * Calculate data similarity (0-100)
     */
    private calculateDataSimilarity;
    /**
     * Find conflicting fields between two data objects
     */
    private findConflictingFields;
    /**
     * Determine if conflict should auto-resolve
     */
    private shouldAutoResolve;
    /**
     * Resolve a conflict using specified strategy
     */
    resolveConflict(conflictId: string, strategy?: ResolutionStrategy): StoredConflict['resolution'] | null;
    /**
     * Attempt to merge conflicting data
     */
    private attemptMerge;
    /**
     * Get conflict by ID
     */
    getConflict(conflictId: string): StoredConflict | undefined;
    /**
     * Get all unresolved conflicts
     */
    getUnresolvedConflicts(): StoredConflict[];
    /**
     * Get conflicts for a session
     */
    getConflictsForSession(sessionId: string): StoredConflict[];
    /**
     * Get high severity unresolved conflicts
     */
    getHighSeverityConflicts(): StoredConflict[];
    /**
     * Get statistics
     */
    getStats(): ConflictStats;
    /**
     * Configure resolver
     */
    configure(config: Partial<ConflictResolverConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): ConflictResolverConfig;
    /**
     * Clear all conflicts
     */
    clear(): void;
    /**
     * Reset service (for testing)
     */
    reset(): void;
}
/**
 * Get the singleton conflict resolver instance
 */
export declare function getConflictResolver(): ConflictResolver;
/**
 * Create a new conflict resolver with custom configuration
 */
export declare function createConflictResolver(config?: Partial<ConflictResolverConfig>): ConflictResolver;
/**
 * Reset the singleton resolver (for testing)
 */
export declare function resetConflictResolver(): void;
export {};
