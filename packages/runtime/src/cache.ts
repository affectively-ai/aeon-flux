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

export class NavigationCache {
  private cache: Map<string, CachedSession> = new Map();
  private accessOrder: string[] = [];
  private hits = 0;
  private misses = 0;
  private maxSize: number;
  private defaultTtl: number;
  private onEvict?: (session: CachedSession) => void;

  constructor(options: NavigationCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtl = options.defaultTtl ?? 5 * 60 * 1000; // 5 minutes
    this.onEvict = options.onEvict;
  }

  /**
   * Get a session from cache
   */
  get(sessionId: string): CachedSession | null {
    const session = this.cache.get(sessionId);

    if (!session) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.cache.delete(sessionId);
      this.removeFromAccessOrder(sessionId);
      this.misses++;
      return null;
    }

    this.hits++;
    this.updateAccessOrder(sessionId);
    return session;
  }

  /**
   * Store a session in cache
   */
  set(session: CachedSession, ttl?: number): void {
    const sessionId = session.sessionId;

    // Evict if at capacity
    if (!this.cache.has(sessionId) && this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const cached: CachedSession = {
      ...session,
      cachedAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : Date.now() + this.defaultTtl,
    };

    this.cache.set(sessionId, cached);
    this.updateAccessOrder(sessionId);
  }

  /**
   * Check if session is cached
   */
  has(sessionId: string): boolean {
    const session = this.cache.get(sessionId);
    if (!session) return false;

    // Check expiration
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.cache.delete(sessionId);
      this.removeFromAccessOrder(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Prefetch a session by ID
   */
  async prefetch(
    sessionId: string,
    fetcher: () => Promise<CachedSession>
  ): Promise<CachedSession> {
    // Return cached if available
    const cached = this.get(sessionId);
    if (cached) return cached;

    // Fetch and cache
    const session = await fetcher();
    this.set(session);
    return session;
  }

  /**
   * Prefetch multiple sessions in parallel
   */
  async prefetchMany(
    sessionIds: string[],
    fetcher: (sessionId: string) => Promise<CachedSession>
  ): Promise<CachedSession[]> {
    const promises = sessionIds.map(async (sessionId) => {
      const cached = this.get(sessionId);
      if (cached) return cached;

      const session = await fetcher(sessionId);
      this.set(session);
      return session;
    });

    return Promise.all(promises);
  }

  /**
   * Preload all sessions (total preload strategy)
   */
  async preloadAll(
    manifest: { sessionId: string; route: string }[],
    fetcher: (sessionId: string) => Promise<CachedSession>,
    options: { onProgress?: (loaded: number, total: number) => void } = {}
  ): Promise<void> {
    const total = manifest.length;
    let loaded = 0;

    // Use batching to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < manifest.length; i += batchSize) {
      const batch = manifest.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ({ sessionId }) => {
          if (!this.has(sessionId)) {
            try {
              const session = await fetcher(sessionId);
              this.set(session, Infinity); // Never expire for total preload
            } catch {
              // Ignore failed fetches during preload
            }
          }
          loaded++;
          options.onProgress?.(loaded, total);
        })
      );

      // Small delay between batches to keep main thread responsive
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  /**
   * Invalidate a cached session
   */
  invalidate(sessionId: string): void {
    const session = this.cache.get(sessionId);
    if (session && this.onEvict) {
      this.onEvict(session);
    }
    this.cache.delete(sessionId);
    this.removeFromAccessOrder(sessionId);
  }

  /**
   * Clear all cached sessions
   */
  clear(): void {
    if (this.onEvict) {
      for (const session of this.cache.values()) {
        this.onEvict(session);
      }
    }
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let totalBytes = 0;
    for (const session of this.cache.values()) {
      totalBytes += JSON.stringify(session).length;
    }

    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      totalBytes,
      hitRate: total > 0 ? this.hits / total : 0,
      preloadedRoutes: this.cache.size,
    };
  }

  /**
   * Get all cached session IDs
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Export cache for service worker storage
   */
  export(): CachedSession[] {
    return Array.from(this.cache.values());
  }

  /**
   * Import cache from service worker storage
   */
  import(sessions: CachedSession[]): void {
    for (const session of sessions) {
      this.set(session);
    }
  }

  // LRU eviction
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruId = this.accessOrder.shift()!;
    const session = this.cache.get(lruId);

    if (session && this.onEvict) {
      this.onEvict(session);
    }

    this.cache.delete(lruId);
  }

  private updateAccessOrder(sessionId: string): void {
    this.removeFromAccessOrder(sessionId);
    this.accessOrder.push(sessionId);
  }

  private removeFromAccessOrder(sessionId: string): void {
    const index = this.accessOrder.indexOf(sessionId);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}

