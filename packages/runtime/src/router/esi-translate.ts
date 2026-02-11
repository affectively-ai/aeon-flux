/**
 * ESI Translation Module
 *
 * Provides automatic translation capabilities for aeon-flux applications.
 * Uses AI Gateway LLM inference for translation, with multi-layer caching.
 *
 * @example
 * ```tsx
 * // Using ESI.Translate component
 * <ESI.Translate targetLanguage="es">Hello world</ESI.Translate>
 *
 * // Using data-attribute decoration
 * <p data-translate data-target-lang="es">Hello world</p>
 * ```
 */

import type {
  ESIDirective,
  ESIParams,
  TranslationResult,
  TranslationProviderConfig,
  SupportedLanguageCode,
} from './types';

// ============================================================================
// Translation Cache
// ============================================================================

interface TranslationCacheEntry {
  result: TranslationResult;
  expiresAt: number;
}

/** In-memory LRU cache for translations */
const translationCache = new Map<string, TranslationCacheEntry>();
const MAX_CACHE_SIZE = 1000;

/**
 * Generate a cache key for a translation
 */
export function generateTranslationCacheKey(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  context?: string,
): string {
  // Create a deterministic key from the inputs
  const input = `${text}:${sourceLanguage}:${targetLanguage}:${context || ''}`;
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `translate:${Math.abs(hash).toString(36)}`;
}

/**
 * Get a cached translation result
 */
export function getCachedTranslation(key: string): TranslationResult | null {
  const entry = translationCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    translationCache.delete(key);
    return null;
  }

  return { ...entry.result, cached: true };
}

/**
 * Cache a translation result
 */
export function setCachedTranslation(
  key: string,
  result: TranslationResult,
  ttl: number,
): void {
  if (ttl <= 0) return;

  // LRU eviction
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }

  translationCache.set(key, {
    result,
    expiresAt: Date.now() + ttl * 1000,
  });
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

// ============================================================================
// ESI Directive Builder
// ============================================================================

/**
 * System prompt for translation
 */
const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator. Translate the following text accurately while:
- Preserving the original meaning and tone
- Using culturally appropriate expressions in the target language
- Keeping proper nouns, technical terms, and brand names as appropriate
- Maintaining any formatting if present

Respond with ONLY the translated text, no explanations, markdown, or quotes.`;

/**
 * Create an ESI directive for translation
 *
 * @example
 * ```typescript
 * const directive = esiTranslate('Hello world', 'es');
 * const result = await processor.process(directive, userContext);
 * // Returns ESIResult with translated text
 * ```
 */
export function esiTranslate(
  text: string,
  targetLanguage: string,
  options: {
    sourceLanguage?: string;
    context?: string;
    cacheTtl?: number;
    temperature?: number;
  } = {},
): ESIDirective {
  const {
    sourceLanguage = 'auto',
    context,
    cacheTtl = 86400, // 24 hours default
    temperature = 0.1, // Low temperature for consistency
  } = options;

  // Build the prompt
  let prompt = text;
  if (context) {
    prompt = `[Context: ${context}]\n\n${text}`;
  }

  const systemPrompt =
    sourceLanguage === 'auto'
      ? `${TRANSLATION_SYSTEM_PROMPT}\n\nTarget language: ${targetLanguage}`
      : `${TRANSLATION_SYSTEM_PROMPT}\n\nSource language: ${sourceLanguage}\nTarget language: ${targetLanguage}`;

  return {
    id: `esi-translate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: 'llm',
      system: systemPrompt,
      temperature,
      maxTokens: Math.min(text.length * 3, 2000), // Estimate max tokens
      cacheTtl,
    } as ESIParams,
    content: {
      type: 'text',
      value: prompt,
    },
    contextAware: false, // Translation doesn't need user context
  };
}

// ============================================================================
// Head Tag Configuration Reader
// ============================================================================

/**
 * Read translation configuration from document head
 *
 * Supports:
 * - <meta name="aeon-language" content="es">
 * - <meta name="aeon-language-source" content="en">
 * - <meta name="aeon-translation-endpoint" content="https://...">
 * - <script type="application/json" id="aeon-translation-config">...</script>
 */
export function readHeadTranslationConfig(): Partial<TranslationProviderConfig> {
  if (typeof document === 'undefined') return {};

  const config: Partial<TranslationProviderConfig> = {};

  // Read meta tags
  const langMeta = document.querySelector('meta[name="aeon-language"]');
  if (langMeta) {
    const content = langMeta.getAttribute('content');
    if (content) config.defaultLanguage = content;
  }

  const sourceLangMeta = document.querySelector(
    'meta[name="aeon-language-source"]',
  );
  if (sourceLangMeta) {
    // Source language hint (used if autoDetectSource is false)
    // Store in config for reference
  }

  const endpointMeta = document.querySelector(
    'meta[name="aeon-translation-endpoint"]',
  );
  if (endpointMeta) {
    const content = endpointMeta.getAttribute('content');
    if (content) config.endpoint = content;
  }

  // Read JSON config from script tag
  const jsonConfig = document.getElementById('aeon-translation-config');
  if (jsonConfig && jsonConfig.textContent) {
    try {
      const parsed = JSON.parse(jsonConfig.textContent);
      Object.assign(config, parsed);
    } catch {
      console.warn('[ESI Translate] Failed to parse translation config JSON');
    }
  }

  return config;
}

// ============================================================================
// Language Utilities
// ============================================================================

/**
 * Common language name to ISO 639-1 code mapping
 */
