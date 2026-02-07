/**
 * Font Manifest Generator
 *
 * Converts web fonts to base64 data URIs for embedding directly
 * in CSS @font-face declarations. This eliminates font loading
 * delays and layout shifts.
 *
 * Supports:
 * - WOFF2, WOFF, TTF, OTF formats
 * - Font subsetting (optional, requires external tool)
 * - Automatic weight/style detection from filename
 * - Unicode range specification
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

export interface FontEntry {
  family: string;
  weight: number;
  style: 'normal' | 'italic' | 'oblique';
  format: string;
  dataUri: string;
  size: number;
  unicodeRange?: string;
}

export interface FontManifest {
  version: string;
  generatedAt: string;
  fonts: Record<string, FontEntry>;
  fontFaceCSS: string;
  totalSize: number;
  totalCount: number;
}

export interface FontOptions {
  /** Directory containing font files */
  fontsDir: string;
  /** Maximum font file size to inline (bytes). Default: 100KB */
  maxInlineSize?: number;
  /** Preferred format order */
  preferredFormats?: string[];
  /** Unicode ranges for subsetting */
  unicodeRanges?: Record<string, string>;
}

const DEFAULT_OPTIONS: Partial<FontOptions> = {
  maxInlineSize: 100 * 1024, // 100KB
  preferredFormats: ['woff2', 'woff', 'ttf', 'otf'],
};

// MIME types for font formats
const FONT_MIME_TYPES: Record<string, string> = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
};

// Format strings for @font-face src
const FONT_FORMAT_STRINGS: Record<string, string> = {
  '.woff2': 'woff2',
  '.woff': 'woff',
  '.ttf': 'truetype',
  '.otf': 'opentype',
  '.eot': 'embedded-opentype',
};

// Supported extensions
const SUPPORTED_EXTENSIONS = new Set(Object.keys(FONT_MIME_TYPES));

// Weight mapping from common naming conventions
const WEIGHT_MAP: Record<string, number> = {
  'thin': 100,
  'hairline': 100,
  'extralight': 200,
  'ultralight': 200,
  'light': 300,
  'regular': 400,
  'normal': 400,
  'book': 400,
  'medium': 500,
  'semibold': 600,
  'demibold': 600,
  'bold': 700,
  'extrabold': 800,
  'ultrabold': 800,
  'black': 900,
  'heavy': 900,
};

/**
 * Parse font filename to extract family, weight, and style
 * Common patterns:
 * - Inter-Bold.woff2
 * - Inter-BoldItalic.woff2
 * - Inter-400.woff2
 * - Inter_400_italic.woff2
 */
function parseFontFilename(filename: string): { family: string; weight: number; style: 'normal' | 'italic' | 'oblique' } {
  // Remove extension
  const name = basename(filename).replace(/\.[^.]+$/, '');

  // Split by common separators
  const parts = name.split(/[-_]/);

  let family = parts[0];
  let weight = 400;
  let style: 'normal' | 'italic' | 'oblique' = 'normal';

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].toLowerCase();

    // Check for weight
    if (WEIGHT_MAP[part]) {
      weight = WEIGHT_MAP[part];
    } else if (/^\d{3}$/.test(part)) {
      weight = parseInt(part, 10);
    }

    // Check for style
    if (part === 'italic' || part.includes('italic')) {
      style = 'italic';
    } else if (part === 'oblique' || part.includes('oblique')) {
      style = 'oblique';
    }

    // Check for combined weight+style like "bolditalic"
    for (const [weightName, weightValue] of Object.entries(WEIGHT_MAP)) {
      if (part.startsWith(weightName)) {
        weight = weightValue;
        if (part.includes('italic')) {
          style = 'italic';
        }
      }
    }
  }

  return { family, weight, style };
}

/**
 * Generate a unique key for a font entry
 */
function fontKey(family: string, weight: number, style: string): string {
  return `${family}-${weight}-${style}`;
}

/**
 * Convert font file to base64 data URI
 */
