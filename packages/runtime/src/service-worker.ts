/**
 * Aeon Service Worker - Total Preload Strategy
 *
 * The Aeon architecture is recursive:
 * - This service worker caches the ENTIRE site as an Aeon
 * - Each page session is an Aeon entity within the site Aeon
 * - Federation would cache multiple sites as Aeons of Aeons
 *
 * With 8.4KB framework + ~2-5KB per page session, we can preload EVERYTHING.
 * A site with 100 pages = ~315KB total (smaller than one hero image!)
 */

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'aeon-v1';
const MANIFEST_URL = '/.aeon/manifest.json';
const SESSIONS_PREFIX = '/.aeon/sessions/';

interface RouteManifest {
  version: string;
  routes: Array<{
    pattern: string;
    sessionId: string;
    isAeon: boolean;
  }>;
  generatedAt: string;
}

interface CacheMessage {
  type: 'CACHE_STATUS' | 'PRELOAD_PROGRESS' | 'PRELOAD_COMPLETE';
  loaded?: number;
  total?: number;
  percentage?: number;
  cachedRoutes?: string[];
}

/**
 * Install event - Pre-cache the framework and manifest
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache essential assets
      const essentialAssets = [
        '/',
        MANIFEST_URL,
        '/.aeon/runtime.js',
      ];

      await cache.addAll(essentialAssets.filter(Boolean));

      // Skip waiting to activate immediately
      await self.skipWaiting();
    })()
  );
});

/**
 * Activate event - Clean up old caches and claim clients
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );

      // Claim all clients immediately
      await self.clients.claim();

      // Start total preload in background
      startTotalPreload();
    })()
  );
});

/**
 * Fetch event - Serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip WebSocket and other special protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle session requests (highest priority for cached)
  if (url.pathname.startsWith(SESSIONS_PREFIX)) {
    event.respondWith(handleSessionRequest(event.request));
    return;
  }

  // Handle page navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Standard cache-first for other assets
  event.respondWith(cacheFirst(event.request));
});

/**
 * Handle session data requests - cache first, network fallback
 */
async function handleSessionRequest(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached immediately, revalidate in background
    revalidateInBackground(request, cache);
    return cached;
  }

  // Fetch and cache
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Handle navigation requests - try to serve pre-rendered page
 */
async function handleNavigationRequest(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);

  // Try to match the route to a cached session
  const manifest = await getManifest(cache);
  if (manifest) {
    const route = matchRoute(url.pathname, manifest.routes);
    if (route) {
      const sessionUrl = `${SESSIONS_PREFIX}${route.sessionId}.json`;
      const sessionResponse = await cache.match(sessionUrl);

      if (sessionResponse) {
        // We have the session - could render here or let client handle
        // For now, pass through to let the client render with cached data
      }
    }
  }

  // Standard navigation handling
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  return fetch(request);
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Revalidate in background (stale-while-revalidate)
 */
async function revalidateInBackground(request: Request, cache: Cache): Promise<void> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch {
    // Ignore network errors during revalidation
  }
}

/**
 * Get cached manifest
 */
async function getManifest(cache: Cache): Promise<RouteManifest | null> {
  try {
    const response = await cache.match(MANIFEST_URL);
    if (response) {
      return response.json();
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Match URL to route
 */
function matchRoute(
  pathname: string,
  routes: RouteManifest['routes']
): RouteManifest['routes'][0] | null {
  for (const route of routes) {
    if (matchPattern(pathname, route.pattern)) {
      return route;
    }
  }
  return null;
}

/**
 * Match URL pattern (supports dynamic segments)
 */
function matchPattern(pathname: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\[\[\.\.\.(\w+)\]\]/g, '(?:.*)?') // Optional catch-all
    .replace(/\[\.\.\.(\w+)\]/g, '(.+)') // Required catch-all
    .replace(/\[(\w+)\]/g, '([^/]+)'); // Dynamic segment

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

/**
 * Start total preload of all sessions
 */
async function startTotalPreload(): Promise<void> {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Fetch fresh manifest
    const manifestResponse = await fetch(MANIFEST_URL);
    if (!manifestResponse.ok) {
      console.warn('[aeon-sw] Could not fetch manifest for total preload');
      return;
    }

    const manifest: RouteManifest = await manifestResponse.json();
    await cache.put(MANIFEST_URL, new Response(JSON.stringify(manifest)));

    const total = manifest.routes.length;
    let loaded = 0;
    const cachedRoutes: string[] = [];

    // Batch preload sessions
    const batchSize = 5;
    for (let i = 0; i < manifest.routes.length; i += batchSize) {
      const batch = manifest.routes.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (route) => {
          const sessionUrl = `${SESSIONS_PREFIX}${route.sessionId}.json`;

          try {
            // Check if already cached
            const existing = await cache.match(sessionUrl);
            if (!existing) {
              const response = await fetch(sessionUrl);
              if (response.ok) {
                await cache.put(sessionUrl, response);
              }
            }
            cachedRoutes.push(route.pattern);
          } catch {
            // Ignore individual failures
          }

          loaded++;

          // Broadcast progress to clients
          broadcastProgress({
            type: 'PRELOAD_PROGRESS',
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });
        })
      );

      // Small delay to keep main thread responsive
      await new Promise((r) => setTimeout(r, 10));
    }

    // Broadcast completion
    broadcastProgress({
      type: 'PRELOAD_COMPLETE',
      loaded: total,
      total,
      percentage: 100,
      cachedRoutes,
    });

    console.log(`[aeon-sw] Total preload complete: ${total} sessions cached`);
  } catch (error) {
    console.error('[aeon-sw] Error during total preload:', error);
  }
}

/**
 * Broadcast message to all clients
 */
async function broadcastProgress(message: CacheMessage): Promise<void> {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  const data = event.data;

  switch (data.type) {
    case 'GET_CACHE_STATUS':
      handleGetCacheStatus(event);
      break;

    case 'TRIGGER_PRELOAD':
      startTotalPreload();
      break;

    case 'PREFETCH_ROUTE':
      handlePrefetchRoute(data.route);
      break;

    case 'CLEAR_CACHE':
      handleClearCache();
      break;
  }
});

/**
 * Handle cache status request
 */
async function handleGetCacheStatus(event: ExtendableMessageEvent): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const manifest = await getManifest(cache);

  if (!manifest) {
    event.ports[0]?.postMessage({ cached: 0, total: 0, routes: [] });
    return;
  }

  const cachedRoutes: string[] = [];
  for (const route of manifest.routes) {
    const sessionUrl = `${SESSIONS_PREFIX}${route.sessionId}.json`;
    const cached = await cache.match(sessionUrl);
    if (cached) {
      cachedRoutes.push(route.pattern);
    }
  }

  event.ports[0]?.postMessage({
    cached: cachedRoutes.length,
    total: manifest.routes.length,
    routes: cachedRoutes,
  });
}

/**
 * Handle prefetch route request
 */
async function handlePrefetchRoute(route: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const manifest = await getManifest(cache);

  if (!manifest) return;

  const routeInfo = manifest.routes.find((r) => r.pattern === route);
  if (!routeInfo) return;

  const sessionUrl = `${SESSIONS_PREFIX}${routeInfo.sessionId}.json`;

  try {
    const existing = await cache.match(sessionUrl);
    if (!existing) {
      const response = await fetch(sessionUrl);
      if (response.ok) {
        await cache.put(sessionUrl, response);
      }
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Handle clear cache request
 */
async function handleClearCache(): Promise<void> {
  await caches.delete(CACHE_NAME);
  console.log('[aeon-sw] Cache cleared');
}

export {};
