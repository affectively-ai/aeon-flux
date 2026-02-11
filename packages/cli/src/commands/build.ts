/**
 * aeon build - Build for production
 *
 * The key insight: pages come from D1, not files!
 *
 * Build process:
 * 1. Parse JSX/TSX pages into AST
 * 2. Serialize component trees to Aeon session format
 * 3. Build CSS manifest (on-demand, tree-shaken)
 * 4. Build asset manifest (inline SVG, images as data URIs)
 * 5. Build font manifest (embedded fonts with @font-face)
 * 6. Pre-render all pages with inline CSS, assets, fonts
 * 7. Seed D1 database with routes, sessions, and pre-rendered HTML
 * 8. Bundle WASM runtime (~20KB)
 * 9. Generate Cloudflare Worker entry point
 *
 * Output: Everything needed for `wrangler deploy`
 */

import {
  readFile,
  readdir,
  writeFile,
  mkdir,
  copyFile,
  stat,
} from 'fs/promises';
import { join, resolve, relative } from 'path';
// Import from build package (relative path for workspace development)
import {
  // CSS Manifest
  buildCSSManifest,
  extractClassesFromTree,
  generateCSSForClasses,
  generateCriticalCSS,
  type CSSManifest,
  // Asset Manifest
  buildAssetManifest,
  resolveAssetsInTree,
  type AssetManifest,
  // Font Manifest
  buildFontManifest,
  getFontFaceCSS,
  type FontManifest,
  // Pre-render
  prerenderPage,
  prerenderAllPages,
  generatePreRenderSeedSQL,
  generatePreRenderMigrationSQL,
  generateManifestSeedSQL,
  type PreRenderOptions,
  // Types
  type PageSession,
  type PreRenderedPage,
} from '../../../build/src/index';

interface BuildOptions {
  config?: string;
}

interface AeonConfig {
  pagesDir: string;
  componentsDir?: string;
  assetsDir?: string;
  fontsDir?: string;
  runtime: 'bun' | 'cloudflare';
  output?: { dir?: string };
  aeon?: {
    sync?: { mode: string };
  };
  prerender?: {
    enabled?: boolean;
    hydration?: boolean;
    fontFamilies?: string[];
  };
  env?: Record<string, string>;
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
  const assetsDir = config.assetsDir
    ? resolve(cwd, config.assetsDir)
    : resolve(cwd, './public');
  const fontsDir = config.fontsDir
    ? resolve(cwd, config.fontsDir)
    : resolve(cwd, './fonts');
  const prerenderEnabled = config.prerender?.enabled !== false;
  const version = `${Date.now().toString(36)}`;

  // Create output directories
  await mkdir(join(outputDir, 'dist'), { recursive: true });
  await mkdir(join(outputDir, 'migrations'), { recursive: true });
  await mkdir(join(outputDir, 'manifests'), { recursive: true });

  console.log('📁 Output: ' + relative(cwd, outputDir));
  console.log('');

  // Step 1: Scan and parse pages
  console.log('1️⃣  Parsing pages...');
  const pages = await parsePages(pagesDir);
  console.log(`   Found ${pages.length} page(s)`);

  // Step 2: Build manifests (CSS, assets, fonts)
  console.log('2️⃣  Building manifests...');

  // Build CSS manifest
  const allClasses = new Set<string>();
  for (const page of pages) {
    const classes = extractClassesFromTree(page.componentTree);
    classes.forEach((c) => allClasses.add(c));
  }
  const cssManifest = buildCSSManifest(allClasses);
  await writeFile(
    join(outputDir, 'manifests', 'css.json'),
    JSON.stringify(cssManifest, null, 2),
  );
  console.log(`   ✓ CSS manifest (${allClasses.size} classes)`);

