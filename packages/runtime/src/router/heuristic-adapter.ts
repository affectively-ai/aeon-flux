/**
 * Heuristic Router Adapter
 *
 * Zero-latency personalized routing using pure heuristics.
 * No external API calls - all decisions made locally via WASM-compatible logic.
 *
 * Signals used:
 * - User tier → feature gating
 * - Viewport → responsive layout selection, density
 * - Custom signals → theme/accent derivation (configurable)
 * - Navigation history → component ordering, speculation
 * - Time of day → theme suggestion
 * - Connection speed → prefetch depth
 */

import type {
  ComponentNode,
  ComponentTree,
  EmotionState,
  LayoutDensity,
  RouteDecision,
  RouterAdapter,
  SkeletonHints,
  ThemeMode,
  UserContext,
  UserTier,
} from './types';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Feature flags configuration by tier
 */
export type TierFeatures = Record<UserTier, Record<string, boolean>>;

/**
 * Custom signal processor for deriving values from user context
 */
export interface SignalProcessor {
  /** Derive accent color from context */
  deriveAccent?: (context: UserContext) => string;

  /** Derive theme from context */
  deriveTheme?: (context: UserContext) => ThemeMode;

  /** Custom component relevance scoring */
  scoreRelevance?: (node: ComponentNode, context: UserContext) => number;

  /** Custom navigation prediction */
  predictNavigation?: (currentPath: string, context: UserContext) => string[];
}

/**
 * Heuristic adapter configuration
 */
export interface HeuristicAdapterConfig {
  /** Feature flags by tier (optional - defaults to all features enabled) */
  tierFeatures?: TierFeatures;

  /** Default accent color when no signal processor provided */
  defaultAccent?: string;

  /** Custom signal processing */
  signals?: SignalProcessor;

  /** Default paths to suggest when no history available */
  defaultPaths?: string[];

