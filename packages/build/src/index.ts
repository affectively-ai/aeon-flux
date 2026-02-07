/**
 * Aeon Build Package
 *
 * Build-time optimizations for zero-dependency page rendering:
 * - CSS tree-shaking and on-demand generation
 * - Asset inlining (SVG, images as base64 data URIs)
 * - Font embedding with @font-face data URIs
 * - Full page pre-rendering at build time
 */

export * from './css-manifest';
export * from './asset-manifest';
export * from './font-manifest';
export * from './prerender';
export * from './types';
