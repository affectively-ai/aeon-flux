/**
 * ESI Translation React Components
 *
 * Provides React components for automatic translation in aeon-flux applications.
 *
 * @example
 * ```tsx
 * // Basic usage with explicit target language
 * <ESI.Translate targetLanguage="es">
 *   Hello, welcome to our platform!
 * </ESI.Translate>
 *
 * // Using TranslationProvider for app-wide language
 * <TranslationProvider defaultLanguage="es">
 *   <ESI.Translate>Hello world</ESI.Translate>
 * </TranslationProvider>
 *
 * // Programmatic translation
 * const { translate, language } = useTranslation();
 * const translated = await translate('Hello world');
 * ```
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type FC,
} from 'react';
import type {
  TranslationResult,
  TranslationProviderConfig,
  SupportedLanguageCode,
} from './types';
import {
  esiTranslate,
  generateTranslationCacheKey,
  getCachedTranslation,
  setCachedTranslation,
  readHeadTranslationConfig,
  detectTargetLanguage,
  normalizeLanguageCode,
  getSupportedLanguages,
  getLanguageName,
} from './esi-translate';
import { useESI, useGlobalESIState } from './esi-react';

// ============================================================================
// Translation Context
// ============================================================================

export interface TranslationContextValue {
  /** Current target language (ISO 639-1 code) */
  language: string;

  /** Set the target language */
  setLanguage: (lang: string) => void;

  /** Translate text programmatically */
  translate: (
    text: string,
    options?: {
      targetLanguage?: string;
      sourceLanguage?: string;
      context?: string;
    }
  ) => Promise<TranslationResult>;

  /** Is translation currently loading */
  isTranslating: boolean;

  /** List of supported languages */
  supportedLanguages: SupportedLanguageCode[];

  /** Translation endpoint */
  endpoint: string;

  /** Cache TTL in seconds */
  cacheTtl: number;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

// ============================================================================
// TranslationProvider
// ============================================================================

export interface TranslationProviderProps {
  children: ReactNode;

  /** Default target language (ISO 639-1 code or language name) */
  defaultLanguage?: string;

  /** AI Gateway endpoint for translation */
  endpoint?: string;

  /** Cache TTL in seconds (default: 86400 = 24 hours) */
  cacheTtl?: number;

  /** Fallback language if translation fails */
  fallbackLanguage?: string;
}

/**
 * TranslationProvider - Provides translation context to the component tree
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <TranslationProvider defaultLanguage="es" endpoint="https://ai-gateway.example.com">
 *       <MyComponent />
 *     </TranslationProvider>
 *   );
 * }
 * ```
 */
