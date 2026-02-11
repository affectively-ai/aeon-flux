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

import { getPredictor, type PredictedRoute } from './predictor';

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

const DEFAULT_CONFIG: SpeculativeRendererConfig = {
  maxCachedPages: 5,
  maxCacheSize: 5 * 1024 * 1024, // 5MB
  staleTTL: 5 * 60 * 1000, // 5 minutes
  minConfidence: 0.3,
  intersectionRootMargin: '200px',
  useSpeculationRules: true,
  prerenderOnHover: true,
  hoverDelay: 100,
  sessionBaseUrl: '/_aeon/session',
};

export class SpeculativeRenderer {
  private config: SpeculativeRendererConfig;
  private cache = new Map<string, PreRenderedPage>();
  private currentCacheSize = 0;
  private observer: IntersectionObserver | null = null;
  private hoverTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private initialized = false;

  constructor(config: Partial<SpeculativeRendererConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the speculative renderer
   * Call this after the page has loaded
   */
  init(): void {
    if (this.initialized) return;
    if (typeof window === 'undefined') return;

    this.initialized = true;

    // Setup IntersectionObserver for visible links
    this.setupIntersectionObserver();

    // Setup hover listeners if enabled
    if (this.config.prerenderOnHover) {
      this.setupHoverListeners();
    }

    // Inject Speculation Rules if supported
    if (this.config.useSpeculationRules) {
      this.injectSpeculationRules();
    }

    // Setup navigation interception
    this.setupNavigationInterception();

    // Start prediction-based pre-rendering
    this.startPredictivePrerendering();

    console.log('[aeon:speculation] Initialized');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    for (const timeout of this.hoverTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.hoverTimeouts.clear();

    this.cache.clear();
    this.currentCacheSize = 0;
    this.initialized = false;

    console.log('[aeon:speculation] Destroyed');
  }

  /**
   * Pre-render a specific route
   */
  async prerender(route: string, confidence = 1): Promise<boolean> {
    // Skip if already cached and not stale
    const existing = this.cache.get(route);
    if (
      existing &&
      !existing.stale &&
      Date.now() - existing.prefetchedAt < this.config.staleTTL
    ) {
      return true;
    }

    // Skip if current route
    if (typeof window !== 'undefined' && window.location.pathname === route) {
      return false;
    }

    try {
      console.log(`[aeon:speculation] Pre-rendering: ${route}`);

      // Fetch the pre-rendered HTML from the server
      const response = await fetch(`${route}?_aeon_prerender=1`, {
        headers: {
          'X-Aeon-Prerender': '1',
          Accept: 'text/html',
        },
      });

      if (!response.ok) {
        console.warn(
          `[aeon:speculation] Failed to fetch: ${route}`,
          response.status,
        );
        return false;
      }

      const html = await response.text();
      const size = html.length;

      // Make room if needed
      this.evictIfNeeded(size);

      // Store in cache
      const page: PreRenderedPage = {
        route,
        html,
        prefetchedAt: Date.now(),
        confidence,
        stale: false,
        size,
      };

      this.cache.set(route, page);
      this.currentCacheSize += size;

      console.log(
        `[aeon:speculation] Cached: ${route} (${(size / 1024).toFixed(1)}KB)`,
      );
      return true;
    } catch (err) {
      console.warn(`[aeon:speculation] Error pre-rendering: ${route}`, err);
      return false;
    }
  }

  /**
   * Navigate to a route using pre-rendered content if available
   * Returns true if handled, false if fallback to normal navigation
   */
  async navigate(route: string): Promise<boolean> {
    const cached = this.cache.get(route);

    if (
      cached &&
      !cached.stale &&
      Date.now() - cached.prefetchedAt < this.config.staleTTL
    ) {
      console.log(`[aeon:speculation] Instant nav to: ${route}`);

      // Instant navigation - replace document content
      document.open();
      document.write(cached.html);
      document.close();

      // Update URL
      history.pushState({ aeonSpeculative: true }, '', route);

      // Re-initialize for new page
      this.reinitialize();

      return true;
    }

    return false;
  }

  /**
   * Invalidate cached pages
   */
  invalidate(routes?: string[]): void {
    if (routes) {
      for (const route of routes) {
        const cached = this.cache.get(route);
        if (cached) {
          cached.stale = true;
        }
      }
    } else {
      // Mark all as stale
      for (const page of this.cache.values()) {
        page.stale = true;
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cachedPages: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      cachedPages: this.cache.size,
      cacheSize: this.currentCacheSize,
      cacheHitRate: 0, // Would need to track hits/misses
    };
  }

  // ---------- Private Methods ----------

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => this.onLinksVisible(entries),
      { rootMargin: this.config.intersectionRootMargin },
    );

    // Observe all internal links
    this.observeLinks();
  }

  private observeLinks(): void {
    if (!this.observer) return;

    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      this.observer!.observe(link);
    });
  }

  private async onLinksVisible(
    entries: IntersectionObserverEntry[],
  ): Promise<void> {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const link = entry.target as HTMLAnchorElement;
      const route = new URL(link.href, window.location.origin).pathname;

      // Stop observing this link
      this.observer?.unobserve(link);

      // Pre-render with visibility confidence
      await this.prerender(route, 0.7);
    }
  }

  private setupHoverListeners(): void {
    document.addEventListener('mouseenter', (e) => this.onLinkHover(e), true);
    document.addEventListener('mouseleave', (e) => this.onLinkLeave(e), true);
  }

  private onLinkHover(e: Event): void {
    const link = (e.target as Element).closest(
      'a[href^="/"]',
    ) as HTMLAnchorElement | null;
    if (!link) return;

    const route = new URL(link.href, window.location.origin).pathname;

    // Set timeout to pre-render on sustained hover
    const timeout = setTimeout(() => {
      this.prerender(route, 0.9);
    }, this.config.hoverDelay);

    this.hoverTimeouts.set(route, timeout);
  }

  private onLinkLeave(e: Event): void {
    const link = (e.target as Element).closest(
      'a[href^="/"]',
    ) as HTMLAnchorElement | null;
    if (!link) return;

    const route = new URL(link.href, window.location.origin).pathname;

    // Clear pending timeout
    const timeout = this.hoverTimeouts.get(route);
    if (timeout) {
      clearTimeout(timeout);
      this.hoverTimeouts.delete(route);
    }
  }

  private injectSpeculationRules(): void {
    // Check if browser supports Speculation Rules
    if (
      !(
        'supports' in HTMLScriptElement &&
        HTMLScriptElement.supports('speculationrules')
      )
    ) {
      console.log(
        '[aeon:speculation] Browser does not support Speculation Rules API',
      );
      return;
    }

    const rules = {
      prerender: [
        {
          source: 'document',
          where: {
            href_matches: '/*',
            not: {
              or: [
                { href_matches: '/api/*' },
                { href_matches: '/_aeon/*' },
                { selector_matches: '[data-aeon-no-prerender]' },
              ],
            },
          },
          eagerness: 'moderate',
        },
      ],
    };

    const script = document.createElement('script');
    script.type = 'speculationrules';
    script.textContent = JSON.stringify(rules);
    document.head.appendChild(script);

    console.log('[aeon:speculation] Speculation Rules injected');
  }

  private setupNavigationInterception(): void {
    // Intercept link clicks
    document.addEventListener('click', async (e) => {
      const link = (e.target as Element).closest(
        'a[href^="/"]',
      ) as HTMLAnchorElement | null;
      if (!link) return;

      // Skip if modifier keys pressed
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const route = new URL(link.href, window.location.origin).pathname;

      // Try speculative navigation
      if (await this.navigate(route)) {
        e.preventDefault();
      }
    });

    // Handle popstate for back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state?.aeonSpeculative) {
        // This was a speculative navigation, handle accordingly
        const route = window.location.pathname;
        const cached = this.cache.get(route);
        if (cached && !cached.stale) {
          document.open();
          document.write(cached.html);
          document.close();
          this.reinitialize();
        }
      }
    });
  }

  private async startPredictivePrerendering(): Promise<void> {
    const predictor = getPredictor();
    const currentRoute = window.location.pathname;

    // Get predictions
    const predictions = predictor.predict(currentRoute);

    // Pre-render high-confidence predictions
    for (const prediction of predictions) {
      if (prediction.probability >= this.config.minConfidence) {
        // Don't await - fire and forget
        this.prerender(prediction.route, prediction.probability);
      }
    }
  }

  private reinitialize(): void {
    // Re-observe links after DOM replacement
    setTimeout(() => {
      this.observeLinks();
      this.startPredictivePrerendering();
    }, 0);
  }

  private evictIfNeeded(incomingSize: number): void {
    // Check if we need to evict
    while (
      (this.cache.size >= this.config.maxCachedPages ||
        this.currentCacheSize + incomingSize > this.config.maxCacheSize) &&
      this.cache.size > 0
    ) {
      // Find oldest or lowest confidence page
      let toEvict: string | null = null;
      let lowestScore = Infinity;

      for (const [route, page] of this.cache) {
        // Score based on age and confidence
        const age = Date.now() - page.prefetchedAt;
        const score = page.confidence / (1 + age / 60000); // Decay over time

        if (page.stale || score < lowestScore) {
          lowestScore = score;
          toEvict = route;
        }
      }

      if (toEvict) {
        const page = this.cache.get(toEvict)!;
        this.cache.delete(toEvict);
        this.currentCacheSize -= page.size;
        console.log(`[aeon:speculation] Evicted: ${toEvict}`);
      } else {
        break;
      }
    }
  }
}

// Singleton instance
let globalSpeculativeRenderer: SpeculativeRenderer | null = null;

export function getSpeculativeRenderer(): SpeculativeRenderer {
  if (!globalSpeculativeRenderer) {
    globalSpeculativeRenderer = new SpeculativeRenderer();
  }
  return globalSpeculativeRenderer;
}

export function setSpeculativeRenderer(renderer: SpeculativeRenderer): void {
  globalSpeculativeRenderer = renderer;
}

/**
 * Initialize speculative rendering (call on page load)
 */
export function initSpeculativeRendering(
  config?: Partial<SpeculativeRendererConfig>,
): SpeculativeRenderer {
  const renderer = new SpeculativeRenderer(config);
  setSpeculativeRenderer(renderer);
  renderer.init();
  return renderer;
}
