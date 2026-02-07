/**
 * Aeon Navigation Hooks
 *
 * React hooks for the cutting-edge navigation system.
 * The navigation state itself is an Aeon - the site is a session.
 *
 * Recursive Aeon Architecture:
 * - Component = Aeon entity
 * - Page = Aeon session
 * - Site = Aeon of sessions (routes are collaborative)
 * - Federation = Aeon of Aeons (cross-site sync)
 */
import type { AeonNavigationEngine, NavigationOptions, PrefetchOptions, NavigationState, RoutePresenceInfo } from '@affectively/aeon-pages-runtime';
export interface NavigationPrediction {
    route: string;
    probability: number;
    reason: 'history' | 'hover' | 'visibility' | 'community';
}
export interface AeonNavigationContextValue {
    navigator: AeonNavigationEngine;
}
export declare const AeonNavigationContext: import("react").Context<AeonNavigationContextValue | null>;
/**
 * Main navigation hook - provides navigation, prefetch, and state
 */
export declare function useAeonNavigation(): {
    current: string;
    previous: string | null;
    history: string[];
    isNavigating: boolean;
    navigate: (href: string, options?: NavigationOptions) => Promise<void>;
    prefetch: (href: string, options?: PrefetchOptions) => Promise<void>;
    back: () => Promise<void>;
    preloadAll: (onProgress?: (loaded: number, total: number) => void) => Promise<void>;
    isPreloaded: (href: string) => boolean;
    getCacheStats: () => import("@affectively/aeon-pages-runtime").CacheStats;
};
/**
 * Route Presence hook - subscribe to who's viewing/editing routes
 *
 * Presence flows upward through the Aeon hierarchy:
 * - Page presence = users on this page
 * - Site presence = aggregate of all page presence
 * - Federation presence = aggregate across sites
 *
 * Note: This is different from usePresence in provider.tsx which is for
 * page-level editing presence. This hook is for navigation-level presence
 * (who's viewing what routes before you navigate there).
 */
export declare function useRoutePresence(): {
    getPresence: (route: string) => RoutePresenceInfo | null;
    subscribePresence: (callback: (route: string, presence: RoutePresenceInfo) => void) => (() => void);
};
/**
 * Navigation prediction hook
 */
export declare function useNavigationPrediction(): {
    predict: (fromRoute?: string) => NavigationPrediction[];
};
/**
 * Hook for observing links and auto-prefetching
 */
export declare function useLinkObserver(containerRef: React.RefObject<Element>): {
    observe: () => () => void;
};
/**
 * Hook for total preload progress
 */
export declare function useTotalPreload(): {
    startPreload: (onProgress?: (loaded: number, total: number) => void) => Promise<void>;
    getStats: () => import("@affectively/aeon-pages-runtime").CacheStats;
};
export type { NavigationOptions, PrefetchOptions, NavigationState, RoutePresenceInfo };
