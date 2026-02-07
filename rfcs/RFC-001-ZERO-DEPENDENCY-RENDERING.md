# RFC-001: Zero-Dependency Page Rendering

**Status**: Draft
**Author**: AFFECTIVELY Engineering
**Created**: 2026-02-06
**Target**: aeon-pages v2.0.0

---

## Summary

Implement a rendering pipeline that produces **completely self-contained HTML documents** requiring zero external requests. All CSS, images, fonts, and critical JS are inlined as data URIs or embedded directly. The WASM-based AST parser walks the DOM faster than browsers, computing styles and resolving assets at render time.

## Motivation

### Current Performance Profile

```
Page Load Timeline (Current):
├── HTML Document                    50ms
├── → /styles.css (105KB)          150ms  [blocking]
├── → /client.css (46KB)           100ms  [blocking]
├── → /fonts/inter.woff2 (50KB)    120ms
├── → /images/logo.svg (5KB)        80ms
├── → /client.js (200KB)           180ms
└── → First Paint                  ~500ms
     → Interactive                ~1200ms
```

**Problems:**
1. Multiple round-trips to origin/CDN
2. CSS blocks first paint
3. Font loading causes layout shift
4. JS bundle too large for edge delivery
5. Cache invalidation cascades

### Target Performance Profile

```
Page Load Timeline (Target):
├── HTML Document (all-in-one)      80ms
└── → First Paint                  <100ms
     → Interactive                 <200ms
```

**Single request. Zero dependencies. Instant render.**

---

## Design

### The WASM Render Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUILD TIME (Once per deploy)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ Components   │───▶│ AST Parser   │───▶│ CSS Manifest                 │  │
│  │ (TSX files)  │    │ (SWC)        │    │ (class → rules mapping)      │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ Assets       │───▶│ Optimizer    │───▶│ Asset Manifest               │  │
│  │ (SVG/PNG/...)│    │ (SVGO/Sharp) │    │ (path → data URI mapping)    │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ Fonts        │───▶│ Subsetter    │───▶│ Font Manifest                │  │
│  │ (WOFF2)      │    │ (fonttools)  │    │ (family → base64 data URI)   │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                                              │
│                                 ▼                                            │
│                    ┌────────────────────────┐                               │
│                    │ Unified Render Manifest │ ──▶ D1/KV                    │
│                    └────────────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          RENDER TIME (Per request)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────────────────────────────────────────┐  │
│  │ Page Session │───▶│              WASM Renderer                        │  │
│  │ (from D1)    │    │                                                   │  │
│  └──────────────┘    │  1. Walk component tree (parallel)               │  │
│                      │  2. Collect CSS classes → lookup in manifest      │  │
│  ┌──────────────┐    │  3. Resolve asset refs → inline data URIs        │  │
│  │ Render       │───▶│  4. Apply inline styles to nodes                 │  │
│  │ Manifest     │    │  5. Embed fonts as @font-face data URIs          │  │
│  └──────────────┘    │  6. Generate minimal hydration script             │  │
│                      │                                                   │  │
│                      └────────────────────┬─────────────────────────────┘  │
│                                           │                                  │
│                                           ▼                                  │
│                      ┌────────────────────────────────────────────────┐     │
│                      │         Self-Contained HTML Document           │     │
│                      │                                                 │     │
│                      │  <!DOCTYPE html>                                │     │
│                      │  <html>                                         │     │
│                      │  <head>                                         │     │
│                      │    <style>/* All CSS inline */</style>          │     │
│                      │    <style>@font-face { src: data:... }</style>  │     │
│                      │  </head>                                        │     │
│                      │  <body>                                         │     │
│                      │    <img src="data:image/svg+xml;base64,...">    │     │
│                      │    <script>/* Minimal hydration */</script>     │     │
│                      │  </body>                                        │     │
│                      │  </html>                                        │     │
│                      │                                                 │     │
│                      └────────────────────────────────────────────────┘     │
│                                           │                                  │
│                    ┌──────────────────────┴──────────────────────┐          │
│                    ▼                      ▼                      ▼          │
│              Edge Cache             KV Cache              D1 Cache          │
│              (1-5ms)               (5-10ms)              (10-20ms)          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Design

### 1. WASM AST Renderer

The core of the system is a Rust/WASM module that walks the component tree and produces fully-resolved HTML.

