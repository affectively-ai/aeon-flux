/**
 * Skeleton Tree Compiler
 *
 * Walks a serialized component tree and enriches nodes with skeleton metadata.
 * Combines Tailwind class inference, prop defaults, and explicit hints.
 */

import type {
  SerializedComponent,
  SkeletonMetadata,
  SkeletonShape,
  SkeletonSource,
  SkeletonDimensions,
} from '@affectively/aeon-pages-runtime';

import {
  extractDimensionsFromClasses,
  propsToDimensions,
  mergeDimensions,
  type DimensionInference,
} from './skeleton-extractor';

import { parseSkeletonHints, isDynamicFromHints } from './skeleton-hints';

/** Configuration for skeleton compilation */
export interface SkeletonCompilerConfig {
  /** Minimum confidence to generate skeleton (0-1) */
  minConfidence?: number;
  /** Components that should always have skeletons */
  alwaysDynamic?: string[];
  /** Components that should never have skeletons */
  neverDynamic?: string[];
  /** Enable verbose logging */
  verbose?: boolean;
}

const DEFAULT_CONFIG: Required<SkeletonCompilerConfig> = {
  minConfidence: 0.3,
  alwaysDynamic: [
    'Avatar',
    'UserCard',
    'ProfileImage',
    'DataTable',
    'Chart',
    'Graph',
    'Feed',
    'Timeline',
    'Comments',
    'Skeleton', // If using a skeleton component, it's obviously dynamic
  ],
  neverDynamic: [
    'Fragment',
    'div', // Plain divs without content are usually containers
    'span',
  ],
  verbose: false,
};

/** HTML elements that typically contain text content */
const TEXT_ELEMENTS = new Set([
  'p',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'td',
  'th',
  'label',
  'a',
  'button',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
]);

/** HTML elements that are typically containers */
const CONTAINER_ELEMENTS = new Set([
  'div',
  'section',
  'article',
  'main',
  'aside',
  'header',
  'footer',
  'nav',
  'form',
  'ul',
  'ol',
  'table',
  'thead',
  'tbody',
  'tr',
]);

/** Components that are typically image-like */
const IMAGE_COMPONENTS = new Set([
  'img',
  'Image',
  'Avatar',
  'ProfileImage',
  'Thumbnail',
  'Picture',
  'picture',
  'video',
  'canvas',
  'svg',
]);

/**
 * Compile skeleton metadata for an entire component tree
 *
 * @param tree - The serialized component tree
 * @param config - Compiler configuration
 * @returns Tree with skeleton metadata attached to nodes
 */
export function compileSkeletonTree(
  tree: SerializedComponent,
  config: SkeletonCompilerConfig = {}
): SerializedComponent {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  return walkAndEnrich(tree, mergedConfig);
}

function walkAndEnrich(
  node: SerializedComponent,
  config: Required<SkeletonCompilerConfig>
): SerializedComponent {
  const props = node.props || {};

  // 1. Check for explicit ignore hint
  const hints = parseSkeletonHints(props);
  if (hints.ignore) {
    // Skip skeleton for this node, but still process children
    return enrichChildren(node, config);
  }

  // 2. Extract dimensions from Tailwind classes
  const className = (props.className || props.class || '') as string;
  const tailwindDims = extractDimensionsFromClasses(className);

  // 3. Extract dimensions from props
  const propDims = propsToDimensions(props);

  // 4. Apply explicit hint overrides
  const hintDims: DimensionInference = {
    confidence: hints.width || hints.height ? 1.0 : 0,
    ...(hints.width && { width: hints.width }),
    ...(hints.height && { height: hints.height }),
  };

  // 5. Merge dimensions (hints > props > tailwind)
  const dimensions = mergeDimensions(tailwindDims, propDims, hintDims);

  // 6. Determine shape
  const shape = determineShape(node, hints, dimensions);

  // 7. Determine if this is dynamic content
  const isDynamic = isDynamicContent(node, config, hints);

  // 8. Calculate final confidence
  const confidence = calculateConfidence(dimensions, hints, isDynamic);

  // 9. Determine source
  const source = determineSource(hints, tailwindDims, propDims);

  // 10. Only attach skeleton if above minimum confidence and is dynamic
  const skeleton: SkeletonMetadata | undefined =
    isDynamic && confidence >= config.minConfidence
      ? {
          dimensions: stripConfidence(dimensions),
          shape,
          lines: hints.lines || (shape === 'text-block' ? 3 : undefined),
          isDynamic,
          confidence,
          source,
        }
      : undefined;

  // 11. Enrich children and return
  const enrichedNode: SerializedComponent = {
    ...node,
    ...(skeleton && { _skeleton: skeleton }),
  };

  return enrichChildren(enrichedNode, config);
}

function enrichChildren(
  node: SerializedComponent,
  config: Required<SkeletonCompilerConfig>
): SerializedComponent {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  return {
    ...node,
    children: node.children.map((child) =>
      typeof child === 'string' ? child : walkAndEnrich(child, config)
    ),
  };
}

/**
 * Determine the skeleton shape based on component type, hints, and dimensions
 */
