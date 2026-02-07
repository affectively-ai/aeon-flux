/**
 * Aeon Build Package
 *
 * Build-time optimizations for zero-dependency page rendering:
 * - CSS tree-shaking and on-demand generation
 * - Asset inlining (SVG, images as base64 data URIs)
 * - Font embedding with @font-face data URIs
 * - Full page pre-rendering at build time
 * - Automatic skeleton generation for zero CLS
 */

export * from './css-manifest';
export * from './asset-manifest';
export * from './font-manifest';
export * from './prerender';
export * from './types';

// Skeleton system - automatic zero-CLS skeleton generation
export {
  extractDimensionsFromClasses,
  propsToDimensions,
  mergeDimensions,
  type DimensionInference,
} from './skeleton-extractor';

export {
  parseSkeletonHints,
  isDynamicFromHints,
  stripSkeletonHints,
  mergeHints,
} from './skeleton-hints';

export {
  compileSkeletonTree,
  getSkeletonStats,
  type SkeletonCompilerConfig,
} from './skeleton-compiler';
