/**
 * aeon start - Start production server
 *
 * For local testing of production builds before deploying to Cloudflare.
 * In production, you deploy to Cloudflare Workers - no server needed!
 */

import { readFile } from 'fs/promises';
import { resolve, join, relative } from 'path';

interface StartOptions {
  port: number;
  config?: string;
}

interface AeonConfig {
  pagesDir: string;
  output?: { dir?: string };
}

interface RouteManifest {
  version: string;
  routes: Array<{
    pattern: string;
    sessionId: string;
    isAeon: boolean;
  }>;
}

export async function start(options: StartOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = options.config || 'aeon.config.ts';
  const port = options.port || 3000;

  console.log('\n🚀 Starting Aeon Flux production server...\n');

  // Load config
  const config = await loadConfig(resolve(cwd, configPath));
  const outputDir = resolve(cwd, config.output?.dir || '.aeon');

  // Check for build output
  const manifestPath = join(outputDir, 'manifest.json');
  let manifest: RouteManifest;

  try {
    const content = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(content);
  } catch {
    console.error('❌ No build found. Run `aeon build` first.\n');
    process.exit(1);
  }

  console.log(`📦 Build: ${relative(cwd, outputDir)}`);
  console.log(`📄 Routes: ${manifest.routes.length}`);
  console.log(`🌐 Port: ${port}`);
  console.log('');

  // Load seed data (simulate D1)
  const sessions = await loadSeedData(outputDir);

  // Start server
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // Match route
      const match = matchRoute(url.pathname, manifest.routes);
      if (!match) {
        return new Response('Not Found', { status: 404 });
      }

      // Get session (simulating D1 query)
      const session = sessions.get(match.sessionId);
      if (!session) {
        return new Response('Session not found', { status: 404 });
      }

      // Render page
      const html = renderPage(session, match);

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    },
    websocket: {
      open(_ws) {
        console.log('   WebSocket client connected');
      },
      close(_ws) {
        console.log('   WebSocket client disconnected');
      },
      message(_ws, _message) {
        // Handle collaboration messages
      },
    },
  });

  console.log(`✨ Ready at http://localhost:${port}\n`);
  console.log('   This is a local preview. In production, deploy to Cloudflare Workers.');
  console.log('   Press Ctrl+C to stop\n');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...\n');
    server.stop();
    process.exit(0);
  });
}

async function loadConfig(configPath: string): Promise<AeonConfig> {
  try {
    const module = await import(configPath);
    return module.default || module;
  } catch {
    return {
      pagesDir: './pages',
    };
  }
}

interface Session {
  route: string;
  tree: SerializedComponent;
  data: Record<string, unknown>;
  schema: { version: string };
}

interface SerializedComponent {
  type: string;
  props?: Record<string, unknown>;
  children?: (SerializedComponent | string)[];
}

async function loadSeedData(outputDir: string): Promise<Map<string, Session>> {
  const sessions = new Map<string, Session>();

  try {
    const seedPath = join(outputDir, 'seed.sql');
    const content = await readFile(seedPath, 'utf-8');

    // Parse INSERT statements (simplified)
    const sessionInserts = content.match(
      /INSERT OR REPLACE INTO sessions \(session_id, route, tree, data, schema_version\) VALUES \('([^']+)', '([^']+)', '(.+?)', '\{\}', '([^']+)'\);/g
    );

    if (sessionInserts) {
      for (const insert of sessionInserts) {
        const match = insert.match(
          /VALUES \('([^']+)', '([^']+)', '(.+?)', '\{\}', '([^']+)'\)/
        );
        if (match) {
          const [, sessionId, route, treeStr, version] = match;
          const tree = JSON.parse(treeStr.replace(/''/g, "'"));
          sessions.set(sessionId, {
            route,
            tree,
            data: {},
            schema: { version },
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to load seed data:', err);
  }

  return sessions;
}

interface RouteMatch {
  pattern: string;
  sessionId: string;
  isAeon: boolean;
  params: Record<string, string>;
}

function matchRoute(
  path: string,
  routes: RouteManifest['routes']
): RouteMatch | null {
  const pathParts = path.split('/').filter(Boolean);

  for (const route of routes) {
    const params = matchPattern(pathParts, route.pattern);
    if (params !== null) {
      return { ...route, params };
    }
  }
  return null;
}

function matchPattern(
  pathParts: string[],
  pattern: string
): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  let pi = 0;
  let pati = 0;

  while (pi < pathParts.length && pati < patternParts.length) {
    const pathPart = pathParts[pi];
    const patternPart = patternParts[pati];

    if (patternPart.startsWith('[[...') && patternPart.endsWith(']]')) {
      const name = patternPart.slice(5, -2);
      params[name] = pathParts.slice(pi).join('/');
      return params;
    } else if (patternPart.startsWith('[...') && patternPart.endsWith(']')) {
      const name = patternPart.slice(4, -1);
      params[name] = pathParts.slice(pi).join('/');
      return params;
    } else if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      const name = patternPart.slice(1, -1);
      params[name] = pathPart;
      pi++;
      pati++;
    } else if (pathPart === patternPart) {
      pi++;
      pati++;
    } else {
      return null;
    }
  }

  if (pati < patternParts.length) {
    const last = patternParts[pati];
    if (last.startsWith('[[...') && last.endsWith(']]')) {
      params[last.slice(5, -2)] = '';
      return params;
    }
  }

  return pi === pathParts.length && pati === patternParts.length ? params : null;
}

function renderPage(session: Session, match: RouteMatch): string {
  const html = renderTree(session.tree);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aeon Flux</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>
  <div id="root">${html}</div>
  ${match.isAeon ? `
  <script>
    window.__AEON_FLUX__ = {
      route: "${match.pattern}",
      sessionId: "${match.sessionId}",
      params: ${JSON.stringify(match.params)},
    };
  </script>
  ` : ''}
</body>
</html>`;
}

function renderTree(node: SerializedComponent | string): string {
  if (typeof node === 'string') return escapeHtml(node);
  if (!node) return '';

  const { type, props = {}, children = [] } = node;
  const attrs = Object.entries(props)
    .map(([k, v]) => {
      if (k === 'className') return `class="${v}"`;
      if (typeof v === 'boolean') return v ? k : '';
      return `${k}="${escapeHtml(String(v))}"`;
    })
    .filter(Boolean)
    .join(' ');

  const childHtml = children.map(renderTree).join('');
  return `<${type}${attrs ? ' ' + attrs : ''}>${childHtml}</${type}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
