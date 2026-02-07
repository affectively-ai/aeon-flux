/**
 * Asset Manifest Generator
 *
 * Scans project assets (SVG, PNG, JPG, etc.) and converts them to
 * base64 data URIs for inlining in the final HTML output.
 *
 * Benefits:
 * - Zero external requests for assets
 * - No CORS issues
 * - Better caching (assets are part of the HTML)
 * - Faster perceived loading
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';

export interface AssetEntry {
  originalPath: string;
  dataUri: string;
  size: number;
  format: string;
  optimized?: boolean;
}

export interface AssetManifest {
  version: string;
  generatedAt: string;
  assets: Record<string, AssetEntry>;
  totalSize: number;
  totalCount: number;
}

export interface AssetOptions {
  /** Maximum file size to inline (bytes). Default: 50KB */
  maxInlineSize?: number;
  /** Directory to scan for assets */
  assetsDir: string;
  /** Convert images to WebP if smaller */
  convertToWebP?: boolean;
  /** WebP quality (0-100) */
  webpQuality?: number;
  /** Optimize SVGs with SVGO */
  optimizeSvg?: boolean;
  /** Include subdirectories */
  recursive?: boolean;
}

const DEFAULT_OPTIONS: Partial<AssetOptions> = {
  maxInlineSize: 50 * 1024, // 50KB
  convertToWebP: false,
  webpQuality: 80,
  optimizeSvg: true,
  recursive: true,
};

// MIME types for common image formats
const MIME_TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

// Supported extensions
const SUPPORTED_EXTENSIONS = new Set(Object.keys(MIME_TYPES));

/**
 * Optimize SVG content
 * In production, this would use SVGO
 */
async function optimizeSvg(svgContent: string): Promise<string> {
  // Basic optimization: remove comments, whitespace, unnecessary attributes
  let optimized = svgContent
    // Remove XML declaration
    .replace(/<\?xml[^?]*\?>/g, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove unnecessary whitespace
    .replace(/>\s+</g, '><')
    // Remove empty attributes
    .replace(/\s+([a-z-]+)=""/gi, '')
    // Remove data-* attributes
    .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
    // Trim
    .trim();

  // Try to load SVGO dynamically
  try {
    const { optimize } = await import('svgo');
    const result = optimize(optimized, {
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
  } catch {
    // SVGO not available, return basic optimization
    return optimized;
  }
}

/**
 * Convert file to base64 data URI
 */
async function fileToDataUri(
  filePath: string,
  options: AssetOptions
): Promise<{ dataUri: string; size: number; optimized: boolean } | null> {
  const ext = extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext];

  if (!mimeType) return null;

  const buffer = await readFile(filePath);
  let content: Buffer | string = buffer;
  let optimized = false;
  let finalSize = buffer.length;

  // Check size limit
  if (buffer.length > (options.maxInlineSize || DEFAULT_OPTIONS.maxInlineSize!)) {
    console.warn(`  ⚠️  Skipping ${filePath}: too large (${(buffer.length / 1024).toFixed(1)}KB)`);
    return null;
  }

  // Optimize SVGs
  if (ext === '.svg' && options.optimizeSvg !== false) {
    const svgContent = buffer.toString('utf-8');
    const optimizedSvg = await optimizeSvg(svgContent);
    content = Buffer.from(optimizedSvg, 'utf-8');
    finalSize = content.length;
    optimized = true;
  }

  // Convert to base64
  const base64 = Buffer.isBuffer(content)
    ? content.toString('base64')
    : Buffer.from(content).toString('base64');

  return {
    dataUri: `data:${mimeType};base64,${base64}`,
    size: finalSize,
    optimized,
  };
}

/**
 * Recursively scan directory for assets
 */
async function scanDirectory(dir: string, recursive: boolean): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        const subFiles = await scanDirectory(fullPath, recursive);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`  ⚠️  Could not scan directory: ${dir}`);
  }

  return files;
}

/**
 * Build asset manifest from a directory
 */
