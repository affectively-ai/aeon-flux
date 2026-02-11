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
  duration: number; // How long they stayed on 'from'
  source?: 'click' | 'back' | 'forward' | 'direct';
}

export interface CommunityPattern {
  route: string;
  popularity: number; // How many users visited
  avgTimeSpent: number;
  nextRoutes: { route: string; count: number }[];
}

export interface PredictorConfig {
  historyWeight: number; // 0-1, weight for personal history
  communityWeight: number; // 0-1, weight for community patterns
  timeWeight: number; // 0-1, weight for time-based patterns
  decayFactor: number; // How quickly old history decays (0-1)
  minProbability: number; // Minimum probability to include in predictions
  maxPredictions: number; // Maximum predictions to return
}

const DEFAULT_CONFIG: PredictorConfig = {
  historyWeight: 0.5,
  communityWeight: 0.3,
  timeWeight: 0.2,
  decayFactor: 0.95,
  minProbability: 0.1,
  maxPredictions: 5,
};

export class NavigationPredictor {
  private config: PredictorConfig;
  private history: NavigationRecord[] = [];
  private transitionMatrix: Map<string, Map<string, number>> = new Map();
  private communityPatterns: Map<string, CommunityPattern> = new Map();
  private timePatterns: Map<string, Map<number, number>> = new Map(); // route -> hour -> count

  constructor(config: Partial<PredictorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a navigation event
   */
  record(record: NavigationRecord): void {
    this.history.push(record);

    // Update transition matrix
    if (!this.transitionMatrix.has(record.from)) {
      this.transitionMatrix.set(record.from, new Map());
    }
    const fromMap = this.transitionMatrix.get(record.from)!;
    fromMap.set(record.to, (fromMap.get(record.to) ?? 0) + 1);

    // Update time patterns
    const hour = new Date(record.timestamp).getHours();
    if (!this.timePatterns.has(record.to)) {
      this.timePatterns.set(record.to, new Map());
    }
    const hourMap = this.timePatterns.get(record.to)!;
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);

    // Apply decay to old records
    this.applyDecay();
  }

