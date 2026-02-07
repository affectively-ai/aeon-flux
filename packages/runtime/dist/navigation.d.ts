/**
 * Aeon Navigation Engine
 *
 * Cutting-edge navigation with:
 * - Speculative prefetching
 * - Total preload capability
 * - View transitions
 * - Presence awareness
 * - Predictive navigation
 */
import { AeonRouter } from './router.js';
import { NavigationCache, type CachedSession } from './cache';
export interface NavigationOptions {
    transition?: 'slide' | 'fade' | 'morph' | 'none';
    replace?: boolean;
}
export interface PrefetchOptions {
    data?: boolean;
    presence?: boolean;
    priority?: 'high' | 'normal' | 'low';
}
export interface NavigationState {
    current: string;
    previous: string | null;
    history: string[];
    isNavigating: boolean;
}
export interface PresenceInfo {
    route: string;
    count: number;
    editing: number;
    hot: boolean;
    users?: {
        userId: string;
        name?: string;
    }[];
}
export interface PredictedRoute {
    route: string;
    probability: number;
    reason: 'history' | 'hover' | 'visibility' | 'community';
}
type NavigationListener = (state: NavigationState) => void;
type PresenceListener = (route: string, presence: PresenceInfo) => void;
export declare class AeonNavigationEngine {
    private router;
    private cache;
    private state;
    private navigationListeners;
    private presenceListeners;
    private presenceCache;
    private navigationHistory;
    private pendingPrefetches;
    private observer;
    private sessionFetcher?;
    private presenceFetcher?;
    constructor(options?: {
        router?: AeonRouter;
        cache?: NavigationCache;
        initialRoute?: string;
        sessionFetcher?: (sessionId: string) => Promise<CachedSession>;
        presenceFetcher?: (route: string) => Promise<PresenceInfo>;
    });
    /**
     * Navigate to a route with optional view transition
     */
    navigate(href: string, options?: NavigationOptions): Promise<void>;
    /**
     * Prefetch a route
     */
    prefetch(href: string, options?: PrefetchOptions): Promise<void>;
    /**
     * Prefetch presence for a route
     */
    prefetchPresence(route: string): Promise<PresenceInfo | null>;
    /**
     * Check if a route is preloaded
     */
    isPreloaded(href: string): boolean;
    /**
     * Get cached presence for a route
     */
    getPresence(route: string): PresenceInfo | null;
    /**
     * Observe links for visibility-based prefetch
     */
    observeLinks(container: Element): () => void;
    /**
     * Predict next navigation destinations
     */
    predict(currentRoute: string): PredictedRoute[];
    /**
     * Go back in navigation history
     */
    back(): Promise<void>;
    /**
     * Get current navigation state
     */
    getState(): NavigationState;
    /**
     * Subscribe to navigation changes
     */
    subscribe(listener: NavigationListener): () => void;
    /**
     * Subscribe to presence changes for a route
     */
    subscribePresence(listener: PresenceListener): () => void;
    /**
     * Preload all routes (total preload strategy)
     */
    preloadAll(onProgress?: (loaded: number, total: number) => void): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): import("./cache").CacheStats;
    private getSession;
    private updateDOM;
    private recordNavigation;
    private notifyListeners;
    private notifyPresenceListeners;
}
export declare function getNavigator(): AeonNavigationEngine;
export declare function setNavigator(navigator: AeonNavigationEngine): void;
export {};