  // Build asset manifest
  let assetManifest: AssetManifest;
  try {
    assetManifest = await buildAssetManifest(assetsDir);
    await writeFile(
      join(outputDir, 'manifests', 'assets.json'),
      JSON.stringify(assetManifest, null, 2),
    );
    console.log(
      `   ✓ Asset manifest (${assetManifest.totalCount} assets, ${(assetManifest.totalSize / 1024).toFixed(1)}KB)`,
    );
  } catch {
    assetManifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      assets: {},
      totalSize: 0,
      totalCount: 0,
    };
    console.log('   ⚠️  No assets directory found, skipping');
  }

  // Build font manifest
  let fontManifest: FontManifest;
  try {
    fontManifest = await buildFontManifest(fontsDir);
    await writeFile(
      join(outputDir, 'manifests', 'fonts.json'),
      JSON.stringify(fontManifest, null, 2),
    );
    console.log(
      `   ✓ Font manifest (${fontManifest.totalCount} fonts, ${(fontManifest.totalSize / 1024).toFixed(1)}KB)`,
    );
  } catch {
    fontManifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      fonts: {},
      fontFaceCSS: '',
      totalSize: 0,
      totalCount: 0,
    };
    console.log('   ⚠️  No fonts directory found, skipping');
  }

  // Step 3: Generate route manifest
  console.log('3️⃣  Generating route manifest...');
  const manifest = generateManifest(pages);
  await writeFile(
    join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  console.log('   ✓ manifest.json');

  // Step 4: Generate D1 migration
  console.log('4️⃣  Generating D1 migration...');
  const migration = generateMigration(pages);
  const prerenderMigration = generatePreRenderMigrationSQL();
  await writeFile(
    join(outputDir, 'migrations', '0001_initial.sql'),
    migration + '\n' + prerenderMigration,
  );
  console.log('   ✓ migrations/0001_initial.sql');

  // Step 5: Pre-render pages (if enabled)
  let preRenderedPages: PreRenderedPage[] = [];
  if (prerenderEnabled && pages.length > 0) {
    console.log('5️⃣  Pre-rendering pages...');
    const sessions: PageSession[] = pages.map((page) => ({
      route: page.route,
      tree: page.componentTree,
      data: {
        title: extractTitle(page.componentTree) || 'Aeon Flux',
        description: '',
      },
      schema: { version: '1.0.0' },
    }));

    const prerenderOptions: PreRenderOptions = {
      cssManifest,
      assetManifest,
      fontManifest,
      fontFamilies: config.prerender?.fontFamilies,
      addHydrationScript: config.prerender?.hydration !== false,
      env: config.env,
    };

    const result = await prerenderAllPages(sessions, prerenderOptions);
    preRenderedPages = result.pages;

    // Write pre-render seed SQL
    const prerenderSeed = generatePreRenderSeedSQL(preRenderedPages, version);
    await writeFile(join(outputDir, 'prerender-seed.sql'), prerenderSeed);
    console.log(
      `   ✓ prerender-seed.sql (${preRenderedPages.length} pages, ${(result.totalSize / 1024).toFixed(1)}KB total)`,
    );
  } else {
    console.log('5️⃣  Pre-rendering skipped (disabled or no pages)');
  }

  // Step 6: Store manifests for D1 (for runtime re-rendering)
  console.log('6️⃣  Generating manifest seed SQL...');
  const manifestSeed = generateManifestSeedSQL(
    cssManifest,
    assetManifest,
    fontManifest,
    version,
  );
  await writeFile(join(outputDir, 'manifest-seed.sql'), manifestSeed);
  console.log('   ✓ manifest-seed.sql (CSS, assets, fonts)');

  // Step 7: Generate seed data
  console.log('7️⃣  Generating D1 seed data...');
  const seedData = generateSeedData(pages);
  await writeFile(join(outputDir, 'seed.sql'), seedData);
  console.log('   ✓ seed.sql');

  // Step 8: Copy WASM runtime
  console.log('8️⃣  Bundling WASM runtime...');
  try {
    // Try to find the WASM package
    const wasmPkgPath = resolve(
      cwd,
      'node_modules/@affectively/aeon-pages-runtime-wasm',
    );
    await copyFile(
      join(wasmPkgPath, 'aeon_pages_runtime_bg.wasm'),
      join(outputDir, 'dist', 'runtime.wasm'),
    );
    await copyFile(
      join(wasmPkgPath, 'aeon_pages_runtime.js'),
      join(outputDir, 'dist', 'runtime.js'),
    );
    console.log('   ✓ runtime.wasm (~20KB)');
  } catch {
    console.log('   ⚠️  WASM runtime not found, skipping');
  }

  // Step 9: Generate Cloudflare Worker
  console.log('9️⃣  Generating Cloudflare Worker...');
  const workerCode = generateWorker(pages, prerenderEnabled);
  await writeFile(join(outputDir, 'dist', 'worker.js'), workerCode);
  console.log('   ✓ worker.js');

  // Step 10: Generate wrangler.toml
  console.log('🔟 Generating wrangler config...');
  const wranglerConfig = generateWranglerConfig();
  await writeFile(join(outputDir, 'wrangler.toml'), wranglerConfig);
  console.log('   ✓ wrangler.toml');

  const elapsed = Date.now() - startTime;
  console.log(`\n✨ Build complete in ${elapsed}ms\n`);

  if (prerenderEnabled && preRenderedPages.length > 0) {
    console.log('📊 Pre-render stats:');
    console.log(`   Pages: ${preRenderedPages.length}`);
    console.log(
      `   Total size: ${(preRenderedPages.reduce((a, p) => a + p.size, 0) / 1024).toFixed(1)}KB`,
    );
    console.log(
      `   Avg size: ${(preRenderedPages.reduce((a, p) => a + p.size, 0) / preRenderedPages.length / 1024).toFixed(1)}KB per page`,
    );
    console.log('');
  }

  console.log('Next steps:');
  console.log('  1. Create D1 database:');
  console.log('     wrangler d1 create aeon-flux');
  console.log('');
  console.log('  2. Create KV namespace (edge cache):');
  console.log('     wrangler kv:namespace create PAGES_CACHE');
  console.log('');
  console.log('  3. Run migration:');
  console.log(
    `     wrangler d1 execute aeon-flux --file=${relative(cwd, join(outputDir, 'migrations/0001_initial.sql'))}`,
  );
  console.log('');
  console.log('  4. Seed data:');
  console.log(
    `     wrangler d1 execute aeon-flux --file=${relative(cwd, join(outputDir, 'seed.sql'))}`,
  );
  console.log(
    `     wrangler d1 execute aeon-flux --file=${relative(cwd, join(outputDir, 'manifest-seed.sql'))}`,
  );
  if (prerenderEnabled && preRenderedPages.length > 0) {
    console.log(
      `     wrangler d1 execute aeon-flux --file=${relative(cwd, join(outputDir, 'prerender-seed.sql'))}`,
    );
  }
  console.log('');
  console.log('  5. Update wrangler.toml with your IDs:');
  console.log('     - database_id: from step 1 output');
  console.log('     - kv namespace id: from step 2 output');
  console.log('');
  console.log('  6. Deploy:');
  console.log(`     cd ${relative(cwd, outputDir)} && wrangler deploy`);
  console.log('');
}

