import {
  AeonRouter,
  HeuristicAdapter,
  addSpeculationHeaders,
  extractUserContext,
  init_router,
  setContextCookies
} from "./chunk-mcdw85z7.js";
import {
  __require
} from "./chunk-pgbgfrym.js";

// src/server.ts
init_router();

// src/registry.ts
class AeonRouteRegistry {
  routes = new Map;
  coordinator = null;
  reconciler = null;
  versions = null;
  syncMode;
  versioningEnabled;
  mutationCallbacks = [];
  connectedSockets = new Set;
  constructor(options) {
    this.syncMode = options.syncMode;
    this.versioningEnabled = options.versioningEnabled;
    this.initializeAeonModules();
  }
  async initializeAeonModules() {
    try {
      const aeon = await import("@affectively/aeon");
      if (this.syncMode === "distributed") {
        this.coordinator = new aeon.SyncCoordinator;
        this.reconciler = new aeon.StateReconciler;
        this.coordinator.on("sync-completed", (session) => {
          this.handleSyncCompleted(session);
        });
      }
      if (this.versioningEnabled) {
        this.versions = new aeon.SchemaVersionManager;
        this.versions.registerVersion("1.0.0", {
          description: "Initial route schema"
        });
      }
    } catch (error) {
      console.warn("[aeon-registry] Aeon modules not available, running in standalone mode");
    }
  }
  async addRoute(path, component, metadata) {
    const operation = {
      type: "route-add",
      path,
      component,
      metadata,
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? "local"
    };
    if (this.syncMode === "distributed" && this.coordinator) {
      const participants = this.coordinator.getOnlineNodes().map((n) => n.id);
      if (participants.length > 0) {
        await this.coordinator.createSyncSession(this.coordinator.getLocalNodeId(), participants);
      }
    }
    const version = this.versioningEnabled && this.versions ? await this.versions.getCurrentVersion() : "1.0.0";
    this.routes.set(path, {
      path,
      component,
      metadata,
      version
    });
    this.notifyMutation(operation);
    await this.persistRoute(path, component);
  }
  async updateRoute(path, updates) {
    const existing = this.routes.get(path);
    if (!existing) {
      throw new Error(`Route not found: ${path}`);
    }
    const operation = {
      type: "route-update",
      path,
      component: updates.component,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        updatedBy: this.coordinator?.getLocalNodeId() ?? "local"
      },
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? "local"
    };
    this.routes.set(path, {
      ...existing,
      ...updates,
      metadata: operation.metadata
    });
    this.notifyMutation(operation);
  }
  async removeRoute(path) {
    const operation = {
      type: "route-remove",
      path,
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? "local"
    };
    this.routes.delete(path);
    this.notifyMutation(operation);
  }
  getRoute(path) {
    return this.routes.get(path);
  }
  getSessionId(path) {
    return path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  }
  getAllRoutes() {
    return Array.from(this.routes.values());
  }
  subscribeToMutations(callback) {
    this.mutationCallbacks.push(callback);
    return () => {
      const idx = this.mutationCallbacks.indexOf(callback);
      if (idx >= 0) {
        this.mutationCallbacks.splice(idx, 1);
      }
    };
  }
  handleConnect(ws) {
    this.connectedSockets.add(ws);
  }
  handleDisconnect(ws) {
    this.connectedSockets.delete(ws);
  }
  handleSyncMessage(ws, message) {
    try {
      const data = typeof message === "string" ? JSON.parse(message) : message;
      if (data.type === "route-operation") {
        this.applyRemoteOperation(data.operation);
      }
    } catch (error) {
      console.error("[aeon-registry] Error handling sync message:", error);
    }
  }
  notifyMutation(operation) {
    for (const callback of this.mutationCallbacks) {
      try {
        callback(operation);
      } catch (error) {
        console.error("[aeon-registry] Error in mutation callback:", error);
      }
    }
    const message = JSON.stringify({ type: "route-operation", operation });
    for (const ws of this.connectedSockets) {
      try {
        ws.send?.(message);
      } catch {}
    }
  }
  handleSyncCompleted(session) {
    if (this.reconciler) {
      const result = this.reconciler.reconcile();
      if (result?.state) {
        const routes = result.state;
        for (const [path, route] of routes) {
          this.routes.set(path, route);
        }
      }
    }
  }
  applyRemoteOperation(operation) {
    switch (operation.type) {
      case "route-add":
        if (operation.component && operation.metadata) {
          this.routes.set(operation.path, {
            path: operation.path,
            component: operation.component,
            metadata: operation.metadata,
            version: "1.0.0"
          });
        }
        break;
      case "route-update":
        const existing = this.routes.get(operation.path);
        if (existing && operation.component) {
          this.routes.set(operation.path, {
            ...existing,
            component: operation.component,
            metadata: operation.metadata ?? existing.metadata
          });
        }
        break;
      case "route-remove":
        this.routes.delete(operation.path);
        break;
    }
    for (const callback of this.mutationCallbacks) {
      try {
        callback(operation);
      } catch (error) {
        console.error("[aeon-registry] Error in mutation callback:", error);
      }
    }
  }
  async persistRoute(path, component) {
    const filePath = path === "/" ? "page.tsx" : `${path.slice(1)}/page.tsx`;
    const content = `'use aeon';

export default function Page() {
  return <${component} />;
}
`;
    try {
      console.log(`[aeon-registry] Would persist route to: ${filePath}`);
    } catch (error) {
      console.error(`[aeon-registry] Error persisting route:`, error);
    }
  }
}

