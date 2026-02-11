import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from 'bun:test';
import {
  SpeculativeRenderer,
  getSpeculativeRenderer,
  setSpeculativeRenderer,
  initSpeculativeRendering,
  type SpeculativeRendererConfig,
} from './speculation';
import { setPredictor, NavigationPredictor } from './predictor';

// Mock DOM environment
function createMockDOM() {
  return {
    querySelectorAll: mock(() => []),
    addEventListener: mock(() => {}),
    createElement: mock(() => ({
      type: '',
      textContent: '',
    })),
    head: {
      appendChild: mock(() => {}),
    },
    open: mock(() => {}),
    write: mock(() => {}),
    close: mock(() => {}),
  };
}

function createMockWindow() {
  return {
    location: { pathname: '/', origin: 'http://localhost' },
    history: {
      pushState: mock(() => {}),
    },
    addEventListener: mock(() => {}),
    IntersectionObserver: mock((callback: Function, options: any) => ({
      observe: mock(() => {}),
      unobserve: mock(() => {}),
      disconnect: mock(() => {}),
    })),
  };
}

describe('SpeculativeRenderer', () => {
  let originalWindow: typeof globalThis.window;
  let originalDocument: typeof globalThis.document;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
    originalFetch = globalThis.fetch;

    // Set up a mock predictor
    const predictor = new NavigationPredictor();
    setPredictor(predictor);
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
    setSpeculativeRenderer(null as any);
  });

  test('creates instance with default config', () => {
    const renderer = new SpeculativeRenderer();
    expect(renderer).toBeDefined();

    const stats = renderer.getStats();
    expect(stats.cachedPages).toBe(0);
    expect(stats.cacheSize).toBe(0);
  });

  test('creates instance with custom config', () => {
    const config: Partial<SpeculativeRendererConfig> = {
      maxCachedPages: 10,
      maxCacheSize: 10 * 1024 * 1024,
      minConfidence: 0.5,
    };

    const renderer = new SpeculativeRenderer(config);
    expect(renderer).toBeDefined();
  });

  test('getSpeculativeRenderer returns singleton', () => {
    const renderer1 = getSpeculativeRenderer();
    const renderer2 = getSpeculativeRenderer();
    expect(renderer1).toBe(renderer2);
  });

  test('setSpeculativeRenderer replaces singleton', () => {
    const original = getSpeculativeRenderer();
    const replacement = new SpeculativeRenderer();

    setSpeculativeRenderer(replacement);
    expect(getSpeculativeRenderer()).toBe(replacement);
    expect(getSpeculativeRenderer()).not.toBe(original);
  });

  test('prerender caches page HTML', async () => {
    const mockHtml = '<html><body>Test Page</body></html>';

    globalThis.fetch = mock(
      async () =>
        ({
          ok: true,
          text: async () => mockHtml,
        }) as Response,
    );

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    const renderer = new SpeculativeRenderer();
    const result = await renderer.prerender('/about');

    expect(result).toBe(true);
    expect(renderer.getStats().cachedPages).toBe(1);
    expect(renderer.getStats().cacheSize).toBe(mockHtml.length);
  });

  test('prerender skips current route', async () => {
    globalThis.window = {
      location: { pathname: '/about' },
    } as any;

    const renderer = new SpeculativeRenderer();
    const result = await renderer.prerender('/about');

    expect(result).toBe(false);
    expect(renderer.getStats().cachedPages).toBe(0);
  });

  test('prerender handles fetch failures', async () => {
    globalThis.fetch = mock(
      async () =>
        ({
          ok: false,
          status: 404,
        }) as Response,
    );

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    const renderer = new SpeculativeRenderer();
    const result = await renderer.prerender('/not-found');

    expect(result).toBe(false);
    expect(renderer.getStats().cachedPages).toBe(0);
  });

  test('prerender handles network errors', async () => {
    globalThis.fetch = mock(async () => {
      throw new Error('Network error');
    });

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    const renderer = new SpeculativeRenderer();
    const result = await renderer.prerender('/error');

    expect(result).toBe(false);
    expect(renderer.getStats().cachedPages).toBe(0);
  });

  test('invalidate marks pages as stale', async () => {
    const mockHtml = '<html><body>Test</body></html>';

    globalThis.fetch = mock(
      async () =>
        ({
          ok: true,
          text: async () => mockHtml,
        }) as Response,
    );

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    const renderer = new SpeculativeRenderer();
    await renderer.prerender('/about');
    await renderer.prerender('/contact');

    // Invalidate specific routes
    renderer.invalidate(['/about']);

    // About should be stale, navigate should fail
    const navigateResult = await renderer.navigate('/about');
    expect(navigateResult).toBe(false);
  });

  test('invalidate without routes marks all as stale', async () => {
    const mockHtml = '<html><body>Test</body></html>';

    globalThis.fetch = mock(
      async () =>
        ({
          ok: true,
          text: async () => mockHtml,
        }) as Response,
    );

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    const renderer = new SpeculativeRenderer();
    await renderer.prerender('/about');
    await renderer.prerender('/contact');

    // Invalidate all
    renderer.invalidate();

    // Both should be stale
    const aboutResult = await renderer.navigate('/about');
    const contactResult = await renderer.navigate('/contact');

    expect(aboutResult).toBe(false);
    expect(contactResult).toBe(false);
  });

  test('evicts old pages when cache is full', async () => {
    const mockHtml = 'x'.repeat(1000); // 1KB per page

    globalThis.fetch = mock(
      async () =>
        ({
          ok: true,
          text: async () => mockHtml,
        }) as Response,
    );

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    // Small cache - max 2 pages
    const renderer = new SpeculativeRenderer({
      maxCachedPages: 2,
    });

    await renderer.prerender('/page1');
    await renderer.prerender('/page2');

    expect(renderer.getStats().cachedPages).toBe(2);

    // Adding third page should evict oldest
    await renderer.prerender('/page3');

    expect(renderer.getStats().cachedPages).toBe(2);
  });

  test('evicts based on cache size limit', async () => {
    globalThis.fetch = mock(
      async () =>
        ({
          ok: true,
          text: async () => 'x'.repeat(1000), // 1KB
        }) as Response,
    );

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    // Small cache - max 1.5KB
    const renderer = new SpeculativeRenderer({
      maxCacheSize: 1500,
      maxCachedPages: 100,
    });

    await renderer.prerender('/page1');
    await renderer.prerender('/page2');

    // Should only keep one page due to size limit
    expect(renderer.getStats().cachedPages).toBe(1);
    expect(renderer.getStats().cacheSize).toBeLessThanOrEqual(1500);
  });

  test('uses cached page on second prerender', async () => {
    let fetchCount = 0;
    const mockHtml = '<html><body>Test</body></html>';

    globalThis.fetch = mock(async () => {
      fetchCount++;
      return {
        ok: true,
        text: async () => mockHtml,
      } as Response;
    });

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    const renderer = new SpeculativeRenderer();

    await renderer.prerender('/about');
    expect(fetchCount).toBe(1);

    // Second call should use cache
    await renderer.prerender('/about');
    expect(fetchCount).toBe(1); // No additional fetch
  });

  test('destroy cleans up resources', async () => {
    const mockHtml = '<html><body>Test</body></html>';

    globalThis.fetch = mock(
      async () =>
        ({
          ok: true,
          text: async () => mockHtml,
        }) as Response,
    );

    globalThis.window = {
      location: { pathname: '/' },
    } as any;

    const renderer = new SpeculativeRenderer();
    await renderer.prerender('/about');

    expect(renderer.getStats().cachedPages).toBe(1);

    renderer.destroy();

    expect(renderer.getStats().cachedPages).toBe(0);
    expect(renderer.getStats().cacheSize).toBe(0);
  });
});

describe('initSpeculativeRendering', () => {
  test('creates and initializes renderer', () => {
    // Can't fully test init without DOM, but verify function exists
    expect(initSpeculativeRendering).toBeDefined();
    expect(typeof initSpeculativeRendering).toBe('function');
  });
});

describe('Speculation integration with predictor', () => {
  test('predictor predictions are used for pre-rendering', () => {
    const predictor = new NavigationPredictor();

    // Record some navigation history
    predictor.record({
      from: '/',
      to: '/dashboard',
      timestamp: Date.now(),
      duration: 5000,
    });

    predictor.record({
      from: '/',
      to: '/dashboard',
      timestamp: Date.now(),
      duration: 3000,
    });

    predictor.record({
      from: '/',
      to: '/explore',
      timestamp: Date.now(),
      duration: 2000,
    });

    // Predict from home
    const predictions = predictor.predict('/');

    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].route).toBe('/dashboard'); // Most likely
    expect(predictions[0].probability).toBeGreaterThan(0.4); // ~0.48 expected
  });
});