// Extract title from component tree
function extractTitle(tree: SerializedComponent): string | undefined {
  if (tree.type === 'title' && tree.children?.[0]) {
    return String(tree.children[0]);
  }
  if (tree.type === 'h1' && tree.children?.[0]) {
    return String(tree.children[0]);
  }
  if (tree.children) {
    for (const child of tree.children) {
      if (typeof child !== 'string') {
        const title = extractTitle(child);
        if (title) return title;
      }
    }
  }
  return undefined;
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
    const escapedLayout = page.layout
      ? `'${page.layout.replace(/'/g, "''")}'`
      : 'NULL';

    lines.push(
      `INSERT OR REPLACE INTO routes (path, pattern, session_id, component_id, layout, is_aeon) VALUES ('${escapedPattern}', '${escapedPattern}', '${sessionId}', '${sessionId}', ${escapedLayout}, ${page.isAeon ? 1 : 0});`,
    );
  }

  lines.push('');
  lines.push('-- Sessions');

  for (const page of pages) {
    const sessionId = routeToSessionId(page.route);
    const escapedRoute = page.route.replace(/'/g, "''");
    const tree = JSON.stringify(page.componentTree).replace(/'/g, "''");

    lines.push(
      `INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version) VALUES ('${sessionId}', '${escapedRoute}', '${tree}', '{}', '1.0.0');`,
    );
  }

  return lines.join('\n');
}

function generateWorker(
  pages: ParsedPage[],
  prerenderEnabled: boolean = true,
): string {
  const routes = pages.map((p) => ({
    pattern: p.route,
    sessionId: routeToSessionId(p.route),
    isAeon: p.isAeon,
  }));

  return `/**
 * Aeon Flux Cloudflare Worker
 * Generated: ${new Date().toISOString()}
 *
 * Zero-dependency rendering with multi-layer caching:
 * 1. First, try KV cache (edge, ~1ms)
 * 2. Then, try D1 pre-rendered pages (~5ms)
 * 3. Fallback to session-based rendering (~50ms)
 *
 * Pre-rendered pages include:
 * - Inline CSS (tree-shaken, only what's needed)
 * - Inline assets (SVG, images as data URIs)
 * - Inline fonts (@font-face with data URIs)
 * - Minimal hydration script for interactivity
 */

// Route manifest (baked in at build time)
const ROUTES = ${JSON.stringify(routes, null, 2)};
const PRERENDER_ENABLED = ${prerenderEnabled};
const CACHE_TTL = 3600; // 1 hour in KV
const BUILD_VERSION = '${Date.now().toString(36)}'; // For cache invalidation

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

    const cacheKey = \`page:\${match.pattern}\`;

    // Layer 1: Try KV cache first (edge, fastest ~1ms)
    // Only use cache if version matches current build (auto-invalidation on deploy)
    if (env.PAGES_CACHE) {
      const cached = await getFromKV(env.PAGES_CACHE, cacheKey);
      if (cached && cached.version === BUILD_VERSION) {
        return new Response(cached.html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Aeon-Cache': 'HIT-KV',
            'X-Aeon-Version': cached.version,
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        });
      }
      // Stale cache from old version - will be replaced with fresh content
    }

    // Layer 2: Try D1 pre-rendered page (~5ms)
    if (PRERENDER_ENABLED) {
      const preRendered = await getPreRenderedPage(env.DB, match.pattern);
      if (preRendered) {
        // Cache in KV for next request
        if (env.PAGES_CACHE) {
          ctx.waitUntil(
            env.PAGES_CACHE.put(cacheKey, JSON.stringify(preRendered), {
              expirationTtl: CACHE_TTL
            })
          );
        }
        return new Response(preRendered.html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Aeon-Cache': 'HIT-D1',
            'X-Aeon-Version': preRendered.version,
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        });
      }
    }

    // Layer 3: Fallback to session-based rendering (~50ms)
    const session = await getSession(env.DB, match.sessionId);
    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    // Render page
    const html = renderPage(session, match);

    // Cache the rendered page in KV for next request
    if (env.PAGES_CACHE) {
      const cacheData = { html, version: BUILD_VERSION };
      ctx.waitUntil(
        env.PAGES_CACHE.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: CACHE_TTL
        })
      );
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Aeon-Cache': 'MISS',
      },
    });
  },
};

// Get page from KV cache
async function getFromKV(kv, key) {
  try {
    const value = await kv.get(key);
    if (value) {
      return JSON.parse(value);
    }
  } catch {
    // Cache miss or parse error
  }
  return null;
}

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

// Get pre-rendered page from D1 (zero-rendering path)
async function getPreRenderedPage(db, route) {
  try {
    const result = await db
      .prepare('SELECT html, version FROM rendered_pages WHERE route = ?')
      .bind(route)
      .first();

    return result ? { html: result.html, version: result.version } : null;
  } catch {
    return null;
  }
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

# KV Namespace - edge page cache (~1ms)
[[kv_namespaces]]
binding = "PAGES_CACHE"
id = "YOUR_KV_ID"  # Replace after \`wrangler kv:namespace create PAGES_CACHE\`

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
