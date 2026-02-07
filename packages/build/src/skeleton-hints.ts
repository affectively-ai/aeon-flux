/**
 * Skeleton Hints Parser
 *
 * Parses data-skeleton-* attributes from component props for explicit
 * skeleton control. These hints take priority over auto-inferred values.
 */

import type { SkeletonHint, SkeletonShape } from '@affectively/aeon-pages-runtime';

/** Valid skeleton shapes */
const VALID_SHAPES: SkeletonShape[] = ['rect', 'circle', 'text-line', 'text-block', 'container'];

/**
 * Parse skeleton hints from data-skeleton-* attributes in props
 *
 * @param props - Component props object
 * @returns Parsed skeleton hints
 *
 * @example
 * // Shape hint
 * <img data-skeleton-shape="circle" />
 *
 * @example
 * // Text block with line count
 * <p data-skeleton-shape="text-block" data-skeleton-lines="3" />
 *
 * @example
 * // Explicit dimensions
 * <div data-skeleton-width="200px" data-skeleton-height="100px" />
 *
 * @example
 * // Skip skeleton for this element
 * <div data-skeleton-ignore="true" />
 */
export function parseSkeletonHints(props: Record<string, unknown>): SkeletonHint {
  const hint: SkeletonHint = {};

  for (const [key, value] of Object.entries(props)) {
    // Only process data-skeleton-* attributes
    if (!key.startsWith('data-skeleton-')) continue;

    const hintKey = key.replace('data-skeleton-', '');

    switch (hintKey) {
      case 'shape': {
        const strValue = String(value);
        if (VALID_SHAPES.includes(strValue as SkeletonShape)) {
          hint.shape = strValue as SkeletonShape;
        }
        break;
      }

      case 'width': {
        const strValue = String(value);
        // Validate it looks like a CSS value
        if (strValue && /^[\d.]+(?:px|rem|em|%|vw|vh|ch|ex)?$/.test(strValue)) {
          hint.width = strValue;
        } else if (strValue) {
          // Allow any value for flexibility (could be CSS variable, calc, etc.)
          hint.width = strValue;
        }
        break;
      }

      case 'height': {
        const strValue = String(value);
        if (strValue) {
          hint.height = strValue;
        }
        break;
      }

      case 'lines': {
        const numValue = parseInt(String(value), 10);
        if (!isNaN(numValue) && numValue > 0 && numValue <= 20) {
          hint.lines = numValue;
        }
        break;
      }

      case 'ignore': {
        // Accept various truthy values
        hint.ignore =
          value === true ||
          value === 'true' ||
          value === '1' ||
          value === 1;
        break;
      }

      case 'dynamic': {
        // Explicit dynamic marker (forces skeleton generation)
        // This is stored in props, not in hint, but we can note it here
        // The compiler will check for this separately
        break;
      }
    }
  }

  return hint;
}

/**
 * Check if props indicate this is dynamic content that needs a skeleton
 */
export function isDynamicFromHints(props: Record<string, unknown>): boolean {
  // Explicit dynamic marker
  if (props['data-skeleton-dynamic'] === true || props['data-skeleton-dynamic'] === 'true') {
    return true;
  }

  // Explicit loading state
  if (props['data-loading'] === true || props['data-loading'] === 'true') {
    return true;
  }

  return false;
}

/**
 * Remove skeleton hint attributes from props
 * (useful when passing props to rendered component)
 */
export function stripSkeletonHints(props: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (!key.startsWith('data-skeleton-')) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Merge skeleton hints, with later hints taking priority
 */
export function mergeHints(...hints: SkeletonHint[]): SkeletonHint {
  const result: SkeletonHint = {};

  for (const hint of hints) {
    if (hint.shape !== undefined) result.shape = hint.shape;
    if (hint.width !== undefined) result.width = hint.width;
    if (hint.height !== undefined) result.height = hint.height;
    if (hint.lines !== undefined) result.lines = hint.lines;
    if (hint.ignore !== undefined) result.ignore = hint.ignore;
  }

  return result;
}
