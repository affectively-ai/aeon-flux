import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm, readFile, readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { build } from './build';

describe('aeon build', () => {
  const originalCwd = process.cwd();
  const testDir = resolve(originalCwd, '.aeon-test-build');
  const pagesDir = join(testDir, 'pages');
  const outputDir = join(testDir, '.aeon');

  beforeEach(async () => {
    // Clean up any existing test dir
    await rm(testDir, { recursive: true, force: true });

    // Create test directory structure
    await mkdir(pagesDir, { recursive: true });
    await mkdir(join(pagesDir, 'blog', '[slug]'), { recursive: true });
    await mkdir(join(pagesDir, 'docs', '[[...path]]'), { recursive: true });
    await mkdir(join(pagesDir, 'api', '[...catchall]'), { recursive: true });

    // Create test pages
    await writeFile(
      join(pagesDir, 'page.tsx'),
      `'use aeon';

export default function Home() {
  return (
    <div className="container">
      <h1>Welcome to Aeon Flux</h1>
      <p>The CMS is the website.</p>
    </div>
  );
}`,
    );

    await writeFile(
      join(pagesDir, 'blog', '[slug]', 'page.tsx'),
      `'use aeon';

export default function BlogPost({ params }) {
  return (
    <article>
      <h1>Blog Post</h1>
    </article>
  );
}`,
    );

    await writeFile(
      join(pagesDir, 'blog', '[slug]', 'layout.tsx'),
      `export default function BlogLayout({ children }) {
  return <div className="blog-layout">{children}</div>;
}`,
    );

    await writeFile(
      join(pagesDir, 'docs', '[[...path]]', 'page.tsx'),
      `"use aeon";

export default function Docs() {
  return (
    <section>
      <h1>Documentation</h1>
    </section>
  );
}`,
    );

    await writeFile(
      join(pagesDir, 'api', '[...catchall]', 'page.ts'),
      `// Static page - no directive
export default function ApiDocs() {
  return { type: 'div', children: ['API Docs'] };
}`,
    );

    // Create config
    await writeFile(
      join(testDir, 'aeon.config.ts'),
      `export default {
  pagesDir: './pages',
  runtime: 'cloudflare',
  output: { dir: '.aeon' },
};`,
    );

    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(testDir, { recursive: true, force: true });
  });

  test('generates manifest.json with all routes', async () => {
    await build({});

    const manifest = JSON.parse(
      await readFile(join(outputDir, 'manifest.json'), 'utf-8'),
    );

    expect(manifest.version).toBe('1.0.0');
    expect(manifest.routes.length).toBeGreaterThanOrEqual(4);

    // Check root route
    const rootRoute = manifest.routes.find((r: any) => r.pattern === '/');
    expect(rootRoute).toBeDefined();
    expect(rootRoute.isAeon).toBe(true);
    expect(rootRoute.sessionId).toBe('index');

    // Check dynamic route
    const blogRoute = manifest.routes.find((r: any) =>
      r.pattern.includes('[slug]'),
    );
    expect(blogRoute).toBeDefined();
    expect(blogRoute.isAeon).toBe(true);

    // Check optional catch-all
    const docsRoute = manifest.routes.find((r: any) =>
      r.pattern.includes('[[...path]]'),
    );
    expect(docsRoute).toBeDefined();

    // Check non-aeon route
    const apiRoute = manifest.routes.find((r: any) =>
      r.pattern.includes('[...catchall]'),
    );
    expect(apiRoute).toBeDefined();
    expect(apiRoute.isAeon).toBe(false);
  });

  test('generates D1 migration SQL', async () => {
    await build({});

    const migration = await readFile(
      join(outputDir, 'migrations', '0001_initial.sql'),
      'utf-8',
    );

    // Check for tables
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS routes');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS sessions');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS presence');

    // Check for indexes
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS idx_routes_pattern',
    );
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS idx_sessions_route',
    );
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS idx_presence_session',
    );

    // Check columns
    expect(migration).toContain('path TEXT PRIMARY KEY');
    expect(migration).toContain('session_id TEXT');
    expect(migration).toContain('tree TEXT NOT NULL');
    expect(migration).toContain('schema_version TEXT');
  });

  test('generates seed.sql with route and session data', async () => {
    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');

    // Check for route insertions
    expect(seed).toContain('INSERT OR REPLACE INTO routes');
    expect(seed).toContain('pattern, session_id, component_id');

    // Check for session insertions
    expect(seed).toContain('INSERT OR REPLACE INTO sessions');
    expect(seed).toContain('tree');
    expect(seed).toContain('schema_version');

    // Check that component tree is serialized
    expect(seed).toContain('"type"');
    expect(seed).toContain('"children"');
  });

  test('generates Cloudflare Worker', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    // Check for route matching
    expect(worker).toContain('const ROUTES =');
    expect(worker).toContain('matchRoute');
    expect(worker).toContain('matchPattern');

    // Check for D1 integration
    expect(worker).toContain('getSession');
    expect(worker).toContain('env.DB');
    expect(worker).toContain('.prepare(');

    // Check for WebSocket handling
    expect(worker).toContain('handleWebSocket');
    expect(worker).toContain('AEON_SESSIONS');

    // Check for rendering
    expect(worker).toContain('renderPage');
    expect(worker).toContain('renderTree');

    // Check for dynamic segment handling
    expect(worker).toContain('[[...');
    expect(worker).toContain('[...');
  });

  test('generates wrangler.toml', async () => {
    await build({});

    const wrangler = await readFile(join(outputDir, 'wrangler.toml'), 'utf-8');

    expect(wrangler).toContain('name = "aeon-flux"');
    expect(wrangler).toContain('main = "dist/worker.js"');
    expect(wrangler).toContain('[[d1_databases]]');
    expect(wrangler).toContain('binding = "DB"');
    expect(wrangler).toContain('[durable_objects]');
    expect(wrangler).toContain('AeonPageSession');
  });

  test('parses JSX and extracts component tree', async () => {
    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');

    // Check that JSX was parsed into tree structure
    // The home page has a div with className "container"
    expect(seed).toContain('"type"');

    // Check for text content extraction
    expect(seed.toLowerCase()).toContain('welcome');
  });

  test('detects use aeon directive with single quotes', async () => {
    await build({});

    const manifest = JSON.parse(
      await readFile(join(outputDir, 'manifest.json'), 'utf-8'),
    );

    const homeRoute = manifest.routes.find((r: any) => r.pattern === '/');
    expect(homeRoute.isAeon).toBe(true);
  });

  test('detects use aeon directive with double quotes', async () => {
    await build({});

    const manifest = JSON.parse(
      await readFile(join(outputDir, 'manifest.json'), 'utf-8'),
    );

    const docsRoute = manifest.routes.find((r: any) =>
      r.pattern.includes('docs'),
    );
    expect(docsRoute.isAeon).toBe(true);
  });

  test('detects non-aeon pages', async () => {
    await build({});

    const manifest = JSON.parse(
      await readFile(join(outputDir, 'manifest.json'), 'utf-8'),
    );

    const apiRoute = manifest.routes.find((r: any) =>
      r.pattern.includes('api'),
    );
    expect(apiRoute.isAeon).toBe(false);
  });

  test('handles layout files', async () => {
    await build({});

    const manifest = JSON.parse(
      await readFile(join(outputDir, 'manifest.json'), 'utf-8'),
    );

    const blogRoute = manifest.routes.find((r: any) =>
      r.pattern.includes('[slug]'),
    );
    expect(blogRoute.layout).toBeDefined();
  });

  test('creates correct output directory structure', async () => {
    await build({});

    const distFiles = await readdir(join(outputDir, 'dist'));
    expect(distFiles).toContain('worker.js');

    const migrationFiles = await readdir(join(outputDir, 'migrations'));
    expect(migrationFiles).toContain('0001_initial.sql');

    const rootFiles = await readdir(outputDir);
    expect(rootFiles).toContain('manifest.json');
    expect(rootFiles).toContain('seed.sql');
    expect(rootFiles).toContain('wrangler.toml');
  });

  test('generates valid SQL for seed data', async () => {
    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');

    // Check SQL syntax
    const statements = seed.split(';').filter((s) => s.trim());
    for (const stmt of statements) {
      if (stmt.includes('INSERT')) {
        expect(stmt).toMatch(/INSERT OR REPLACE INTO \w+ \([^)]+\) VALUES/);
      }
    }

    // Check for proper escaping
    expect(seed).not.toContain("''"); // No double single quotes unless escaping
  });

  test('handles empty pages directory gracefully', async () => {
    // Remove all pages
    await rm(pagesDir, { recursive: true });
    await mkdir(pagesDir, { recursive: true });

    await build({});

    const manifest = JSON.parse(
      await readFile(join(outputDir, 'manifest.json'), 'utf-8'),
    );

    expect(manifest.routes).toEqual([]);
  });

  test('uses default config when config file missing', async () => {
    // Remove config
    await rm(join(testDir, 'aeon.config.ts'));

    // Create pages in default location
    await mkdir(join(testDir, 'pages'), { recursive: true });
    await writeFile(
      join(testDir, 'pages', 'page.tsx'),
      `'use aeon';\nexport default function Page() { return <div>Test</div>; }`,
    );

    await build({ config: 'nonexistent.config.ts' });

    // Should use defaults and still work
    const manifest = JSON.parse(
      await readFile(join(testDir, '.aeon', 'manifest.json'), 'utf-8'),
    );
    expect(manifest.version).toBe('1.0.0');
  });
});