```rust
// packages/runtime-wasm/src/renderer.rs

use wasm_bindgen::prelude::*;
use std::collections::{HashMap, HashSet};

#[wasm_bindgen]
pub struct AeonRenderer {
    css_manifest: CSSManifest,
    asset_manifest: AssetManifest,
    font_manifest: FontManifest,
}

#[wasm_bindgen]
impl AeonRenderer {
    #[wasm_bindgen(constructor)]
    pub fn new(
        css_manifest: JsValue,
        asset_manifest: JsValue,
        font_manifest: JsValue,
    ) -> AeonRenderer {
        AeonRenderer {
            css_manifest: serde_wasm_bindgen::from_value(css_manifest).unwrap(),
            asset_manifest: serde_wasm_bindgen::from_value(asset_manifest).unwrap(),
            font_manifest: serde_wasm_bindgen::from_value(font_manifest).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn render(&self, component_tree: JsValue) -> JsValue {
        let tree: ComponentNode = serde_wasm_bindgen::from_value(component_tree).unwrap();

        let mut ctx = RenderContext::new();

        // Walk tree, collecting all requirements
        self.walk_tree(&tree, &mut ctx);

        // Assemble final output
        let output = RenderOutput {
            html: ctx.html,
            css: self.assemble_css(&ctx.classes),
            fonts: self.assemble_fonts(&ctx.font_families),
            critical_js: self.generate_hydration_script(&ctx.interactive_nodes),
        };

        serde_wasm_bindgen::to_value(&output).unwrap()
    }

    fn walk_tree(&self, node: &ComponentNode, ctx: &mut RenderContext) {
        // Collect CSS classes
        if let Some(class_name) = &node.class_name {
            for class in class_name.split_whitespace() {
                ctx.classes.insert(class.to_string());
            }
        }

        // Resolve asset references
        let resolved_props = self.resolve_assets(&node.props, ctx);

        // Render this node
        ctx.html.push_str(&self.render_node(node, &resolved_props));

        // Recurse into children
        for child in &node.children {
            match child {
                Child::Node(n) => self.walk_tree(n, ctx),
                Child::Text(t) => ctx.html.push_str(&html_escape(t)),
            }
        }

        // Close tag
        if !is_void_element(&node.tag) {
            ctx.html.push_str(&format!("</{}>", node.tag));
        }
    }

    fn resolve_assets(&self, props: &Props, ctx: &mut RenderContext) -> Props {
        let mut resolved = props.clone();

        // Resolve src attributes (images)
        if let Some(src) = resolved.get("src") {
            if let Some(data_uri) = self.asset_manifest.get(src) {
                resolved.insert("src".to_string(), data_uri.clone());
            }
        }

        // Resolve href for stylesheets (shouldn't exist, but handle gracefully)
        if let Some(href) = resolved.get("href") {
            if href.ends_with(".css") {
                // Remove external CSS reference
                resolved.remove("href");
            }
        }

        resolved
    }

    fn assemble_css(&self, classes: &HashSet<String>) -> String {
        let mut css = String::new();
        let mut seen = HashSet::new();

        // Sort for deterministic output
        let mut sorted_classes: Vec<_> = classes.iter().collect();
        sorted_classes.sort();

        for class in sorted_classes {
            if let Some(rules) = self.css_manifest.get(class) {
                for rule in rules {
                    if !seen.contains(rule) {
                        css.push_str(rule);
                        css.push('\n');
                        seen.insert(rule.clone());
                    }
                }
            }
        }

        css
    }

    fn assemble_fonts(&self, families: &HashSet<String>) -> String {
        let mut css = String::new();

        for family in families {
            if let Some(font_data) = self.font_manifest.get(family) {
                css.push_str(&format!(
                    r#"@font-face {{
  font-family: '{}';
  font-weight: {};
  font-style: {};
  font-display: swap;
  src: url('data:font/woff2;base64,{}') format('woff2');
}}
"#,
                    font_data.family,
                    font_data.weight,
                    font_data.style,
                    font_data.base64
                ));
            }
        }

        css
    }

    fn generate_hydration_script(&self, nodes: &[InteractiveNode]) -> String {
        if nodes.is_empty() {
            return String::new();
        }

        // Minimal script that lazy-loads component JS only when needed
        format!(
            r#"<script type="module">
const h=async(e)=>{{const c=e.dataset.aeonComponent;const m=await import('/_aeon/c/'+c+'.js');m.hydrate(e)}};
document.querySelectorAll('[data-aeon-i]').forEach(e=>{{
  if(e.dataset.aeonHydrate==='eager')h(e);
  else if('IntersectionObserver' in window){{
    new IntersectionObserver((es,o)=>{{es.forEach(en=>{{if(en.isIntersecting){{o.unobserve(en.target);h(en.target)}}}})}}).observe(e)
  }}else h(e)
}});
</script>"#
        )
    }
}
```

### 2. CSS Manifest Generation (Build Time)

