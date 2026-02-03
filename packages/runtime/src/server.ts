/**
 * Aeon Pages Bun Server
 *
 * Lightweight server for serving Aeon pages with:
 * - Hot reload in development
 * - Collaborative route mutations via Aeon sync
 * - File system persistence
 * - Personalized routing with speculation
 */

import { AeonRouter } from './router';
import { AeonRouteRegistry } from './registry';
import {
  HeuristicAdapter,
  extractUserContext,
  setContextCookies,
  addSpeculationHeaders,
} from './router/index';
import type { AeonConfig } from './types';
import type {
  RouterAdapter,
  RouterConfig,
  RouteDecision,
  ComponentTree,
  ComponentNode,
  UserContext,
} from './router/types';

export interface ServerOptions {
  config: AeonConfig;
  /** Personalized router configuration */
  router?: RouterConfig;
  onRouteChange?: (route: string, type: 'add' | 'update' | 'remove') => void;
  onRouteDecision?: (decision: RouteDecision, context: UserContext) => void;
}

/**
 * Create a minimal component tree for routing decisions
 */
function createMinimalTree(match: ReturnType<AeonRouter['match']>): ComponentTree {
  const nodes = new Map<string, ComponentNode>();
  const rootId = match?.componentId || 'root';

  nodes.set(rootId, {
    id: rootId,
    type: 'page',
    props: {},
    children: [],
  });

  return {
    rootId,
    nodes,
    getNode: (id) => nodes.get(id),
    getChildren: () => [],
    getSchema: () => ({
      rootId,
      nodeCount: nodes.size,
      nodeTypes: ['page'],
      depth: 1,
    }),
    clone: () => createMinimalTree(match),
  };
}

/**
 * Create the personalized router adapter
 */
function createRouterAdapter(routerConfig?: RouterConfig): RouterAdapter {
  if (!routerConfig) {
    return new HeuristicAdapter();
  }

  if (typeof routerConfig.adapter === 'object') {
    return routerConfig.adapter;
  }

  switch (routerConfig.adapter) {
    case 'heuristic':
    default:
      return new HeuristicAdapter();
    // AI and hybrid adapters can be added here in the future
  }
}

/**
 * Create an Aeon Pages server using Bun's native server
 */