describe('AST to D1 sync', () => {
  const originalCwd = process.cwd();
  const testDir = resolve(originalCwd, '.aeon-test-ast-sync');
  const pagesDir = join(testDir, 'pages');
  const outputDir = join(testDir, '.aeon');

  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(pagesDir, { recursive: true });
    await writeFile(
      join(testDir, 'aeon.config.ts'),
      `export default { pagesDir: './pages', runtime: 'cloudflare' };`,
    );
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(testDir, { recursive: true, force: true });
  });

  test('extracts component type from JSX', async () => {
    await writeFile(
      join(pagesDir, 'page.tsx'),
      `'use aeon';
export default function Test() {
  return (
    <main className="test">
      <h1>Title</h1>
    </main>
  );
}`,
    );

    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');
    expect(seed).toContain('"type":"main"');
  });

  test('extracts text content from JSX', async () => {
    await writeFile(
      join(pagesDir, 'page.tsx'),
      `'use aeon';
export default function Test() {
  return (
    <div>
      Hello World Content Here
    </div>
  );
}`,
    );

    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');
    expect(seed.toLowerCase()).toContain('hello world');
  });

  test('handles component with props', async () => {
    await writeFile(
      join(pagesDir, 'page.tsx'),
      `'use aeon';
export default function Test() {
  return (
    <section id="main" data-testid="container">
      Content
    </section>
  );
}`,
    );

    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');
    expect(seed).toContain('"type":"section"');
    expect(seed).toContain('"props"');
    expect(seed).toContain('"className":"aeon-page"');
  });

  test('handles nested components', async () => {
    await writeFile(
      join(pagesDir, 'page.tsx'),
      `'use aeon';
export default function Test() {
  return (
    <div>
      <header>
        <nav>Navigation</nav>
      </header>
      <main>Content</main>
    </div>
  );
}`,
    );

    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');
    expect(seed).toContain('"type":"div"');
  });

  test('syncs route pattern to session ID', async () => {
    await mkdir(join(pagesDir, 'users', '[id]', 'posts', '[postId]'), {
      recursive: true,
    });
    await writeFile(
      join(pagesDir, 'users', '[id]', 'posts', '[postId]', 'page.tsx'),
      `'use aeon';
export default function Post() {
  return <article>Post</article>;
}`,
    );

    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');

    // Session ID should be derived from route
    expect(seed).toContain('users-[id]-posts-[postId]');
  });

  test('handles special characters in content', async () => {
    await writeFile(
      join(pagesDir, 'page.tsx'),
      `'use aeon';
export default function Test() {
  return (
    <div>
      It's a "test" with <special> & characters
    </div>
  );
}`,
    );

    await build({});

    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');
    // Should be properly escaped for SQL - single quotes are doubled
    expect(seed).toContain("It''s"); // Single quote escaped as ''
    expect(seed).toContain('test'); // Double quotes should be preserved in JSON
  });

  test('generates consistent session IDs', async () => {
    await writeFile(
      join(pagesDir, 'page.tsx'),
      `'use aeon';\nexport default function Home() { return <div>Home</div>; }`,
    );

    await build({});

    const manifest = JSON.parse(
      await readFile(join(outputDir, 'manifest.json'), 'utf-8'),
    );
    const seed = await readFile(join(outputDir, 'seed.sql'), 'utf-8');

    const homeRoute = manifest.routes.find((r: any) => r.pattern === '/');
    expect(seed).toContain(`'${homeRoute.sessionId}'`);
  });
});

