/**
 * aeon dev - Start development server with hot reload
 *
 * Features:
 * - Hot module reload
 * - 'use aeon' directive processing
 * - Real-time sync preview
 * - AST ↔ Source bidirectional editing
 * - Error overlay
 */

import { watch } from 'fs';
import { readFile, stat } from 'fs/promises';
import { resolve, join, relative } from 'path';

interface DevOptions {
  port: number;
  config?: string;
}

interface AeonConfig {
  pagesDir: string;
  componentsDir?: string;
  runtime: 'bun' | 'cloudflare';
  port?: number;
  aeon?: {
    sync?: { mode: string };
    presence?: { enabled: boolean };
    versioning?: { enabled: boolean };
    offline?: { enabled: boolean };
  };
}

export async function dev(options: DevOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = options.config || 'aeon.config.ts';

  console.log('\n🚀 Starting Aeon Flux development server...\n');

  // Load config
  const config = await loadConfig(resolve(cwd, configPath));
  const port = options.port || config.port || 3000;

  // Resolve directories
  const pagesDir = resolve(cwd, config.pagesDir || './pages');
  const componentsDir = resolve(cwd, config.componentsDir || './components');

  console.log(`📁 Pages:      ${relative(cwd, pagesDir)}`);
  console.log(`📁 Components: ${relative(cwd, componentsDir)}`);
  console.log(`🌐 Port:       ${port}`);
  console.log('');

  // Scan for routes
  const routes = await scanRoutes(pagesDir);
  console.log(`📄 Found ${routes.length} route(s):`);
  for (const route of routes) {
    const aeonBadge = route.isAeon ? ' [aeon]' : '';
    console.log(`   ${route.pattern}${aeonBadge}`);
  }
  console.log('');

  // Start file watcher
  const watcher = startWatcher(pagesDir, componentsDir, async (event, filename) => {
    console.log(`\n♻️  ${event}: ${filename}`);
    // Trigger HMR
    broadcastHMR(filename);
  });

  // Start server
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // HMR WebSocket
      if (url.pathname === '/__aeon_hmr') {
        const upgraded = server.upgrade(req);
        if (!upgraded) {
          return new Response('WebSocket upgrade failed', { status: 400 });
        }
        return undefined;
      }

      // Dev overlay script
      if (url.pathname === '/__aeon_dev.js') {
        return new Response(DEV_OVERLAY_SCRIPT, {
          headers: { 'Content-Type': 'application/javascript' },
        });
      }

      // Match route
      const match = matchRoute(url.pathname, routes);
      if (!match) {
        return new Response('Not found', { status: 404 });
      }

      // Read and process page
      try {
        const content = await readFile(match.filePath, 'utf-8');
        const html = await renderPage(content, match, config);

        // Inject dev overlay
        const devHtml = injectDevOverlay(html, port);

        return new Response(devHtml, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      } catch (err) {
        console.error('Render error:', err);
        return new Response(renderErrorPage(err as Error), {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    },
    websocket: {
      open(ws) {
        hmrClients.add(ws);
        console.log('   HMR client connected');
      },
      close(ws) {
        hmrClients.delete(ws);
      },
      message(_ws, _message) {
        // Handle client messages if needed
      },
    },
  });

  console.log(`\n✨ Ready at http://localhost:${port}\n`);
  console.log('   Press Ctrl+C to stop\n');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...\n');
    watcher.close();
    server.stop();
    process.exit(0);
  });
}

// HMR clients
const hmrClients = new Set<unknown>();

function broadcastHMR(filename: string): void {
  const message = JSON.stringify({ type: 'reload', filename });
  for (const client of hmrClients) {
    try {
      (client as { send: (msg: string) => void }).send(message);
    } catch {
      hmrClients.delete(client);
    }
  }
}

async function loadConfig(configPath: string): Promise<AeonConfig> {
  try {
    const module = await import(configPath);
    return module.default || module;
  } catch {
    console.log('⚠️  No config found, using defaults');
    return {
      pagesDir: './pages',
      runtime: 'bun',
    };
  }
}

interface RouteInfo {
  pattern: string;
  filePath: string;
  isAeon: boolean;
  layout?: string;
}

async function scanRoutes(pagesDir: string): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  async function scan(dir: string, routePath: string): Promise<void> {
    const { readdir } = await import('fs/promises');
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        let segment = entry.name;
        // Convert Next.js dynamic routes to Aeon format
        if (segment.startsWith('[') && segment.endsWith(']')) {
          if (segment.startsWith('[...')) {
            // Catch-all: [...slug] -> *slug
            segment = '*' + segment.slice(4, -1);
          } else if (segment.startsWith('[[...')) {
            // Optional catch-all: [[...slug]] -> **slug
            segment = '**' + segment.slice(5, -2);
          } else {
            // Dynamic: [id] -> :id
            segment = ':' + segment.slice(1, -1);
          }
        }
        await scan(fullPath, `${routePath}/${segment}`);
      } else if (entry.isFile()) {
        const isPage =
          entry.name === 'page.tsx' ||
          entry.name === 'page.ts' ||
          entry.name === 'page.jsx' ||
          entry.name === 'page.js' ||
          (entry.name.endsWith('.tsx') && !entry.name.startsWith('_'));

        if (isPage) {
          const content = await readFile(fullPath, 'utf-8');
          const isAeon = content.includes("'use aeon'") || content.includes('"use aeon"');

          // Check for layout
          const layoutPath = join(dir, 'layout.tsx');
          let layout: string | undefined;
          try {
            await stat(layoutPath);
            layout = layoutPath;
          } catch {
            // No layout
          }

          routes.push({
            pattern: routePath || '/',
            filePath: fullPath,
            isAeon,
            layout,
          });
        }
      }
    }
  }

  await scan(pagesDir, '');
  return routes.sort((a, b) => {
    // Static routes first
    const aStatic = !a.pattern.includes(':') && !a.pattern.includes('*');
    const bStatic = !b.pattern.includes(':') && !b.pattern.includes('*');
    if (aStatic && !bStatic) return -1;
    if (!aStatic && bStatic) return 1;
    return a.pattern.localeCompare(b.pattern);
  });
}

