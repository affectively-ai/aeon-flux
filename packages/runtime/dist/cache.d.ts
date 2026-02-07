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
