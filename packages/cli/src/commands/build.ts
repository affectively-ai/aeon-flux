/**
 * aeon build - Build for production
 *
 * The key insight: pages come from D1, not files!
 *
 * Build process:
 * 1. Parse JSX/TSX pages into AST
 * 2. Serialize component trees to Aeon session format
 * 3. Seed D1 database with routes and sessions
 * 4. Bundle WASM runtime (~20KB)
 * 5. Generate Cloudflare Worker entry point
 *
 * Output: Everything needed for `wrangler deploy`
 */

import { readFile, readdir, writeFile, mkdir, copyFile, stat } from 'fs/promises';
import { join, resolve, relative } from 'path';

interface BuildOptions {
  config?: string;
}

interface AeonConfig {
  pagesDir: string;
  componentsDir?: string;
  runtime: 'bun' | 'cloudflare';
  output?: { dir?: string };
  aeon?: {
    sync?: { mode: string };
  };
}

interface ParsedPage {
  route: string;
  filePath: string;
  isAeon: boolean;
  componentTree: SerializedComponent;
  layout?: string;
}

interface SerializedComponent {
  type: string;
  props?: Record<string, unknown>;
  children?: (SerializedComponent | string)[];
}

export async function build(options: BuildOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = options.config || 'aeon.config.ts';
  const startTime = Date.now();

  console.log('\n🔨 Building Aeon Flux for production...\n');

  // Load config
  const config = await loadConfig(resolve(cwd, configPath));
  const outputDir = resolve(cwd, config.output?.dir || '.aeon');
  const pagesDir = resolve(cwd, config.pagesDir || './pages');

  // Create output directories
  await mkdir(join(outputDir, 'dist'), { recursive: true });
  await mkdir(join(outputDir, 'migrations'), { recursive: true });

  console.log('📁 Output: ' + relative(cwd, outputDir));
  console.log('');

  // Step 1: Scan and parse pages
  console.log('1️⃣  Parsing pages...');
  const pages = await parsePages(pagesDir);
  console.log(`   Found ${pages.length} page(s)`);

  // Step 2: Generate route manifest
  console.log('2️⃣  Generating route manifest...');
  const manifest = generateManifest(pages);
  await writeFile(
    join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('   ✓ manifest.json');

  // Step 3: Generate D1 migration
  console.log('3️⃣  Generating D1 migration...');
  const migration = generateMigration(pages);
  await writeFile(
    join(outputDir, 'migrations', '0001_initial.sql'),
    migration
  );
  console.log('   ✓ migrations/0001_initial.sql');

  // Step 4: Generate seed data
  console.log('4️⃣  Generating D1 seed data...');
  const seedData = generateSeedData(pages);
  await writeFile(
    join(outputDir, 'seed.sql'),
    seedData
  );
  console.log('   ✓ seed.sql');

  // Step 5: Copy WASM runtime
  console.log('5️⃣  Bundling WASM runtime...');
  try {
    // Try to find the WASM package
    const wasmPkgPath = resolve(cwd, 'node_modules/@affectively/aeon-pages-runtime-wasm');
    await copyFile(
      join(wasmPkgPath, 'aeon_pages_runtime_bg.wasm'),
      join(outputDir, 'dist', 'runtime.wasm')
    );
    await copyFile(
      join(wasmPkgPath, 'aeon_pages_runtime.js'),
      join(outputDir, 'dist', 'runtime.js')
    );
    console.log('   ✓ runtime.wasm (~20KB)');
  } catch {
    console.log('   ⚠️  WASM runtime not found, skipping');
  }

  // Step 6: Generate Cloudflare Worker
  console.log('6️⃣  Generating Cloudflare Worker...');
  const workerCode = generateWorker(pages);
  await writeFile(join(outputDir, 'dist', 'worker.js'), workerCode);
  console.log('   ✓ worker.js');

  // Step 7: Generate wrangler.toml
  console.log('7️⃣  Generating wrangler config...');
  const wranglerConfig = generateWranglerConfig();
  await writeFile(join(outputDir, 'wrangler.toml'), wranglerConfig);
  console.log('   ✓ wrangler.toml');

  const elapsed = Date.now() - startTime;
  console.log(`\n✨ Build complete in ${elapsed}ms\n`);

  console.log('Next steps:');
  console.log('  1. Create D1 database:');
  console.log('     wrangler d1 create aeon-flux');
  console.log('');
  console.log('  2. Run migration:');
  console.log(`     wrangler d1 execute aeon-flux --file=${relative(cwd, join(outputDir, 'migrations/0001_initial.sql'))}`);
  console.log('');
  console.log('  3. Seed data:');
  console.log(`     wrangler d1 execute aeon-flux --file=${relative(cwd, join(outputDir, 'seed.sql'))}`);
  console.log('');
  console.log('  4. Deploy:');
  console.log(`     cd ${relative(cwd, outputDir)} && wrangler deploy`);
  console.log('');
}

async function loadConfig(configPath: string): Promise<AeonConfig> {
  try {
    const module = await import(configPath);
    return module.default || module;
  } catch {
    return {
      pagesDir: './pages',
      runtime: 'cloudflare',
    };
  }
}

async function parsePages(pagesDir: string): Promise<ParsedPage[]> {
  const pages: ParsedPage[] = [];

  async function scan(dir: string, routePath: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        let segment = entry.name;
        if (segment.startsWith('[') && segment.endsWith(']')) {
          if (segment.startsWith('[...')) {
            segment = '[...' + segment.slice(4, -1) + ']';
          } else if (segment.startsWith('[[...')) {
            segment = '[[...' + segment.slice(5, -2) + ']]';
          }
        }
        await scan(fullPath, `${routePath}/${segment}`);
      } else if (
        entry.isFile() &&
        (entry.name === 'page.tsx' ||
          entry.name === 'page.ts' ||
          entry.name === 'page.jsx')
      ) {
        const content = await readFile(fullPath, 'utf-8');
        const isAeon =
          content.includes("'use aeon'") || content.includes('"use aeon"');

        // Parse JSX to component tree (simplified - real impl would use proper parser)
        const componentTree = parseJSXToTree(content);

        // Check for layout
        const layoutPath = join(dir, 'layout.tsx');
        let layout: string | undefined;
        try {
          await stat(layoutPath);
          layout = routePath || '/';
        } catch {
          // No layout
        }

        pages.push({
          route: routePath || '/',
          filePath: fullPath,
          isAeon,
          componentTree,
          layout,
        });
      }
    }
  }

  await scan(pagesDir, '');
  return pages;
}

