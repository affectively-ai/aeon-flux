/**
 * ESI Context Bridge
 *
 * Syncs ESI state from window.__AEON_ESI_STATE__ to GTM dataLayer.
 * Handles initial sync and subscribes to state changes.
 */

import type { AnalyticsConfig, ESIState } from './types';
import { pushContextEvent, pushPageViewEvent } from './data-layer';

// ============================================================================
// ESI State Access
// ============================================================================

/**
 * Get current ESI state from window
 */
export function getESIState(): ESIState | null {
  return window.__AEON_ESI_STATE__ || null;
}

/**
 * Check if ESI state is available
 */
export function hasESIState(): boolean {
  return !!window.__AEON_ESI_STATE__;
}

/**
 * Get specific ESI state property
 */
export function getESIProperty<K extends keyof ESIState>(
  key: K,
): ESIState[K] | undefined {
  const state = getESIState();
  return state ? state[key] : undefined;
}

// ============================================================================
// ESI State Subscription
// ============================================================================

/** Active subscription cleanup function */
let unsubscribe: (() => void) | null = null;

/**
 * Subscribe to ESI state changes
 */
export function subscribeToESIChanges(
  callback: (state: ESIState) => void,
): () => void {
  const state = window.__AEON_ESI_STATE__;

  if (state?.subscribe) {
    return state.subscribe(callback);
  }

  // No subscribe method available - return no-op
  return () => {};
}

// ============================================================================
// DataLayer Sync
// ============================================================================

/**
 * Sync current ESI state to dataLayer
 */
export function syncESIToDataLayer(
  config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>,
): boolean {
  const esiState = getESIState();

  if (!esiState) {
    return false;
  }

  pushContextEvent(esiState, config);
  return true;
}

/**
 * Push page view with current ESI context
 */
export function pushPageView(
  config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>,
  merkleRoot = '',
): boolean {
  const esiState = getESIState();

  if (!esiState) {
    return false;
  }

  pushPageViewEvent(
    window.location.pathname,
    document.title,
    merkleRoot,
    esiState,
    config,
  );

  return true;
}

// ============================================================================
// Watch Mode
// ============================================================================

/**
 * Start watching for ESI state changes and sync to dataLayer
 */
export function watchESIChanges(
  config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>,
): () => void {
  // Clean up any existing subscription
  if (unsubscribe) {
    unsubscribe();
  }

  // Subscribe to changes
  unsubscribe = subscribeToESIChanges(() => {
    syncESIToDataLayer(config);
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize context bridge with full sync
 */
export function initContextBridge(
  config: Pick<
    AnalyticsConfig,
    'dataLayerName' | 'eventPrefix' | 'syncESIContext'
  >,
): () => void {
  if (config.syncESIContext === false) {
    return () => {};
  }

  // Initial sync
  syncESIToDataLayer(config);

  // Watch for changes
  return watchESIChanges(config);
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Wait for ESI state to be available
 */
export function waitForESIState(timeout = 5000): Promise<ESIState | null> {
  return new Promise((resolve) => {
    // Check immediately
    const state = getESIState();
    if (state) {
      resolve(state);
      return;
    }

    const startTime = Date.now();

    const check = () => {
      const state = getESIState();
      if (state) {
        resolve(state);
        return;
      }

      if (Date.now() - startTime > timeout) {
        resolve(null);
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
}

/**
 * Initialize context bridge with retry
 */
export async function initContextBridgeWithRetry(
  config: Pick<
    AnalyticsConfig,
    'dataLayerName' | 'eventPrefix' | 'syncESIContext'
  >,
  timeout = 5000,
): Promise<() => void> {
  if (config.syncESIContext === false) {
    return () => {};
  }

  // Wait for ESI state
  const state = await waitForESIState(timeout);

  if (!state) {
    console.warn('[Aeon Analytics] ESI state not available after timeout');
    return () => {};
  }

  // Now initialize
  return initContextBridge(config);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get partial ESI state for click events
 */
export function getESIContextSnapshot(): Partial<ESIState> {
  const state = getESIState();

  if (!state) {
    return {};
  }

  // Return relevant context for click tracking
  return {
    userTier: state.userTier,
    isAdmin: state.isAdmin,
    userId: state.userId,
    sessionId: state.sessionId,
    isNewSession: state.isNewSession,
    emotionState: state.emotionState,
    features: state.features,
    viewport: state.viewport,
    connection: state.connection,
    localHour: state.localHour,
    timezone: state.timezone,
  };
}

/**
 * Check if current user is an admin
 * Admins bypass all tier restrictions
 */
export function isAdmin(): boolean {
  const state = getESIState();
  return state?.isAdmin === true || state?.userTier === 'admin';
}

/**
 * Check if user has specific feature enabled
 * Admins always have access to all features
 */
export function hasFeature(feature: keyof ESIState['features']): boolean {
  const state = getESIState();

  // Admins bypass all tier restrictions
  if (state?.isAdmin === true || state?.userTier === 'admin') {
    return true;
  }

  return state?.features?.[feature] ?? false;
}

/**
 * Check if user meets minimum tier requirement
 * Admins always meet any tier requirement
 */
export function meetsTierRequirement(
  requiredTier: ESIState['userTier'],
): boolean {
  const state = getESIState();

  if (!state) {
    return false;
  }

  // Admins bypass all tier restrictions
  if (state.isAdmin === true || state.userTier === 'admin') {
    return true;
  }

  // Tier hierarchy: free < starter < pro < enterprise
  const tierOrder: ESIState['userTier'][] = [
    'free',
    'starter',
    'pro',
    'enterprise',
    'admin',
  ];
  const userTierIndex = tierOrder.indexOf(state.userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);

  return userTierIndex >= requiredTierIndex;
}

/**
 * Get user tier
 */
export function getUserTier(): ESIState['userTier'] | null {
  return getESIProperty('userTier') ?? null;
}

/**
 * Get emotion state
 */
export function getEmotionState(): ESIState['emotionState'] | null {
  return getESIProperty('emotionState') ?? null;
}
