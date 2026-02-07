/**
 * Page Pre-Rendering
 *
 * Pre-renders all pages at build time with:
 * - Inline CSS (tree-shaken, only what's needed)
 * - Inline assets (SVG, images as data URIs)
 * - Inline fonts (@font-face with data URIs)
 * - Minimal hydration script
 *
 * Output is stored in D1 and served directly with zero rendering at runtime.
 */

import {
  generateCSSForClasses,
  generateCriticalCSS,
  extractClassesFromTree,
  type CSSManifest,
} from './css-manifest';
import {
  resolveAssetsInTree,
  type AssetManifest,
} from './asset-manifest';
import {
  getFontFaceCSS,
  type FontManifest,
} from './font-manifest';
import type {
  SerializedComponent,
  PageSession,
  PreRenderedPage,
  RenderContext,
} from './types';

export interface PreRenderOptions {
  /** CSS manifest */
  cssManifest: CSSManifest;
  /** Asset manifest */
  assetManifest: AssetManifest;
  /** Font manifest */
  fontManifest: FontManifest;
  /** Font families to include */
  fontFamilies?: string[];
  /** Add minimal hydration script */
  addHydrationScript?: boolean;
  /** Environment variables to embed */
  env?: Record<string, string>;
}

// HTML escape utility
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render component tree to HTML string
function renderTree(node: SerializedComponent | string): string {
  if (typeof node === 'string') {
    return escapeHtml(node);
  }

  const { type, props = {}, children = [] } = node;

  // HTML elements
  const htmlTags = new Set([
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'button', 'img', 'svg', 'section', 'header', 'footer',
    'main', 'nav', 'aside', 'article', 'ul', 'ol', 'li',
    'form', 'input', 'textarea', 'select', 'option', 'label',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'video', 'audio', 'source', 'canvas', 'iframe',
    'strong', 'em', 'code', 'pre', 'blockquote', 'hr', 'br',
    'figure', 'figcaption', 'picture', 'time', 'mark',
  ]);

  const voidElements = new Set([
    'img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr',
  ]);

  // Build attributes string
  const attrs: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    if (value === undefined || value === null) continue;

    if (key === 'className') {
      attrs.push(`class="${escapeHtml(String(value))}"`);
    } else if (key === 'htmlFor') {
      attrs.push(`for="${escapeHtml(String(value))}"`);
    } else if (typeof value === 'boolean') {
      if (value) attrs.push(key);
    } else if (key === 'style' && typeof value === 'object') {
      const styleStr = Object.entries(value as Record<string, string>)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`)
        .join('; ');
      attrs.push(`style="${escapeHtml(styleStr)}"`);
    } else if (key.startsWith('data-') || key.startsWith('aria-')) {
      attrs.push(`${key}="${escapeHtml(String(value))}"`);
    } else if (typeof value === 'string' || typeof value === 'number') {
      attrs.push(`${key}="${escapeHtml(String(value))}"`);
    }
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

  // Handle different node types
  if (htmlTags.has(type)) {
    if (voidElements.has(type)) {
      return `<${type}${attrStr}>`;
    }
    const childContent = children.map(c => renderTree(c as SerializedComponent | string)).join('');
    return `<${type}${attrStr}>${childContent}</${type}>`;
  }

  // For custom components, render children (component wrapper is handled at build time)
  return children.map(c => renderTree(c as SerializedComponent | string)).join('');
}

// Mark interactive nodes for lazy hydration
function markInteractiveNodes(
  node: SerializedComponent,
  context: RenderContext
): SerializedComponent {
  const interactiveComponents = new Set([
    'Button', 'Input', 'Select', 'Textarea', 'Form',
    'Modal', 'Dialog', 'Dropdown', 'Menu', 'Popover',
    'Accordion', 'Tabs', 'Carousel', 'Slider',
    'ChatWidget', 'EmotionWheel', 'DashboardWidget',
  ]);

  const newProps = { ...node.props };

  if (interactiveComponents.has(node.type)) {
    const id = `aeon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    newProps['data-aeon-interactive'] = 'true';
    newProps['data-aeon-component'] = node.type;
    newProps['data-aeon-id'] = id;

    context.interactiveNodes.push({
      id,
      type: node.type,
      hydrationMode: 'lazy',
    });
  }

  const newChildren = node.children?.map(child => {
    if (typeof child === 'string') return child;
    return markInteractiveNodes(child, context);
  });

  return {
    ...node,
    props: Object.keys(newProps).length > 0 ? newProps : undefined,
    children: newChildren,
  };
}

