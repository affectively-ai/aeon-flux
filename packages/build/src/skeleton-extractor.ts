/**
 * Skeleton Dimension Extractor
 *
 * Extracts skeleton dimensions from Tailwind classes for zero-CLS rendering.
 * Uses the same SPACING and BORDER_RADIUS constants as css-manifest.ts.
 */

import type { SkeletonDimensions } from '@affectively/aeon-pages-runtime';

/** Result of dimension inference with confidence score */
export interface DimensionInference extends SkeletonDimensions {
  /** Confidence score (0-1) based on how many dimensions were inferred */
  confidence: number;
}

// Tailwind spacing scale (same as css-manifest.ts)
const SPACING: Record<string, string> = {
  '0': '0px',
  px: '1px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
  full: '100%',
  auto: 'auto',
};

// Border radius scale (same as css-manifest.ts)
const BORDER_RADIUS: Record<string, string> = {
  none: '0px',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// Max-width scale
const MAX_WIDTH: Record<string, string> = {
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  'screen-sm': '640px',
  'screen-md': '768px',
  'screen-lg': '1024px',
  'screen-xl': '1280px',
  'screen-2xl': '1536px',
  full: '100%',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',
  prose: '65ch',
};

/**
 * Parse a fraction value like '1/2' or '2/3' into a percentage
 */
function parseFraction(value: string): string | undefined {
  const match = value.match(/^(\d+)\/(\d+)$/);
  if (!match) return undefined;

  const numerator = parseInt(match[1], 10);
  const denominator = parseInt(match[2], 10);
  if (denominator === 0) return undefined;

  const percent = ((numerator / denominator) * 100).toFixed(6);
  return `${percent}%`;
}

/**
 * Parse arbitrary value like '[200px]' or '[50%]'
 */
function parseArbitrary(value: string): string | undefined {
  const match = value.match(/^\[([^\]]+)\]$/);
  return match ? match[1] : undefined;
}

/**
 * Parse special width/height values
 */
function parseSpecial(value: string): string | undefined {
  switch (value) {
    case 'screen':
      return '100vw';
    case 'svw':
      return '100svw';
    case 'lvw':
      return '100lvw';
    case 'dvw':
      return '100dvw';
    case 'min':
      return 'min-content';
    case 'max':
      return 'max-content';
    case 'fit':
      return 'fit-content';
    default:
      return undefined;
  }
}

/**
 * Parse height special values
 */
function parseHeightSpecial(value: string): string | undefined {
  switch (value) {
    case 'screen':
      return '100vh';
    case 'svh':
      return '100svh';
    case 'lvh':
      return '100lvh';
    case 'dvh':
      return '100dvh';
    case 'min':
      return 'min-content';
    case 'max':
      return 'max-content';
    case 'fit':
      return 'fit-content';
    default:
      return undefined;
  }
}

/**
 * Extract skeleton dimensions from Tailwind class names
 *
 * @param className - Space-separated Tailwind class names
 * @returns Inferred dimensions with confidence score
 */
