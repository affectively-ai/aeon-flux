/**
 * CSS Manifest Generator
 *
 * Generates a mapping of Tailwind class names to their CSS rules.
 * This enables on-demand CSS generation at render time - only the
 * CSS that's actually needed for a page gets inlined.
 *
 * Inspired by Tailwind v4's Lightning CSS approach.
 */

export interface CSSRule {
  selector: string;
  declarations: string;
  mediaQuery?: string;
  layer?: string;
}

export interface CSSManifest {
  version: string;
  generatedAt: string;
  rules: Record<string, CSSRule[]>;
  variants: Record<string, string>;
  critical: string;
}

// Tailwind color palette (subset for common usage)
const COLORS: Record<string, Record<string, string>> = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
  gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712' },
  zinc: { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' },
  neutral: { 50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717', 950: '#0a0a0a' },
  stone: { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917', 950: '#0c0a09' },
  red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
  orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' },
  yellow: { 50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12', 950: '#422006' },
  lime: { 50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', 800: '#3f6212', 900: '#365314', 950: '#1a2e05' },
  green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' },
  cyan: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344' },
  sky: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49' },
  blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
  violet: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
  fuchsia: { 50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75', 950: '#4a044e' },
  pink: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843', 950: '#500724' },
  rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519' },
  white: { DEFAULT: '#ffffff' },
  black: { DEFAULT: '#000000' },
  transparent: { DEFAULT: 'transparent' },
};

// Spacing scale
const SPACING: Record<string, string> = {
  '0': '0px', 'px': '1px', '0.5': '0.125rem', '1': '0.25rem', '1.5': '0.375rem',
  '2': '0.5rem', '2.5': '0.625rem', '3': '0.75rem', '3.5': '0.875rem', '4': '1rem',
  '5': '1.25rem', '6': '1.5rem', '7': '1.75rem', '8': '2rem', '9': '2.25rem',
  '10': '2.5rem', '11': '2.75rem', '12': '3rem', '14': '3.5rem', '16': '4rem',
  '20': '5rem', '24': '6rem', '28': '7rem', '32': '8rem', '36': '9rem', '40': '10rem',
  '44': '11rem', '48': '12rem', '52': '13rem', '56': '14rem', '60': '15rem', '64': '16rem',
  '72': '18rem', '80': '20rem', '96': '24rem',
  'full': '100%', 'auto': 'auto',
};

// Font sizes
const FONT_SIZES: Record<string, [string, string]> = {
  'xs': ['0.75rem', '1rem'],
  'sm': ['0.875rem', '1.25rem'],
  'base': ['1rem', '1.5rem'],
  'lg': ['1.125rem', '1.75rem'],
  'xl': ['1.25rem', '1.75rem'],
  '2xl': ['1.5rem', '2rem'],
  '3xl': ['1.875rem', '2.25rem'],
  '4xl': ['2.25rem', '2.5rem'],
  '5xl': ['3rem', '1'],
  '6xl': ['3.75rem', '1'],
  '7xl': ['4.5rem', '1'],
  '8xl': ['6rem', '1'],
  '9xl': ['8rem', '1'],
};

// Border radius
const BORDER_RADIUS: Record<string, string> = {
  'none': '0px', 'sm': '0.125rem', 'DEFAULT': '0.25rem', 'md': '0.375rem',
  'lg': '0.5rem', 'xl': '0.75rem', '2xl': '1rem', '3xl': '1.5rem', 'full': '9999px',
};

// Escape CSS selector special characters
function escapeSelector(cls: string): string {
  return cls.replace(/[.:/[\]#%()@!]/g, '\\$&');
}

// Get color value from palette
function getColor(colorName: string, shade?: string): string | null {
  const palette = COLORS[colorName];
  if (!palette) return null;
  return palette[shade || 'DEFAULT'] || palette['500'] || null;
}

// Convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Generate CSS rule for a single class
function generateRule(className: string): CSSRule | null {
  const escaped = escapeSelector(className);

  // Background colors: bg-{color}-{shade} or bg-{color}-{shade}/{opacity}
  const bgMatch = className.match(/^bg-(\w+)(?:-(\d+))?(?:\/(\d+))?$/);
  if (bgMatch) {
    const [, color, shade, opacity] = bgMatch;
    const colorValue = getColor(color, shade);
    if (colorValue) {
      const value = opacity
        ? hexToRgba(colorValue, parseInt(opacity) / 100)
        : colorValue;
      return {
        selector: `.${escaped}`,
        declarations: `background-color: ${value}`,
      };
    }
  }

  // Text colors: text-{color}-{shade}
  const textColorMatch = className.match(/^text-(\w+)(?:-(\d+))?$/);
  if (textColorMatch) {
    const [, color, shade] = textColorMatch;
    // Skip if it's a text size class
    if (!['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl', 'left', 'center', 'right', 'justify'].includes(color)) {
      const colorValue = getColor(color, shade);
      if (colorValue) {
        return {
          selector: `.${escaped}`,
          declarations: `color: ${colorValue}`,
        };
      }
    }
  }

  // Text sizes: text-{size}
  const textSizeMatch = className.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/);
  if (textSizeMatch) {
    const [fontSize, lineHeight] = FONT_SIZES[textSizeMatch[1]];
    return {
      selector: `.${escaped}`,
      declarations: `font-size: ${fontSize}; line-height: ${lineHeight}`,
    };
  }

  // Text alignment
  if (className === 'text-left') return { selector: `.${escaped}`, declarations: 'text-align: left' };
  if (className === 'text-center') return { selector: `.${escaped}`, declarations: 'text-align: center' };
  if (className === 'text-right') return { selector: `.${escaped}`, declarations: 'text-align: right' };
  if (className === 'text-justify') return { selector: `.${escaped}`, declarations: 'text-align: justify' };

  // Padding: p{x|y|t|r|b|l}-{size}
  const paddingMatch = className.match(/^p([xytblr])?-(.+)$/);
  if (paddingMatch) {
    const [, dir, size] = paddingMatch;
    const value = SPACING[size];
    if (value) {
      let declarations: string;
      switch (dir) {
        case 'x': declarations = `padding-left: ${value}; padding-right: ${value}`; break;
        case 'y': declarations = `padding-top: ${value}; padding-bottom: ${value}`; break;
        case 't': declarations = `padding-top: ${value}`; break;
        case 'r': declarations = `padding-right: ${value}`; break;
        case 'b': declarations = `padding-bottom: ${value}`; break;
        case 'l': declarations = `padding-left: ${value}`; break;
        default: declarations = `padding: ${value}`;
      }
      return { selector: `.${escaped}`, declarations };
    }
  }

  // Margin: m{x|y|t|r|b|l}-{size}
  const marginMatch = className.match(/^-?m([xytblr])?-(.+)$/);
  if (marginMatch) {
    const isNegative = className.startsWith('-');
    const [, dir, size] = marginMatch;
    let value = SPACING[size];
    if (value) {
      if (isNegative && value !== '0px' && value !== 'auto') {
        value = `-${value}`;
      }
      let declarations: string;
      switch (dir) {
        case 'x': declarations = `margin-left: ${value}; margin-right: ${value}`; break;
        case 'y': declarations = `margin-top: ${value}; margin-bottom: ${value}`; break;
        case 't': declarations = `margin-top: ${value}`; break;
        case 'r': declarations = `margin-right: ${value}`; break;
        case 'b': declarations = `margin-bottom: ${value}`; break;
        case 'l': declarations = `margin-left: ${value}`; break;
        default: declarations = `margin: ${value}`;
      }
      return { selector: `.${escaped}`, declarations };
    }
  }

  // Width: w-{size}
  const widthMatch = className.match(/^w-(.+)$/);
  if (widthMatch) {
    const size = widthMatch[1];
    const value = SPACING[size] || (size === 'screen' ? '100vw' : null);
    if (value) {
      return { selector: `.${escaped}`, declarations: `width: ${value}` };
    }
    // Fractional widths
    const fractionMatch = size.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      const percent = (parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]) * 100).toFixed(6);
      return { selector: `.${escaped}`, declarations: `width: ${percent}%` };
    }
  }

  // Height: h-{size}
  const heightMatch = className.match(/^h-(.+)$/);
  if (heightMatch) {
    const size = heightMatch[1];
    const value = SPACING[size] || (size === 'screen' ? '100vh' : null);
    if (value) {
      return { selector: `.${escaped}`, declarations: `height: ${value}` };
    }
  }

  // Min/Max width/height
  if (className === 'min-h-screen') return { selector: `.${escaped}`, declarations: 'min-height: 100vh' };
  if (className === 'min-w-full') return { selector: `.${escaped}`, declarations: 'min-width: 100%' };
  if (className === 'max-w-full') return { selector: `.${escaped}`, declarations: 'max-width: 100%' };
  if (className === 'max-w-screen-xl') return { selector: `.${escaped}`, declarations: 'max-width: 1280px' };
  if (className === 'max-w-screen-lg') return { selector: `.${escaped}`, declarations: 'max-width: 1024px' };
  if (className === 'max-w-7xl') return { selector: `.${escaped}`, declarations: 'max-width: 80rem' };
  if (className === 'max-w-6xl') return { selector: `.${escaped}`, declarations: 'max-width: 72rem' };
  if (className === 'max-w-5xl') return { selector: `.${escaped}`, declarations: 'max-width: 64rem' };
  if (className === 'max-w-4xl') return { selector: `.${escaped}`, declarations: 'max-width: 56rem' };
  if (className === 'max-w-3xl') return { selector: `.${escaped}`, declarations: 'max-width: 48rem' };
  if (className === 'max-w-2xl') return { selector: `.${escaped}`, declarations: 'max-width: 42rem' };
  if (className === 'max-w-xl') return { selector: `.${escaped}`, declarations: 'max-width: 36rem' };
  if (className === 'max-w-lg') return { selector: `.${escaped}`, declarations: 'max-width: 32rem' };
  if (className === 'max-w-md') return { selector: `.${escaped}`, declarations: 'max-width: 28rem' };
  if (className === 'max-w-sm') return { selector: `.${escaped}`, declarations: 'max-width: 24rem' };
  if (className === 'max-w-xs') return { selector: `.${escaped}`, declarations: 'max-width: 20rem' };

  // Border radius: rounded-{size}
  const roundedMatch = className.match(/^rounded(?:-([a-z0-9]+))?(?:-(tl|tr|bl|br|t|r|b|l))?$/);
  if (roundedMatch) {
    const [, size, corner] = roundedMatch;
    const value = BORDER_RADIUS[size || 'DEFAULT'];
    if (value) {
      let declarations: string;
      switch (corner) {
        case 'tl': declarations = `border-top-left-radius: ${value}`; break;
        case 'tr': declarations = `border-top-right-radius: ${value}`; break;
        case 'bl': declarations = `border-bottom-left-radius: ${value}`; break;
        case 'br': declarations = `border-bottom-right-radius: ${value}`; break;
        case 't': declarations = `border-top-left-radius: ${value}; border-top-right-radius: ${value}`; break;
        case 'r': declarations = `border-top-right-radius: ${value}; border-bottom-right-radius: ${value}`; break;
        case 'b': declarations = `border-bottom-left-radius: ${value}; border-bottom-right-radius: ${value}`; break;
        case 'l': declarations = `border-top-left-radius: ${value}; border-bottom-left-radius: ${value}`; break;
        default: declarations = `border-radius: ${value}`;
      }
      return { selector: `.${escaped}`, declarations };
    }
  }

  // Border width
  const borderMatch = className.match(/^border(?:-([xytblr]))?(?:-(\d+))?$/);
  if (borderMatch) {
    const [, dir, width] = borderMatch;
    const value = width ? `${width}px` : '1px';
    let declarations: string;
    switch (dir) {
      case 'x': declarations = `border-left-width: ${value}; border-right-width: ${value}`; break;
      case 'y': declarations = `border-top-width: ${value}; border-bottom-width: ${value}`; break;
      case 't': declarations = `border-top-width: ${value}`; break;
      case 'r': declarations = `border-right-width: ${value}`; break;
      case 'b': declarations = `border-bottom-width: ${value}`; break;
      case 'l': declarations = `border-left-width: ${value}`; break;
      default: declarations = `border-width: ${value}`;
    }
    return { selector: `.${escaped}`, declarations: `${declarations}; border-style: solid` };
  }

  // Border colors
  const borderColorMatch = className.match(/^border-(\w+)(?:-(\d+))?(?:\/(\d+))?$/);
  if (borderColorMatch) {
    const [, color, shade, opacity] = borderColorMatch;
    if (!['x', 'y', 't', 'r', 'b', 'l'].includes(color)) {
      const colorValue = getColor(color, shade);
      if (colorValue) {
        const value = opacity
          ? hexToRgba(colorValue, parseInt(opacity) / 100)
          : colorValue;
        return { selector: `.${escaped}`, declarations: `border-color: ${value}` };
      }
    }
  }

  // Gap
  const gapMatch = className.match(/^gap(?:-([xy]))?-(.+)$/);
  if (gapMatch) {
    const [, dir, size] = gapMatch;
    const value = SPACING[size];
    if (value) {
      let declarations: string;
      switch (dir) {
        case 'x': declarations = `column-gap: ${value}`; break;
        case 'y': declarations = `row-gap: ${value}`; break;
        default: declarations = `gap: ${value}`;
      }
      return { selector: `.${escaped}`, declarations };
    }
  }

  // Space between: space-{x|y}-{size}
  const spaceMatch = className.match(/^space-([xy])-(.+)$/);
  if (spaceMatch) {
    const [, dir, size] = spaceMatch;
    const value = SPACING[size];
    if (value) {
      const prop = dir === 'x' ? 'margin-left' : 'margin-top';
      return {
        selector: `.${escaped} > :not([hidden]) ~ :not([hidden])`,
        declarations: `${prop}: ${value}`,
      };
    }
  }

  // Static utility classes
  const staticUtilities: Record<string, string> = {
    // Display
    'flex': 'display: flex',
    'inline-flex': 'display: inline-flex',
    'block': 'display: block',
    'inline-block': 'display: inline-block',
    'inline': 'display: inline',
    'hidden': 'display: none',
    'grid': 'display: grid',
    'inline-grid': 'display: inline-grid',
    'contents': 'display: contents',
    'table': 'display: table',

    // Flex direction
    'flex-row': 'flex-direction: row',
    'flex-row-reverse': 'flex-direction: row-reverse',
    'flex-col': 'flex-direction: column',
    'flex-col-reverse': 'flex-direction: column-reverse',

    // Flex wrap
    'flex-wrap': 'flex-wrap: wrap',
    'flex-wrap-reverse': 'flex-wrap: wrap-reverse',
    'flex-nowrap': 'flex-wrap: nowrap',

    // Flex grow/shrink
    'flex-1': 'flex: 1 1 0%',
    'flex-auto': 'flex: 1 1 auto',
    'flex-initial': 'flex: 0 1 auto',
    'flex-none': 'flex: none',
    'grow': 'flex-grow: 1',
    'grow-0': 'flex-grow: 0',
    'shrink': 'flex-shrink: 1',
    'shrink-0': 'flex-shrink: 0',

    // Align items
    'items-start': 'align-items: flex-start',
    'items-end': 'align-items: flex-end',
    'items-center': 'align-items: center',
    'items-baseline': 'align-items: baseline',
    'items-stretch': 'align-items: stretch',

    // Align self
    'self-auto': 'align-self: auto',
    'self-start': 'align-self: flex-start',
    'self-end': 'align-self: flex-end',
    'self-center': 'align-self: center',
    'self-stretch': 'align-self: stretch',

    // Justify content
    'justify-start': 'justify-content: flex-start',
    'justify-end': 'justify-content: flex-end',
    'justify-center': 'justify-content: center',
    'justify-between': 'justify-content: space-between',
    'justify-around': 'justify-content: space-around',
    'justify-evenly': 'justify-content: space-evenly',

    // Justify items
    'justify-items-start': 'justify-items: start',
    'justify-items-end': 'justify-items: end',
    'justify-items-center': 'justify-items: center',
    'justify-items-stretch': 'justify-items: stretch',

    // Position
    'static': 'position: static',
    'fixed': 'position: fixed',
    'absolute': 'position: absolute',
    'relative': 'position: relative',
    'sticky': 'position: sticky',

    // Inset
    'inset-0': 'inset: 0',
    'inset-auto': 'inset: auto',
    'top-0': 'top: 0',
    'right-0': 'right: 0',
    'bottom-0': 'bottom: 0',
    'left-0': 'left: 0',

    // Z-index
    'z-0': 'z-index: 0',
    'z-10': 'z-index: 10',
    'z-20': 'z-index: 20',
    'z-30': 'z-index: 30',
    'z-40': 'z-index: 40',
    'z-50': 'z-index: 50',
    'z-auto': 'z-index: auto',

    // Overflow
    'overflow-auto': 'overflow: auto',
    'overflow-hidden': 'overflow: hidden',
    'overflow-visible': 'overflow: visible',
    'overflow-scroll': 'overflow: scroll',
    'overflow-x-auto': 'overflow-x: auto',
    'overflow-y-auto': 'overflow-y: auto',
    'overflow-x-hidden': 'overflow-x: hidden',
    'overflow-y-hidden': 'overflow-y: hidden',

    // Font weight
    'font-thin': 'font-weight: 100',
    'font-extralight': 'font-weight: 200',
    'font-light': 'font-weight: 300',
    'font-normal': 'font-weight: 400',
    'font-medium': 'font-weight: 500',
    'font-semibold': 'font-weight: 600',
    'font-bold': 'font-weight: 700',
    'font-extrabold': 'font-weight: 800',
    'font-black': 'font-weight: 900',

    // Font style
    'italic': 'font-style: italic',
    'not-italic': 'font-style: normal',

    // Text decoration
    'underline': 'text-decoration-line: underline',
    'overline': 'text-decoration-line: overline',
    'line-through': 'text-decoration-line: line-through',
    'no-underline': 'text-decoration-line: none',

    // Text transform
    'uppercase': 'text-transform: uppercase',
    'lowercase': 'text-transform: lowercase',
    'capitalize': 'text-transform: capitalize',
    'normal-case': 'text-transform: none',

    // Whitespace
    'whitespace-normal': 'white-space: normal',
    'whitespace-nowrap': 'white-space: nowrap',
    'whitespace-pre': 'white-space: pre',
    'whitespace-pre-line': 'white-space: pre-line',
    'whitespace-pre-wrap': 'white-space: pre-wrap',

    // Word break
    'break-normal': 'overflow-wrap: normal; word-break: normal',
    'break-words': 'overflow-wrap: break-word',
    'break-all': 'word-break: break-all',
    'truncate': 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap',

    // Cursor
    'cursor-auto': 'cursor: auto',
    'cursor-default': 'cursor: default',
    'cursor-pointer': 'cursor: pointer',
    'cursor-wait': 'cursor: wait',
    'cursor-text': 'cursor: text',
    'cursor-move': 'cursor: move',
    'cursor-not-allowed': 'cursor: not-allowed',

    // Pointer events
    'pointer-events-none': 'pointer-events: none',
    'pointer-events-auto': 'pointer-events: auto',

    // User select
    'select-none': 'user-select: none',
    'select-text': 'user-select: text',
    'select-all': 'user-select: all',
    'select-auto': 'user-select: auto',

    // Visibility
    'visible': 'visibility: visible',
    'invisible': 'visibility: hidden',

    // Opacity
    'opacity-0': 'opacity: 0',
    'opacity-5': 'opacity: 0.05',
    'opacity-10': 'opacity: 0.1',
    'opacity-20': 'opacity: 0.2',
    'opacity-25': 'opacity: 0.25',
    'opacity-30': 'opacity: 0.3',
    'opacity-40': 'opacity: 0.4',
    'opacity-50': 'opacity: 0.5',
    'opacity-60': 'opacity: 0.6',
    'opacity-70': 'opacity: 0.7',
    'opacity-75': 'opacity: 0.75',
    'opacity-80': 'opacity: 0.8',
    'opacity-90': 'opacity: 0.9',
    'opacity-95': 'opacity: 0.95',
    'opacity-100': 'opacity: 1',

    // Transition
    'transition': 'transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms',
    'transition-none': 'transition-property: none',
    'transition-all': 'transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms',
    'transition-colors': 'transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms',
    'transition-opacity': 'transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms',
    'transition-shadow': 'transition-property: box-shadow; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms',
    'transition-transform': 'transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms',

    // Duration
    'duration-75': 'transition-duration: 75ms',
    'duration-100': 'transition-duration: 100ms',
    'duration-150': 'transition-duration: 150ms',
    'duration-200': 'transition-duration: 200ms',
    'duration-300': 'transition-duration: 300ms',
    'duration-500': 'transition-duration: 500ms',
    'duration-700': 'transition-duration: 700ms',
    'duration-1000': 'transition-duration: 1000ms',

    // Ease
    'ease-linear': 'transition-timing-function: linear',
    'ease-in': 'transition-timing-function: cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'transition-timing-function: cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)',

    // Animation
    'animate-none': 'animation: none',
    'animate-spin': 'animation: spin 1s linear infinite',
    'animate-ping': 'animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    'animate-pulse': 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    'animate-bounce': 'animation: bounce 1s infinite',

    // Transform
    'transform': 'transform: translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))',
    'transform-none': 'transform: none',

    // Object fit
    'object-contain': 'object-fit: contain',
    'object-cover': 'object-fit: cover',
    'object-fill': 'object-fit: fill',
    'object-none': 'object-fit: none',
    'object-scale-down': 'object-fit: scale-down',

    // Shadow
    'shadow-sm': 'box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'shadow': 'box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'shadow-md': 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'shadow-lg': 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'shadow-xl': 'box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    'shadow-2xl': 'box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)',
    'shadow-inner': 'box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    'shadow-none': 'box-shadow: 0 0 #0000',

    // Ring
    'ring': 'box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)',
    'ring-0': '--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
    'ring-1': '--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
    'ring-2': '--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color)',

    // Outline
    'outline-none': 'outline: 2px solid transparent; outline-offset: 2px',
    'outline': 'outline-style: solid',
    'outline-dashed': 'outline-style: dashed',
    'outline-dotted': 'outline-style: dotted',
    'outline-double': 'outline-style: double',

    // List style
    'list-none': 'list-style-type: none',
    'list-disc': 'list-style-type: disc',
    'list-decimal': 'list-style-type: decimal',
    'list-inside': 'list-style-position: inside',
    'list-outside': 'list-style-position: outside',

    // SR only
    'sr-only': 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0',
    'not-sr-only': 'position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip: auto; white-space: normal',

    // Aspect ratio
    'aspect-auto': 'aspect-ratio: auto',
    'aspect-square': 'aspect-ratio: 1 / 1',
    'aspect-video': 'aspect-ratio: 16 / 9',

    // Container
    'container': 'width: 100%',

    // Columns
    'columns-1': 'columns: 1',
    'columns-2': 'columns: 2',
    'columns-3': 'columns: 3',
    'columns-4': 'columns: 4',

    // Grid
    'grid-cols-1': 'grid-template-columns: repeat(1, minmax(0, 1fr))',
    'grid-cols-2': 'grid-template-columns: repeat(2, minmax(0, 1fr))',
    'grid-cols-3': 'grid-template-columns: repeat(3, minmax(0, 1fr))',
    'grid-cols-4': 'grid-template-columns: repeat(4, minmax(0, 1fr))',
    'grid-cols-5': 'grid-template-columns: repeat(5, minmax(0, 1fr))',
    'grid-cols-6': 'grid-template-columns: repeat(6, minmax(0, 1fr))',
    'grid-cols-12': 'grid-template-columns: repeat(12, minmax(0, 1fr))',
    'grid-rows-1': 'grid-template-rows: repeat(1, minmax(0, 1fr))',
    'grid-rows-2': 'grid-template-rows: repeat(2, minmax(0, 1fr))',
    'grid-rows-3': 'grid-template-rows: repeat(3, minmax(0, 1fr))',
    'grid-rows-4': 'grid-template-rows: repeat(4, minmax(0, 1fr))',
    'grid-rows-5': 'grid-template-rows: repeat(5, minmax(0, 1fr))',
    'grid-rows-6': 'grid-template-rows: repeat(6, minmax(0, 1fr))',

    // Col/Row span
    'col-auto': 'grid-column: auto',
    'col-span-1': 'grid-column: span 1 / span 1',
    'col-span-2': 'grid-column: span 2 / span 2',
    'col-span-3': 'grid-column: span 3 / span 3',
    'col-span-4': 'grid-column: span 4 / span 4',
    'col-span-5': 'grid-column: span 5 / span 5',
    'col-span-6': 'grid-column: span 6 / span 6',
    'col-span-full': 'grid-column: 1 / -1',
    'row-auto': 'grid-row: auto',
    'row-span-1': 'grid-row: span 1 / span 1',
    'row-span-2': 'grid-row: span 2 / span 2',
    'row-span-3': 'grid-row: span 3 / span 3',
    'row-span-full': 'grid-row: 1 / -1',

    // Align/Justify content (grid)
    'content-center': 'align-content: center',
    'content-start': 'align-content: flex-start',
    'content-end': 'align-content: flex-end',
    'content-between': 'align-content: space-between',
    'content-around': 'align-content: space-around',
    'content-evenly': 'align-content: space-evenly',

    // Place items/content/self
    'place-content-center': 'place-content: center',
    'place-content-start': 'place-content: start',
    'place-content-end': 'place-content: end',
    'place-items-center': 'place-items: center',
    'place-items-start': 'place-items: start',
    'place-items-end': 'place-items: end',
    'place-self-center': 'place-self: center',
    'place-self-start': 'place-self: start',
    'place-self-end': 'place-self: end',
    'place-self-auto': 'place-self: auto',
  };

  if (staticUtilities[className]) {
    return { selector: `.${escaped}`, declarations: staticUtilities[className] };
  }

  return null;
}

// Generate rule with variant (hover, focus, etc.)
function generateVariantRule(className: string): CSSRule | null {
  const variantMatch = className.match(/^(hover|focus|active|focus-within|focus-visible|disabled|group-hover|dark):/);
  if (!variantMatch) return null;

  const variant = variantMatch[1];
  const baseClass = className.slice(variant.length + 1);
  const baseRule = generateRule(baseClass);

  if (!baseRule) return null;

  const escaped = escapeSelector(className);

  switch (variant) {
    case 'hover':
      return { ...baseRule, selector: `.${escaped}:hover` };
    case 'focus':
      return { ...baseRule, selector: `.${escaped}:focus` };
    case 'active':
      return { ...baseRule, selector: `.${escaped}:active` };
    case 'focus-within':
      return { ...baseRule, selector: `.${escaped}:focus-within` };
    case 'focus-visible':
      return { ...baseRule, selector: `.${escaped}:focus-visible` };
    case 'disabled':
      return { ...baseRule, selector: `.${escaped}:disabled` };
    case 'group-hover':
      return { ...baseRule, selector: `.group:hover .${escaped}` };
    case 'dark':
      return { ...baseRule, selector: `.dark .${escaped}`, mediaQuery: '(prefers-color-scheme: dark)' };
    default:
      return null;
  }
}

// Generate responsive variant
function generateResponsiveRule(className: string): CSSRule | null {
  const responsiveMatch = className.match(/^(sm|md|lg|xl|2xl):/);
  if (!responsiveMatch) return null;

  const breakpoint = responsiveMatch[1];
  const baseClass = className.slice(breakpoint.length + 1);

  // Check for nested variant (e.g., md:hover:bg-blue-500)
  const variantRule = generateVariantRule(baseClass);
  const baseRule = variantRule || generateRule(baseClass);

  if (!baseRule) return null;

  const escaped = escapeSelector(className);
  const breakpoints: Record<string, string> = {
    'sm': '(min-width: 640px)',
    'md': '(min-width: 768px)',
    'lg': '(min-width: 1024px)',
    'xl': '(min-width: 1280px)',
    '2xl': '(min-width: 1536px)',
  };

  return {
    ...baseRule,
    selector: variantRule ? baseRule.selector.replace(`.${escapeSelector(baseClass)}`, `.${escaped}`) : `.${escaped}`,
    mediaQuery: breakpoints[breakpoint],
  };
}

/**
 * Generate CSS for a single class name
 */
export function generateCSSForClass(className: string): CSSRule | null {
  // Try responsive variant first
  const responsiveRule = generateResponsiveRule(className);
  if (responsiveRule) return responsiveRule;

  // Try state variant
  const variantRule = generateVariantRule(className);
  if (variantRule) return variantRule;

  // Try base rule
  return generateRule(className);
}

/**
 * Generate CSS for a set of class names
 */
export function generateCSSForClasses(classNames: Set<string>): string {
  const rules: CSSRule[] = [];
  const mediaRules: Map<string, CSSRule[]> = new Map();

  for (const className of classNames) {
    const rule = generateCSSForClass(className);
    if (rule) {
      if (rule.mediaQuery) {
        const existing = mediaRules.get(rule.mediaQuery) || [];
        existing.push(rule);
        mediaRules.set(rule.mediaQuery, existing);
      } else {
        rules.push(rule);
      }
    }
  }

  // Generate CSS string
  let css = '';

  // Non-media rules first
  for (const rule of rules) {
    css += `${rule.selector} { ${rule.declarations} }\n`;
  }

  // Then media query grouped rules
  for (const [mediaQuery, mediaQueryRules] of mediaRules) {
    css += `@media ${mediaQuery} {\n`;
    for (const rule of mediaQueryRules) {
      css += `  ${rule.selector} { ${rule.declarations} }\n`;
    }
    css += '}\n';
  }

  return css;
}

/**
 * Critical CSS that should always be included (resets, base styles)
 */
export function generateCriticalCSS(): string {
  return `/* Critical CSS - always included */
*, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
html { line-height: 1.5; -webkit-text-size-adjust: 100%; -moz-tab-size: 4; tab-size: 4; font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; font-feature-settings: normal; font-variation-settings: normal; }
body { margin: 0; line-height: inherit; }
hr { height: 0; color: inherit; border-top-width: 1px; }
abbr:where([title]) { text-decoration: underline dotted; }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
a { color: inherit; text-decoration: inherit; }
b, strong { font-weight: bolder; }
code, kbd, samp, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 1em; }
small { font-size: 80%; }
sub, sup { font-size: 75%; line-height: 0; position: relative; vertical-align: baseline; }
sub { bottom: -0.25em; }
sup { top: -0.5em; }
table { text-indent: 0; border-color: inherit; border-collapse: collapse; }
button, input, optgroup, select, textarea { font-family: inherit; font-size: 100%; font-weight: inherit; line-height: inherit; color: inherit; margin: 0; padding: 0; }
button, select { text-transform: none; }
button, [type='button'], [type='reset'], [type='submit'] { -webkit-appearance: button; background-color: transparent; background-image: none; }
:-moz-focusring { outline: auto; }
:-moz-ui-invalid { box-shadow: none; }
progress { vertical-align: baseline; }
::-webkit-inner-spin-button, ::-webkit-outer-spin-button { height: auto; }
[type='search'] { -webkit-appearance: textfield; outline-offset: -2px; }
::-webkit-search-decoration { -webkit-appearance: none; }
::-webkit-file-upload-button { -webkit-appearance: button; font: inherit; }
summary { display: list-item; }
blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre { margin: 0; }
fieldset { margin: 0; padding: 0; }
legend { padding: 0; }
ol, ul, menu { list-style: none; margin: 0; padding: 0; }
textarea { resize: vertical; }
input::placeholder, textarea::placeholder { opacity: 1; color: #9ca3af; }
button, [role="button"] { cursor: pointer; }
:disabled { cursor: default; }
img, svg, video, canvas, audio, iframe, embed, object { display: block; vertical-align: middle; }
img, video { max-width: 100%; height: auto; }
[hidden] { display: none; }

/* Keyframe animations */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
@keyframes pulse { 50% { opacity: .5; } }
@keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); } }
`;
}

/**
 * Build a complete CSS manifest for a project
 * @param classNames Optional set of class names to pre-compute rules for
 */
export function buildCSSManifest(classNames?: Set<string>): CSSManifest {
  const rules: Record<string, CSSRule[]> = {};

  // Pre-compute rules for all provided class names
  if (classNames) {
    for (const className of classNames) {
      const rule = generateCSSForClass(className);
      if (rule) {
        if (!rules[className]) {
          rules[className] = [];
        }
        rules[className].push(rule);
      }
    }
  }

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    rules,
    variants: {
      'sm': '(min-width: 640px)',
      'md': '(min-width: 768px)',
      'lg': '(min-width: 1024px)',
      'xl': '(min-width: 1280px)',
      '2xl': '(min-width: 1536px)',
    },
    critical: generateCriticalCSS(),
  };
}

/**
 * Extract all CSS classes from a component tree
 */
export function extractClassesFromTree(tree: { type: string; props?: Record<string, unknown>; children?: unknown[] }): Set<string> {
  const classes = new Set<string>();

  function walk(node: unknown): void {
    if (typeof node === 'string') return;
    if (!node || typeof node !== 'object') return;

    const n = node as { type?: string; props?: Record<string, unknown>; children?: unknown[] };

    // Extract className/class from props
    const className = n.props?.className || n.props?.class;
    if (typeof className === 'string') {
      className.split(/\s+/).forEach(c => c && classes.add(c));
    }

    // Recurse into children
    if (Array.isArray(n.children)) {
      n.children.forEach(walk);
    }
  }

  walk(tree);
  return classes;
}
