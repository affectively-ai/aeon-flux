/**
 * Automatic Click Tracker
 *
 * Intercepts all clicks using event delegation and automatically
 * tracks them to GTM dataLayer with Merkle tree context.
 *
 * Features:
 * - Single delegated listener (no per-element handlers)
 * - Walks up DOM to find Merkle-annotated ancestor
 * - Captures full tree path and element metadata
 * - Includes ESI context snapshot with each click
 */
import type { AnalyticsConfig } from './types';
/**
 * Initialize click tracking
 */
export declare function initClickTracker(config: AnalyticsConfig): () => void;
/**
 * Stop click tracking
 */
export declare function stopClickTracker(): void;
/**
 * Check if click tracking is active
 */
export declare function isClickTrackerActive(): boolean;
/**
 * Manually track a click event
 * Useful for custom elements or programmatic clicks
 */
export declare function trackClick(element: HTMLElement, event?: MouseEvent, config?: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix' | 'clickOptions'>): void;
/**
 * Track a custom interaction (not necessarily a click)
 */
export declare function trackInteraction(name: string, data: Record<string, unknown>, element?: HTMLElement, config?: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>): void;