export function extractDimensionsFromClasses(className: string): DimensionInference {
  const classes = className.split(/\s+/).filter(Boolean);
  const result: DimensionInference = { confidence: 0 };
  let matchCount = 0;

  for (const cls of classes) {
    // Skip responsive/state prefixes for dimension extraction
    // We still want the base dimension, just stripping the prefix
    const baseClass = cls.includes(':') ? cls.split(':').pop()! : cls;

    // Width classes: w-64, w-full, w-1/2, w-[200px]
    const widthMatch = baseClass.match(/^w-(.+)$/);
    if (widthMatch) {
      const value = widthMatch[1];
      const parsed =
        SPACING[value] ||
        parseFraction(value) ||
        parseArbitrary(value) ||
        parseSpecial(value);
      if (parsed) {
        result.width = parsed;
        matchCount++;
      }
    }

    // Min-width classes: min-w-full, min-w-[200px]
    const minWidthMatch = baseClass.match(/^min-w-(.+)$/);
    if (minWidthMatch && !result.width) {
      const value = minWidthMatch[1];
      const parsed = SPACING[value] || parseArbitrary(value);
      if (parsed) {
        // Use min-width as width hint if no explicit width
        result.width = parsed;
        matchCount++;
      }
    }

    // Max-width classes: max-w-xl, max-w-screen-lg
    const maxWidthMatch = baseClass.match(/^max-w-(.+)$/);
    if (maxWidthMatch && !result.width) {
      const value = maxWidthMatch[1];
      const parsed = MAX_WIDTH[value] || parseArbitrary(value);
      if (parsed) {
        result.width = parsed;
        matchCount++;
      }
    }

    // Height classes: h-12, h-screen, h-[100px]
    const heightMatch = baseClass.match(/^h-(.+)$/);
    if (heightMatch) {
      const value = heightMatch[1];
      const parsed =
        SPACING[value] ||
        parseFraction(value) ||
        parseArbitrary(value) ||
        parseHeightSpecial(value);
      if (parsed) {
        result.height = parsed;
        matchCount++;
      }
    }

    // Min-height classes: min-h-screen, min-h-[100px]
    const minHeightMatch = baseClass.match(/^min-h-(.+)$/);
    if (minHeightMatch) {
      const value = minHeightMatch[1];
      let parsed: string | undefined;
      if (value === 'screen') parsed = '100vh';
      else if (value === 'svh') parsed = '100svh';
      else if (value === 'lvh') parsed = '100lvh';
      else if (value === 'dvh') parsed = '100dvh';
      else if (value === 'full') parsed = '100%';
      else parsed = SPACING[value] || parseArbitrary(value);

      if (parsed) {
        result.minHeight = parsed;
        matchCount++;
      }
    }

    // Aspect ratio: aspect-square, aspect-video, aspect-[16/9]
    if (baseClass === 'aspect-square') {
      result.aspectRatio = '1/1';
      matchCount++;
    } else if (baseClass === 'aspect-video') {
      result.aspectRatio = '16/9';
      matchCount++;
    } else if (baseClass === 'aspect-auto') {
      result.aspectRatio = 'auto';
    } else {
      const aspectMatch = baseClass.match(/^aspect-\[([^\]]+)\]$/);
      if (aspectMatch) {
        result.aspectRatio = aspectMatch[1];
        matchCount++;
      }
    }

    // Padding: p-4, px-2, py-3, pt-1, etc.
    const paddingMatch = baseClass.match(/^p([xytblr])?-(.+)$/);
    if (paddingMatch) {
      const value = paddingMatch[2];
      const parsed = SPACING[value] || parseArbitrary(value);
      if (parsed) {
        // Store simplified padding (just the value, direction handled at render)
        result.padding = parsed;
        matchCount++;
      }
    }

    // Margin: m-4, mx-auto, my-2, etc.
    const marginMatch = baseClass.match(/^-?m([xytblr])?-(.+)$/);
    if (marginMatch) {
      const isNegative = baseClass.startsWith('-');
      const value = marginMatch[2];
      let parsed = SPACING[value] || parseArbitrary(value);
      if (parsed && isNegative && parsed !== '0px' && parsed !== 'auto') {
        parsed = `-${parsed}`;
      }
      if (parsed) {
        result.margin = parsed;
        matchCount++;
      }
    }

    // Gap: gap-4, gap-x-2, gap-y-3
    const gapMatch = baseClass.match(/^gap(?:-[xy])?-(.+)$/);
    if (gapMatch) {
      const value = gapMatch[1];
      const parsed = SPACING[value] || parseArbitrary(value);
      if (parsed) {
        result.gap = parsed;
        matchCount++;
      }
    }

    // Border radius: rounded, rounded-lg, rounded-full, rounded-[10px]
    const roundedMatch = baseClass.match(/^rounded(?:-([a-z0-9]+))?$/);
    if (roundedMatch) {
      const size = roundedMatch[1] || 'DEFAULT';
      const parsed = BORDER_RADIUS[size] || parseArbitrary(size);
      if (parsed) {
        result.borderRadius = parsed;
        matchCount++;
      }
    }

    // Handle corner-specific border radius: rounded-t-lg, rounded-tl-xl
    const cornerRoundedMatch = baseClass.match(/^rounded-(?:t|r|b|l|tl|tr|bl|br)-(.+)$/);
    if (cornerRoundedMatch && !result.borderRadius) {
      const size = cornerRoundedMatch[1];
      const parsed = BORDER_RADIUS[size] || parseArbitrary(size);
      if (parsed) {
        result.borderRadius = parsed;
        matchCount++;
      }
    }
  }

  // Calculate confidence based on how many dimension-related properties we found
  // Weight width and height more heavily since they're most important for CLS
  const widthWeight = result.width ? 2 : 0;
  const heightWeight = result.height ? 2 : 0;
  const aspectWeight = result.aspectRatio ? 1.5 : 0;
  const otherWeight = matchCount - (result.width ? 1 : 0) - (result.height ? 1 : 0) - (result.aspectRatio ? 1 : 0);

  const totalWeight = widthWeight + heightWeight + aspectWeight + otherWeight * 0.5;
  // Normalize to 0-1 range (max score when we have width + height + other props)
  result.confidence = Math.min(totalWeight / 5, 1);

  return result;
}

