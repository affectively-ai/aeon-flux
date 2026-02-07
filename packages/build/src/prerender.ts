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
import { compileSkeletonTree, getSkeletonStats } from './skeleton-compiler';
import type {
  SerializedComponent,
  PageSession,
  PreRenderedPage,
  RenderContext,
  SkeletonConfig,
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
  /** Skeleton generation configuration */
  skeleton?: SkeletonConfig;
  /** ESI state for global injection (personalization, tier gating, emotion state) */
  esiState?: ESIStateConfig;
}

/**
 * ESI State configuration for pre-rendering
 * This is injected as window.__AEON_ESI_STATE__ in the <head>
 */
export interface ESIStateConfig {
  /** Enable ESI state injection */
  enabled: boolean;
  /** Default user tier for anonymous users */
  defaultTier?: 'free' | 'starter' | 'pro' | 'enterprise';
  /** Include placeholder for runtime emotion state */
  includeEmotionPlaceholder?: boolean;
  /** Feature flags based on default tier */
  defaultFeatures?: {
    aiInference?: boolean;
    emotionTracking?: boolean;
    collaboration?: boolean;
    advancedInsights?: boolean;
    customThemes?: boolean;
    voiceSynthesis?: boolean;
    imageAnalysis?: boolean;
  };
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

  // 10. Generate skeleton if enabled
  const skeletonEnabled = options.skeleton?.enabled ?? false;
  let skeletonHtml = '';
  let skeletonCss = '';
  let skeletonInitScript = '';

  if (skeletonEnabled) {
    // Compile skeleton metadata into tree
    const treeWithSkeleton = compileSkeletonTree(resolvedTree, {
      minConfidence: options.skeleton?.minConfidence ?? 0.3,
      alwaysDynamic: options.skeleton?.alwaysDynamic,
      neverDynamic: options.skeleton?.neverDynamic,
    });

    // Render skeleton HTML (simplified JS version - WASM version used at runtime)
    skeletonHtml = renderSkeletonTree(treeWithSkeleton);
    skeletonCss = generateSkeletonCSS();
    skeletonInitScript = generateSkeletonInitScript();

    // Log skeleton stats
    const stats = getSkeletonStats(treeWithSkeleton);
    if (stats.nodesWithSkeleton > 0) {
      console.log(`   🦴 Skeleton: ${stats.nodesWithSkeleton}/${stats.totalNodes} nodes (${(stats.averageConfidence * 100).toFixed(0)}% avg confidence)`);
    }
  }

  // 11. Generate ESI state script if enabled
  const esiStateEnabled = options.esiState?.enabled ?? false;
  const esiStateScript = esiStateEnabled ? generateESIStateScript(options.esiState!) : '';

  // 12. Build final HTML document with or without skeleton
  const html = skeletonEnabled
    ? `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
  <style>
/* Skeleton CSS */
${skeletonCss}
/* Content CSS */
${fullCSS}
  </style>
  ${esiStateScript}
  ${skeletonInitScript}
</head>
<body>
  <div id="aeon-skeleton" aria-hidden="true">${skeletonHtml}</div>
  <div id="root" style="display:none">${htmlContent}</div>
  <script>
    // Swap skeleton to content when DOM is ready
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',function(){
        window.__AEON_SKELETON__&&window.__AEON_SKELETON__.swap({fade:${options.skeleton?.fadeAnimation !== false},duration:${options.skeleton?.fadeDuration ?? 150}});
      });
    }else{
      window.__AEON_SKELETON__&&window.__AEON_SKELETON__.swap({fade:${options.skeleton?.fadeAnimation !== false},duration:${options.skeleton?.fadeDuration ?? 150}});
    }
  </script>
  ${hydrationScript}
</body>
</html>`
    : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
  ${esiStateScript}
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
    ...(skeletonEnabled && { skeletonHtml, skeletonCss }),
  };
}

/**
 * Render skeleton tree to HTML (JavaScript version for build time)
 * The WASM version is faster but this works without WASM compilation
 */
function renderSkeletonTree(node: SerializedComponent): string {
  const skeleton = (node as unknown as { _skeleton?: { isDynamic: boolean; shape: string; dimensions: Record<string, string>; lines?: number } })._skeleton;

  if (!skeleton || !skeleton.isDynamic) {
    // Not dynamic - render children skeletons only
    return (node.children || [])
      .filter((c): c is SerializedComponent => typeof c !== 'string')
      .map(renderSkeletonTree)
      .join('');
  }

  const style = buildSkeletonStyle(skeleton.dimensions, skeleton.shape);
  const className = `aeon-skeleton aeon-skeleton--${skeleton.shape}`;

  if (skeleton.shape === 'text-block') {
    const lines = skeleton.lines || 3;
    let html = `<div class="${className}" style="${style}" aria-hidden="true">`;
    for (let i = 0; i < lines; i++) {
      const lineWidth = i === lines - 1 ? '60%' : '100%';
      html += `<div class="aeon-skeleton--line" style="width: ${lineWidth}; height: 1em; margin-bottom: 0.5em;"></div>`;
    }
    html += '</div>';
    return html;
  }

  if (skeleton.shape === 'container') {
    const childrenHtml = (node.children || [])
      .filter((c): c is SerializedComponent => typeof c !== 'string')
      .map(renderSkeletonTree)
      .join('');
    return `<div class="${className}" style="${style}" aria-hidden="true">${childrenHtml}</div>`;
  }

  return `<div class="${className}" style="${style}" aria-hidden="true"></div>`;
}

