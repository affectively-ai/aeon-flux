/**
 * Navigation Cache - In-memory cache for total preload navigation
 *
 * With 8.4KB framework + ~2-5KB per page session, we can preload EVERYTHING.
 * Site with 100 pages = ~315KB total (smaller than one hero image!)
 */
export interface CachedSession {
    sessionId: string;
    route: string;
    tree: unknown;
    data: Record<string, unknown>;
    schemaVersion: string;
    cachedAt: number;
    expiresAt?: number;
}
export interface CacheStats {
    size: number;
    totalBytes: number;
    hitRate: number;
    preloadedRoutes: number;
}
export interface NavigationCacheOptions {
    maxSize?: number;
    defaultTtl?: number;
    onEvict?: (session: CachedSession) => void;
}
export declare class NavigationCache {
    private cache;
    private accessOrder;
    private hits;
    private misses;
    private maxSize;
    private defaultTtl;
    private onEvict?;
    constructor(options?: NavigationCacheOptions);
    /**
     * Get a session from cache
     */
    get(sessionId: string): CachedSession | null;
    /**
     * Store a session in cache
     */
    set(session: CachedSession, ttl?: number): void;
    /**
     * Check if session is cached
     */
    has(sessionId: string): boolean;
    /**
     * Prefetch a session by ID
     */
    prefetch(sessionId: string, fetcher: () => Promise<CachedSession>): Promise<CachedSession>;
    /**
     * Prefetch multiple sessions in parallel
     */
    prefetchMany(sessionIds: string[], fetcher: (sessionId: string) => Promise<CachedSession>): Promise<CachedSession[]>;
    /**
     * Preload all sessions (total preload strategy)
     */
    preloadAll(manifest: {
        sessionId: string;
        route: string;
    }[], fetcher: (sessionId: string) => Promise<CachedSession>, options?: {
        onProgress?: (loaded: number, total: number) => void;
    }): Promise<void>;
    /**
     * Invalidate a cached session
     */
    invalidate(sessionId: string): void;
    /**
     * Clear all cached sessions
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get all cached session IDs
     */
    keys(): string[];
    /**
     * Export cache for service worker storage
     */
    export(): CachedSession[];
    /**
     * Import cache from service worker storage
     */
    import(sessions: CachedSession[]): void;
    private evictLRU;
    private updateAccessOrder;
    private removeFromAccessOrder;
}
export declare function getNavigationCache(): NavigationCache;
export declare function setNavigationCache(cache: NavigationCache): void;
/** Cached skeleton data for a route */
export interface CachedSkeleton {
    route: string;
    html: string;
    css: string;
    cachedAt: number;
    expiresAt?: number;
}
/** Skeleton cache options */
export interface SkeletonCacheOptions {
    /** Maximum number of skeletons to cache */
    maxSize?: number;
    /** Default TTL in milliseconds */
    defaultTtl?: number;
}
/**
 * Skeleton Cache - Optimized for instant skeleton delivery
 *
 * Skeletons are cached separately from full pages for faster access.
 * In edge environments, skeletons are stored in KV for ~1ms access.
 */
export declare class SkeletonCache {
    private cache;
    private maxSize;
    private defaultTtl;
    constructor(options?: SkeletonCacheOptions);
    /**
     * Get skeleton for a route
     */
    get(route: string): CachedSkeleton | null;
    /**
     * Store skeleton for a route
     */
    set(skeleton: CachedSkeleton, ttl?: number): void;
    /**
     * Check if skeleton is cached
     */
    has(route: string): boolean;
    /**
     * Invalidate skeleton for a route
     */
    invalidate(route: string): void;
    /**
     * Clear all cached skeletons
     */
    clear(): void;
    /**
     * Get cache size
     */
    get size(): number;
    /**
     * Export all skeletons for service worker
     */
    export(): CachedSkeleton[];
    /**
     * Import skeletons from service worker
     */
    import(skeletons: CachedSkeleton[]): void;
}
/** Skeleton and content result for progressive rendering */
export interface SkeletonWithContent {
    /** Skeleton HTML (available immediately) */
    skeleton: CachedSkeleton | null;
    /** Content promise (resolves later) */
    content: Promise<CachedSession | null>;
}
/**
 * Get skeleton and content in parallel for optimal UX
 *
 * @param route - The route to fetch
 * @param skeletonCache - Skeleton cache instance
 * @param sessionCache - Session cache instance
 * @param contentFetcher - Function to fetch full content
 */
export declare function getWithSkeleton(route: string, skeletonCache: SkeletonCache, sessionCache: NavigationCache, contentFetcher: (route: string) => Promise<CachedSession>): SkeletonWithContent;
export declare function getSkeletonCache(): SkeletonCache;
export declare function setSkeletonCache(cache: SkeletonCache): void;
