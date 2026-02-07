/**
 * Speculation Manager
 *
 * Client-side prefetching and prerendering for instant navigation.
 * Uses the Speculation Rules API when available, with fallback to link prefetch.
 */
export interface SpeculationOptions {
    /** Maximum paths to prefetch */
    maxPrefetch?: number;
    /** Maximum paths to prerender (more expensive) */
    maxPrerender?: number;
    /** Prefetch on hover delay (ms) */
    hoverDelay?: number;
    /** Prefetch on viewport intersection */
    prefetchOnVisible?: boolean;
    /** Intersection observer threshold */
    visibilityThreshold?: number;
    /** Cache duration for prefetched resources (ms) */
    cacheDuration?: number;
    /** Callback when speculation occurs */
    onSpeculate?: (path: string, type: 'prefetch' | 'prerender') => void;
}
export interface SpeculationState {
    prefetched: Set<string>;
    prerendered: Set<string>;
    pending: Set<string>;
}
declare function supportsSpeculationRules(): boolean;
declare function supportsLinkPrefetch(): boolean;
/**
 * Add speculation rules to the document
 */
declare function addSpeculationRules(prefetch: string[], prerender: string[]): HTMLScriptElement | null;
/**
 * Prefetch a path using <link rel="prefetch">
 */
declare function linkPrefetch(path: string): HTMLLinkElement | null;
export declare class SpeculationManager {
    private options;
    private state;
    private observers;
    private hoverTimers;
    private speculationScript;
    private prefetchLinks;
    constructor(options?: SpeculationOptions);
    /**
     * Initialize speculation from server hints
     */
    initFromHints(prefetch?: string[], prerender?: string[]): void;
    /**
     * Prefetch a specific path
     */
    prefetch(path: string): boolean;
    /**
     * Watch an element for hover to prefetch its href
     */
    watchHover(element: HTMLAnchorElement): () => void;
    /**
     * Watch an element for visibility to prefetch its href
     */
    watchVisible(element: HTMLAnchorElement): () => void;
    /**
     * Auto-watch all internal links on the page
     */
    watchAllLinks(): () => void;
    /**
     * Clear all speculation state
     */
    clear(): void;
    /**
     * Get current speculation state
     */
    getState(): Readonly<SpeculationState>;
}
/**
 * React hook for speculation management
 * Usage: const speculation = useSpeculation({ maxPrefetch: 5 });
 */
export declare function createSpeculationHook(useState: <T>(initial: T) => [T, (v: T) => void], useEffect: (effect: () => void | (() => void), deps: unknown[]) => void, useRef: <T>(initial: T) => {
    current: T;
}): (options?: SpeculationOptions) => {
    state: SpeculationState;
    prefetch: (path: string) => boolean | undefined;
    initFromHints: (prefetch: string[], prerender: string[]) => void | undefined;
    clear: () => void | undefined;
};
/**
 * Auto-initialize speculation from window.__AEON_SPECULATION__ hints
 */
export declare function autoInitSpeculation(): SpeculationManager | null;
export { supportsSpeculationRules, supportsLinkPrefetch, addSpeculationRules, linkPrefetch, };
