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

import { useEffect, useRef } from 'react';
import type { TranslationResult } from './types';
import {
  translateWithAIGateway,
  detectTargetLanguage,
  normalizeLanguageCode,
} from './esi-translate';

// ============================================================================
// Types
// ============================================================================

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

interface TranslationQueueItem {
  element: Element;
  originalText: string;
  targetLanguage: string;
  sourceLanguage: string;
  context?: string;
}

// ============================================================================
// TranslationObserver Class
// ============================================================================

/**
 * TranslationObserver - Watches DOM for translatable elements
 *
 * Uses MutationObserver to detect elements with data-translate attribute
 * and automatically translates them using the AI Gateway.
 */
export class TranslationObserver {
  private observer: MutationObserver | null = null;
  private config: Required<Omit<TranslationObserverConfig, 'root' | 'onTranslate' | 'onError'>> & {
    root: Element | null;
    onTranslate?: TranslationObserverConfig['onTranslate'];
    onError?: TranslationObserverConfig['onError'];
  };
  private translationQueue: TranslationQueueItem[] = [];
  private isProcessing = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private translatedElements = new WeakSet<Element>();

  constructor(config: TranslationObserverConfig = {}) {
    this.config = {
      root: config.root ?? null,
      translateAttribute: config.translateAttribute ?? 'data-translate',
      batchSize: config.batchSize ?? 10,
      debounceMs: config.debounceMs ?? 100,
      endpoint: config.endpoint ?? 'https://ai-gateway.taylorbuley.workers.dev',
      defaultTargetLanguage: config.defaultTargetLanguage ?? 'en',
      cacheTtl: config.cacheTtl ?? 86400,
      onTranslate: config.onTranslate,
      onError: config.onError,
    };
  }

  /**
   * Start observing for translatable elements
   */
  observe(): void {
    if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
      console.warn('[TranslationObserver] MutationObserver not available');
      return;
    }

    const root = this.config.root ?? document.body;
    if (!root) {
      console.warn('[TranslationObserver] Root element not found');
      return;
    }

    // Create observer
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    // Start observing
    this.observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [this.config.translateAttribute, 'data-target-lang'],
    });

    // Translate existing elements
    this.translateAll();
  }

  /**
   * Stop observing
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Manually translate all current elements
   */
  async translateAll(): Promise<void> {
    const root = this.config.root ?? document.body;
    if (!root) return;

    const elements = root.querySelectorAll(`[${this.config.translateAttribute}]`);
    Array.from(elements).forEach((element) => {
      if (!this.translatedElements.has(element)) {
        this.queueElement(element);
      }
    });

    await this.processQueue();
  }

  /**
   * Translate a specific element
   */
  async translateElement(element: Element): Promise<TranslationResult | null> {
    const originalText = element.textContent?.trim();
    if (!originalText) return null;

    const targetLanguage = this.getTargetLanguage(element);
    const sourceLanguage = this.getSourceLanguage(element);
    const context = element.getAttribute('data-translate-context') ?? undefined;

    try {
      const result = await translateWithAIGateway(originalText, targetLanguage, {
        sourceLanguage,
        context,
        endpoint: this.config.endpoint,
      });

      // Update element content
      if (result.translated !== originalText) {
        element.textContent = result.translated;
        element.setAttribute('data-translated', 'true');
        element.setAttribute('data-original-text', originalText);
      }

      this.translatedElements.add(element);
      this.config.onTranslate?.(element, result);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Translation failed';
      this.config.onError?.(element, errorMsg);
      return null;
    }
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    let hasNewElements = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check added nodes
        Array.from(mutation.addedNodes).forEach((node) => {
          if (node instanceof Element) {
            if (node.hasAttribute(this.config.translateAttribute)) {
              if (!this.translatedElements.has(node)) {
                this.queueElement(node);
                hasNewElements = true;
              }
            }
            // Check descendants
            const descendants = node.querySelectorAll(`[${this.config.translateAttribute}]`);
            Array.from(descendants).forEach((descendant) => {
              if (!this.translatedElements.has(descendant)) {
                this.queueElement(descendant);
                hasNewElements = true;
              }
            });
          }
        });
      } else if (mutation.type === 'attributes') {
        // Element got data-translate attribute added
        if (mutation.target instanceof Element) {
          if (mutation.target.hasAttribute(this.config.translateAttribute)) {
            if (!this.translatedElements.has(mutation.target)) {
              this.queueElement(mutation.target);
              hasNewElements = true;
            }
          }
        }
      }
    }

    if (hasNewElements) {
      this.debouncedProcessQueue();
    }
  }

  /**
   * Queue an element for translation
   */
  private queueElement(element: Element): void {
    const originalText = element.textContent?.trim();
    if (!originalText) return;

    // Skip if already in queue
    if (this.translationQueue.some((item) => item.element === element)) {
      return;
    }

    const targetLanguage = this.getTargetLanguage(element);
    const sourceLanguage = this.getSourceLanguage(element);
    const context = element.getAttribute('data-translate-context') ?? undefined;

    this.translationQueue.push({
      element,
      originalText,
      targetLanguage,
      sourceLanguage,
      context,
    });
  }

  /**
   * Debounced queue processing
   */
  private debouncedProcessQueue(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, this.config.debounceMs);
  }

  /**
   * Process queued translations
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.translationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process in batches
      while (this.translationQueue.length > 0) {
        const batch = this.translationQueue.splice(0, this.config.batchSize);

        // Process batch concurrently
        await Promise.all(
          batch.map(async (item) => {
            try {
              const result = await translateWithAIGateway(
                item.originalText,
                item.targetLanguage,
                {
                  sourceLanguage: item.sourceLanguage,
                  context: item.context,
                  endpoint: this.config.endpoint,
                }
              );

              // Update element content
              if (result.translated !== item.originalText) {
                item.element.textContent = result.translated;
                item.element.setAttribute('data-translated', 'true');
                item.element.setAttribute('data-original-text', item.originalText);
              }

              this.translatedElements.add(item.element);
              this.config.onTranslate?.(item.element, result);
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Translation failed';
              this.config.onError?.(item.element, errorMsg);
            }
          })
        );
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get target language for an element
   */
  private getTargetLanguage(element: Element): string {
    const explicit = element.getAttribute('data-target-lang');
    if (explicit) return normalizeLanguageCode(explicit);

    return detectTargetLanguage(undefined, undefined);
  }

  /**
   * Get source language for an element
   */
  private getSourceLanguage(element: Element): string {
    const explicit = element.getAttribute('data-source-lang');
    if (explicit) return normalizeLanguageCode(explicit);

    return 'auto';
  }
}

// ============================================================================
// React Hook
// ============================================================================

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
export function useTranslationObserver(
  config?: TranslationObserverConfig
): React.RefObject<TranslationObserver | null> {
  const observerRef = useRef<TranslationObserver | null>(null);

  useEffect(() => {
    observerRef.current = new TranslationObserver(config);
    observerRef.current.observe();

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return observerRef;
}

// ============================================================================
// Auto-initialization
// ============================================================================

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
export function initTranslationObserver(config?: TranslationObserverConfig): TranslationObserver {
  const observer = new TranslationObserver(config);

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe();
      });
    } else {
      observer.observe();
    }
  }

  return observer;
}