function parseJSXToTree(content: string): SerializedComponent {
  // Simplified JSX parser - extracts component structure
  // Real implementation would use @babel/parser or swc

  // Find the return statement in the component
  const returnMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*\}/);

  if (!returnMatch) {
    return { type: 'div', children: ['Page content'] };
  }

  const jsx = returnMatch[1];

  // Very basic extraction - just get the root element type
  const rootMatch = jsx.match(/<(\w+)/);
  const rootType = rootMatch?.[1] || 'div';

  // Extract text content (simplified)
  const textContent = jsx
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]+\}/g, '')
    .trim()
    .slice(0, 100);

  return {
    type: rootType,
    props: { className: 'aeon-page' },
    children: textContent ? [textContent] : ['Page content'],
  };
}

interface RouteManifest {
  version: string;
  routes: Array<{
    pattern: string;
    sessionId: string;
    componentId: string;
    isAeon: boolean;
    layout?: string;
  }>;
}

function generateManifest(pages: ParsedPage[]): RouteManifest {
  return {
    version: '1.0.0',
    routes: pages.map((page) => ({
      pattern: page.route,
      sessionId: routeToSessionId(page.route),
      componentId: routeToSessionId(page.route),
      isAeon: page.isAeon,
      layout: page.layout,
    })),
  };
}

function generateMigration(_pages: ParsedPage[]): string {
  return `-- Aeon Flux D1 Migration
-- Generated: ${new Date().toISOString()}

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  path TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,
  session_id TEXT NOT NULL,
  component_id TEXT NOT NULL,
  layout TEXT,
  is_aeon INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (page content)
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  tree TEXT NOT NULL,
  data TEXT DEFAULT '{}',
  schema_version TEXT DEFAULT '1.0.0',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Presence tracking
CREATE TABLE IF NOT EXISTS presence (
  session_id TEXT,
  user_id TEXT,
  role TEXT DEFAULT 'user',
  cursor_x INTEGER,
  cursor_y INTEGER,
  editing TEXT,
  status TEXT DEFAULT 'online',
  last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routes_pattern ON routes(pattern);
CREATE INDEX IF NOT EXISTS idx_sessions_route ON sessions(route);
CREATE INDEX IF NOT EXISTS idx_presence_session ON presence(session_id);
`;
}

