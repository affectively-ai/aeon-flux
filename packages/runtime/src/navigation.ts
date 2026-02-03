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

import { AeonRouter, type RouteMatch } from './router';
import { NavigationCache, type CachedSession, getNavigationCache } from './cache';

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
  users?: { userId: string; name?: string }[];
}

export interface PredictedRoute {
  route: string;
  probability: number;
  reason: 'history' | 'hover' | 'visibility' | 'community';
}

type NavigationListener = (state: NavigationState) => void;
type PresenceListener = (route: string, presence: PresenceInfo) => void;

export class AeonNavigationEngine {
  private router: AeonRouter;
  private cache: NavigationCache;
  private state: NavigationState;
  private navigationListeners: Set<NavigationListener> = new Set();
  private presenceListeners: Set<PresenceListener> = new Set();
  private presenceCache: Map<string, PresenceInfo> = new Map();
  private navigationHistory: Map<string, Map<string, number>> = new Map();
  private pendingPrefetches: Map<string, Promise<CachedSession>> = new Map();
  private observer: IntersectionObserver | null = null;
  private sessionFetcher?: (sessionId: string) => Promise<CachedSession>;
  private presenceFetcher?: (route: string) => Promise<PresenceInfo>;

  constructor(options: {
    router?: AeonRouter;
    cache?: NavigationCache;
    initialRoute?: string;
    sessionFetcher?: (sessionId: string) => Promise<CachedSession>;
    presenceFetcher?: (route: string) => Promise<PresenceInfo>;
  } = {}) {
    this.router = options.router ?? new AeonRouter({ routesDir: './pages' });
    this.cache = options.cache ?? getNavigationCache();
    this.sessionFetcher = options.sessionFetcher;
    this.presenceFetcher = options.presenceFetcher;

    this.state = {
      current: options.initialRoute ?? '/',
      previous: null,
      history: [options.initialRoute ?? '/'],
      isNavigating: false,
    };
  }

  /**
   * Navigate to a route with optional view transition
   */
  async navigate(href: string, options: NavigationOptions = {}): Promise<void> {
    const { transition = 'fade', replace = false } = options;

    // Match route
    const match = this.router.match(href);
    if (!match) {
      throw new Error(`Route not found: ${href}`);
    }

    // Update state
    const previousRoute = this.state.current;
    this.state.isNavigating = true;
    this.notifyListeners();

    try {
      // Get session (from cache or fetch)
      const session = await this.getSession(match.sessionId);

      // Perform navigation with view transition
      if (transition !== 'none' && typeof document !== 'undefined' && 'startViewTransition' in document) {
        await (document as any).startViewTransition(() => {
          this.updateDOM(session, match);
        }).finished;
      } else {
        this.updateDOM(session, match);
      }

      // Update state
      this.state.previous = previousRoute;
      this.state.current = href;
      if (!replace) {
        this.state.history.push(href);
      } else {
        this.state.history[this.state.history.length - 1] = href;
      }

      // Update browser history
      if (typeof window !== 'undefined') {
        if (replace) {
          window.history.replaceState({ route: href }, '', href);
        } else {
          window.history.pushState({ route: href }, '', href);
        }
      }

      // Record for prediction
      this.recordNavigation(previousRoute, href);

      // Prefetch predicted next routes
      const predictions = this.predict(href);
      for (const prediction of predictions.slice(0, 3)) {
        if (prediction.probability > 0.3) {
          this.prefetch(prediction.route);
        }
      }
    } finally {
      this.state.isNavigating = false;
      this.notifyListeners();
    }
  }

  /**
   * Prefetch a route
   */
  async prefetch(href: string, options: PrefetchOptions = {}): Promise<void> {
    const { data = true, presence = false, priority = 'normal' } = options;

    const match = this.router.match(href);
    if (!match) return;

    // Avoid duplicate prefetches
    const cacheKey = `${match.sessionId}:${data}:${presence}`;
    if (this.pendingPrefetches.has(cacheKey)) {
      return;
    }

    const prefetchPromise = (async () => {
      const promises: Promise<unknown>[] = [];

      // Prefetch session data
      if (data && this.sessionFetcher) {
        promises.push(
          this.cache.prefetch(match.sessionId, () =>
            this.sessionFetcher!(match.sessionId)
          )
        );
      }

      // Prefetch presence
      if (presence && this.presenceFetcher) {
        promises.push(this.prefetchPresence(href));
      }

      await Promise.all(promises);
      return this.cache.get(match.sessionId)!;
    })();

    this.pendingPrefetches.set(cacheKey, prefetchPromise);

    try {
      await prefetchPromise;
    } finally {
      this.pendingPrefetches.delete(cacheKey);
    }
  }