```typescript
// packages/build/src/css-manifest.ts

interface CSSManifest {
  version: string;
  rules: Map<string, string[]>;  // className → CSS rules
  variants: Map<string, string>;  // variant → media query
}

async function generateCSSManifest(config: AeonConfig): Promise<CSSManifest> {
  // 1. Generate full Tailwind CSS
  const fullCSS = await execTailwind(config.tailwindConfig);

  // 2. Parse into AST
  const ast = postcss.parse(fullCSS);

  // 3. Build class → rules index
  const rules = new Map<string, string[]>();

  ast.walkRules((rule) => {
    const classMatch = rule.selector.match(/^\.([a-zA-Z0-9_-]+)/);
    if (!classMatch) return;

    const className = classMatch[1];
    const cssText = rule.toString();

    const existing = rules.get(className) || [];
    existing.push(cssText);
    rules.set(className, existing);
  });

  // 4. Extract variant definitions
  const variants = new Map<string, string>();
  ast.walkAtRules('media', (atRule) => {
    // Map responsive prefixes to media queries
    if (atRule.params.includes('min-width: 640px')) {
      variants.set('sm:', atRule.params);
    }
    // ... etc for md, lg, xl, 2xl
  });

  return { version: '1.0.0', rules, variants };
}
```

### 3. Asset Manifest Generation (Build Time)

```typescript
// packages/build/src/asset-manifest.ts

interface AssetManifest {
  version: string;
  assets: Map<string, AssetEntry>;
}

interface AssetEntry {
  originalPath: string;
  dataUri: string;
  size: number;
  format: string;
}

async function generateAssetManifest(
  assetsDir: string,
  options: AssetOptions
): Promise<AssetManifest> {
  const assets = new Map<string, AssetEntry>();

  // Scan all asset files
  for await (const file of glob(`${assetsDir}/**/*.{svg,png,jpg,jpeg,gif,webp,ico}`)) {
    const relativePath = path.relative(assetsDir, file);
    const buffer = await Bun.file(file).arrayBuffer();

    // Skip if too large
    if (buffer.byteLength > options.maxInlineSize) {
      console.warn(`Skipping ${relativePath}: too large (${buffer.byteLength} bytes)`);
      continue;
    }

    let dataUri: string;

    if (file.endsWith('.svg')) {
      // SVG: Optimize with SVGO, then inline
      const svgContent = await optimizeSVG(await Bun.file(file).text());
      const base64 = Buffer.from(svgContent).toString('base64');
      dataUri = `data:image/svg+xml;base64,${base64}`;
    } else {
      // Raster: Optionally convert to WebP, then base64
      let finalBuffer = buffer;
      let mimeType = getMimeType(file);

      if (options.convertToWebP && !file.endsWith('.webp')) {
        finalBuffer = await convertToWebP(buffer, options.webpQuality);
        mimeType = 'image/webp';
      }

      const base64 = Buffer.from(finalBuffer).toString('base64');
      dataUri = `data:${mimeType};base64,${base64}`;
    }

    assets.set(`/${relativePath}`, {
      originalPath: file,
      dataUri,
      size: buffer.byteLength,
      format: path.extname(file).slice(1),
    });
  }

  return { version: '1.0.0', assets };
}

async function optimizeSVG(svgContent: string): Promise<string> {
  const { optimize } = await import('svgo');

  const result = optimize(svgContent, {
    multipass: true,
    plugins: [
      'preset-default',
      'removeDimensions',
      {
        name: 'removeAttrs',
        params: { attrs: ['data-name', 'class'] },
      },
    ],
  });

  return result.data;
}
```

### 4. Font Manifest Generation (Build Time)

```typescript
// packages/build/src/font-manifest.ts

interface FontManifest {
  version: string;
  fonts: Map<string, FontEntry>;
}

interface FontEntry {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  dataUri: string;
  unicodeRange?: string;
}

async function generateFontManifest(
  fontsDir: string,
  options: FontOptions
): Promise<FontManifest> {
  const fonts = new Map<string, FontEntry>();

  for await (const file of glob(`${fontsDir}/**/*.woff2`)) {
    const buffer = await Bun.file(file).arrayBuffer();

    // Optional: Subset font to reduce size
    let finalBuffer = buffer;
    if (options.subset) {
      finalBuffer = await subsetFont(buffer, options.subset);
    }

    const base64 = Buffer.from(finalBuffer).toString('base64');
    const { family, weight, style } = parseFileName(file);

    fonts.set(`${family}-${weight}-${style}`, {
      family,
      weight,
      style,
      dataUri: `data:font/woff2;base64,${base64}`,
    });
  }

  return { version: '1.0.0', fonts };
}

// Parse font file name like "Inter-Bold.woff2" → { family: "Inter", weight: 700, style: "normal" }
function parseFileName(file: string): { family: string; weight: number; style: 'normal' | 'italic' } {
  const name = path.basename(file, '.woff2');
  const parts = name.split('-');

  const family = parts[0];
  const weightMap: Record<string, number> = {
    'Thin': 100, 'ExtraLight': 200, 'Light': 300, 'Regular': 400,
    'Medium': 500, 'SemiBold': 600, 'Bold': 700, 'ExtraBold': 800, 'Black': 900,
  };

  let weight = 400;
  let style: 'normal' | 'italic' = 'normal';

  for (const part of parts.slice(1)) {
    if (weightMap[part]) weight = weightMap[part];
    if (part === 'Italic') style = 'italic';
  }

  return { family, weight, style };
}
```

