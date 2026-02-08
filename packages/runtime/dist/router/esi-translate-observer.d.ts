/**
 * ESI Translation Observer
 *
 * MutationObserver-based system for automatically translating elements
 * decorated with data-translate attribute.
 *
 * @example
 * ```html
 * <!-- Basic translation -->
 * <p data-translate data-target-lang="es">Hello world</p>
 *
 * <!-- With source language hint -->
 * <span data-translate data-source-lang="en" data-target-lang="fr">Welcome</span>
 *
 * <!-- With translation context -->
 * <p data-translate data-translate-context="formal, business">
 *   Please review the attached document.
 * </p>
 * ```
 *
 * @example
 * ```tsx
 * // React hook usage
 * function App() {
 *   useTranslationObserver({
 *     translateAttribute: 'data-translate',
 *     batchSize: 10,
 *     debounceMs: 100,
 *   });
 *
 *   return <div data-translate data-target-lang="es">Hello</div>;
 * }
 * ```
 */
import type { TranslationResult } from './types';
export interface TranslationObserverConfig {
    /** Root element to observe (defaults to document.body) */
    root?: Element;
    /** Attribute that marks elements for translation (default: 'data-translate') */
    translateAttribute?: string;
    /** Batch translations for efficiency (default: 10) */
    batchSize?: number;
    /** Debounce time for mutations in ms (default: 100) */
    debounceMs?: number;
    /** AI Gateway endpoint */
    endpoint?: string;
    /** Default target language if not specified on element */
    defaultTargetLanguage?: string;
    /** Cache TTL in seconds (default: 86400 = 24 hours) */
    cacheTtl?: number;
    /** Callback when element is translated */
    onTranslate?: (element: Element, result: TranslationResult) => void;
    /** Callback on translation error */
    onError?: (element: Element, error: string) => void;
}
/**
 * TranslationObserver - Watches DOM for translatable elements
 *
 * Uses MutationObserver to detect elements with data-translate attribute
 * and automatically translates them using the AI Gateway.
 */
export declare class TranslationObserver {
    private observer;
    private config;
    private translationQueue;
    private isProcessing;
    private debounceTimer;
    private translatedElements;
    constructor(config?: TranslationObserverConfig);
    /**
     * Start observing for translatable elements
     */
    observe(): void;
    /**
     * Stop observing
     */
    disconnect(): void;
    /**
     * Manually translate all current elements
     */
    translateAll(): Promise<void>;
    /**
     * Translate a specific element
     */
    translateElement(element: Element): Promise<TranslationResult | null>;
    /**
     * Handle DOM mutations
     */
    private handleMutations;
    /**
     * Queue an element for translation
     */
    private queueElement;
    /**
     * Debounced queue processing
     */
    private debouncedProcessQueue;
    /**
     * Process queued translations
     */
    private processQueue;
    /**
     * Get target language for an element
     */
    private getTargetLanguage;
    /**
     * Get source language for an element
     */
    private getSourceLanguage;
}
/**
 * React hook for translation observer
 *
 * @example
 * ```tsx
 * function App() {
 *   useTranslationObserver({
 *     translateAttribute: 'data-translate',
 *     onTranslate: (element, result) => {
 *       console.log('Translated:', result.translated);
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <p data-translate data-target-lang="es">Hello world</p>
 *       <p data-translate data-target-lang="fr">Goodbye</p>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useTranslationObserver(config?: TranslationObserverConfig): React.RefObject<TranslationObserver | null>;
/**
 * Auto-initialize translation observer when DOM is ready
 *
 * Call this in your app's entry point to automatically translate
 * all elements with data-translate attribute.
 *
 * @example
 * ```tsx
 * // In your app entry point
 * import { initTranslationObserver } from '@affectively/aeon-flux';
 *
 * initTranslationObserver({
 *   defaultTargetLanguage: 'es',
 *   onTranslate: (element, result) => {
 *     console.log('Translated:', result.translated);
 *   },
 * });
 * ```
 */
export declare function initTranslationObserver(config?: TranslationObserverConfig): TranslationObserver;