async function fontToDataUri(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const ext = extname(filePath).toLowerCase();
  const mimeType = FONT_MIME_TYPES[ext];

  if (!mimeType) {
    throw new Error(`Unsupported font format: ${ext}`);
  }

  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Generate @font-face CSS for a font entry
 */
function generateFontFaceCSS(entry: FontEntry): string {
  const lines: string[] = ['@font-face {'];
  lines.push(`  font-family: '${entry.family}';`);
  lines.push(`  font-weight: ${entry.weight};`);
  lines.push(`  font-style: ${entry.style};`);
  lines.push(`  font-display: swap;`);
  lines.push(`  src: url('${entry.dataUri}') format('${entry.format}');`);

  if (entry.unicodeRange) {
    lines.push(`  unicode-range: ${entry.unicodeRange};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Scan directory for font files
 */
async function scanFontsDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = await scanFontsDirectory(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`  ⚠️  Could not scan fonts directory: ${dir}`);
  }

  return files;
}

/**
 * Build font manifest from a directory
 */
export async function buildFontManifest(options: FontOptions): Promise<FontManifest> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const fonts: Record<string, FontEntry> = {};
  let totalSize = 0;
  let totalCount = 0;

  console.log(`\n🔤 Building font manifest from: ${opts.fontsDir}`);

  // Check if directory exists
  try {
    await stat(opts.fontsDir);
  } catch {
    console.warn(`  ⚠️  Fonts directory not found: ${opts.fontsDir}`);
    return {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      fonts: {},
      fontFaceCSS: '',
      totalSize: 0,
      totalCount: 0,
    };
  }

  // Scan for font files
  const files = await scanFontsDirectory(opts.fontsDir);
  console.log(`   Found ${files.length} font file(s)`);

  // Group by family/weight/style and prefer woff2
  const fontGroups: Map<string, string[]> = new Map();

  for (const filePath of files) {
    const { family, weight, style } = parseFontFilename(filePath);
    const key = fontKey(family, weight, style);

    const existing = fontGroups.get(key) || [];
    existing.push(filePath);
    fontGroups.set(key, existing);
  }

  // Process each font group
  for (const [key, groupFiles] of fontGroups) {
    // Sort by preferred format order
    const sorted = groupFiles.sort((a, b) => {
      const extA = extname(a).toLowerCase();
      const extB = extname(b).toLowerCase();
      const indexA = opts.preferredFormats!.indexOf(extA.slice(1));
      const indexB = opts.preferredFormats!.indexOf(extB.slice(1));
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    // Use the best format
    const filePath = sorted[0];
    const ext = extname(filePath).toLowerCase();

    // Check size limit
    const stats = await stat(filePath);
    if (stats.size > (opts.maxInlineSize || DEFAULT_OPTIONS.maxInlineSize!)) {
      console.warn(`  ⚠️  Skipping ${basename(filePath)}: too large (${(stats.size / 1024).toFixed(1)}KB)`);
      continue;
    }

    // Parse font info
    const { family, weight, style } = parseFontFilename(filePath);

    // Convert to data URI
    const dataUri = await fontToDataUri(filePath);

    fonts[key] = {
      family,
      weight,
      style,
      format: FONT_FORMAT_STRINGS[ext],
      dataUri,
      size: stats.size,
      unicodeRange: opts.unicodeRanges?.[family],
    };

    totalSize += stats.size;
    totalCount++;

    console.log(`   ✓ ${family} ${weight} ${style} (${(stats.size / 1024).toFixed(1)}KB)`);
  }

  // Generate combined @font-face CSS
  const fontFaceCSS = Object.values(fonts)
    .map(generateFontFaceCSS)
    .join('\n\n');

  console.log(`\n   Total: ${totalCount} fonts, ${(totalSize / 1024).toFixed(1)}KB`);

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    fonts,
    fontFaceCSS,
    totalSize,
    totalCount,
  };
}

/**
 * Get font face CSS for specific families
 */
export function getFontFaceCSS(manifest: FontManifest, families?: string[]): string {
  if (!families || families.length === 0) {
    return manifest.fontFaceCSS;
  }

  const familySet = new Set(families.map(f => f.toLowerCase()));

  return Object.values(manifest.fonts)
    .filter(font => familySet.has(font.family.toLowerCase()))
    .map(generateFontFaceCSS)
    .join('\n\n');
}

/**
 * Common unicode ranges for font subsetting
 */
export const UNICODE_RANGES = {
  // Latin characters (most Western languages)
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',

  // Latin Extended
  latinExtended: 'U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF',

  // Greek
  greek: 'U+0370-03FF',

  // Cyrillic
  cyrillic: 'U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',

  // Vietnamese
  vietnamese: 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB',

  // Numbers and basic punctuation only
  numbersOnly: 'U+0030-0039, U+002C, U+002E',

  // Emoji (if font supports)
  emoji: 'U+1F600-1F64F, U+1F300-1F5FF, U+1F680-1F6FF, U+1F1E0-1F1FF',
};

/**
 * Generate font loading CSS with fallback system fonts
 */
export function generateFontStackCSS(
  manifest: FontManifest,
  stacks: Record<string, { primary: string; fallbacks: string[] }>
): string {
  let css = manifest.fontFaceCSS + '\n\n';

  for (const [variable, { primary, fallbacks }] of Object.entries(stacks)) {
    const stack = [
      `'${primary}'`,
      ...fallbacks.map(f => f.includes(' ') ? `'${f}'` : f),
    ].join(', ');

    css += `--${variable}: ${stack};\n`;
  }

  return css;
}