### 5. Multi-Layer Cache Implementation

```typescript
// packages/runtime/src/cache.ts

interface CacheConfig {
  edge: { ttl: number };
  kv: { ttl: number; namespace: string };
  d1: { table: string };
}

class PageCache {
  constructor(
    private env: Env,
    private config: CacheConfig
  ) {}

  async get(route: string): Promise<string | null> {
    // Layer 1: Edge cache (handled by Cloudflare automatically via headers)

    // Layer 2: KV cache
    const kvKey = `page:${route}`;
    const kvCached = await this.env.CACHE.get(kvKey);
    if (kvCached) {
      console.log(`[cache] KV hit: ${route}`);
      return kvCached;
    }

    // Layer 3: D1 cache
    const d1Result = await this.env.DB
      .prepare(`SELECT html FROM ${this.config.d1.table} WHERE route = ?`)
      .bind(route)
      .first<{ html: string }>();

    if (d1Result) {
      console.log(`[cache] D1 hit: ${route}`);
      // Promote to KV
      await this.env.CACHE.put(kvKey, d1Result.html, {
        expirationTtl: this.config.kv.ttl,
      });
      return d1Result.html;
    }

    console.log(`[cache] miss: ${route}`);
    return null;
  }

  async set(route: string, html: string): Promise<void> {
    const kvKey = `page:${route}`;

    // Store in both KV and D1
    await Promise.all([
      this.env.CACHE.put(kvKey, html, {
        expirationTtl: this.config.kv.ttl,
      }),
      this.env.DB
        .prepare(`
          INSERT OR REPLACE INTO ${this.config.d1.table} (route, html, rendered_at)
          VALUES (?, ?, datetime('now'))
        `)
        .bind(route, html)
        .run(),
    ]);
  }

  async invalidate(routes: string[]): Promise<void> {
    await Promise.all([
      // Clear KV
      ...routes.map(route => this.env.CACHE.delete(`page:${route}`)),

      // Clear D1
      this.env.DB
        .prepare(`DELETE FROM ${this.config.d1.table} WHERE route IN (${routes.map(() => '?').join(',')})`)
        .bind(...routes)
        .run(),
    ]);
  }
}
```

### 6. Worker Entry Point