// src/server.ts
function createMinimalTree(match) {
  const nodes = new Map;
  const rootId = match?.componentId || "root";
  nodes.set(rootId, {
    id: rootId,
    type: "page",
    props: {},
    children: []
  });
  return {
    rootId,
    nodes,
    getNode: (id) => nodes.get(id),
    getChildren: () => [],
    getSchema: () => ({
      rootId,
      nodeCount: nodes.size,
      nodeTypes: ["page"],
      depth: 1
    }),
    clone: () => createMinimalTree(match)
  };
}
function createRouterAdapter(routerConfig) {
  if (!routerConfig) {
    return new HeuristicAdapter;
  }
  if (typeof routerConfig.adapter === "object") {
    return routerConfig.adapter;
  }
  switch (routerConfig.adapter) {
    case "heuristic":
    default:
      return new HeuristicAdapter;
  }
}
async function createAeonServer(options) {
  const {
    config,
    router: routerConfig,
    onRouteChange,
    onRouteDecision
  } = options;
  const router = new AeonRouter({
    routesDir: config.pagesDir,
    componentsDir: config.componentsDir
  });
  const registry = new AeonRouteRegistry({
    syncMode: config.aeon?.sync?.mode ?? "distributed",
    versioningEnabled: config.aeon?.versioning?.enabled ?? true
  });
  const personalizedRouter = createRouterAdapter(routerConfig);
  if (config.runtime === "bun" && true) {
    await watchFiles(config.pagesDir, async (path, type) => {
      console.log(`[aeon] File ${type}: ${path}`);
      await router.reload();
      onRouteChange?.(path, type === "create" ? "add" : type === "delete" ? "remove" : "update");
    });
  }
  registry.subscribeToMutations((operation) => {
    console.log(`[aeon] Collaborative route mutation:`, operation);
    router.reload();
    onRouteChange?.(operation.path, operation.type);
  });
  await router.scan();
  return Bun.serve({
    port: config.port ?? 3000,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      if (path.startsWith("/_aeon/")) {
        return handleStaticAsset(path, config);
      }
      if (path === "/_aeon/ws" && req.headers.get("upgrade") === "websocket") {
        return handleWebSocketUpgrade(req, registry);
      }
      const match = router.match(path);
      if (!match) {
        if (config.aeon?.dynamicRoutes !== false) {
          return handleDynamicCreation(path, req, registry);
        }
        return new Response("Not Found", { status: 404 });
      }
      const userContext = await extractUserContext(req);
      const tree = createMinimalTree(match);
      const decision = await personalizedRouter.route(path, userContext, tree);
      onRouteDecision?.(decision, userContext);
      let response = await renderRoute(match, req, config, decision);
      response = setContextCookies(response, userContext, path);
      response = addSpeculationHeaders(response, decision.prefetch || [], decision.prerender || []);
      return response;
    },
    websocket: {
      message(ws, message) {
        registry.handleSyncMessage(ws, message);
      },
      open(ws) {
        registry.handleConnect(ws);
      },
      close(ws) {
        registry.handleDisconnect(ws);
      }
    }
  });
}
async function watchFiles(dir, callback) {
  const { watch } = await import("fs");
  const { join } = await import("./chunk-mt5x744n.js");
  watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename)
      return;
    if (!filename.endsWith(".tsx") && !filename.endsWith(".ts"))
      return;
    const fullPath = join(dir, filename);
    const type = eventType === "rename" ? "create" : "update";
    callback(fullPath, type);
  });
}
function handleStaticAsset(path, config) {
  const assetPath = path.replace("/_aeon/", "");
  const fullPath = `${config.output?.dir ?? ".aeon"}/${assetPath}`;
  try {
    const file = Bun.file(fullPath);
    return new Response(file);
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
function handleWebSocketUpgrade(req, _registry) {
  const server = Bun.serve.prototype;
  if ("upgrade" in server) {
    const success = server.upgrade(req);
    if (success) {
      return new Response(null, { status: 101 });
    }
  }
  return new Response("WebSocket upgrade failed", { status: 500 });
}
async function handleDynamicCreation(path, req, registry) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Not Found", { status: 404 });
  }
  await registry.addRoute(path, "DynamicPage", {
    createdAt: new Date().toISOString(),
    createdBy: "dynamic"
  });
  return new Response(JSON.stringify({
    message: "Route created",
    path,
    session: registry.getSessionId(path)
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
async function renderRoute(match, _req, config, decision) {
  if (!match) {
    return new Response("Not Found", { status: 404 });
  }
  if (match.isAeon) {
    const html2 = generateAeonPageHtml(match, config, decision);
    return new Response(html2, {
      headers: { "Content-Type": "text/html" }
    });
  }
  const html = generateStaticPageHtml(match, config, decision);
  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}
function generateSpeculationScript(decision) {
  if (!decision?.prefetch?.length && !decision?.prerender?.length) {
    return "";
  }
  const rules = {};
  if (decision.prerender?.length) {
    rules.prerender = [{ urls: decision.prerender }];
  }
  if (decision.prefetch?.length) {
    rules.prefetch = [{ urls: decision.prefetch }];
  }
  return `<script type="speculationrules">${JSON.stringify(rules)}</script>`;
}
function generatePersonalizationStyles(decision) {
  if (!decision)
    return "";
  const vars = [];
  if (decision.accent) {
    vars.push(`--aeon-accent: ${decision.accent}`);
  }
  if (decision.theme) {
    vars.push(`--aeon-theme: ${decision.theme}`);
  }
  if (decision.density) {
    const spacingMap = {
      compact: "0.5rem",
      normal: "1rem",
      comfortable: "1.5rem"
    };
    vars.push(`--aeon-spacing: ${spacingMap[decision.density]}`);
  }
  if (vars.length === 0)
    return "";
  return `<style>:root { ${vars.join("; ")} }</style>`;
}
function generateAeonPageHtml(match, config, decision) {
  const { sessionId, params, componentId } = match;
  const colorScheme = decision?.theme === "dark" ? "dark" : decision?.theme === "light" ? "light" : "";
  const colorSchemeAttr = colorScheme ? ` data-theme="${colorScheme}"` : "";
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
function generateStaticPageHtml(match, _config, decision) {
  const colorScheme = decision?.theme === "dark" ? "dark" : decision?.theme === "light" ? "light" : "";
  const colorSchemeAttr = colorScheme ? ` data-theme="${colorScheme}"` : "";
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
export { AeonRouteRegistry, createAeonServer };
