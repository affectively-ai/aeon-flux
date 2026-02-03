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
