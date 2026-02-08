/**
 * ESI Context Bridge
 *
 * Syncs ESI state from window.__AEON_ESI_STATE__ to GTM dataLayer.
 * Handles initial sync and subscribes to state changes.
 */
import type { AnalyticsConfig, ESIState } from './types';
/**
 * Get current ESI state from window
 */
export declare function getESIState(): ESIState | null;
/**
 * Check if ESI state is available
 */
export declare function hasESIState(): boolean;
/**
 * Get specific ESI state property
 */
export declare function getESIProperty<K extends keyof ESIState>(key: K): ESIState[K] | undefined;
/**
 * Subscribe to ESI state changes
 */
export declare function subscribeToESIChanges(callback: (state: ESIState) => void): () => void;
/**
 * Sync current ESI state to dataLayer
 */
export declare function syncESIToDataLayer(config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>): boolean;
/**
 * Push page view with current ESI context
 */
export declare function pushPageView(config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>, merkleRoot?: string): boolean;
/**
 * Start watching for ESI state changes and sync to dataLayer
 */
export declare function watchESIChanges(config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>): () => void;
/**
 * Initialize context bridge with full sync
 */
export declare function initContextBridge(config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix' | 'syncESIContext'>): () => void;
/**
 * Wait for ESI state to be available
 */
export declare function waitForESIState(timeout?: number): Promise<ESIState | null>;
/**
 * Initialize context bridge with retry
 */
export declare function initContextBridgeWithRetry(config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix' | 'syncESIContext'>, timeout?: number): Promise<() => void>;
/**
 * Get partial ESI state for click events
 */
export declare function getESIContextSnapshot(): Partial<ESIState>;
/**
 * Check if current user is an admin
 * Admins bypass all tier restrictions
 */
export declare function isAdmin(): boolean;
/**
 * Check if user has specific feature enabled
 * Admins always have access to all features
 */
export declare function hasFeature(feature: keyof ESIState['features']): boolean;
/**
 * Check if user meets minimum tier requirement
 * Admins always meet any tier requirement
 */
export declare function meetsTierRequirement(requiredTier: ESIState['userTier']): boolean;
/**
 * Get user tier
 */
export declare function getUserTier(): ESIState['userTier'] | null;
/**
 * Get emotion state
 */
export declare function getEmotionState(): ESIState['emotionState'] | null;
