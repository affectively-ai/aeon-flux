/**
 * Shared types for Aeon Build
 */

/**
 * Serialized component tree structure
 */
export interface SerializedComponent {
  type: string;
  props?: Record<string, unknown>;
  children?: (SerializedComponent | string)[];
}

/**
 * Page session data from D1
 */
export interface PageSession {
  route: string;
  tree: SerializedComponent;
  data: Record<string, unknown>;
  schema: { version: string };
}

/**
 * Pre-rendered page output
 */
export interface PreRenderedPage {
  route: string;
  html: string;
  css: string;
  size: number;
  renderedAt: string;
}

/**
 * Build output containing all manifests
 */
export interface BuildOutput {
  cssManifest: import('./css-manifest').CSSManifest;
  assetManifest: import('./asset-manifest').AssetManifest;
  fontManifest: import('./font-manifest').FontManifest;
  pages: PreRenderedPage[];
  totalSize: number;
  buildTime: number;
}

/**
 * Render context for building pages
 */
export interface RenderContext {
  cssClasses: Set<string>;
  assets: Set<string>;
  fonts: Set<string>;
  interactiveNodes: Array<{
    id: string;
    type: string;
    hydrationMode: 'eager' | 'lazy' | 'idle';
  }>;
}

/**
 * Build configuration
 */
export interface BuildConfig {
  /** Pages directory */
  pagesDir: string;
  /** Components directory */
  componentsDir?: string;
  /** Assets directory */
  assetsDir?: string;
  /** Fonts directory */
  fontsDir?: string;
  /** Output directory */
  outputDir?: string;
  /** Target runtime */
  runtime: 'cloudflare' | 'bun' | 'node';
  /** Enable pre-rendering */
  prerender?: boolean;
  /** Aeon-specific configuration */
  aeon?: {
    sync?: { mode: 'distributed' | 'local' };
    versioning?: { enabled: boolean };
    presence?: { enabled: boolean };
  };
}

/**
 * D1 database types for storing manifests
 */
export interface D1Manifest {
  type: 'css' | 'assets' | 'fonts' | 'routes';
  version: string;
  manifest: string;  // JSON blob
  created_at: string;
}

export interface D1RenderedPage {
  route: string;
  html: string;
  version: string;
  rendered_at: string;
}