// Generate minimal hydration script
function generateHydrationScript(context: RenderContext, env: Record<string, string> = {}): string {
  const hasInteractive = context.interactiveNodes.length > 0;

  // Speculative pre-rendering script (always included for instant navigation)
  const speculationScript = `
// Aeon Speculation - Pre-render predicted pages for instant navigation
const sp={c:new Map(),o:null,
init(){if(this.o)return;this.o=new IntersectionObserver(e=>e.forEach(en=>{if(en.isIntersecting){this.o.unobserve(en.target);this.pr(en.target.pathname)}}),{rootMargin:'200px'});document.querySelectorAll('a[href^="/"]').forEach(l=>this.o.observe(l));this.pp()},
async pr(r){if(this.c.has(r)||location.pathname===r)return;try{const res=await fetch(r+'?_aeon_pr=1',{headers:{'X-Aeon-Prerender':'1'}});if(res.ok){const html=await res.text();this.c.set(r,{html,t:Date.now()})}}catch{}},
async nav(r){const p=this.c.get(r);if(p&&Date.now()-p.t<300000){document.open();document.write(p.html);document.close();history.pushState({aeon:1},'',r);setTimeout(()=>sp.init(),0);return true}return false},
pp(){const pred=[...document.querySelectorAll('a[href^="/"]')].slice(0,3).map(l=>l.pathname);pred.forEach(r=>this.pr(r))}
};
document.addEventListener('click',async e=>{const l=e.target.closest('a[href^="/"]');if(!l||e.metaKey||e.ctrlKey)return;if(await sp.nav(l.pathname))e.preventDefault()});
window.addEventListener('popstate',e=>{if(e.state?.aeon){const p=sp.c.get(location.pathname);if(p){document.open();document.write(p.html);document.close();setTimeout(()=>sp.init(),0)}}});
sp.init();`;

  // Hydration script for interactive components
  const hydrationScript = hasInteractive
    ? `
// Aeon Hydration - Lazy load interactive components
const h=async(e)=>{const c=e.dataset.aeonComponent;try{const m=await import('/_aeon/c/'+c+'.js');m.hydrate(e)}catch(err){console.error('[aeon] Failed to hydrate:',c,err)}};
const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);h(e.target)}})},{rootMargin:'100px'});
document.querySelectorAll('[data-aeon-interactive]').forEach(e=>io.observe(e));`
    : '';

  const aeonConfig = JSON.stringify({
    env,
    components: context.interactiveNodes.map(n => n.type),
  });

  return `<script type="module">
window.__AEON__=${aeonConfig};${speculationScript}${hydrationScript}
</script>`;
}

/**
 * Pre-render a single page
 */