describe('Multi-layer caching', () => {
  const originalCwd = process.cwd();
  const testDir = resolve(originalCwd, '.aeon-test-cache');
  const pagesDir = join(testDir, 'pages');
  const outputDir = join(testDir, '.aeon');

  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(pagesDir, { recursive: true });
    await writeFile(
      join(pagesDir, 'page.tsx'),
      `'use aeon';\nexport default function Home() { return <div>Home</div>; }`,
    );
    await writeFile(
      join(testDir, 'aeon.config.ts'),
      `export default { pagesDir: './pages', runtime: 'cloudflare' };`,
    );
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(testDir, { recursive: true, force: true });
  });

  test('wrangler.toml includes KV namespace for page cache', async () => {
    await build({});

    const wrangler = await readFile(join(outputDir, 'wrangler.toml'), 'utf-8');

    expect(wrangler).toContain('[[kv_namespaces]]');
    expect(wrangler).toContain('binding = "PAGES_CACHE"');
    expect(wrangler).toContain('# KV Namespace - edge page cache');
  });

  test('worker includes KV cache layer logic', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    // Check for KV cache first check
    expect(worker).toContain('env.PAGES_CACHE');
    expect(worker).toContain('getFromKV');
    expect(worker).toContain("'X-Aeon-Cache': 'HIT-KV'");
  });

  test('worker includes D1 pre-rendered page layer', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    expect(worker).toContain('getPreRenderedPage');
    expect(worker).toContain("'X-Aeon-Cache': 'HIT-D1'");
    expect(worker).toContain('rendered_pages');
  });

  test('worker includes session-based fallback layer', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    expect(worker).toContain('getSession');
    expect(worker).toContain("'X-Aeon-Cache': 'MISS'");
    expect(worker).toContain('renderPage');
  });

  test('worker includes build version for cache invalidation', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    expect(worker).toContain('BUILD_VERSION');
    expect(worker).toContain('cached.version === BUILD_VERSION');
  });

  test('worker caches KV-miss to KV after D1 hit', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    // After D1 hit, should cache in KV
    expect(worker).toContain('ctx.waitUntil');
    expect(worker).toContain('env.PAGES_CACHE.put');
    expect(worker).toContain('expirationTtl: CACHE_TTL');
  });

  test('worker caches session-rendered pages to KV', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    // After session render, should cache in KV
    expect(worker).toContain('JSON.stringify(cacheData)');
    expect(worker).toContain('html, version: BUILD_VERSION');
  });

  test('worker returns proper cache headers', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    // Check for cache control headers
    expect(worker).toContain('Cache-Control');
    expect(worker).toContain('max-age=3600');
    expect(worker).toContain('stale-while-revalidate');
    expect(worker).toContain('X-Aeon-Version');
  });

  test('getFromKV helper parses cached JSON correctly', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    expect(worker).toContain('async function getFromKV');
    expect(worker).toContain('JSON.parse(value)');
    expect(worker).toContain('return null'); // Returns null on miss or parse error
  });

  test('cache key uses route pattern', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    expect(worker).toContain('const cacheKey = `page:${match.pattern}`');
  });

  test('CACHE_TTL is configurable', async () => {
    await build({});

    const worker = await readFile(
      join(outputDir, 'dist', 'worker.js'),
      'utf-8',
    );

    expect(worker).toContain('const CACHE_TTL = 3600');
  });
});