export const TranslationProvider: FC<TranslationProviderProps> = ({
  children,
  defaultLanguage,
  endpoint: propEndpoint,
  cacheTtl: propCacheTtl = 86400,
  fallbackLanguage = 'en',
}) => {
  // Read config from head tags
  const headConfig = useMemo(() => readHeadTranslationConfig(), []);

  // Get global ESI state for language preferences
  const globalState = useGlobalESIState();

  // Determine initial language
  const initialLanguage = useMemo(
    () =>
      normalizeLanguageCode(
        defaultLanguage ||
          headConfig.defaultLanguage ||
          globalState.preferences?.language ||
          fallbackLanguage
      ),
    [defaultLanguage, headConfig.defaultLanguage, globalState.preferences?.language, fallbackLanguage]
  );

  const [language, setLanguageState] = useState(initialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);

  // Resolve endpoint
  const endpoint = propEndpoint || headConfig.endpoint || 'https://ai-gateway.taylorbuley.workers.dev';
  const cacheTtl = propCacheTtl || headConfig.cacheTtl || 86400;

  // Get ESI context for processing
  const esiContext = useESI();

  // Set language handler
  const setLanguage = useCallback((lang: string) => {
    setLanguageState(normalizeLanguageCode(lang));
  }, []);

  // Translate function
  const translate = useCallback(
    async (
      text: string,
      options: {
        targetLanguage?: string;
        sourceLanguage?: string;
        context?: string;
      } = {}
    ): Promise<TranslationResult> => {
      const targetLang = normalizeLanguageCode(options.targetLanguage || language);
      const sourceLang = options.sourceLanguage || 'auto';

      // Check cache
      const cacheKey = generateTranslationCacheKey(
        text,
        sourceLang,
        targetLang,
        options.context
      );
      const cached = getCachedTranslation(cacheKey);
      if (cached) {
        return cached;
      }

      setIsTranslating(true);

      try {
        // Create ESI directive
        const directive = esiTranslate(text, targetLang, {
          sourceLanguage: sourceLang,
          context: options.context,
          cacheTtl,
        });

        // Process via ESI
        const esiResult = await esiContext.process(directive);

        const result: TranslationResult = {
          original: text,
          translated: esiResult.success ? (esiResult.output || text) : text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          confidence: esiResult.success ? 0.95 : 0,
          cached: esiResult.cached,
          latencyMs: esiResult.latencyMs,
        };

        // Cache the result
        if (esiResult.success) {
          setCachedTranslation(cacheKey, result, cacheTtl);
        }

        return result;
      } catch (error) {
        // Return original text on error
        return {
          original: text,
          translated: text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          confidence: 0,
          cached: false,
          latencyMs: 0,
        };
      } finally {
        setIsTranslating(false);
      }
    },
    [language, cacheTtl, esiContext]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      translate,
      isTranslating,
      supportedLanguages: getSupportedLanguages(),
      endpoint,
      cacheTtl,
    }),
    [language, setLanguage, translate, isTranslating, endpoint, cacheTtl]
  );

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

// ============================================================================
// useTranslation Hook
// ============================================================================

/**
 * Hook to access translation context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { translate, language, setLanguage } = useTranslation();
 *
 *   const handleTranslate = async () => {
 *     const result = await translate('Hello world');
 *     console.log(result.translated);
 *   };
 *
 *   return (
 *     <button onClick={handleTranslate}>
 *       Translate (current: {language})
 *     </button>
 *   );
 * }
 * ```
 */
export function useTranslation(): TranslationContextValue {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return ctx;
}

/**
 * Hook to access translation context (optional - returns null if not available)
 */
export function useTranslationOptional(): TranslationContextValue | null {
  return useContext(TranslationContext);
}

// ============================================================================
// ESI.Translate Component
// ============================================================================

export interface ESITranslateProps {
  /** Content to translate */
  children?: ReactNode;

  /** Explicit text to translate (overrides children) */
  text?: string;

  /** Target language (ISO 639-1 code or language name) */
  targetLanguage?: string;

  /** Source language (ISO 639-1 code, or 'auto' for auto-detect) */
  sourceLanguage?: string;

  /** Additional context for better translation quality */
  context?: string;

  /** Fallback content if translation fails */
  fallback?: ReactNode;

  /** Loading content */
  loading?: ReactNode;

  /** Cache TTL in seconds (default: 86400 = 24 hours) */
  cacheTtl?: number;

  /** Enable streaming translation */
  stream?: boolean;

  /** Custom render function */
  render?: (result: TranslationResult) => ReactNode;

  /** Class name for wrapper */
  className?: string;

