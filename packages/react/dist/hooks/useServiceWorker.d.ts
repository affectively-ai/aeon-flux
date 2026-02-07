/**
 * Service Worker Hooks - Client communication with Aeon SW
 *
 * Provides React hooks for:
 * - Total preload progress tracking
 * - Cache status monitoring
 * - Manual preload triggers
 */
export interface PreloadProgress {
    loaded: number;
    total: number;
    percentage: number;
    isComplete: boolean;
    cachedRoutes: string[];
}
export interface CacheStatus {
    cached: number;
    total: number;
    routes: string[];
    isReady: boolean;
}
/**
 * Hook to register and track the Aeon service worker
 */
export declare function useAeonServiceWorker(): {
    isRegistered: boolean;
    isActive: boolean;
    error: Error | null;
    update: () => Promise<void>;
    unregister: () => Promise<void>;
};
/**
 * Hook to track total preload progress
 */
export declare function usePreloadProgress(): PreloadProgress;
/**
 * Hook to get current cache status
 */
export declare function useCacheStatus(): CacheStatus & {
    refresh: () => void;
};
/**
 * Hook to trigger manual preload
 */
export declare function useManualPreload(): {
    triggerPreload: () => void;
    isPreloading: boolean;
    progress: PreloadProgress;
};
/**
 * Hook to prefetch a specific route
 */
export declare function usePrefetchRoute(): (route: string) => void;
/**
 * Hook to clear the cache
 */
export declare function useClearCache(): {
    clearCache: () => Promise<void>;
    isClearing: boolean;
};