  /**
   * Prefetch presence for a route
   */
  async prefetchPresence(route: string): Promise<PresenceInfo | null> {
    if (!this.presenceFetcher) return null;

    try {
      const presence = await this.presenceFetcher(route);
      this.presenceCache.set(route, presence);
      this.notifyPresenceListeners(route, presence);
      return presence;
    } catch {
      return null;
    }
  }

  /**
   * Check if a route is preloaded
   */
  isPreloaded(href: string): boolean {
    const match = this.router.match(href);
    if (!match) return false;
    return this.cache.has(match.sessionId);
  }

  /**
   * Get cached presence for a route
   */
  getPresence(route: string): PresenceInfo | null {
    return this.presenceCache.get(route) ?? null;
  }

  /**
   * Observe links for visibility-based prefetch
   */
  observeLinks(container: Element): () => void {
    if (typeof IntersectionObserver === 'undefined') {
      return () => {};
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            if (href && href.startsWith('/')) {
              this.prefetch(href);
            }
          }
        }
      },
      { rootMargin: '100px' }
    );

    const links = container.querySelectorAll('a[href^="/"]');
    links.forEach((link) => this.observer!.observe(link));

    return () => {
      this.observer?.disconnect();
      this.observer = null;
    };
  }

  /**
   * Predict next navigation destinations
   */
  predict(currentRoute: string): PredictedRoute[] {
    const predictions: PredictedRoute[] = [];

    // From navigation history
    const fromHistory = this.navigationHistory.get(currentRoute);
    if (fromHistory) {
      const total = Array.from(fromHistory.values()).reduce((a, b) => a + b, 0);
      for (const [route, count] of fromHistory) {
        predictions.push({
          route,
          probability: count / total,
          reason: 'history',
        });
      }
    }

    // Sort by probability
    predictions.sort((a, b) => b.probability - a.probability);

    return predictions;
  }

  /**
   * Go back in navigation history
   */
  async back(): Promise<void> {
    if (this.state.history.length <= 1) return;

    this.state.history.pop();
    const previousRoute = this.state.history[this.state.history.length - 1];

    await this.navigate(previousRoute, { replace: true });
  }

  /**
   * Get current navigation state
   */
  getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Subscribe to navigation changes
   */
  subscribe(listener: NavigationListener): () => void {
    this.navigationListeners.add(listener);
    return () => this.navigationListeners.delete(listener);
  }

  /**
   * Subscribe to presence changes for a route
   */
  subscribePresence(listener: PresenceListener): () => void {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }

  /**
   * Preload all routes (total preload strategy)
   */
  async preloadAll(
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    if (!this.sessionFetcher) {
      throw new Error('sessionFetcher required for preloadAll');
    }

    const routes = this.router.getRoutes();
    const manifest = routes.map((r) => ({
      sessionId: this.router.match(r.pattern)?.sessionId ?? r.pattern,
      route: r.pattern,
    }));

    await this.cache.preloadAll(manifest, this.sessionFetcher, { onProgress });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  // Private methods

  private async getSession(sessionId: string): Promise<CachedSession> {
    const cached = this.cache.get(sessionId);
    if (cached) return cached;

    if (!this.sessionFetcher) {
      throw new Error('Session not cached and no fetcher provided');
    }

    const session = await this.sessionFetcher(sessionId);
    this.cache.set(session);
    return session;
  }

  private updateDOM(session: CachedSession, match: RouteMatch): void {
    // This is a placeholder - actual implementation would render the page
    // In practice, this integrates with React/the rendering layer
    if (typeof document !== 'undefined') {
      // Dispatch custom event for React integration
      const event = new CustomEvent('aeon:navigate', {
        detail: { session, match },
      });
      document.dispatchEvent(event);
    }
  }

  private recordNavigation(from: string, to: string): void {
    if (!this.navigationHistory.has(from)) {
      this.navigationHistory.set(from, new Map());
    }
    const fromMap = this.navigationHistory.get(from)!;
    fromMap.set(to, (fromMap.get(to) ?? 0) + 1);
  }

  private notifyListeners(): void {
    for (const listener of this.navigationListeners) {
      listener(this.getState());
    }
  }

  private notifyPresenceListeners(route: string, presence: PresenceInfo): void {
    for (const listener of this.presenceListeners) {
      listener(route, presence);
    }
  }
}

// Singleton instance
let globalNavigator: AeonNavigationEngine | null = null;

export function getNavigator(): AeonNavigationEngine {
  if (!globalNavigator) {
    globalNavigator = new AeonNavigationEngine();
  }
  return globalNavigator;
}

export function setNavigator(navigator: AeonNavigationEngine): void {
  globalNavigator = navigator;
}

// Browser history integration
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    const navigator = getNavigator();
    const route = event.state?.route ?? window.location.pathname;
    navigator.navigate(route, { replace: true });
  });
}