const LANGUAGE_NAME_TO_CODE: Record<string, SupportedLanguageCode> = {
  english: 'en',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  italian: 'it',
  portuguese: 'pt',
  dutch: 'nl',
  polish: 'pl',
  russian: 'ru',
  chinese: 'zh',
  japanese: 'ja',
  korean: 'ko',
  arabic: 'ar',
  hindi: 'hi',
  bengali: 'bn',
  vietnamese: 'vi',
  thai: 'th',
  turkish: 'tr',
  indonesian: 'id',
  malay: 'ms',
  tagalog: 'tl',
  filipino: 'tl',
  swedish: 'sv',
  danish: 'da',
  norwegian: 'no',
  finnish: 'fi',
  czech: 'cs',
  greek: 'el',
  hebrew: 'he',
  ukrainian: 'uk',
  romanian: 'ro',
  hungarian: 'hu',
  catalan: 'ca',
  armenian: 'hy',
};

/**
 * ISO 639-1 code to language name mapping
 */
const LANGUAGE_CODE_TO_NAME: Record<SupportedLanguageCode, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  vi: 'Vietnamese',
  th: 'Thai',
  tr: 'Turkish',
  id: 'Indonesian',
  ms: 'Malay',
  tl: 'Tagalog',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  cs: 'Czech',
  el: 'Greek',
  he: 'Hebrew',
  uk: 'Ukrainian',
  ro: 'Romanian',
  hu: 'Hungarian',
  ca: 'Catalan',
  hy: 'Armenian',
};

/**
 * Normalize language input to ISO 639-1 code
 * Accepts language names (e.g., "Spanish") or codes (e.g., "es")
 */
export function normalizeLanguageCode(
  input: string,
): SupportedLanguageCode | string {
  const lower = input.toLowerCase().trim();

  // Check if it's already a valid code
  if (
    lower.length === 2 &&
    LANGUAGE_CODE_TO_NAME[lower as SupportedLanguageCode]
  ) {
    return lower as SupportedLanguageCode;
  }

  // Check language name mapping
  if (LANGUAGE_NAME_TO_CODE[lower]) {
    return LANGUAGE_NAME_TO_CODE[lower];
  }

  // Return as-is if unknown (let the AI handle it)
  return input;
}

/**
 * Get the display name for a language code
 */
export function getLanguageName(code: SupportedLanguageCode | string): string {
  return LANGUAGE_CODE_TO_NAME[code as SupportedLanguageCode] || code;
}

/**
 * Get the list of supported language codes
 */
export function getSupportedLanguages(): SupportedLanguageCode[] {
  return Object.keys(LANGUAGE_CODE_TO_NAME) as SupportedLanguageCode[];
}

// ============================================================================
// Language Detection from Context
// ============================================================================

/**
 * Detect target language from various sources (priority order)
 *
 * 1. Explicit targetLanguage prop
 * 2. TranslationProvider context (not available here)
 * 3. GlobalESIState preferences.language
 * 4. HTML <meta name="aeon-language"> tag
 * 5. Browser navigator.language
 * 6. Default to 'en'
 */
export function detectTargetLanguage(
  explicitLanguage?: string,
  globalState?: { preferences?: { language?: string } },
): string {
  // 1. Explicit prop
  if (explicitLanguage) {
    return normalizeLanguageCode(explicitLanguage);
  }

  // 2. Global ESI state
  if (globalState?.preferences?.language) {
    return normalizeLanguageCode(globalState.preferences.language);
  }

  // 3. Head meta tag
  if (typeof document !== 'undefined') {
    const langMeta = document.querySelector('meta[name="aeon-language"]');
    if (langMeta) {
      const content = langMeta.getAttribute('content');
      if (content) return normalizeLanguageCode(content);
    }
  }

  // 4. Browser language
  if (typeof navigator !== 'undefined' && navigator.language) {
    // Extract just the language code (e.g., 'en-US' -> 'en')
    const browserLang = navigator.language.split('-')[0];
    return normalizeLanguageCode(browserLang);
  }

  // 5. Default
  return 'en';
}

// ============================================================================
// AI Gateway Translation
// ============================================================================

/**
 * Translate text using the AI Gateway
 *
 * This function directly calls the AI Gateway translation endpoint.
 * For React components, use ESI.Translate instead which integrates with
 * the ESI context and caching system.
 */
export async function translateWithAIGateway(
  text: string,
  targetLanguage: string,
  options: {
    sourceLanguage?: string;
    context?: string;
    endpoint?: string;
    timeout?: number;
  } = {},
): Promise<TranslationResult> {
  const {
    sourceLanguage = 'auto',
    context,
    endpoint = process.env.AI_GATEWAY_URL ||
      'https://ai-gateway.taylorbuley.workers.dev',
    timeout = 10000,
  } = options;

  const startTime = Date.now();

  // Check cache first
  const cacheKey = generateTranslationCacheKey(
    text,
    sourceLanguage,
    targetLanguage,
    context,
  );
  const cached = getCachedTranslation(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`${endpoint}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        targetLanguage: normalizeLanguageCode(targetLanguage),
        context,
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Translation failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      translatedText: string;
      detectedSourceLanguage?: string;
      confidence?: number;
    };

    const result: TranslationResult = {
      original: text,
      translated: data.translatedText,
      sourceLanguage: data.detectedSourceLanguage || sourceLanguage,
      targetLanguage: normalizeLanguageCode(targetLanguage),
      confidence: data.confidence ?? 1.0,
      cached: false,
      latencyMs: Date.now() - startTime,
    };

    // Cache the result
    setCachedTranslation(cacheKey, result, 86400); // 24 hours

    return result;
  } catch (error) {
    // Return original text on error
    return {
      original: text,
      translated: text, // Fallback to original
      sourceLanguage,
      targetLanguage: normalizeLanguageCode(targetLanguage),
      confidence: 0,
      cached: false,
      latencyMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  TranslationResult,
  TranslationProviderConfig,
  SupportedLanguageCode,
};
