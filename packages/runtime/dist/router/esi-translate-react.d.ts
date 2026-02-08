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
import { type ReactNode, type FC } from 'react';
import type { TranslationResult, SupportedLanguageCode } from './types';
import { normalizeLanguageCode, getSupportedLanguages, getLanguageName } from './esi-translate';
export interface TranslationContextValue {
    /** Current target language (ISO 639-1 code) */
    language: string;
    /** Set the target language */
    setLanguage: (lang: string) => void;
    /** Translate text programmatically */
    translate: (text: string, options?: {
        targetLanguage?: string;
        sourceLanguage?: string;
        context?: string;
    }) => Promise<TranslationResult>;
    /** Is translation currently loading */
    isTranslating: boolean;
    /** List of supported languages */
    supportedLanguages: SupportedLanguageCode[];
    /** Translation endpoint */
    endpoint: string;
    /** Cache TTL in seconds */
    cacheTtl: number;
}
declare const TranslationContext: import("react").Context<TranslationContextValue | null>;
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
export declare const TranslationProvider: FC<TranslationProviderProps>;
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
export declare function useTranslation(): TranslationContextValue;
/**
 * Hook to access translation context (optional - returns null if not available)
 */
export declare function useTranslationOptional(): TranslationContextValue | null;
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
export declare const ESITranslate: FC<ESITranslateProps>;
export { TranslationContext, normalizeLanguageCode, getSupportedLanguages, getLanguageName, };