  /** HTML element to render as */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  /** Callback when translation completes */
  onComplete?: (result: TranslationResult) => void;

  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * ESI Translation Component
 *
 * Translates text to the specified language using AI inference.
 * Uses TranslationProvider context if available, otherwise falls back
 * to detecting language from various sources.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ESI.Translate targetLanguage="es">
 *   Hello, how are you?
 * </ESI.Translate>
 *
 * // With context for better translation
 * <ESI.Translate targetLanguage="ja" context="emotional wellness app">
 *   We're here to help you understand your feelings.
 * </ESI.Translate>
 *
 * // Using language from context
 * <ESI.Translate>
 *   Welcome to our platform
 * </ESI.Translate>
 * ```
 */
export const ESITranslate: FC<ESITranslateProps> = ({
  children,
  text,
  targetLanguage: propTargetLanguage,
  sourceLanguage = 'auto',
  context,
  fallback,
  loading = '...',
  cacheTtl = 86400,
  stream = false,
  render,
  className,
  as: Component = 'span',
  onComplete,
  onError,
}) => {
  const { process, processWithStream, enabled } = useESI();
  const globalState = useGlobalESIState();
  const translationContext = useTranslationOptional();

  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);

  // Get text to translate
  const textToTranslate = useMemo(
    () => text || (typeof children === 'string' ? children : String(children || '')),
    [text, children]
  );

  // Determine target language
  const targetLanguage = useMemo(
    () =>
      normalizeLanguageCode(
        propTargetLanguage ||
          translationContext?.language ||
          detectTargetLanguage(undefined, globalState)
      ),
    [propTargetLanguage, translationContext?.language, globalState]
  );

  // Skip translation if source and target are the same
  const shouldTranslate = useMemo(() => {
    if (!textToTranslate) return false;
    // Don't translate if target is 'en' and we assume source is English
    // (this is a heuristic - could be improved with language detection)
    if (targetLanguage === 'en' && sourceLanguage === 'auto') return false;
    if (sourceLanguage === targetLanguage) return false;
    return true;
  }, [textToTranslate, targetLanguage, sourceLanguage]);

  useEffect(() => {
    // If translation is disabled or not needed
    if (!enabled || !shouldTranslate) {
      setOutput(textToTranslate);
      setIsLoading(false);
      return;
    }

    // Check cache
    const cacheKey = generateTranslationCacheKey(
      textToTranslate,
      sourceLanguage,
      targetLanguage,
      context
    );
    const cached = getCachedTranslation(cacheKey);
    if (cached) {
      setOutput(cached.translated);
      setResult(cached);
      setIsLoading(false);
      onComplete?.(cached);
      return;
    }

    // Create translation directive
    const directive = esiTranslate(textToTranslate, targetLanguage, {
      sourceLanguage,
      context,
      cacheTtl,
    });

    const processTranslation = async () => {
      try {
        let esiResult;

        if (stream && processWithStream) {
          setOutput('');
          esiResult = await processWithStream(directive, (chunk) => {
            setOutput((prev) => prev + chunk);
          });
        } else {
          esiResult = await process(directive);
        }

        setIsLoading(false);

        if (esiResult.success && esiResult.output) {
          const translatedText = esiResult.output.trim();
          setOutput(translatedText);

          const translationResult: TranslationResult = {
            original: textToTranslate,
            translated: translatedText,
            sourceLanguage,
            targetLanguage,
            confidence: 0.95,
            cached: esiResult.cached,
            latencyMs: esiResult.latencyMs,
          };

          setResult(translationResult);
          setCachedTranslation(cacheKey, translationResult, cacheTtl);
          onComplete?.(translationResult);
        } else {
          setError(esiResult.error || 'Translation failed');
          setOutput(textToTranslate); // Fall back to original
          onError?.(esiResult.error || 'Translation failed');
        }
      } catch (err) {
        setIsLoading(false);
        setOutput(textToTranslate);
        const errorMsg = err instanceof Error ? err.message : 'Translation failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    processTranslation();
  }, [
    textToTranslate,
    targetLanguage,
    sourceLanguage,
    context,
    cacheTtl,
    enabled,
    shouldTranslate,
    stream,
    process,
    processWithStream,
    onComplete,
    onError,
  ]);

  // Render loading state
  if (isLoading && !stream) {
    return <Component className={className}>{loading}</Component>;
  }

  // Render error with fallback
  if (error && fallback) {
    return <Component className={className}>{fallback}</Component>;
  }

  // Custom render
  if (render && result) {
    return <Component className={className}>{render(result)}</Component>;
  }

  return <Component className={className}>{output || (isLoading ? loading : '')}</Component>;
};

// ============================================================================
// Exports
// ============================================================================

export {
  TranslationContext,
  normalizeLanguageCode,
  getSupportedLanguages,
  getLanguageName,
};