/**
 * Build inline style string for skeleton element
 */
function buildSkeletonStyle(dims: Record<string, string> = {}, shape: string): string {
  const styles: string[] = [];

  if (dims.width) styles.push(`width: ${dims.width}`);
  if (dims.height) styles.push(`height: ${dims.height}`);
  if (dims.minHeight) styles.push(`min-height: ${dims.minHeight}`);
  if (dims.aspectRatio) styles.push(`aspect-ratio: ${dims.aspectRatio}`);
  if (dims.padding) styles.push(`padding: ${dims.padding}`);
  if (dims.margin) styles.push(`margin: ${dims.margin}`);
  if (dims.gap) styles.push(`gap: ${dims.gap}`);

  // Shape-specific border radius
  const radius = dims.borderRadius || (shape === 'circle' ? '50%' : shape === 'rect' ? '0.25rem' : '0.125rem');
  styles.push(`border-radius: ${radius}`);

  if (shape === 'container') {
    styles.push('display: flex');
    styles.push('flex-direction: column');
  }

  return styles.join('; ');
}

/**
 * Generate skeleton CSS
 */
function generateSkeletonCSS(): string {
  return `/* Aeon Skeleton - Zero CLS */
.aeon-skeleton {
  background: linear-gradient(90deg, var(--aeon-skeleton-base, #e5e7eb) 0%, var(--aeon-skeleton-highlight, #f3f4f6) 50%, var(--aeon-skeleton-base, #e5e7eb) 100%);
  background-size: 200% 100%;
  animation: aeon-skeleton-pulse 1.5s ease-in-out infinite;
}
.aeon-skeleton--rect { display: block; }
.aeon-skeleton--circle { display: block; }
.aeon-skeleton--text-line { display: block; height: 1em; }
.aeon-skeleton--text-block { display: flex; flex-direction: column; }
.aeon-skeleton--line { background: inherit; background-size: inherit; animation: inherit; border-radius: 0.125rem; }
.aeon-skeleton--container { background: transparent; animation: none; }
@keyframes aeon-skeleton-pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@media (prefers-color-scheme: dark) { :root { --aeon-skeleton-base: #374151; --aeon-skeleton-highlight: #4b5563; } }
@media (prefers-reduced-motion: reduce) { .aeon-skeleton, .aeon-skeleton--line { animation: none; background-size: 100% 100%; } }`;
}

/**
 * Generate inline skeleton init script
 */
function generateSkeletonInitScript(): string {
  return `<script>
(function(){
  var s=document.getElementById('aeon-skeleton'),r=document.getElementById('root');
  if(s&&r){r.style.display='none';s.style.display='block'}
  window.__AEON_SKELETON__={
    swap:function(o){
      if(this.done)return;
      o=o||{};
      var f=o.fade!==false,d=o.duration||150;
      if(f){
        s.style.transition=r.style.transition='opacity '+d+'ms ease-out';
        r.style.opacity='0';r.style.display='block';
        void r.offsetHeight;
        s.style.opacity='0';r.style.opacity='1';
        setTimeout(function(){s.remove();o.onComplete&&o.onComplete()},d);
      }else{
        s.remove();r.style.display='block';o.onComplete&&o.onComplete();
      }
      this.done=true
    },
    isVisible:function(){return!this.done&&!!s},
    done:false
  };
})();
</script>`;
}

/**
 * Generate ESI state injection script for <head>
 * This provides global state to ESI components before React hydration
 */
function generateESIStateScript(config: ESIStateConfig): string {
  const tier = config.defaultTier || 'free';

  // Default features based on tier
  const tierFeatures: Record<string, ESIStateConfig['defaultFeatures']> = {
    free: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: false,
      customThemes: false,
      voiceSynthesis: false,
      imageAnalysis: false,
    },
    starter: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: false,
      imageAnalysis: false,
    },
    pro: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true,
    },
    enterprise: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true,
    },
  };

  const features = config.defaultFeatures || tierFeatures[tier] || tierFeatures.free;

  // Build initial ESI state (will be hydrated at runtime with actual user context)
  const esiState = {
    userTier: tier,
    emotionState: config.includeEmotionPlaceholder ? null : undefined,
    preferences: {
      theme: 'auto',
      reducedMotion: false,
      language: undefined,
    },
    sessionId: undefined,
    localHour: new Date().getHours(),
    timezone: 'UTC',
    features,
    userId: undefined,
    isNewSession: true,
    recentPages: [],
    viewport: { width: 1920, height: 1080 },
    connection: '4g',
  };

  const stateJson = JSON.stringify(esiState);

  return `<script>
/* Aeon ESI State - Pre-rendered defaults, hydrated at runtime */
window.__AEON_ESI_STATE__=${stateJson};
window.__AEON_ESI_STATE__.update=function(o){Object.assign(this,o);this._listeners&&this._listeners.forEach(function(l){l(this)}.bind(this))};
window.__AEON_ESI_STATE__.subscribe=function(l){this._listeners=this._listeners||[];this._listeners.push(l);return function(){this._listeners=this._listeners.filter(function(x){return x!==l})}.bind(this)};
</script>`;
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