function determineShape(
  node: SerializedComponent,
  hints: ReturnType<typeof parseSkeletonHints>,
  dimensions: DimensionInference
): SkeletonShape {
  // Explicit hint takes priority
  if (hints.shape) {
    return hints.shape;
  }

  const nodeType = node.type;

  // Image/avatar components - check if circular
  if (IMAGE_COMPONENTS.has(nodeType)) {
    // If it's a 1:1 aspect ratio or has rounded-full, it's probably circular
    if (
      dimensions.aspectRatio === '1/1' ||
      dimensions.borderRadius === '9999px' ||
      dimensions.borderRadius === '50%'
    ) {
      return 'circle';
    }
    return 'rect';
  }

  // Text elements
  if (TEXT_ELEMENTS.has(nodeType)) {
    // If we have explicit lines hint, use text-block
    if (hints.lines && hints.lines > 1) {
      return 'text-block';
    }
    return 'text-line';
  }

  // Container elements
  if (CONTAINER_ELEMENTS.has(nodeType)) {
    return 'container';
  }

  // Component names that suggest text
  if (
    nodeType.includes('Text') ||
    nodeType.includes('Label') ||
    nodeType.includes('Title') ||
    nodeType.includes('Heading') ||
    nodeType.includes('Paragraph')
  ) {
    return 'text-line';
  }

  // Component names that suggest cards/containers
  if (
    nodeType.includes('Card') ||
    nodeType.includes('Container') ||
    nodeType.includes('Box') ||
    nodeType.includes('Wrapper') ||
    nodeType.includes('Section')
  ) {
    return 'container';
  }

  // Default to rect
  return 'rect';
}

/**
 * Determine if this node has dynamic content that needs a skeleton
 */
function isDynamicContent(
  node: SerializedComponent,
  config: Required<SkeletonCompilerConfig>,
  hints: ReturnType<typeof parseSkeletonHints>
): boolean {
  const props = node.props || {};
  const nodeType = node.type;

  // Explicit hint from props
  if (isDynamicFromHints(props)) {
    return true;
  }

  // Check always-dynamic list
  if (config.alwaysDynamic.includes(nodeType)) {
    return true;
  }

  // Check never-dynamic list (but only if no explicit hint)
  if (config.neverDynamic.includes(nodeType) && !hints.shape) {
    // Still consider it dynamic if it has dimension hints
    return !!(hints.width || hints.height || hints.lines);
  }

  // Images with dynamic src
  if (IMAGE_COMPONENTS.has(nodeType)) {
    const src = props.src as string | undefined;
    if (src) {
      // Dynamic if src contains template syntax or isn't a static path
      if (
        src.includes('{') ||
        src.includes('$') ||
        (!src.startsWith('/') && !src.startsWith('./') && !src.startsWith('data:'))
      ) {
        return true;
      }
    }
    // Images without src are probably dynamic
    if (!src) {
      return true;
    }
  }

  // Check for common dynamic content indicators in props
  if (
    props.loading === true ||
    props.isLoading === true ||
    props['aria-busy'] === 'true' ||
    props['aria-busy'] === true
  ) {
    return true;
  }

  // Check if children are dynamic (single text child that's a variable)
  if (node.children && node.children.length === 1) {
    const child = node.children[0];
    if (typeof child === 'string') {
      // Static text content - not dynamic
      return false;
    }
  }

  // Empty children but with className suggests it will receive content
  if (
    (!node.children || node.children.length === 0) &&
    (props.className || props.class)
  ) {
    // Has styling but no content - might be dynamic
    // Only consider dynamic if we have dimension hints
    const className = (props.className || props.class || '') as string;
    const dims = extractDimensionsFromClasses(className);
    return dims.confidence > 0.5;
  }

  return false;
}

/**
 * Calculate final confidence score
 */
function calculateConfidence(
  dimensions: DimensionInference,
  hints: ReturnType<typeof parseSkeletonHints>,
  isDynamic: boolean
): number {
  // Explicit hints give full confidence
  if (hints.shape || hints.width || hints.height) {
    return 1.0;
  }

  // Use dimension inference confidence
  let confidence = dimensions.confidence;

  // Boost if we have both width and height
  if (dimensions.width && dimensions.height) {
    confidence = Math.min(confidence + 0.2, 1.0);
  }

  // Slight penalty if not dynamic
  if (!isDynamic) {
    confidence *= 0.8;
  }

  return confidence;
}

/**
 * Determine the source of skeleton data
 */
function determineSource(
  hints: ReturnType<typeof parseSkeletonHints>,
  tailwindDims: DimensionInference,
  propDims: DimensionInference
): SkeletonSource {
  if (hints.shape || hints.width || hints.height) {
    return 'hint';
  }
  if (tailwindDims.confidence > propDims.confidence) {
    return 'tailwind';
  }
  if (propDims.confidence > 0) {
    return 'prop-defaults';
  }
  return 'tailwind';
}

/**
 * Strip confidence from dimensions for storage
 */
function stripConfidence(dims: DimensionInference): SkeletonDimensions {
  const { confidence, ...rest } = dims;
  return rest;
}

/**
 * Generate a summary of skeleton coverage for a tree
 */
export function getSkeletonStats(tree: SerializedComponent): {
  totalNodes: number;
  nodesWithSkeleton: number;
  averageConfidence: number;
  shapeDistribution: Record<SkeletonShape, number>;
} {
  let totalNodes = 0;
  let nodesWithSkeleton = 0;
  let confidenceSum = 0;
  const shapeDistribution: Record<SkeletonShape, number> = {
    rect: 0,
    circle: 0,
    'text-line': 0,
    'text-block': 0,
    container: 0,
  };

  function walk(node: SerializedComponent): void {
    totalNodes++;

    if (node._skeleton) {
      nodesWithSkeleton++;
      confidenceSum += node._skeleton.confidence;
      shapeDistribution[node._skeleton.shape]++;
    }

    if (node.children) {
      for (const child of node.children) {
        if (typeof child !== 'string') {
          walk(child);
        }
      }
    }
  }

  walk(tree);

  return {
    totalNodes,
    nodesWithSkeleton,
    averageConfidence: nodesWithSkeleton > 0 ? confidenceSum / nodesWithSkeleton : 0,
    shapeDistribution,
  };
}