export async function buildAssetManifest(options: AssetOptions): Promise<AssetManifest> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const assets: Record<string, AssetEntry> = {};
  let totalSize = 0;
  let totalCount = 0;

  console.log(`\n📦 Building asset manifest from: ${opts.assetsDir}`);

  // Check if directory exists
  try {
    await stat(opts.assetsDir);
  } catch {
    console.warn(`  ⚠️  Assets directory not found: ${opts.assetsDir}`);
    return {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      assets: {},
      totalSize: 0,
      totalCount: 0,
    };
  }

  // Scan for files
  const files = await scanDirectory(opts.assetsDir, opts.recursive ?? true);
  console.log(`   Found ${files.length} asset file(s)`);

  // Process each file
  for (const filePath of files) {
    const result = await fileToDataUri(filePath, opts);
    if (!result) continue;

    const relativePath = '/' + relative(opts.assetsDir, filePath).replace(/\\/g, '/');
    const ext = extname(filePath).toLowerCase();

    assets[relativePath] = {
      originalPath: filePath,
      dataUri: result.dataUri,
      size: result.size,
      format: ext.slice(1),
      optimized: result.optimized,
    };

    totalSize += result.size;
    totalCount++;

    console.log(`   ✓ ${relativePath} (${(result.size / 1024).toFixed(1)}KB${result.optimized ? ', optimized' : ''})`);
  }

  console.log(`\n   Total: ${totalCount} assets, ${(totalSize / 1024).toFixed(1)}KB`);

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    assets,
    totalSize,
    totalCount,
  };
}

/**
 * Get data URI for an asset from manifest
 */
export function getAssetDataUri(manifest: AssetManifest, path: string): string | null {
  // Normalize path
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  return manifest.assets[normalizedPath]?.dataUri || null;
}

/**
 * Resolve asset references in a component tree
 */
export function resolveAssetsInTree(
  tree: { type: string; props?: Record<string, unknown>; children?: unknown[] },
  manifest: AssetManifest
): { type: string; props?: Record<string, unknown>; children?: unknown[] } {
  function walk(node: unknown): unknown {
    if (typeof node === 'string') return node;
    if (!node || typeof node !== 'object') return node;

    const n = node as { type?: string; props?: Record<string, unknown>; children?: unknown[] };

    // Clone props
    const newProps = { ...n.props };

    // Resolve src attribute
    if (typeof newProps.src === 'string' && !newProps.src.startsWith('data:')) {
      const dataUri = getAssetDataUri(manifest, newProps.src);
      if (dataUri) {
        newProps.src = dataUri;
      }
    }

    // Resolve href for link elements (stylesheets, etc.)
    if (n.type === 'link' && typeof newProps.href === 'string') {
      const ext = extname(newProps.href).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        const dataUri = getAssetDataUri(manifest, newProps.href);
        if (dataUri) {
          newProps.href = dataUri;
        }
      }
    }

    // Resolve background images in style
    if (typeof newProps.style === 'object' && newProps.style !== null) {
      const style = newProps.style as Record<string, string>;
      if (style.backgroundImage) {
        const urlMatch = style.backgroundImage.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (urlMatch && !urlMatch[1].startsWith('data:')) {
          const dataUri = getAssetDataUri(manifest, urlMatch[1]);
          if (dataUri) {
            style.backgroundImage = `url('${dataUri}')`;
          }
        }
      }
      newProps.style = style;
    }

    // Recurse into children
    const newChildren = Array.isArray(n.children)
      ? n.children.map(walk)
      : n.children;

    return {
      type: n.type,
      props: Object.keys(newProps).length > 0 ? newProps : undefined,
      children: newChildren,
    };
  }

  return walk(tree) as { type: string; props?: Record<string, unknown>; children?: unknown[] };
}

/**
 * Inline SVG directly (not as data URI)
 * This is better for SVGs that need to be styled or animated
 */
export async function inlineSvg(
  filePath: string,
  options: { addAriaHidden?: boolean; removeIds?: boolean; className?: string } = {}
): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  let svg = await optimizeSvg(content);

  // Add aria-hidden for decorative SVGs
  if (options.addAriaHidden) {
    svg = svg.replace('<svg', '<svg aria-hidden="true"');
  }

  // Add className
  if (options.className) {
    if (svg.includes('class="')) {
      svg = svg.replace(/class="([^"]*)"/, `class="$1 ${options.className}"`);
    } else {
      svg = svg.replace('<svg', `<svg class="${options.className}"`);
    }
  }

  // Remove/replace IDs to prevent collisions when multiple SVGs are on the page
  if (options.removeIds) {
    const prefix = `svg-${Date.now().toString(36)}`;
    svg = svg.replace(/id="([^"]+)"/g, `id="${prefix}-$1"`);
    svg = svg.replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`);
    svg = svg.replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`);
  }

  return svg;
}
