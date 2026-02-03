/**
 * Speculation Manager
 *
 * Client-side prefetching and prerendering for instant navigation.
 * Uses the Speculation Rules API when available, with fallback to link prefetch.
 */

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Feature Detection
// ============================================================================

function supportsSpeculationRules(): boolean {
  if (typeof document === 'undefined') return false;
  return 'supports' in HTMLScriptElement && HTMLScriptElement.supports?.('speculationrules');
}

function supportsLinkPrefetch(): boolean {
  if (typeof document === 'undefined') return false;
  const link = document.createElement('link');
  return link.relList?.supports?.('prefetch') ?? false;
}

// ============================================================================
// Speculation Rules API
// ============================================================================

/**
 * Add speculation rules to the document
 */
function addSpeculationRules(
  prefetch: string[],
  prerender: string[]
): HTMLScriptElement | null {
  if (!supportsSpeculationRules()) return null;

  const rules: Record<string, Array<{ urls: string[] }>> = {};

  if (prefetch.length > 0) {
    rules.prefetch = [{ urls: prefetch }];
  }

  if (prerender.length > 0) {
    rules.prerender = [{ urls: prerender }];
  }

  if (Object.keys(rules).length === 0) return null;

  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.textContent = JSON.stringify(rules);
  document.head.appendChild(script);

  return script;
}

/**
 * Remove speculation rules script
 */
function removeSpeculationRules(script: HTMLScriptElement): void {
  script.remove();
}

// ============================================================================
// Link Prefetch Fallback
// ============================================================================

/**
 * Prefetch a path using <link rel="prefetch">
 */
function linkPrefetch(path: string): HTMLLinkElement | null {
  if (!supportsLinkPrefetch()) return null;

  // Check if already prefetched
  const existing = document.querySelector(`link[rel="prefetch"][href="${path}"]`);
  if (existing) return existing as HTMLLinkElement;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);

  return link;
}

/**
 * Remove prefetch link
 */
function removePrefetch(link: HTMLLinkElement): void {
  link.remove();
}

// ============================================================================
// Speculation Manager
// ============================================================================

export class SpeculationManager {
  private options: Required<SpeculationOptions>;
  private state: SpeculationState;
  private observers: Map<Element, IntersectionObserver> = new Map();
  private hoverTimers: Map<Element, ReturnType<typeof setTimeout>> = new Map();
  private speculationScript: HTMLScriptElement | null = null;
  private prefetchLinks: Map<string, HTMLLinkElement> = new Map();

  constructor(options: SpeculationOptions = {}) {
    this.options = {
      maxPrefetch: options.maxPrefetch ?? 5,
      maxPrerender: options.maxPrerender ?? 1,
      hoverDelay: options.hoverDelay ?? 100,
      prefetchOnVisible: options.prefetchOnVisible ?? true,
      visibilityThreshold: options.visibilityThreshold ?? 0.1,
      cacheDuration: options.cacheDuration ?? 5 * 60 * 1000, // 5 minutes
      onSpeculate: options.onSpeculate ?? (() => {}),
    };

    this.state = {
      prefetched: new Set(),
      prerendered: new Set(),
      pending: new Set(),
    };
  }

  /**
   * Initialize speculation from server hints
   */
  initFromHints(prefetch: string[] = [], prerender: string[] = []): void {
    // Filter out already handled paths
    const newPrefetch = prefetch
      .filter((p) => !this.state.prefetched.has(p) && !this.state.prerendered.has(p))
      .slice(0, this.options.maxPrefetch);

    const newPrerender = prerender
      .filter((p) => !this.state.prerendered.has(p))
      .slice(0, this.options.maxPrerender);

    // Try Speculation Rules API first
    if (supportsSpeculationRules()) {
      this.speculationScript = addSpeculationRules(newPrefetch, newPrerender);

      newPrefetch.forEach((p) => {
        this.state.prefetched.add(p);
        this.options.onSpeculate(p, 'prefetch');
      });

      newPrerender.forEach((p) => {
        this.state.prerendered.add(p);
        this.options.onSpeculate(p, 'prerender');
      });
    } else {
      // Fallback to link prefetch (no prerender fallback)
      newPrefetch.forEach((path) => {
        const link = linkPrefetch(path);
        if (link) {
          this.prefetchLinks.set(path, link);
          this.state.prefetched.add(path);
          this.options.onSpeculate(path, 'prefetch');
        }
      });
    }
  }

  /**
   * Prefetch a specific path
   */
  prefetch(path: string): boolean {
    if (this.state.prefetched.has(path) || this.state.prerendered.has(path)) {
      return false;
    }

    if (this.state.prefetched.size >= this.options.maxPrefetch) {
      return false;
    }

    if (supportsSpeculationRules()) {
      // Update speculation rules
      const allPrefetch = [...this.state.prefetched, path];
      const allPrerender = [...this.state.prerendered];

      if (this.speculationScript) {
        removeSpeculationRules(this.speculationScript);
      }

      this.speculationScript = addSpeculationRules(allPrefetch, allPrerender);
    } else {
      const link = linkPrefetch(path);
      if (link) {
        this.prefetchLinks.set(path, link);
      }
    }

    this.state.prefetched.add(path);
    this.options.onSpeculate(path, 'prefetch');
    return true;
  }