export function prerenderPage(
  session: PageSession,
  options: PreRenderOptions
): PreRenderedPage {
  const startTime = Date.now();
  const context: RenderContext = {
    cssClasses: new Set(),
    assets: new Set(),
    fonts: new Set(),
    interactiveNodes: [],
  };

  // 1. Mark interactive nodes for hydration
  const markedTree = markInteractiveNodes(session.tree, context);

  // 2. Resolve asset references (replace with data URIs)
  const resolvedTree = resolveAssetsInTree(markedTree, options.assetManifest);

  // 3. Extract CSS classes from tree
  const cssClasses = extractClassesFromTree(resolvedTree);
  cssClasses.forEach(c => context.cssClasses.add(c));

  // 4. Generate tree-shaken CSS
  const componentCSS = generateCSSForClasses(cssClasses);
  const criticalCSS = generateCriticalCSS();

  // 5. Get font face CSS
  const fontCSS = getFontFaceCSS(options.fontManifest, options.fontFamilies);

  // 6. Combine all CSS
  const fullCSS = `${criticalCSS}\n${fontCSS}\n${componentCSS}`;

  // 7. Render HTML
  const htmlContent = renderTree(resolvedTree);

  // 8. Generate hydration script
  const hydrationScript = options.addHydrationScript !== false
    ? generateHydrationScript(context, options.env)
    : '';

  // 9. Build final HTML document
  const title = (session.data.title as string) || 'AFFECTIVELY';
  const description = (session.data.description as string) || '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
  <style>${fullCSS}</style>
</head>
<body>
  <div id="root">${htmlContent}</div>
  ${hydrationScript}
</body>
</html>`;

  const renderTime = Date.now() - startTime;

  return {
    route: session.route,
    html,
    css: fullCSS,
    size: html.length,
    renderedAt: new Date().toISOString(),
  };
}

/**
 * Pre-render all pages
 */
export async function prerenderAllPages(
  sessions: PageSession[],
  options: PreRenderOptions
): Promise<{ pages: PreRenderedPage[]; totalSize: number; totalTime: number }> {
  const startTime = Date.now();
  const pages: PreRenderedPage[] = [];
  let totalSize = 0;

  console.log(`\n📄 Pre-rendering ${sessions.length} page(s)...`);

  for (const session of sessions) {
    const page = prerenderPage(session, options);
    pages.push(page);
    totalSize += page.size;

    console.log(`   ✓ ${session.route} (${(page.size / 1024).toFixed(1)}KB)`);
  }

  const totalTime = Date.now() - startTime;

  console.log(`\n   Total: ${pages.length} pages, ${(totalSize / 1024).toFixed(1)}KB in ${totalTime}ms`);
  console.log(`   Avg per page: ${(totalSize / pages.length / 1024).toFixed(1)}KB`);

  return { pages, totalSize, totalTime };
}

/**
 * Generate D1 seed SQL for pre-rendered pages
 */
export function generatePreRenderSeedSQL(pages: PreRenderedPage[], version: string): string {
  const lines: string[] = [
    '-- Pre-rendered pages',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Version: ${version}`,
    `-- Total pages: ${pages.length}`,
    '',
    '-- Clear existing pre-rendered pages',
    "DELETE FROM rendered_pages WHERE version != '" + version + "';",
    '',
  ];

  for (const page of pages) {
    // Escape single quotes in HTML
    const escapedHtml = page.html.replace(/'/g, "''");
    lines.push(
      `INSERT OR REPLACE INTO rendered_pages (route, html, version, rendered_at) VALUES ('${page.route}', '${escapedHtml}', '${version}', '${page.renderedAt}');`
    );
  }

  return lines.join('\n');
}

/**
 * Generate D1 seed SQL for render manifests (CSS, assets, fonts)
 */
export function generateManifestSeedSQL(
  cssManifest: unknown,
  assetManifest: unknown,
  fontManifest: unknown,
  version: string
): string {
  const lines: string[] = [
    '-- Render manifests',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Version: ${version}`,
    '',
    '-- Clear existing manifests',
    "DELETE FROM render_manifests WHERE version != '" + version + "';",
    '',
  ];

  // Escape and insert manifests
  const cssJson = JSON.stringify(cssManifest).replace(/'/g, "''");
  const assetJson = JSON.stringify(assetManifest).replace(/'/g, "''");
  const fontJson = JSON.stringify(fontManifest).replace(/'/g, "''");

  lines.push(`INSERT OR REPLACE INTO render_manifests (type, version, manifest) VALUES ('css', '${version}', '${cssJson}');`);
  lines.push(`INSERT OR REPLACE INTO render_manifests (type, version, manifest) VALUES ('assets', '${version}', '${assetJson}');`);
  lines.push(`INSERT OR REPLACE INTO render_manifests (type, version, manifest) VALUES ('fonts', '${version}', '${fontJson}');`);

  return lines.join('\n');
}

/**
 * Generate D1 migration for rendered pages table
 */
export function generatePreRenderMigrationSQL(): string {
  return `-- Pre-rendered pages table
-- Generated: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS rendered_pages (
  route TEXT PRIMARY KEY,
  html TEXT NOT NULL,
  version TEXT NOT NULL,
  rendered_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rendered_pages_version ON rendered_pages(version);

-- Render manifests table
CREATE TABLE IF NOT EXISTS render_manifests (
  type TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  manifest TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;
}
