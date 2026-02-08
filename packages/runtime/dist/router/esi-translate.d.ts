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
import type { ESIDirective, TranslationResult, TranslationProviderConfig, SupportedLanguageCode } from './types';
/**
 * Generate a cache key for a translation
 */
export declare function generateTranslationCacheKey(text: string, sourceLanguage: string, targetLanguage: string, context?: string): string;
/**
 * Get a cached translation result
 */
export declare function getCachedTranslation(key: string): TranslationResult | null;
/**
 * Cache a translation result
 */
export declare function setCachedTranslation(key: string, result: TranslationResult, ttl: number): void;
/**
 * Clear the translation cache
 */
export declare function clearTranslationCache(): void;
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
export declare function esiTranslate(text: string, targetLanguage: string, options?: {
    sourceLanguage?: string;
    context?: string;
    cacheTtl?: number;
    temperature?: number;
}): ESIDirective;
/**
 * Read translation configuration from document head
 *
 * Supports:
 * - <meta name="aeon-language" content="es">
 * - <meta name="aeon-language-source" content="en">
 * - <meta name="aeon-translation-endpoint" content="https://...">
 * - <script type="application/json" id="aeon-translation-config">...</script>
 */
export declare function readHeadTranslationConfig(): Partial<TranslationProviderConfig>;
/**
 * Normalize language input to ISO 639-1 code
 * Accepts language names (e.g., "Spanish") or codes (e.g., "es")
 */
export declare function normalizeLanguageCode(input: string): SupportedLanguageCode | string;
/**
 * Get the display name for a language code
 */
export declare function getLanguageName(code: SupportedLanguageCode | string): string;
/**
 * Get the list of supported language codes
 */
export declare function getSupportedLanguages(): SupportedLanguageCode[];
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
export declare function detectTargetLanguage(explicitLanguage?: string, globalState?: {
    preferences?: {
        language?: string;
    };
}): string;
/**
 * Translate text using the AI Gateway
 *
 * This function directly calls the AI Gateway translation endpoint.
 * For React components, use ESI.Translate instead which integrates with
 * the ESI context and caching system.
 */
export declare function translateWithAIGateway(text: string, targetLanguage: string, options?: {
    sourceLanguage?: string;
    context?: string;
    endpoint?: string;
    timeout?: number;
}): Promise<TranslationResult>;
export type { TranslationResult, TranslationProviderConfig, SupportedLanguageCode, };