  /**
   * Watch an element for hover to prefetch its href
   */
  watchHover(element: HTMLAnchorElement): () => void {
    const path = new URL(element.href, window.location.href).pathname;

    const handleMouseEnter = () => {
      if (this.state.prefetched.has(path) || this.state.pending.has(path)) {
        return;
      }

      this.state.pending.add(path);

      const timer = setTimeout(() => {
        this.prefetch(path);
        this.state.pending.delete(path);
      }, this.options.hoverDelay);

      this.hoverTimers.set(element, timer);
    };

    const handleMouseLeave = () => {
      const timer = this.hoverTimers.get(element);
      if (timer) {
        clearTimeout(timer);
        this.hoverTimers.delete(element);
      }
      this.state.pending.delete(path);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      handleMouseLeave();
    };
  }

  /**
   * Watch an element for visibility to prefetch its href
   */
  watchVisible(element: HTMLAnchorElement): () => void {
    if (!this.options.prefetchOnVisible) {
      return () => {};
    }

    const path = new URL(element.href, window.location.href).pathname;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.prefetch(path);
            observer.disconnect();
            this.observers.delete(element);
          }
        });
      },
      { threshold: this.options.visibilityThreshold }
    );

    observer.observe(element);
    this.observers.set(element, observer);

    return () => {
      observer.disconnect();
      this.observers.delete(element);
    };
  }

  /**
   * Auto-watch all internal links on the page
   */
  watchAllLinks(): () => void {
    const links = document.querySelectorAll('a[href^="/"]');
    const cleanups: Array<() => void> = [];

    links.forEach((link) => {
      if (link instanceof HTMLAnchorElement) {
        cleanups.push(this.watchHover(link));
        cleanups.push(this.watchVisible(link));
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  /**
   * Clear all speculation state
   */
  clear(): void {
    // Clear speculation rules
    if (this.speculationScript) {
      removeSpeculationRules(this.speculationScript);
      this.speculationScript = null;
    }

    // Clear prefetch links
    this.prefetchLinks.forEach((link) => removePrefetch(link));
    this.prefetchLinks.clear();

    // Clear observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    // Clear timers
    this.hoverTimers.forEach((timer) => clearTimeout(timer));
    this.hoverTimers.clear();

    // Reset state
    this.state.prefetched.clear();
    this.state.prerendered.clear();
    this.state.pending.clear();
  }

  /**
   * Get current speculation state
   */
  getState(): Readonly<SpeculationState> {
    return {
      prefetched: new Set(this.state.prefetched),
      prerendered: new Set(this.state.prerendered),
      pending: new Set(this.state.pending),
    };
  }
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for speculation management
 * Usage: const speculation = useSpeculation({ maxPrefetch: 5 });
 */
export function createSpeculationHook(
  useState: <T>(initial: T) => [T, (v: T) => void],
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => void,
  useRef: <T>(initial: T) => { current: T }
) {
  return function useSpeculation(options: SpeculationOptions = {}) {
    const managerRef = useRef<SpeculationManager | null>(null);
    const [state, setState] = useState<SpeculationState>({
      prefetched: new Set(),
      prerendered: new Set(),
      pending: new Set(),
    });

    useEffect(() => {
      managerRef.current = new SpeculationManager({
        ...options,
        onSpeculate: (path, type) => {
          options.onSpeculate?.(path, type);
          setState(managerRef.current!.getState());
        },
      });

      // Auto-watch all links
      const cleanup = managerRef.current.watchAllLinks();

      return () => {
        cleanup();
        managerRef.current?.clear();
      };
    }, []);

    return {
      state,
      prefetch: (path: string) => managerRef.current?.prefetch(path),
      initFromHints: (prefetch: string[], prerender: string[]) =>
        managerRef.current?.initFromHints(prefetch, prerender),
      clear: () => managerRef.current?.clear(),
    };
  };
}

// ============================================================================
// Auto-init for non-React usage
// ============================================================================

/**
 * Auto-initialize speculation from window.__AEON_SPECULATION__ hints
 */
export function autoInitSpeculation(): SpeculationManager | null {
  if (typeof window === 'undefined') return null;

  // @ts-expect-error - Global hint injection
  const hints = window.__AEON_SPECULATION__ as { prefetch?: string[]; prerender?: string[] } | undefined;

  const manager = new SpeculationManager();

  if (hints) {
    manager.initFromHints(hints.prefetch || [], hints.prerender || []);
  }

  // Watch all links
  manager.watchAllLinks();

  return manager;
}

// ============================================================================
// Exports
// ============================================================================

export {
  supportsSpeculationRules,
  supportsLinkPrefetch,
  addSpeculationRules,
  linkPrefetch,
};