/**
 * Map common size prop values to skeleton dimensions
 */
export function propsToDimensions(props: Record<string, unknown>): DimensionInference {
  const result: DimensionInference = { confidence: 0 };
  let matchCount = 0;

  // Direct dimension props
  if (props.width !== undefined) {
    const width = String(props.width);
    // If it's a number, assume pixels
    if (/^\d+$/.test(width)) {
      result.width = `${width}px`;
    } else {
      result.width = width;
    }
    matchCount++;
  }

  if (props.height !== undefined) {
    const height = String(props.height);
    if (/^\d+$/.test(height)) {
      result.height = `${height}px`;
    } else {
      result.height = height;
    }
    matchCount++;
  }

  // Common size prop mapping (for icon/avatar components)
  const sizeMap: Record<string, { width: string; height: string }> = {
    xs: { width: '1rem', height: '1rem' },
    sm: { width: '1.5rem', height: '1.5rem' },
    md: { width: '2rem', height: '2rem' },
    lg: { width: '2.5rem', height: '2.5rem' },
    xl: { width: '3rem', height: '3rem' },
    '2xl': { width: '4rem', height: '4rem' },
    '3xl': { width: '5rem', height: '5rem' },
    '4xl': { width: '6rem', height: '6rem' },
  };

  if (props.size !== undefined && typeof props.size === 'string') {
    const mapped = sizeMap[props.size];
    if (mapped) {
      if (!result.width) result.width = mapped.width;
      if (!result.height) result.height = mapped.height;
      matchCount++;
    }
  }

  // Numeric size prop (common in icon libraries)
  if (props.size !== undefined && typeof props.size === 'number') {
    const size = `${props.size}px`;
    if (!result.width) result.width = size;
    if (!result.height) result.height = size;
    matchCount++;
  }

  // Calculate confidence
  result.confidence = Math.min(matchCount / 2, 1);

  return result;
}

/**
 * Merge multiple dimension inferences, with later sources taking priority
 */
export function mergeDimensions(...sources: DimensionInference[]): DimensionInference {
  const result: DimensionInference = { confidence: 0 };

  for (const source of sources) {
    if (source.width) result.width = source.width;
    if (source.height) result.height = source.height;
    if (source.minHeight) result.minHeight = source.minHeight;
    if (source.aspectRatio) result.aspectRatio = source.aspectRatio;
    if (source.padding) result.padding = source.padding;
    if (source.margin) result.margin = source.margin;
    if (source.borderRadius) result.borderRadius = source.borderRadius;
    if (source.gap) result.gap = source.gap;
    // Take max confidence
    result.confidence = Math.max(result.confidence, source.confidence);
  }

  return result;
}