  /** Maximum number of paths to speculate */
  maxSpeculationPaths?: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<HeuristicAdapterConfig> = {
  tierFeatures: {
    free: {},
    starter: {},
    pro: {},
    enterprise: {},
  },
  defaultAccent: '#6366f1', // Indigo - neutral default
  signals: {},
  defaultPaths: ['/'],
  maxSpeculationPaths: 5,
};

// ============================================================================
// Theme Derivation
// ============================================================================

/**
 * Default theme derivation based on time
 */
function defaultDeriveTheme(context: UserContext): ThemeMode {
  // Explicit preference takes priority
  if (context.preferences.theme) {
    return context.preferences.theme as ThemeMode;
  }

  // Time-based suggestion
  const hour = context.localHour;
  const isNight = hour >= 20 || hour < 6;
  const isEvening = hour >= 18 && hour < 20;

  if (isNight) {
    return 'dark';
  }

  if (isEvening) {
    return 'auto';
  }

  return 'light';
}

/**
 * Determine layout density based on viewport and preferences
 */
function determineDensity(context: UserContext): LayoutDensity {
  // Explicit preference
  if (context.preferences.density) {
    return context.preferences.density as LayoutDensity;
  }

  // Viewport-based
  const { width, height } = context.viewport;

  // Mobile
  if (width < 768) {
    return 'compact';
  }

  // Large desktop with plenty of space
  if (width >= 1440 && height >= 900) {
    return 'comfortable';
  }

  // Default
  return 'normal';
}

// ============================================================================
// Navigation Prediction (Markov Chain)
// ============================================================================

interface TransitionMatrix {
  [from: string]: { [to: string]: number };
}

/**
 * Build transition matrix from navigation history
 */
function buildTransitionMatrix(history: string[]): TransitionMatrix {
  const matrix: TransitionMatrix = {};

  for (let i = 0; i < history.length - 1; i++) {
    const from = history[i];
    const to = history[i + 1];

    if (!matrix[from]) {
      matrix[from] = {};
    }
    matrix[from][to] = (matrix[from][to] || 0) + 1;
  }

  // Normalize to probabilities
  for (const from of Object.keys(matrix)) {
    const total = Object.values(matrix[from]).reduce((a, b) => a + b, 0);
    for (const to of Object.keys(matrix[from])) {
      matrix[from][to] /= total;
    }
  }

  return matrix;
}

/**
 * Predict next routes based on current path and history
 */
function defaultPredictNavigation(
  currentPath: string,
  context: UserContext,
  defaultPaths: string[],
  topN: number
): string[] {
  const history = context.recentPages;

  // If we have enough history, use Markov chain
  if (history.length >= 3) {
    const matrix = buildTransitionMatrix(history);
    const transitions = matrix[currentPath];

    if (transitions) {
      const sorted = Object.entries(transitions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, topN)
        .map(([path]) => path);

      if (sorted.length > 0) {
        return sorted;
      }
    }
  }

  // Fallback to default paths (excluding current)
  return defaultPaths.filter((p) => p !== currentPath).slice(0, topN);
}

// ============================================================================
// Component Relevance Scoring
// ============================================================================

/**
 * Default component relevance scoring
 */
function defaultScoreRelevance(node: ComponentNode, context: UserContext): number {
  let score = 50; // Base score

  // Tier gating
  if (node.requiredTier) {
    const tierOrder: UserTier[] = ['free', 'starter', 'pro', 'enterprise'];
    const requiredIndex = tierOrder.indexOf(node.requiredTier);
    const userIndex = tierOrder.indexOf(context.tier);

    if (userIndex < requiredIndex) {
      return 0; // User doesn't have access
    }
    score += 10;
  }

  // Relevance signals
  if (node.relevanceSignals) {
    for (const signal of node.relevanceSignals) {
      // Recent pages signal
      if (signal.startsWith('recentPage:')) {
        const page = signal.slice('recentPage:'.length);
        if (context.recentPages.includes(page)) {
          score += 20;
        }
      }

      // Time signal
      if (signal.startsWith('timeOfDay:')) {
        const timeRange = signal.slice('timeOfDay:'.length);
        const hour = context.localHour;

        if (timeRange === 'morning' && hour >= 5 && hour < 12) score += 15;
        if (timeRange === 'afternoon' && hour >= 12 && hour < 17) score += 15;
        if (timeRange === 'evening' && hour >= 17 && hour < 21) score += 15;
        if (timeRange === 'night' && (hour >= 21 || hour < 5)) score += 15;
      }

      // Preference signal
      if (signal.startsWith('preference:')) {
        const pref = signal.slice('preference:'.length);
        if (context.preferences[pref]) {
          score += 20;
        }
      }

      // Tier signal
      if (signal.startsWith('tier:')) {
        const requiredTier = signal.slice('tier:'.length) as UserTier;
        const tierOrder: UserTier[] = ['free', 'starter', 'pro', 'enterprise'];
        if (tierOrder.indexOf(context.tier) >= tierOrder.indexOf(requiredTier)) {
          score += 15;
        }
      }
    }
  }

  // Default hidden penalty
  if (node.defaultHidden) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Order components by relevance
 */
function orderComponentsByRelevance(
  tree: ComponentTree,
  context: UserContext,
  scoreRelevance: (node: ComponentNode, context: UserContext) => number
): string[] {
  const scored: Array<{ id: string; score: number }> = [];

  tree.nodes.forEach((node, id) => {
    scored.push({
      id,
      score: scoreRelevance(node, context),
    });
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.id);
}

/**
 * Find components to hide based on tier and relevance
 */
function findHiddenComponents(
  tree: ComponentTree,
  context: UserContext,
  scoreRelevance: (node: ComponentNode, context: UserContext) => number
): string[] {
  const hidden: string[] = [];

  tree.nodes.forEach((node, id) => {
    const score = scoreRelevance(node, context);
    if (score === 0) {
      hidden.push(id);
    }
  });

  return hidden;
}

// ============================================================================
// Skeleton Hints
// ============================================================================

/**
 * Compute skeleton hints for the route
 */
function computeSkeletonHints(
  route: string,
  context: UserContext,
  tree: ComponentTree
): SkeletonHints {
  // Determine layout type from route - apps can override via custom signals
  let layout: SkeletonHints['layout'] = 'custom';

  // Simple path-based heuristics (can be overridden by app)
  if (route === '/' || route.includes('dashboard')) {
    layout = 'dashboard';
  } else if (route.includes('chat') || route.includes('message')) {
    layout = 'chat';
  } else if (route.includes('setting') || route.includes('config')) {
    layout = 'settings';
  } else if (route.includes('tool')) {
    layout = 'tools';
  }

  // Estimate height based on viewport and content
  const baseHeight = context.viewport.height;
  const contentMultiplier = tree.nodes.size > 10 ? 1.5 : 1;
  const estimatedHeight = Math.round(baseHeight * contentMultiplier);

  // Compute section hints
  const sections = tree.getChildren(tree.rootId).map((child, i) => ({
    id: child.id,
    height: Math.round(estimatedHeight / (tree.nodes.size || 1)),
    priority: i + 1,
  }));

  return {
    layout,
    estimatedHeight,
    sections,
  };
}

// ============================================================================
// Prefetch Depth by Connection
// ============================================================================

function getPrefetchDepth(context: UserContext): { prefetch: number; prerender: number } {
  switch (context.connection) {
    case 'fast':
    case '4g':
      return { prefetch: 5, prerender: 1 };
    case '3g':
      return { prefetch: 3, prerender: 0 };
    case '2g':
      return { prefetch: 1, prerender: 0 };
    case 'slow-2g':
      return { prefetch: 0, prerender: 0 };
    default:
      return { prefetch: 3, prerender: 0 };
  }
}

// ============================================================================
// Heuristic Adapter Implementation
// ============================================================================

export class HeuristicAdapter implements RouterAdapter {
  name = 'heuristic';
  private config: Required<HeuristicAdapterConfig>;

  constructor(config: HeuristicAdapterConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      tierFeatures: config.tierFeatures ?? DEFAULT_CONFIG.tierFeatures,
      signals: config.signals ?? DEFAULT_CONFIG.signals,
    };
  }

  async route(
    path: string,
    context: UserContext,
    tree: ComponentTree
  ): Promise<RouteDecision> {
    const startTime = Date.now();

    // Generate session ID
    const sessionId = this.generateSessionId(path, context);

    // Compute feature flags from tier
    const featureFlags = { ...this.config.tierFeatures[context.tier] };

    // Compute theme - use custom processor or default
    const theme = this.config.signals.deriveTheme
      ? this.config.signals.deriveTheme(context)
      : defaultDeriveTheme(context);

    // Compute accent - use custom processor or default
    const accent = this.config.signals.deriveAccent
      ? this.config.signals.deriveAccent(context)
      : this.config.defaultAccent;

    // Compute density
    const density = determineDensity(context);

    // Relevance scoring - use custom or default
    const scoreRelevance = this.config.signals.scoreRelevance ?? defaultScoreRelevance;

    // Order components by relevance
    const componentOrder = orderComponentsByRelevance(tree, context, scoreRelevance);

    // Find hidden components
    const hiddenComponents = findHiddenComponents(tree, context, scoreRelevance);

    // Predict likely next paths - use custom or default
    const predictions = this.config.signals.predictNavigation
      ? this.config.signals.predictNavigation(path, context)
      : defaultPredictNavigation(
          path,
          context,
          this.config.defaultPaths,
          this.config.maxSpeculationPaths
        );

    const { prefetch: prefetchDepth, prerender: prerenderCount } = getPrefetchDepth(context);

    const prefetch = predictions.slice(0, prefetchDepth);
    const prerender = predictions.slice(0, prerenderCount);

    // Compute skeleton hints
    const skeleton = computeSkeletonHints(path, context, tree);

    return {
      route: path,
      sessionId,
      componentOrder,
      hiddenComponents,
      featureFlags,
      theme,
      accent,
      density,
      prefetch,
      prerender,
      skeleton,
      routedAt: startTime,
      routerName: this.name,
      confidence: 0.85, // Heuristic confidence
    };
  }

  async speculate(
    currentPath: string,
    context: UserContext
  ): Promise<string[]> {
    return this.config.signals.predictNavigation
      ? this.config.signals.predictNavigation(currentPath, context)
      : defaultPredictNavigation(
          currentPath,
          context,
          this.config.defaultPaths,
          this.config.maxSpeculationPaths
        );
  }

  personalizeTree(
    tree: ComponentTree,
    decision: RouteDecision
  ): ComponentTree {
    const cloned = tree.clone();

    // Hide components that should be hidden
    if (decision.hiddenComponents) {
      for (const id of decision.hiddenComponents) {
        const node = cloned.getNode(id);
        if (node) {
          node.defaultHidden = true;
        }
      }
    }

    return cloned;
  }

  emotionToAccent(emotionState: EmotionState): string {
    // If app provided a custom deriveAccent, use it
    if (this.config.signals.deriveAccent) {
      return this.config.signals.deriveAccent({
        emotionState,
        // Provide minimal context for just the emotion
        tier: 'free',
        recentPages: [],
        dwellTimes: new Map(),
        clickPatterns: [],
        preferences: {},
        viewport: { width: 0, height: 0 },
        connection: 'fast',
        reducedMotion: false,
        localHour: 12,
        timezone: 'UTC',
        isNewSession: true,
      });
    }

    return this.config.defaultAccent;
  }

  private generateSessionId(path: string, context: UserContext): string {
    const base = path.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
    const userId = context.userId || 'anon';
    const sessionPrefix = context.sessionId || Date.now().toString(36);

    return `${base}-${userId.slice(0, 8)}-${sessionPrefix.slice(0, 8)}`;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type { TierFeatures, SignalProcessor };