// Singleton instance for global access
let globalCache: NavigationCache | null = null;

export function getNavigationCache(): NavigationCache {
  if (!globalCache) {
    globalCache = new NavigationCache();
  }
  return globalCache;
}

export function setNavigationCache(cache: NavigationCache): void {
  globalCache = cache;
}

// =============================================================================
// SKELETON CACHE - Separate fast cache for skeleton-first rendering
// =============================================================================

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
export class SkeletonCache {
  private cache: Map<string, CachedSkeleton> = new Map();
  private maxSize: number;
  private defaultTtl: number;

  constructor(options: SkeletonCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 500;
    this.defaultTtl = options.defaultTtl ?? 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Get skeleton for a route
   */
  get(route: string): CachedSkeleton | null {
    const skeleton = this.cache.get(route);

    if (!skeleton) return null;

    // Check expiration
    if (skeleton.expiresAt && Date.now() > skeleton.expiresAt) {
      this.cache.delete(route);
      return null;
    }

    return skeleton;
  }

  /**
   * Store skeleton for a route
   */
  set(skeleton: CachedSkeleton, ttl?: number): void {
    // Evict oldest if at capacity
    if (!this.cache.has(skeleton.route) && this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(skeleton.route, {
      ...skeleton,
      cachedAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : Date.now() + this.defaultTtl,
    });
  }

  /**
   * Check if skeleton is cached
   */
  has(route: string): boolean {
    const skeleton = this.cache.get(route);
    if (!skeleton) return false;

    if (skeleton.expiresAt && Date.now() > skeleton.expiresAt) {
      this.cache.delete(route);
      return false;
    }

    return true;
  }

  /**
   * Invalidate skeleton for a route
   */
  invalidate(route: string): void {
    this.cache.delete(route);
  }

  /**
   * Clear all cached skeletons
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Export all skeletons for service worker
   */
  export(): CachedSkeleton[] {
    return Array.from(this.cache.values());
  }

  /**
   * Import skeletons from service worker
   */
  import(skeletons: CachedSkeleton[]): void {
    for (const skeleton of skeletons) {
      this.set(skeleton);
    }
  }
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
export function getWithSkeleton(
  route: string,
  skeletonCache: SkeletonCache,
  sessionCache: NavigationCache,
  contentFetcher: (route: string) => Promise<CachedSession>
): SkeletonWithContent {
  // Get skeleton immediately (sync)
  const skeleton = skeletonCache.get(route);

  // Start content fetch in parallel
  const content = (async () => {
    // Check session cache first
    const sessionId = routeToSessionId(route);
    const cached = sessionCache.get(sessionId);
    if (cached) return cached;

    // Fetch from network
    try {
      const session = await contentFetcher(route);
      sessionCache.set(session);
      return session;
    } catch {
      return null;
    }
  })();

  return { skeleton, content };
}

/**
 * Convert route to session ID
 * This is a simple implementation - real apps may have more complex mapping
 */
function routeToSessionId(route: string): string {
  // Remove leading/trailing slashes and replace slashes with dashes
  return route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
}

// Singleton skeleton cache
let globalSkeletonCache: SkeletonCache | null = null;

export function getSkeletonCache(): SkeletonCache {
  if (!globalSkeletonCache) {
    globalSkeletonCache = new SkeletonCache();
  }
  return globalSkeletonCache;
}

export function setSkeletonCache(cache: SkeletonCache): void {
  globalSkeletonCache = cache;
}
