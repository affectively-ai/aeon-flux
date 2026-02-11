import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  NavigationCache,
  getNavigationCache,
  setNavigationCache,
  type CachedSession,
} from './cache';
import { AeonNavigationEngine, getNavigator, setNavigator } from './navigation';
import {
  NavigationPredictor,
  getPredictor,
  setPredictor,
  type NavigationRecord,
} from './predictor';
import { AeonRouter } from './router';

describe('NavigationCache', () => {
  let cache: NavigationCache;

  beforeEach(() => {
    cache = new NavigationCache({ maxSize: 10, defaultTtl: 1000 });
  });

  const createSession = (id: string): CachedSession => ({
    sessionId: id,
    route: `/${id}`,
    tree: { type: 'div', children: [] },
    data: { title: id },
    schemaVersion: '1.0.0',
    cachedAt: Date.now(),
  });

  test('stores and retrieves sessions', () => {
    const session = createSession('test');
    cache.set(session);
    const retrieved = cache.get('test');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.sessionId).toBe('test');
  });

  test('returns null for non-existent sessions', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('tracks hit/miss rate', () => {
    const session = createSession('test');
    cache.set(session);

    cache.get('test'); // Hit
    cache.get('test'); // Hit
    cache.get('nonexistent'); // Miss

    const stats = cache.getStats();
    expect(stats.hitRate).toBeCloseTo(0.67, 1);
  });

  test('evicts LRU items when at capacity', () => {
    // Fill cache to capacity
    for (let i = 0; i < 10; i++) {
      cache.set(createSession(`session-${i}`));
    }

    // Access some sessions to update LRU order
    cache.get('session-5');
    cache.get('session-9');

    // Add new session, should evict oldest (session-0)
    cache.set(createSession('new-session'));

    expect(cache.get('session-0')).toBeNull();
    expect(cache.get('session-5')).not.toBeNull();
    expect(cache.get('new-session')).not.toBeNull();
  });

  test('expires sessions after TTL', async () => {
    const cache = new NavigationCache({ defaultTtl: 50 });
    cache.set(createSession('expiring'));

    expect(cache.get('expiring')).not.toBeNull();

    // Wait for expiration
    await new Promise((r) => setTimeout(r, 60));

    expect(cache.get('expiring')).toBeNull();
  });

  test('prefetches sessions with fetcher', async () => {
    const fetcher = mock(() => Promise.resolve(createSession('fetched')));

    const result = await cache.prefetch('fetched', fetcher);

    expect(result.sessionId).toBe('fetched');
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await cache.prefetch('fetched', fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('prefetches many sessions in parallel', async () => {
    const fetcher = mock((id: string) => Promise.resolve(createSession(id)));

    const results = await cache.prefetchMany(['a', 'b', 'c'], fetcher);

    expect(results).toHaveLength(3);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  test('preloads all sessions with progress', async () => {
    const manifest = [
      { sessionId: 's1', route: '/s1' },
      { sessionId: 's2', route: '/s2' },
      { sessionId: 's3', route: '/s3' },
    ];

    const fetcher = mock((id: string) => Promise.resolve(createSession(id)));

    const progress: number[] = [];
    await cache.preloadAll(manifest, fetcher, {
      onProgress: (loaded, total) => progress.push(loaded),
    });

    expect(progress).toContain(3); // Final count
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  test('invalidates specific sessions', () => {
    cache.set(createSession('test'));
    expect(cache.has('test')).toBe(true);

    cache.invalidate('test');
    expect(cache.has('test')).toBe(false);
  });

  test('clears all sessions', () => {
    cache.set(createSession('a'));
    cache.set(createSession('b'));

    cache.clear();

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });

  test('exports and imports sessions', () => {
    cache.set(createSession('a'));
    cache.set(createSession('b'));

    const exported = cache.export();
    expect(exported).toHaveLength(2);

    const newCache = new NavigationCache();
    newCache.import(exported);

    expect(newCache.get('a')).not.toBeNull();
    expect(newCache.get('b')).not.toBeNull();
  });
});

describe('NavigationPredictor', () => {
  let predictor: NavigationPredictor;

  beforeEach(() => {
    predictor = new NavigationPredictor();
  });

  const record = (from: string, to: string): NavigationRecord => ({
    from,
    to,
    timestamp: Date.now(),
    duration: 5000,
    source: 'click',
  });

  test('records navigation and predicts based on history', () => {
    // Build history: / -> /about (3x), / -> /blog (1x)
    predictor.record(record('/', '/about'));
    predictor.record(record('/', '/about'));
    predictor.record(record('/', '/about'));
    predictor.record(record('/', '/blog'));

    const predictions = predictor.predict('/');

    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].route).toBe('/about'); // Higher probability
    expect(predictions[0].probability).toBeGreaterThan(0.5);
  });

  test('applies decay to old records', () => {
    predictor.record(record('/', '/old'));

    // Record many new navigations to trigger decay
    for (let i = 0; i < 100; i++) {
      predictor.record(record('/other', '/new'));
    }

    const predictions = predictor.predict('/');
    // Old prediction should have decayed significantly
    const oldPred = predictions.find((p) => p.route === '/old');
    expect(oldPred?.probability ?? 0).toBeLessThan(0.5);
  });

  test('returns empty predictions for unknown routes', () => {
    const predictions = predictor.predict('/unknown');
    expect(predictions).toEqual([]);
  });

  test('limits predictions to maxPredictions', () => {
    const predictor = new NavigationPredictor({ maxPredictions: 2 });

    predictor.record(record('/', '/a'));
    predictor.record(record('/', '/b'));
    predictor.record(record('/', '/c'));
    predictor.record(record('/', '/d'));

    const predictions = predictor.predict('/');
    expect(predictions.length).toBeLessThanOrEqual(2);
  });

  test('filters out low probability predictions', () => {
    const predictor = new NavigationPredictor({ minProbability: 0.3 });

    // Create very uneven distribution
    for (let i = 0; i < 100; i++) {
      predictor.record(record('/', '/main'));
    }
    predictor.record(record('/', '/rare'));

    const predictions = predictor.predict('/');

    // /rare should be filtered out due to low probability
    const rarePred = predictions.find((p) => p.route === '/rare');
    expect(rarePred).toBeUndefined();
  });

  test('exports and imports data', () => {
    predictor.record(record('/', '/about'));
    predictor.record(record('/', '/blog'));

    const exported = predictor.export();

    const newPredictor = new NavigationPredictor();
    newPredictor.import(exported);

    const predictions = newPredictor.predict('/');
    expect(predictions.length).toBeGreaterThan(0);
  });

  test('provides statistics', () => {
    predictor.record(record('/', '/about'));
    predictor.record(record('/', '/blog'));
    predictor.record(record('/about', '/contact'));

    const stats = predictor.getStats();

    expect(stats.totalRecords).toBe(3);
    expect(stats.uniqueRoutes).toBe(2); // / and /about
    expect(stats.transitionPairs).toBe(3);
  });

  test('clears all data', () => {
    predictor.record(record('/', '/about'));
    predictor.clear();

    expect(predictor.predict('/').length).toBe(0);
    expect(predictor.getStats().totalRecords).toBe(0);
  });

  test('merges community patterns', () => {
    const patterns = new Map([
      [
        '/',
        {
          route: '/',
          popularity: 100,
          avgTimeSpent: 5000,
          nextRoutes: [
            { route: '/popular', count: 80 },
            { route: '/other', count: 20 },
          ],
        },
      ],
    ]);

    predictor.updateCommunityPatterns(patterns);

    const predictions = predictor.predict('/');

    // Community prediction should be included
    const popularPred = predictions.find((p) => p.route === '/popular');
    expect(popularPred).toBeDefined();
  });
});

describe('AeonNavigationEngine', () => {
  let navigator: AeonNavigationEngine;
  let mockRouter: AeonRouter;

  beforeEach(() => {
    mockRouter = new AeonRouter({ routesDir: './test-pages' });

    navigator = new AeonNavigationEngine({
      router: mockRouter,
      initialRoute: '/',
      sessionFetcher: async (id) => ({
        sessionId: id,
        route: `/${id}`,
        tree: { type: 'div' },
        data: {},
        schemaVersion: '1.0.0',
        cachedAt: Date.now(),
      }),
    });
  });

  test('initializes with current route', () => {
    const state = navigator.getState();
    expect(state.current).toBe('/');
    expect(state.isNavigating).toBe(false);
  });

  test('prefetches routes', async () => {
    // Mock the router's match method to return a valid match
    const originalMatch = mockRouter.match.bind(mockRouter);
    mockRouter.match = (path: string) => {
      if (path === '/about') {
        return {
          sessionId: 'about',
          componentId: 'About',
          pattern: '/about',
          params: {},
        };
      }
      return originalMatch(path);
    };

    await navigator.prefetch('/about');

    expect(navigator.isPreloaded('/about')).toBe(true);
  });

  test('subscribes to navigation changes', async () => {
    const states: any[] = [];
    const unsubscribe = navigator.subscribe((state) => states.push(state));

    // Trigger a state change
    (navigator as any).state.isNavigating = true;
    (navigator as any).notifyListeners();

    expect(states.length).toBeGreaterThan(0);
    unsubscribe();
  });

  test('tracks navigation history', () => {
    const state = navigator.getState();
    expect(state.history).toContain('/');
  });

  test('provides cache statistics', () => {
    const stats = navigator.getCacheStats();

    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('hitRate');
    expect(stats).toHaveProperty('totalBytes');
  });

  test('predicts next routes based on history', () => {
    // Record some navigation history
    (navigator as any).recordNavigation('/', '/about');
    (navigator as any).recordNavigation('/', '/about');
    (navigator as any).recordNavigation('/', '/blog');

    const predictions = navigator.predict('/');

    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].route).toBe('/about');
  });
});

describe('Global singletons', () => {
  test('getNavigationCache returns singleton', () => {
    const cache1 = getNavigationCache();
    const cache2 = getNavigationCache();
    expect(cache1).toBe(cache2);
  });

  test('setNavigationCache replaces singleton', () => {
    const originalCache = getNavigationCache();
    const newCache = new NavigationCache();

    setNavigationCache(newCache);
    expect(getNavigationCache()).toBe(newCache);

    // Restore original
    setNavigationCache(originalCache);
  });

  test('getPredictor returns singleton', () => {
    const pred1 = getPredictor();
    const pred2 = getPredictor();
    expect(pred1).toBe(pred2);
  });

  test('setPredictor replaces singleton', () => {
    const originalPredictor = getPredictor();
    const newPredictor = new NavigationPredictor();

    setPredictor(newPredictor);
    expect(getPredictor()).toBe(newPredictor);

    // Restore original
    setPredictor(originalPredictor);
  });

  test('getNavigator returns singleton', () => {
    const nav1 = getNavigator();
    const nav2 = getNavigator();
    expect(nav1).toBe(nav2);
  });
});