function matchRoute(
  path: string,
  routes: RouteInfo[]
): (RouteInfo & { params: Record<string, string> }) | null {
  for (const route of routes) {
    const params = matchPattern(path, route.pattern);
    if (params !== null) {
      return { ...route, params };
    }
  }
  return null;
}

function matchPattern(path: string, pattern: string): Record<string, string> | null {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  let pi = 0;
  let pati = 0;

  while (pi < pathParts.length && pati < patternParts.length) {
    const pathPart = pathParts[pi];
    const patternPart = patternParts[pati];

    if (patternPart.startsWith('**')) {
      // Optional catch-all
      const paramName = patternPart.slice(2);
      params[paramName] = pathParts.slice(pi).join('/');
      return params;
    } else if (patternPart.startsWith('*')) {
      // Catch-all
      const paramName = patternPart.slice(1);
      params[paramName] = pathParts.slice(pi).join('/');
      return params;
    } else if (patternPart.startsWith(':')) {
      // Dynamic segment
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
      pi++;
      pati++;
    } else if (pathPart === patternPart) {
      pi++;
      pati++;
    } else {
      return null;
    }
  }

  // Handle optional catch-all at end
  if (pati < patternParts.length && patternParts[pati].startsWith('**')) {
    const paramName = patternParts[pati].slice(2);
    params[paramName] = '';
    return params;
  }

  if (pi === pathParts.length && pati === patternParts.length) {
    return params;
  }

  return null;
}

async function renderPage(
  content: string,
  match: RouteInfo & { params: Record<string, string> },
  _config: AeonConfig
): Promise<string> {
  // For dev mode, we do a simple transform
  // In production, this would use the WASM runtime

  // Check for 'use aeon' directive
  const isAeon = match.isAeon;

  // Extract the default export component
  const componentMatch = content.match(
    /export\s+default\s+function\s+(\w+)/
  );
  const componentName = componentMatch?.[1] || 'Page';

  // Simple dev rendering - in production this uses React SSR
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName} - Aeon Flux</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet">
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18",
        "react-dom": "https://esm.sh/react-dom@18",
        "react-dom/client": "https://esm.sh/react-dom@18/client",
        "@affectively/aeon-pages/react": "/__aeon_runtime.js"
      }
    }
  </script>
</head>
<body>
  <div id="root"></div>
  ${isAeon ? `
  <script type="module">
    // Aeon Flux runtime
    window.__AEON_PAGE__ = {
      route: "${match.pattern}",
      params: ${JSON.stringify(match.params)},
      isAeon: true,
    };
  </script>
  ` : ''}
  <script type="module">
    // Dev mode hydration
    import React from 'react';
    import { createRoot } from 'react-dom/client';

    // Simple placeholder for dev mode
    const App = () => React.createElement('div', {
      style: { padding: '2rem', fontFamily: 'system-ui' }
    }, [
      React.createElement('h1', { key: 'h1' }, '${componentName}'),
      React.createElement('p', { key: 'p' }, 'Route: ${match.pattern}'),
      ${isAeon ? `React.createElement('p', { key: 'aeon', style: { color: 'green' } }, '✓ Aeon Flux enabled'),` : ''}
      React.createElement('p', { key: 'note', style: { color: '#666', marginTop: '1rem' } },
        'This is dev mode. Full rendering coming soon.')
    ]);

    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;

  return html;
}

function injectDevOverlay(html: string, port: number): string {
  const script = `<script>
    // Aeon Flux HMR
    const ws = new WebSocket('ws://localhost:${port}/__aeon_hmr');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'reload') {
        console.log('[Aeon Flux] Reloading:', msg.filename);
        location.reload();
      }
    };
    ws.onclose = () => {
      console.log('[Aeon Flux] Server disconnected, reconnecting...');
      setTimeout(() => location.reload(), 1000);
    };
  </script>`;

  return html.replace('</body>', `${script}</body>`);
}

function renderErrorPage(error: Error): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Error - Aeon Flux</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #1a1a1a; color: #fff; }
    pre { background: #2d2d2d; padding: 1rem; border-radius: 8px; overflow: auto; }
    h1 { color: #ff6b6b; }
  </style>
</head>
<body>
  <h1>⚠️ Error</h1>
  <pre>${escapeHtml(error.message)}\n\n${escapeHtml(error.stack || '')}</pre>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function startWatcher(
  pagesDir: string,
  componentsDir: string,
  callback: (event: string, filename: string) => void
): { close: () => void } {
  const watchers: ReturnType<typeof watch>[] = [];

  try {
    watchers.push(
      watch(pagesDir, { recursive: true }, (event, filename) => {
        if (filename) callback(event, `pages/${filename}`);
      })
    );
  } catch {
    console.log('⚠️  Could not watch pages directory');
  }

  try {
    watchers.push(
      watch(componentsDir, { recursive: true }, (event, filename) => {
        if (filename) callback(event, `components/${filename}`);
      })
    );
  } catch {
    // Components dir may not exist
  }

  return {
    close: () => watchers.forEach((w) => w.close()),
  };
}

const DEV_OVERLAY_SCRIPT = `
// Aeon Flux Dev Overlay
console.log('[Aeon Flux] Dev mode active');
`;