```typescript
// packages/runtime/src/worker.ts

import { AeonRenderer } from './renderer.wasm';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const route = url.pathname;

    // Static assets bypass rendering
    if (route.startsWith('/_aeon/')) {
      return handleStaticAsset(route, env);
    }

    // Initialize cache
    const cache = new PageCache(env, {
      edge: { ttl: 3600 },
      kv: { ttl: 3600, namespace: 'CACHE' },
      d1: { table: 'rendered_pages' },
    });

    // Check cache first
    const cached = await cache.get(route);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          'X-Aeon-Cache': 'hit',
        },
      });
    }

    // Load manifests
    const [cssManifest, assetManifest, fontManifest, pageSession] = await Promise.all([
      loadManifest(env, 'css'),
      loadManifest(env, 'assets'),
      loadManifest(env, 'fonts'),
      loadPageSession(env, route),
    ]);

    if (!pageSession) {
      return new Response('Not Found', { status: 404 });
    }

    // Render with WASM
    const renderer = new AeonRenderer(cssManifest, assetManifest, fontManifest);
    const output = renderer.render(pageSession.tree);

    // Assemble final HTML
    const html = assembleHTML(output, pageSession, env);

    // Cache for next time (non-blocking)
    ctx.waitUntil(cache.set(route, html));

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Aeon-Cache': 'miss',
      },
    });
  },
};

function assembleHTML(output: RenderOutput, session: PageSession, env: Env): string {
  const title = session.data.title || 'AFFECTIVELY';
  const description = session.data.description || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
  <style>${output.fonts}${output.css}</style>
</head>
<body>
  <div id="root">${output.html}</div>
  ${output.critical_js}
</body>
</html>`;
}
```

---

## Performance Expectations

### Render Time Breakdown (WASM)

| Operation | JavaScript | WASM | Speedup |
|-----------|------------|------|---------|
| Parse AST (1000 nodes) | 15ms | 2ms | 7.5x |
| Walk tree | 8ms | 0.5ms | 16x |
| CSS collection | 12ms | 1ms | 12x |
| Asset resolution | 20ms | 3ms | 6.7x |
| HTML generation | 10ms | 1ms | 10x |
| **Total** | **65ms** | **7.5ms** | **8.7x** |

### Page Size Comparison

| Resource | Current | Target | Reduction |
|----------|---------|--------|-----------|
| HTML | 5KB | 15KB | -200% (larger, but includes everything) |
| CSS | 200KB (external) | 10KB (inline) | 95% |
| Fonts | 150KB (external) | 30KB (inline, subset) | 80% |
| Images | 100KB (external) | 50KB (inline, optimized) | 50% |
| JS | 200KB (external) | 5KB (critical only) | 97% |
| **Total Requests** | 15-30 | 1 | 97%+ |
| **Total Bytes** | ~655KB | ~110KB | 83% |

### Time to First Paint

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| TTFB | 100ms | 50ms | 50% |
| FCP | 500ms | 100ms | 80% |
| LCP | 1200ms | 200ms | 83% |
| TTI | 2000ms | 300ms | 85% |
| CLS | 0.05 | 0 | 100% |

---

## Migration Path

### Phase 1: Build Manifests (Week 1-2)
- Implement CSS manifest generation
- Implement asset manifest generation
- Implement font manifest generation
- Store in D1 at deploy time

### Phase 2: WASM Renderer (Week 3-4)
- Port AST walker to Rust
- Implement CSS collection
- Implement asset resolution
- Benchmark against JS renderer

### Phase 3: Cache Layers (Week 5-6)
- Implement KV page cache
- Implement D1 page cache
- Add cache invalidation on deploy
- Add cache warming for popular routes

### Phase 4: Progressive Rollout (Week 7-8)
- A/B test against current system
- Monitor performance metrics
- Fix edge cases
- Full rollout

### Phase 5: Hydration Optimization (Week 9-10)
- Implement lazy hydration
- Reduce critical JS to minimum
- Add interaction observers
- Test interactive components

---

## Speculative Pre-Rendering

### The Vision: Zero-Latency Navigation

Since Aeon already has a speculation engine predicting the next likely click, we can **pre-render entire pages in memory** before the user clicks. When they do click, it's just a DOM swap - no network request, no rendering delay.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SPECULATIVE PRE-RENDERING                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Current Page Loaded                                                         │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────┐                                                        │
│  │ Speculation     │───▶ Predict next clicks: [/dashboard, /explore, /chat] │
│  │ Engine          │     (based on: link proximity, user history, ML model) │
│  └─────────────────┘                                                        │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │ Pre-Render      │     │ Pre-Render      │     │ Pre-Render      │       │
│  │ /dashboard      │     │ /explore        │     │ /chat           │       │
│  │ (full HTML)     │     │ (full HTML)     │     │ (full HTML)     │       │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘       │
│           │                       │                       │                 │
│           └───────────────────────┴───────────────────────┘                 │
│                                   │                                          │
│                                   ▼                                          │
│                    ┌──────────────────────────────┐                         │
│                    │     In-Memory Page Cache      │                         │
│                    │                               │                         │
│                    │  Map<route, {                 │                         │
│                    │    html: string,              │                         │
│                    │    prefetchedAt: Date,        │                         │
│                    │    confidence: number,        │                         │
│                    │    stale: boolean             │                         │
│                    │  }>                           │                         │
│                    │                               │                         │
│                    └──────────────────────────────┘                         │
│                                   │                                          │
│                                   ▼                                          │
│  User Clicks Link ──────────▶ Instant DOM Swap (0ms network, 0ms render)    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// packages/runtime/src/speculation.ts

interface PreRenderedPage {
  route: string;
  html: string;
  prefetchedAt: number;
  confidence: number;
  stale: boolean;
}

class SpeculativeRenderer {
  private cache = new Map<string, PreRenderedPage>();
  private renderer: AeonRenderer;
  private observer: IntersectionObserver;

  constructor(renderer: AeonRenderer) {
    this.renderer = renderer;

    // Watch for links entering viewport
    this.observer = new IntersectionObserver(
      (entries) => this.onLinksVisible(entries),
      { rootMargin: '200px' }  // Pre-render when link is 200px from viewport
    );
  }

  init() {
    // Observe all internal links
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      this.observer.observe(link);
    });

    // Also use speculation rules if browser supports them
    this.injectSpeculationRules();
  }

  private async onLinksVisible(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const link = entry.target as HTMLAnchorElement;
      const route = new URL(link.href).pathname;

      // Skip if already cached
      if (this.cache.has(route)) continue;

      // Pre-render this page
      await this.preRender(route);
    }
  }

  private async preRender(route: string): Promise<void> {
    console.log(`[speculation] Pre-rendering: ${route}`);

    // Fetch page session from worker
    const response = await fetch(`/_aeon/session${route}`);
    if (!response.ok) return;

    const session = await response.json();

    // Render to HTML using WASM
    const output = this.renderer.render(session.tree);
    const html = this.assembleHTML(output, session);

    // Store in memory
    this.cache.set(route, {
      route,
      html,
      prefetchedAt: Date.now(),
      confidence: 0.8,
      stale: false,
    });

    console.log(`[speculation] Cached: ${route} (${html.length} bytes)`);
  }

  private assembleHTML(output: RenderOutput, session: PageSession): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${session.data.title || 'AFFECTIVELY'}</title>
  <style>${output.fonts}${output.css}</style>
</head>
<body>
  <div id="root">${output.html}</div>
  ${output.critical_js}
</body>
</html>`;
  }

  private injectSpeculationRules() {
    // Use browser's native speculation rules API when available
    const rules = {
      prerender: [
        {
          source: 'document',
          where: { href_matches: '/*' },
          eagerness: 'moderate',
        },
      ],
    };

    const script = document.createElement('script');
    script.type = 'speculationrules';
    script.textContent = JSON.stringify(rules);
    document.head.appendChild(script);
  }

  // Called when user clicks a link
  async navigate(route: string): Promise<boolean> {
    const cached = this.cache.get(route);

    if (cached && !cached.stale) {
      // Instant navigation - just swap the HTML
      document.open();
      document.write(cached.html);
      document.close();

      // Update URL
      history.pushState({}, '', route);

      // Re-initialize speculation for new page
      this.init();

      console.log(`[speculation] Instant nav to: ${route}`);
      return true;
    }

    // Not cached - fall back to normal navigation
    return false;
  }

  // Invalidate cached pages (called on data changes)
  invalidate(routes?: string[]) {
    if (routes) {
      routes.forEach((route) => {
        const cached = this.cache.get(route);
        if (cached) cached.stale = true;
      });
    } else {
      this.cache.forEach((page) => (page.stale = true));
    }
  }
}

