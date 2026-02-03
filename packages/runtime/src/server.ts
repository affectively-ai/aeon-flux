/**
 * Aeon Pages Bun Server
 *
 * Lightweight server for serving Aeon pages with:
 * - Hot reload in development
 * - Collaborative route mutations via Aeon sync
 * - File system persistence
 */

import { AeonRouter } from './router';
import { AeonRouteRegistry } from './registry';
import type { AeonConfig } from './types';

export interface ServerOptions {
  config: AeonConfig;
  onRouteChange?: (route: string, type: 'add' | 'update' | 'remove') => void;
}

/**
 * Create an Aeon Pages server using Bun's native server
 */
export async function createAeonServer(options: ServerOptions) {
  const { config, onRouteChange } = options;

  const router = new AeonRouter({
    routesDir: config.pagesDir,
    componentsDir: config.componentsDir,
  });

  const registry = new AeonRouteRegistry({
    syncMode: config.aeon?.sync?.mode ?? 'distributed',
    versioningEnabled: config.aeon?.versioning?.enabled ?? true,
  });

  // Watch for file changes in development
  if (config.runtime === 'bun' && process.env.NODE_ENV !== 'production') {
    await watchFiles(config.pagesDir, async (path, type) => {
      console.log(`[aeon] File ${type}: ${path}`);
      await router.reload();
      onRouteChange?.(path, type === 'create' ? 'add' : type === 'delete' ? 'remove' : 'update');
    });
  }

  // Subscribe to collaborative route mutations
  registry.subscribeToMutations((operation) => {
    console.log(`[aeon] Collaborative route mutation:`, operation);
    router.reload();
    onRouteChange?.(operation.path, operation.type as 'add' | 'update' | 'remove');
  });

  // Initialize routes from file system
  await router.scan();

  return Bun.serve({
    port: config.port ?? 3000,

    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      const path = url.pathname;

      // Static assets
      if (path.startsWith('/_aeon/')) {
        return handleStaticAsset(path, config);
      }

      // WebSocket upgrade for Aeon sync
      if (path === '/_aeon/ws' && req.headers.get('upgrade') === 'websocket') {
        return handleWebSocketUpgrade(req, registry);
      }

      // Try to match a route
      const match = router.match(path);

      if (!match) {
        // Dynamic route creation for unclaimed paths
        if (config.aeon?.dynamicRoutes !== false) {
          return handleDynamicCreation(path, req, registry);
        }
        return new Response('Not Found', { status: 404 });
      }

      // Render the matched route
      return renderRoute(match, req, config);
    },

    // WebSocket handling for Aeon sync
    websocket: {
      message(ws, message) {
        registry.handleSyncMessage(ws, message);
      },
      open(ws) {
        registry.handleConnect(ws);
      },
      close(ws) {
        registry.handleDisconnect(ws);
      },
    },
  });
}

/**
 * Watch files for changes (hot reload)
 */
async function watchFiles(
  dir: string,
  callback: (path: string, type: 'create' | 'update' | 'delete') => void
) {
  const { watch } = await import('fs');
  const { join } = await import('path');

  watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (!filename.endsWith('.tsx') && !filename.endsWith('.ts')) return;

    const fullPath = join(dir, filename);
    const type = eventType === 'rename' ? 'create' : 'update';
    callback(fullPath, type);
  });
}

/**
 * Handle static assets from .aeon build directory
 */
function handleStaticAsset(path: string, config: AeonConfig): Response {
  const assetPath = path.replace('/_aeon/', '');
  const fullPath = `${config.output?.dir ?? '.aeon'}/${assetPath}`;

  try {
    const file = Bun.file(fullPath);
    return new Response(file);
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}

/**
 * Handle WebSocket upgrade for Aeon sync
 */
function handleWebSocketUpgrade(req: Request, _registry: AeonRouteRegistry): Response {
  const server = Bun.serve.prototype; // This is a placeholder - actual upgrade happens in Bun
  if ('upgrade' in server) {
    // @ts-expect-error - Bun-specific API
    const success = server.upgrade(req);
    if (success) {
      return new Response(null, { status: 101 });
    }
  }
  return new Response('WebSocket upgrade failed', { status: 500 });
}

/**
 * Handle dynamic route creation for unclaimed paths
 */
async function handleDynamicCreation(
  path: string,
  req: Request,
  registry: AeonRouteRegistry
): Promise<Response> {
  // Check if user has permission to create routes
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Not Found', { status: 404 });
  }

  // Create a new route via the registry
  await registry.addRoute(path, 'DynamicPage', {
    createdAt: new Date().toISOString(),
    createdBy: 'dynamic',
  });

  // Return a placeholder response
  return new Response(
    JSON.stringify({
      message: 'Route created',
      path,
      session: registry.getSessionId(path),
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Render a matched route
 */
async function renderRoute(
  match: ReturnType<AeonRouter['match']>,
  _req: Request,
  config: AeonConfig
): Promise<Response> {
  if (!match) {
    return new Response('Not Found', { status: 404 });
  }

  // For Aeon pages, we return the session data + hydration script
  if (match.isAeon) {
    const html = generateAeonPageHtml(match, config);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // For non-Aeon pages, do standard SSR
  const html = generateStaticPageHtml(match, config);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * Generate HTML for an Aeon-enabled page
 */
function generateAeonPageHtml(
  match: NonNullable<ReturnType<AeonRouter['match']>>,
  config: AeonConfig
): string {
  const { sessionId, params, componentId } = match;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aeon Page</title>
  <script type="module">
    // Aeon hydration script
    import { hydrate, initAeonSync } from '/_aeon/runtime.js';

    const sessionId = '${sessionId}';
    const params = ${JSON.stringify(params)};
    const componentId = '${componentId}';

    // Initialize Aeon sync
    const sync = await initAeonSync({
      sessionId,
      wsUrl: 'ws://' + window.location.host + '/_aeon/ws',
      presence: ${config.aeon?.presence?.enabled ?? true},
    });

    // Hydrate the page from session state
    const session = await sync.getSession(sessionId);
    hydrate(session.tree, document.getElementById('root'));

    // Subscribe to real-time updates
    sync.subscribe((update) => {
      hydrate(update.tree, document.getElementById('root'));
    });
  </script>
</head>
<body>
  <div id="root">
    <!-- Server-rendered content would go here -->
    <noscript>This page requires JavaScript for collaborative features.</noscript>
  </div>
</body>
</html>`;
}

/**
 * Generate HTML for a static (non-Aeon) page
 */
function generateStaticPageHtml(
  match: NonNullable<ReturnType<AeonRouter['match']>>,
  _config: AeonConfig
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Static Page</title>
</head>
<body>
  <div id="root">
    <!-- Render ${match.componentId} here -->
  </div>
</body>
</html>`;
}

export { AeonRouter, AeonRouteRegistry };
