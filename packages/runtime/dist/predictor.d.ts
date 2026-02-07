/**
 * Aeon Navigation Predictor
 *
 * Predicts where users will navigate next based on:
 * 1. Personal navigation history (Markov chain)
 * 2. Collaborative signals (where is the community going?)
 * 3. Time-based patterns (Monday morning vs Friday afternoon)
 * 4. Content signals (came from search → exploring)
 *
 * The predictor itself is an Aeon entity - it syncs across nodes
 * to build community navigation patterns.
 */
export interface PredictedRoute {
    route: string;
    probability: number;
    reason: 'history' | 'hover' | 'visibility' | 'community' | 'time' | 'content';
    confidence: number;
}
export interface NavigationRecord {
    from: string;
    to: string;
    timestamp: number;
    duration: number;
    source?: 'click' | 'back' | 'forward' | 'direct';
}
export interface CommunityPattern {
    route: string;
    popularity: number;
    avgTimeSpent: number;
    nextRoutes: {
        route: string;
        count: number;
    }[];
}
export interface PredictorConfig {
    historyWeight: number;
    communityWeight: number;
    timeWeight: number;
    decayFactor: number;
    minProbability: number;
    maxPredictions: number;
}
export declare class NavigationPredictor {
    private config;
    private history;
    private transitionMatrix;
    private communityPatterns;
    private timePatterns;
    constructor(config?: Partial<PredictorConfig>);
    /**
     * Record a navigation event
     */
    record(record: NavigationRecord): void;
    /**
     * Predict next navigation destinations from current route
     */
    predict(currentRoute: string): PredictedRoute[];
    /**
     * Predict from personal navigation history (Markov chain)
     */
    private predictFromHistory;
    /**
     * Predict from community patterns
     */
    private predictFromCommunity;
    /**
     * Predict from time-based patterns
     */
    private predictFromTime;
    /**
     * Merge a prediction into the predictions map
     */
    private mergePrediction;
    /**
     * Apply decay to old history records
     */
    private applyDecay;
    /**
     * Update community patterns from external sync
     */
    updateCommunityPatterns(patterns: Map<string, CommunityPattern>): void;
    /**
     * Get current transition matrix (for syncing)
     */
    getTransitionMatrix(): Map<string, Map<string, number>>;
    /**
     * Import transition matrix from sync
     */
    importTransitionMatrix(matrix: Map<string, Map<string, number>>): void;
    /**
     * Get statistics about the predictor
     */
    getStats(): {
        totalRecords: number;
        uniqueRoutes: number;
        transitionPairs: number;
        communityPatterns: number;
    };
    /**
     * Clear all data
     */
    clear(): void;
    /**
     * Export for persistence
     */
    export(): {
        history: NavigationRecord[];
        transitionMatrix: [string, [string, number][]][];
        timePatterns: [string, [number, number][]][];
    };
    /**
     * Import from persistence
     */
    import(data: {
        history?: NavigationRecord[];
        transitionMatrix?: [string, [string, number][]][];
        timePatterns?: [string, [number, number][]][];
    }): void;
}
export declare function getPredictor(): NavigationPredictor;
export declare function setPredictor(predictor: NavigationPredictor): void;