// Integration with link clicks
document.addEventListener('click', async (e) => {
  const link = (e.target as Element).closest('a[href^="/"]');
  if (!link) return;

  const route = new URL((link as HTMLAnchorElement).href).pathname;

  // Try speculative navigation first
  if (await speculativeRenderer.navigate(route)) {
    e.preventDefault();
  }
});
```

### On-Demand CSS (Tailwind v4 Style)

The key insight from Tailwind v4's Lightning CSS: generate CSS **only for the classes actually used** at render time.

```typescript
// packages/runtime/src/on-demand-css.ts

class OnDemandCSS {
  private ruleIndex: Map<string, string>;  // className → CSS rule
  private generated = new Set<string>();   // Already generated classes

  constructor(cssManifest: CSSManifest) {
    this.ruleIndex = cssManifest.rules;
  }

  // Generate CSS for a specific set of classes
  generate(classes: Set<string>): string {
    const newClasses = [...classes].filter((c) => !this.generated.has(c));

    if (newClasses.length === 0) return '';

    const css: string[] = [];

    for (const className of newClasses) {
      const rule = this.ruleIndex.get(className);
      if (rule) {
        css.push(rule);
        this.generated.add(className);
      }
    }

    return css.join('\n');
  }

  // Generate CSS for a component tree
  generateForTree(tree: ComponentNode): string {
    const classes = this.extractClasses(tree);
    return this.generate(classes);
  }

  private extractClasses(node: ComponentNode, classes = new Set<string>()): Set<string> {
    if (node.className) {
      node.className.split(/\s+/).forEach((c) => c && classes.add(c));
    }

    for (const child of node.children || []) {
      if (typeof child === 'object') {
        this.extractClasses(child, classes);
      }
    }

    return classes;
  }
}
```

### The Complete Flow

```
User lands on /home
       │
       ▼
┌──────────────────┐
│ 1. Render /home  │──▶ On-demand CSS (only /home classes) + inline assets
│    with WASM     │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ 2. Speculation   │──▶ Predict next: [/dashboard, /explore, /chat]
│    Engine runs   │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ 3. Pre-render    │──▶ Full HTML for each, stored in memory
│    predicted     │    (each with their own on-demand CSS)
│    pages         │
└──────────────────┘
       │
       ▼
User clicks /dashboard
       │
       ▼
