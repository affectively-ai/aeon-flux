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
import type { ComponentNode, ComponentTree, EmotionState, RouteDecision, RouterAdapter, ThemeMode, UserContext, UserTier } from './types';
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
export declare class HeuristicAdapter implements RouterAdapter {
    name: string;
    private config;
    constructor(config?: HeuristicAdapterConfig);
    route(path: string, context: UserContext, tree: ComponentTree): Promise<RouteDecision>;
    speculate(currentPath: string, context: UserContext): Promise<string[]>;
    personalizeTree(tree: ComponentTree, decision: RouteDecision): ComponentTree;
    emotionToAccent(emotionState: EmotionState): string;
    private generateSessionId;
}