  /**
   * Predict next navigation destinations from current route
   */
  predict(currentRoute: string): PredictedRoute[] {
    const predictions: Map<string, PredictedRoute> = new Map();

    // 1. Personal history predictions (Markov chain)
    const historyPredictions = this.predictFromHistory(currentRoute);
    for (const pred of historyPredictions) {
      this.mergePrediction(predictions, pred, this.config.historyWeight);
    }

    // 2. Community predictions
    const communityPredictions = this.predictFromCommunity(currentRoute);
    for (const pred of communityPredictions) {
      this.mergePrediction(predictions, pred, this.config.communityWeight);
    }

    // 3. Time-based predictions
    const timePredictions = this.predictFromTime();
    for (const pred of timePredictions) {
      this.mergePrediction(predictions, pred, this.config.timeWeight);
    }

    // Sort by probability and filter
    return Array.from(predictions.values())
      .filter((p) => p.probability >= this.config.minProbability)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, this.config.maxPredictions);
  }

  /**
   * Predict from personal navigation history (Markov chain)
   */
  private predictFromHistory(currentRoute: string): PredictedRoute[] {
    const fromMap = this.transitionMatrix.get(currentRoute);
    if (!fromMap) return [];

    const total = Array.from(fromMap.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Array.from(fromMap.entries()).map(([route, count]) => ({
      route,
      probability: count / total,
      reason: 'history' as const,
      confidence: Math.min(1, total / 10), // Higher confidence with more data
    }));
  }

  /**
   * Predict from community patterns
   */
  private predictFromCommunity(currentRoute: string): PredictedRoute[] {
    const pattern = this.communityPatterns.get(currentRoute);
    if (!pattern || pattern.nextRoutes.length === 0) return [];

    const total = pattern.nextRoutes.reduce((a, b) => a + b.count, 0);
    if (total === 0) return [];

    return pattern.nextRoutes.map(({ route, count }) => ({
      route,
      probability: count / total,
      reason: 'community' as const,
      confidence: Math.min(1, pattern.popularity / 100),
    }));
  }

  /**
   * Predict from time-based patterns
   */
  private predictFromTime(): PredictedRoute[] {
    const currentHour = new Date().getHours();
    const predictions: PredictedRoute[] = [];

    let maxCount = 0;
    for (const [route, hourMap] of this.timePatterns) {
      const count = hourMap.get(currentHour) ?? 0;
      if (count > maxCount) maxCount = count;
    }

    if (maxCount === 0) return [];

    for (const [route, hourMap] of this.timePatterns) {
      const count = hourMap.get(currentHour) ?? 0;
      if (count > 0) {
        predictions.push({
          route,
          probability: count / maxCount,
          reason: 'time' as const,
          confidence: Math.min(1, count / 5),
        });
      }
    }

    return predictions;
  }

  /**
   * Merge a prediction into the predictions map
   */
  private mergePrediction(
    predictions: Map<string, PredictedRoute>,
    prediction: PredictedRoute,
    weight: number,
  ): void {
    const existing = predictions.get(prediction.route);
    if (existing) {
      // Combine probabilities (weighted average)
      const totalWeight =
        (existing.confidence ?? 1) + (prediction.confidence ?? 1) * weight;
      existing.probability =
        (existing.probability * (existing.confidence ?? 1) +
          prediction.probability * (prediction.confidence ?? 1) * weight) /
        totalWeight;
      existing.confidence = Math.max(
        existing.confidence,
        prediction.confidence,
      );
      // Keep the higher-confidence reason
      if (prediction.confidence > (existing.confidence ?? 0)) {
        existing.reason = prediction.reason;
      }
    } else {
      predictions.set(prediction.route, {
        ...prediction,
        probability: prediction.probability * weight,
      });
    }
  }

  /**
   * Apply decay to old history records
   */
  private applyDecay(): void {
    // Decay transition matrix
    for (const [from, toMap] of this.transitionMatrix) {
      for (const [to, count] of toMap) {
        const decayed = count * this.config.decayFactor;
        if (decayed < 0.1) {
          toMap.delete(to);
        } else {
          toMap.set(to, decayed);
        }
      }
      if (toMap.size === 0) {
        this.transitionMatrix.delete(from);
      }
    }

    // Trim old history
    const maxHistory = 1000;
    if (this.history.length > maxHistory) {
      this.history = this.history.slice(-maxHistory);
    }
  }

  /**
   * Update community patterns from external sync
   */
  updateCommunityPatterns(patterns: Map<string, CommunityPattern>): void {
    this.communityPatterns = patterns;
  }

  /**
   * Get current transition matrix (for syncing)
   */
  getTransitionMatrix(): Map<string, Map<string, number>> {
    return this.transitionMatrix;
  }

  /**
   * Import transition matrix from sync
   */
  importTransitionMatrix(matrix: Map<string, Map<string, number>>): void {
    // Merge with existing
    for (const [from, toMap] of matrix) {
      if (!this.transitionMatrix.has(from)) {
        this.transitionMatrix.set(from, new Map());
      }
      const existingMap = this.transitionMatrix.get(from)!;
      for (const [to, count] of toMap) {
        existingMap.set(to, (existingMap.get(to) ?? 0) + count);
      }
    }
  }

  /**
   * Get statistics about the predictor
   */
  getStats(): {
    totalRecords: number;
    uniqueRoutes: number;
    transitionPairs: number;
    communityPatterns: number;
  } {
    let transitionPairs = 0;
    for (const toMap of this.transitionMatrix.values()) {
      transitionPairs += toMap.size;
    }

    return {
      totalRecords: this.history.length,
      uniqueRoutes: this.transitionMatrix.size,
      transitionPairs,
      communityPatterns: this.communityPatterns.size,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.history = [];
    this.transitionMatrix.clear();
    this.communityPatterns.clear();
    this.timePatterns.clear();
  }

  /**
   * Export for persistence
   */
  export(): {
    history: NavigationRecord[];
    transitionMatrix: [string, [string, number][]][];
    timePatterns: [string, [number, number][]][];
  } {
    return {
      history: this.history,
      transitionMatrix: Array.from(this.transitionMatrix.entries()).map(
        ([from, toMap]) => [from, Array.from(toMap.entries())],
      ),
      timePatterns: Array.from(this.timePatterns.entries()).map(
        ([route, hourMap]) => [route, Array.from(hourMap.entries())],
      ),
    };
  }

  /**
   * Import from persistence
   */
  import(data: {
    history?: NavigationRecord[];
    transitionMatrix?: [string, [string, number][]][];
    timePatterns?: [string, [number, number][]][];
  }): void {
    if (data.history) {
      this.history = data.history;
    }

    if (data.transitionMatrix) {
      this.transitionMatrix = new Map(
        data.transitionMatrix.map(([from, toEntries]) => [
          from,
          new Map(toEntries),
        ]),
      );
    }

    if (data.timePatterns) {
      this.timePatterns = new Map(
        data.timePatterns.map(([route, hourEntries]) => [
          route,
          new Map(hourEntries),
        ]),
      );
    }
  }
}

// Singleton instance
let globalPredictor: NavigationPredictor | null = null;

export function getPredictor(): NavigationPredictor {
  if (!globalPredictor) {
    globalPredictor = new NavigationPredictor();
  }
  return globalPredictor;
}

export function setPredictor(predictor: NavigationPredictor): void {
  globalPredictor = predictor;
}