┌──────────────────┐
│ 4. DOM swap      │──▶ 0ms network, 0ms render
│    from cache    │    Instant page transition
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ 5. Re-speculate  │──▶ Predict next pages from /dashboard
│    for new page  │
└──────────────────┘
```

This creates a **feel of a native app** - every navigation is instant because the page is already in memory, fully rendered with exactly the CSS it needs.

---

## Build-Time Pre-Rendering (Static Generation)

### The Ultimate Optimization: Pre-Render Everything at Build

Why wait for runtime? We can **pre-render every single page during the build process** and seed them directly into D1/KV. First request for ANY route is a cache hit.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUILD TIME PRE-RENDERING                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ All Routes   │───▶│ WASM         │───▶│ Rendered HTML                │  │
│  │ from D1      │    │ Renderer     │    │ (with inline CSS, assets)    │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────────┘  │
│                                                        │                     │
│                                                        ▼                     │
│                            ┌───────────────────────────────────────────┐    │
│                            │              D1 Seed SQL                   │    │
│                            │                                            │    │
│                            │  INSERT INTO rendered_pages VALUES         │    │
│                            │    ('/', '<html>...</html>'),              │    │
│                            │    ('/about', '<html>...</html>'),         │    │
│                            │    ('/dashboard', '<html>...</html>'),     │    │
│                            │    ('/explore', '<html>...</html>'),       │    │
│                            │    ... (every route pre-rendered)          │    │
│                            │                                            │    │
│                            └───────────────────────────────────────────┘    │
│                                                        │                     │
│                                                        ▼                     │
│                            ┌───────────────────────────────────────────┐    │
│                            │        wrangler d1 execute --file         │    │
│                            │        (seed all pages at deploy)         │    │
│                            └───────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Build Command

```typescript
// packages/cli/src/commands/build.ts

export async function build(options: BuildOptions): Promise<void> {
  // ... existing steps ...

  // Step 9: Pre-render all pages
  console.log('9️⃣  Pre-rendering all pages...');

  const renderer = new AeonRenderer(cssManifest, assetManifest, fontManifest);
  const pages = await getAllPageSessions(db);
  const rendered: Array<{ route: string; html: string }> = [];

  for (const page of pages) {
    const output = renderer.render(page.tree);
    const html = assembleHTML(output, page);

    rendered.push({
      route: page.route,
      html,
    });

    console.log(`   ✓ ${page.route} (${(html.length / 1024).toFixed(1)}KB)`);
  }

  // Step 10: Generate seed SQL for pre-rendered pages
  console.log('🔟  Generating pre-render seed...');

  const seedSQL = generatePreRenderSeed(rendered);
  await writeFile(
    join(outputDir, 'seed-prerender.sql'),
    seedSQL
  );

  console.log(`   ✓ seed-prerender.sql (${rendered.length} pages)`);

  // Summary
  const totalSize = rendered.reduce((sum, p) => sum + p.html.length, 0);
  console.log(`\n📊 Pre-render summary:`);
  console.log(`   Pages: ${rendered.length}`);
  console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Avg per page: ${(totalSize / rendered.length / 1024).toFixed(1)}KB`);
}

function generatePreRenderSeed(pages: Array<{ route: string; html: string }>): string {
  const lines: string[] = [
    '-- Pre-rendered pages',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total pages: ${pages.length}`,
    '',
    'DELETE FROM rendered_pages;',
    '',
  ];

  for (const page of pages) {
    // Escape single quotes in HTML
    const escapedHtml = page.html.replace(/'/g, "''");
    lines.push(
      `INSERT INTO rendered_pages (route, html, version, rendered_at) VALUES ('${page.route}', '${escapedHtml}', '${process.env.DEPLOY_VERSION || '1.0.0'}', datetime('now'));`
    );
  }

  return lines.join('\n');
}
```

### Deploy Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build (includes pre-rendering)
        run: bun run build
        env:
          DEPLOY_VERSION: ${{ github.sha }}

      - name: Deploy to Cloudflare
        run: |
          # 1. Deploy D1 migrations
          wrangler d1 execute aeon-flux --file=.aeon/migrations/0001_initial.sql

          # 2. Seed manifests
          wrangler d1 execute aeon-flux --file=.aeon/seed-manifests.sql

          # 3. Seed pre-rendered pages
          wrangler d1 execute aeon-flux --file=.aeon/seed-prerender.sql

          # 4. Deploy worker
          wrangler deploy
```

### Incremental Pre-Rendering

For large sites, we can do incremental pre-rendering:

