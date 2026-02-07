/**
 * Aeon Speculative Pre-Rendering
 *
 * Pre-renders pages before user clicks based on:
 * 1. NavigationPredictor predictions (Markov chain, community patterns)
 * 2. Link visibility (IntersectionObserver)
 * 3. Hover intent signals
 * 4. Browser Speculation Rules API (when available)
 *
 * This enables zero-latency navigation by having the page ready in memory.
 */
export interface PreRenderedPage {
    route: string;
    html: string;
    prefetchedAt: number;
    confidence: number;
    stale: boolean;
    size: number;
}
export interface SpeculativeRendererConfig {
    /** Maximum pages to keep in memory cache */
    maxCachedPages: number;
    /** Maximum total size in bytes for cache */
    maxCacheSize: number;
    /** Time before a cached page is considered stale (ms) */
    staleTTL: number;
    /** Minimum confidence threshold to pre-render */
    minConfidence: number;
    /** Root margin for IntersectionObserver */
    intersectionRootMargin: string;
    /** Whether to use browser's Speculation Rules API */
    useSpeculationRules: boolean;
    /** Whether to pre-render on hover */
    prerenderOnHover: boolean;
    /** Hover delay before pre-rendering (ms) */
    hoverDelay: number;
    /** Base URL for session fetches */
    sessionBaseUrl: string;
}
export declare class SpeculativeRenderer {
    private config;
    private cache;
    private currentCacheSize;
    private observer;
    private hoverTimeouts;
    private initialized;
    constructor(config?: Partial<SpeculativeRendererConfig>);
    /**
     * Initialize the speculative renderer
     * Call this after the page has loaded
     */
    init(): void;
    /**
     * Cleanup resources
     */
    destroy(): void;
    /**
     * Pre-render a specific route
     */
    prerender(route: string, confidence?: number): Promise<boolean>;
    /**
     * Navigate to a route using pre-rendered content if available
     * Returns true if handled, false if fallback to normal navigation
     */
    navigate(route: string): Promise<boolean>;
    /**
     * Invalidate cached pages
     */
    invalidate(routes?: string[]): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        cachedPages: number;
        cacheSize: number;
        cacheHitRate: number;
    };
    private setupIntersectionObserver;
    private observeLinks;
    private onLinksVisible;
    private setupHoverListeners;
    private onLinkHover;
    private onLinkLeave;
    private injectSpeculationRules;
    private setupNavigationInterception;
    private startPredictivePrerendering;
    private reinitialize;
    private evictIfNeeded;
}
export declare function getSpeculativeRenderer(): SpeculativeRenderer;
export declare function setSpeculativeRenderer(renderer: SpeculativeRenderer): void;
/**
 * Initialize speculative rendering (call on page load)
 */
export declare function initSpeculativeRendering(config?: Partial<SpeculativeRendererConfig>): SpeculativeRenderer;