function generateSeedData(pages: ParsedPage[]): string {
  const lines: string[] = [
    '-- Aeon Flux Seed Data',
    `-- Generated: ${new Date().toISOString()}`,
    '',
    '-- Routes',
  ];

  for (const page of pages) {
    const sessionId = routeToSessionId(page.route);
    const escapedPattern = page.route.replace(/'/g, "''");
    const escapedLayout = page.layout ? `'${page.layout.replace(/'/g, "''")}'` : 'NULL';

    lines.push(`INSERT OR REPLACE INTO routes (path, pattern, session_id, component_id, layout, is_aeon) VALUES ('${escapedPattern}', '${escapedPattern}', '${sessionId}', '${sessionId}', ${escapedLayout}, ${page.isAeon ? 1 : 0});`);
  }

  lines.push('');
  lines.push('-- Sessions');

  for (const page of pages) {
    const sessionId = routeToSessionId(page.route);
    const escapedRoute = page.route.replace(/'/g, "''");
    const tree = JSON.stringify(page.componentTree).replace(/'/g, "''");

    lines.push(`INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version) VALUES ('${sessionId}', '${escapedRoute}', '${tree}', '{}', '1.0.0');`);
  }

  return lines.join('\n');
}

function generateWorker(pages: ParsedPage[]): string {
  const routes = pages.map((p) => ({
    pattern: p.route,
    sessionId: routeToSessionId(p.route),
    isAeon: p.isAeon,
  }));

  return `/**
 * Aeon Flux Cloudflare Worker
 * Generated: ${new Date().toISOString()}
 *
 * Pages come from D1, not files!
 * Runtime: ~20KB WASM
 */

// Route manifest (baked in at build time)
const ROUTES = ${JSON.stringify(routes, null, 2)};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // WebSocket upgrade for real-time collaboration
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocket(request, env, url);
    }

    // Match route
    const match = matchRoute(url.pathname, ROUTES);
    if (!match) {
      return new Response('Not Found', { status: 404 });
    }

    // Get session from D1
    const session = await getSession(env.DB, match.sessionId);
    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    // Render page
    const html = renderPage(session, match);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

function matchRoute(path, routes) {
  const pathParts = path.split('/').filter(Boolean);

  for (const route of routes) {
    const params = matchPattern(pathParts, route.pattern);
    if (params !== null) {
      return { ...route, params };
    }
  }
  return null;
}

function matchPattern(pathParts, pattern) {
  const patternParts = pattern.split('/').filter(Boolean);
  const params = {};

  let pi = 0, pati = 0;
  while (pi < pathParts.length && pati < patternParts.length) {
    const pathPart = pathParts[pi];
    const patternPart = patternParts[pati];

    if (patternPart.startsWith('[[...') && patternPart.endsWith(']]')) {
      // Optional catch-all
      const name = patternPart.slice(5, -2);
      params[name] = pathParts.slice(pi).join('/');
      return params;
    } else if (patternPart.startsWith('[...') && patternPart.endsWith(']')) {
      // Catch-all
      const name = patternPart.slice(4, -1);
      params[name] = pathParts.slice(pi).join('/');
      return params;
    } else if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      // Dynamic
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

async function getSession(db, sessionId) {
  const result = await db
    .prepare('SELECT * FROM sessions WHERE session_id = ?')
    .bind(sessionId)
    .first();

  if (!result) return null;

  return {
    route: result.route,
    tree: JSON.parse(result.tree),
    data: JSON.parse(result.data || '{}'),
    schema: { version: result.schema_version },
  };
}

function renderPage(session, match) {
  const tree = session.tree;
  const html = renderTree(tree);

  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aeon Flux</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet">
  \${match.isAeon ? '<script src="/__aeon_flux.js" defer></script>' : ''}
</head>
<body>
  <div id="root">\${html}</div>
  \${match.isAeon ? \`
  <script>
    window.__AEON_FLUX__ = {
      route: "\${match.pattern}",
      sessionId: "\${match.sessionId}",
      params: \${JSON.stringify(match.params)},
    };
  </script>
  \` : ''}
</body>
</html>\`;
}

function renderTree(node) {
  if (typeof node === 'string') return escapeHtml(node);
  if (!node) return '';

  const { type, props = {}, children = [] } = node;
  const attrs = Object.entries(props)
    .map(([k, v]) => {
      if (k === 'className') return \`class="\${v}"\`;
      if (typeof v === 'boolean') return v ? k : '';
      return \`\${k}="\${escapeHtml(String(v))}"\`;
    })
    .filter(Boolean)
    .join(' ');

  const childHtml = children.map(renderTree).join('');
  return \`<\${type}\${attrs ? ' ' + attrs : ''}>\${childHtml}</\${type}>\`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function handleWebSocket(request, env, url) {
  const sessionId = url.searchParams.get('session') || 'index';

  // Get Durable Object for this session
  const id = env.AEON_SESSIONS.idFromName(sessionId);
  const stub = env.AEON_SESSIONS.get(id);

  return stub.fetch(request);
}

// Export Durable Object classes for wrangler
export { AeonPageSession } from './durable-object.js';
`;
}

function generateWranglerConfig(): string {
  return `# Aeon Flux Cloudflare Worker Configuration
# Generated: ${new Date().toISOString()}

name = "aeon-flux"
main = "dist/worker.js"
compatibility_date = "2024-01-01"

# D1 Database - pages come from here!
[[d1_databases]]
binding = "DB"
database_name = "aeon-flux"
database_id = "YOUR_DATABASE_ID"  # Replace after \`wrangler d1 create\`

# Durable Objects - real-time collaboration
[durable_objects]
bindings = [
  { name = "AEON_SESSIONS", class_name = "AeonPageSession" }
]

[[migrations]]
tag = "v1"
new_classes = ["AeonPageSession"]

# Optional: Assets
# [site]
# bucket = "./public"
`;
}

function routeToSessionId(route: string): string {
  return route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
}