```typescript
// packages/cli/src/commands/build.ts

async function incrementalPreRender(
  renderer: AeonRenderer,
  db: D1Database,
  changedRoutes: string[]
): Promise<void> {
  console.log(`Incremental pre-render: ${changedRoutes.length} pages`);

  for (const route of changedRoutes) {
    const page = await getPageSession(db, route);
    if (!page) continue;

    const output = renderer.render(page.tree);
    const html = assembleHTML(output, page);

    // Update in D1
    await db
      .prepare(`
        INSERT OR REPLACE INTO rendered_pages (route, html, version, rendered_at)
        VALUES (?, ?, ?, datetime('now'))
      `)
      .bind(route, html, process.env.DEPLOY_VERSION)
      .run();

    console.log(`   ✓ ${route}`);
  }
}

// Detect changed routes by comparing git diffs
async function getChangedRoutes(): Promise<string[]> {
  const { stdout } = await exec('git diff --name-only HEAD~1');
  const changedFiles = stdout.split('\n');

  // Map changed files to affected routes
  const routes = new Set<string>();

  for (const file of changedFiles) {
    // Component change affects all routes using it
    if (file.includes('/components/')) {
      const componentName = path.basename(file, '.tsx');
      const affectedRoutes = await getRoutesUsingComponent(componentName);
      affectedRoutes.forEach((r) => routes.add(r));
    }

    // Page change affects that route
    if (file.includes('/pages/') && file.endsWith('page.tsx')) {
      const route = filePathToRoute(file);
      routes.add(route);
    }
  }

  return [...routes];
}
```

### The Complete Build Output

```
$ bun run build

🔨 Building Aeon Flux for production...

📁 Output: .aeon

1️⃣  Parsing pages...
   Found 47 page(s)

2️⃣  Generating route manifest...
   ✓ manifest.json

3️⃣  Generating D1 migration...
   ✓ migrations/0001_initial.sql

4️⃣  Generating D1 seed data...
   ✓ seed.sql

5️⃣  Bundling WASM runtime...
   ✓ runtime.wasm (18KB)

6️⃣  Generating CSS manifest...
   ✓ css-manifest.json (2,847 rules)

7️⃣  Generating asset manifest...
   ✓ asset-manifest.json (156 assets, 892KB inline)

8️⃣  Generating font manifest...
   ✓ font-manifest.json (4 fonts, 124KB inline)

9️⃣  Pre-rendering all pages...
   ✓ / (23.4KB)
   ✓ /about (18.2KB)
   ✓ /dashboard (31.5KB)
   ✓ /explore (45.2KB)
   ✓ /chat (28.7KB)
   ... (42 more pages)

🔟  Generating pre-render seed...
   ✓ seed-prerender.sql (47 pages)

📊 Pre-render summary:
   Pages: 47
   Total size: 1.34MB
   Avg per page: 29.2KB

✨ Build complete in 4.2s

Next steps:
  wrangler d1 execute aeon-flux --file=.aeon/migrations/0001_initial.sql
  wrangler d1 execute aeon-flux --file=.aeon/seed-prerender.sql
  wrangler deploy
```

### Runtime Flow with Pre-Rendered Pages

```
Request: GET /dashboard
       │
       ▼
┌──────────────────┐
│ Check D1         │──▶ SELECT html FROM rendered_pages WHERE route = '/dashboard'
│ (pre-rendered)   │
└──────────────────┘
       │
       ▼ (cache hit - always, because build pre-rendered it)
       │
┌──────────────────┐
│ Return HTML      │──▶ <html>...entire page with inline CSS/assets...</html>
│ (zero rendering) │
└──────────────────┘
       │
       ▼
Response: 200 OK (15ms total, including D1 query)
```

**Every single page is a cache hit from the moment the site deploys.** There's never a cold render path for any known route.

---

## Open Questions

1. **Large Images**: What's the size threshold for inlining vs external? (Proposed: 10KB)
2. **Dynamic Content**: How do we handle user-specific content? (Proposed: separate data loading)
3. **Third-Party Scripts**: Analytics, chat widgets, etc.? (Proposed: load async post-paint)
4. **SEO**: Will inline SVGs affect image SEO? (Proposed: test with GSC)
5. **Memory**: What's the memory impact of large data URIs? (Proposed: benchmark)

---

## Appendix A: D1 Schema

```sql
-- Render manifests
CREATE TABLE IF NOT EXISTS render_manifests (
  type TEXT PRIMARY KEY,  -- 'css', 'assets', 'fonts'
  manifest TEXT NOT NULL,
  version TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Rendered pages cache
CREATE TABLE IF NOT EXISTS rendered_pages (
  route TEXT PRIMARY KEY,
  html TEXT NOT NULL,
  version TEXT NOT NULL,
  rendered_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rendered_pages_time ON rendered_pages(rendered_at);
```

---

## Appendix B: Benchmark Results

*To be filled in during implementation*

---

## References

- [Why Not document.write()?](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#document.write())
- [Critical Rendering Path](https://web.dev/critical-rendering-path/)
- [WASM Performance](https://webassembly.org/docs/faq/)
- [Data URIs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)
- [Font Loading Strategies](https://web.dev/font-best-practices/)
- [Resource Hints](https://web.dev/preload-critical-assets/)

---

*Document Version: 1.0.0*
*Last Updated: 2026-02-06*
