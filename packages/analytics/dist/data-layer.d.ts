/**
 * GTM dataLayer Integration
 *
 * Manages the dataLayer array and provides typed event pushing.
 * Ensures dataLayer exists and handles event formatting.
 */
import type { AnalyticsConfig, ContextEvent, PageViewEvent, ClickEvent, DataLayerEvent, ESIState, ElementInfo, PositionInfo } from './types';
/** Current analytics version */
export declare const ANALYTICS_VERSION = "1.0.0";
/**
 * Ensure dataLayer array exists on window
 */
export declare function ensureDataLayer(name?: string): unknown[];
/**
 * Push event to dataLayer
 */
export declare function pushToDataLayer(event: DataLayerEvent, dataLayerName?: string): void;
/**
 * Build context event from ESI state
 */
export declare function buildContextEvent(esiState: ESIState, prefix?: string): ContextEvent;
/**
 * Build page view event
 */
export declare function buildPageViewEvent(path: string, title: string, merkleRoot: string, esiState: ESIState, prefix?: string): PageViewEvent;
/**
 * Build click event
 */
export declare function buildClickEvent(merkleHash: string, treePath: string[], treePathHashes: string[], element: ElementInfo, position: PositionInfo, context: Partial<ESIState>, prefix?: string): ClickEvent;
/**
 * Extract element info for tracking
 */
export declare function extractElementInfo(element: HTMLElement, maxTextLength?: number): ElementInfo;
/**
 * Extract position info from mouse event
 */
export declare function extractPositionInfo(event: MouseEvent): PositionInfo;
/**
 * Push context event to dataLayer
 */
export declare function pushContextEvent(esiState: ESIState, config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>): void;
/**
 * Push page view event to dataLayer
 */
export declare function pushPageViewEvent(path: string, title: string, merkleRoot: string, esiState: ESIState, config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>): void;
/**
 * Push click event to dataLayer
 */
export declare function pushClickEvent(merkleHash: string, treePath: string[], treePathHashes: string[], element: ElementInfo, position: PositionInfo, context: Partial<ESIState>, config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>): void;
/**
 * Enable/disable debug logging
 */
export declare function setDebugMode(enabled: boolean): void;
/**
 * Get current dataLayer contents (for debugging)
 */
export declare function getDataLayer(name?: string): unknown[];
/**
 * Clear dataLayer (for testing)
 */
export declare function clearDataLayer(name?: string): void;