export async function createAeonServer(options: ServerOptions) {
  const { config, router: routerConfig, onRouteChange, onRouteDecision } = options;

  const router = new AeonRouter({
    routesDir: config.pagesDir,
    componentsDir: config.componentsDir,
  });

  const registry = new AeonRouteRegistry({
    syncMode: config.aeon?.sync?.mode ?? 'distributed',
    versioningEnabled: config.aeon?.versioning?.enabled ?? true,
  });

  // Create personalized router adapter
  const personalizedRouter = createRouterAdapter(routerConfig);

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

      // Extract user context for personalized routing
      const userContext = await extractUserContext(req);

      // Create component tree for routing decision
      const tree = createMinimalTree(match);

      // Get personalized route decision
      const decision = await personalizedRouter.route(path, userContext, tree);

      // Notify callback if provided
      onRouteDecision?.(decision, userContext);

      // Render the matched route with personalization
      let response = await renderRoute(match, req, config, decision);

      // Add context tracking cookies
      response = setContextCookies(response, userContext, path);

      // Add speculation headers for prefetching
      response = addSpeculationHeaders(
        response,
        decision.prefetch || [],
        decision.prerender || []
      );

      return response;
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
 * Render a matched route with personalization
 */
async function renderRoute(
  match: ReturnType<AeonRouter['match']>,
  _req: Request,
  config: AeonConfig,
  decision?: RouteDecision
): Promise<Response> {
  if (!match) {
    return new Response('Not Found', { status: 404 });
  }

  // For Aeon pages, we return the session data + hydration script
  if (match.isAeon) {
    const html = generateAeonPageHtml(match, config, decision);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // For non-Aeon pages, do standard SSR
  const html = generateStaticPageHtml(match, config, decision);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * Generate speculation rules script for prefetching
 */
function generateSpeculationScript(decision?: RouteDecision): string {
  if (!decision?.prefetch?.length && !decision?.prerender?.length) {
    return '';
  }

  const rules: { prerender?: Array<{ urls: string[] }>; prefetch?: Array<{ urls: string[] }> } = {};

  if (decision.prerender?.length) {
    rules.prerender = [{ urls: decision.prerender }];
  }

  if (decision.prefetch?.length) {
    rules.prefetch = [{ urls: decision.prefetch }];
  }

  return `<script type="speculationrules">${JSON.stringify(rules)}</script>`;
}

/**
 * Generate personalization CSS variables
 */
function generatePersonalizationStyles(decision?: RouteDecision): string {
  if (!decision) return '';

  const vars: string[] = [];

  if (decision.accent) {
    vars.push(`--aeon-accent: ${decision.accent}`);
  }

  if (decision.theme) {
    vars.push(`--aeon-theme: ${decision.theme}`);
  }

  if (decision.density) {
    const spacingMap = { compact: '0.5rem', normal: '1rem', comfortable: '1.5rem' };
    vars.push(`--aeon-spacing: ${spacingMap[decision.density]}`);
  }

  if (vars.length === 0) return '';

  return `<style>:root { ${vars.join('; ')} }</style>`;
}

/**
 * Generate HTML for an Aeon-enabled page
 */
function generateAeonPageHtml(
  match: NonNullable<ReturnType<AeonRouter['match']>>,
  config: AeonConfig,
  decision?: RouteDecision
): string {
  const { sessionId, params, componentId } = match;

  // Determine color scheme from decision
  const colorScheme = decision?.theme === 'dark' ? 'dark' : decision?.theme === 'light' ? 'light' : '';
  const colorSchemeAttr = colorScheme ? ` data-theme="${colorScheme}"` : '';

  return `<!DOCTYPE html>
<html lang="en"${colorSchemeAttr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aeon Page</title>
  ${generatePersonalizationStyles(decision)}
  ${generateSpeculationScript(decision)}
  <script type="module">
    // Aeon hydration script
    import { hydrate, initAeonSync } from '/_aeon/runtime.js';

    const sessionId = '${sessionId}';
    const params = ${JSON.stringify(params)};
    const componentId = '${componentId}';
    const routeDecision = ${JSON.stringify(decision || {})};

    // Initialize Aeon sync
    const sync = await initAeonSync({
      sessionId,
      wsUrl: 'ws://' + window.location.host + '/_aeon/ws',
      presence: ${config.aeon?.presence?.enabled ?? true},
    });

    // Hydrate the page from session state
    const session = await sync.getSession(sessionId);
    hydrate(session.tree, document.getElementById('root'), {
      componentOrder: routeDecision.componentOrder,
      hiddenComponents: routeDecision.hiddenComponents,
      featureFlags: routeDecision.featureFlags,
    });

    // Subscribe to real-time updates
    sync.subscribe((update) => {
      hydrate(update.tree, document.getElementById('root'), {
        componentOrder: routeDecision.componentOrder,
        hiddenComponents: routeDecision.hiddenComponents,
        featureFlags: routeDecision.featureFlags,
      });
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
  _config: AeonConfig,
  decision?: RouteDecision
): string {
  const colorScheme = decision?.theme === 'dark' ? 'dark' : decision?.theme === 'light' ? 'light' : '';
  const colorSchemeAttr = colorScheme ? ` data-theme="${colorScheme}"` : '';

  return `<!DOCTYPE html>
<html lang="en"${colorSchemeAttr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Static Page</title>
  ${generatePersonalizationStyles(decision)}
  ${generateSpeculationScript(decision)}
</head>
<body>
  <div id="root">
    <!-- Render ${match.componentId} here -->
  </div>
</body>
</html>`;
}

export { AeonRouter, AeonRouteRegistry };
