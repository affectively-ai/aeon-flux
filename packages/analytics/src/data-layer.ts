/**
 * GTM dataLayer Integration
 *
 * Manages the dataLayer array and provides typed event pushing.
 * Ensures dataLayer exists and handles event formatting.
 */

import type {
  AnalyticsConfig,
  AeonEventBase,
  ContextEvent,
  PageViewEvent,
  ClickEvent,
  DataLayerEvent,
  ESIState,
  ElementInfo,
  PositionInfo,
} from './types';

// ============================================================================
// Constants
// ============================================================================

/** Current analytics version */
export const ANALYTICS_VERSION = '1.0.0';

// ============================================================================
// dataLayer Management
// ============================================================================

/**
 * Ensure dataLayer array exists on window
 */
export function ensureDataLayer(name = 'dataLayer'): unknown[] {
  const w = window as unknown as Record<string, unknown>;

  if (!w[name]) {
    w[name] = [];
  }

  return w[name] as unknown[];
}

/**
 * Push event to dataLayer
 */
export function pushToDataLayer(event: DataLayerEvent, dataLayerName = 'dataLayer'): void {
  const dataLayer = ensureDataLayer(dataLayerName);
  dataLayer.push(event);

  // Debug logging
  if ((window as Window & { __AEON_ANALYTICS_DEBUG__?: boolean }).__AEON_ANALYTICS_DEBUG__) {
    console.log('[Aeon Analytics]', event.event, event);
  }
}

// ============================================================================
// Event Builders
// ============================================================================

/**
 * Create base event structure
 */
function createBaseEvent(eventName: string, prefix = 'aeon'): AeonEventBase {
  return {
    event: prefix ? `${prefix}.${eventName}` : eventName,
    aeon: {
      version: ANALYTICS_VERSION,
      timestamp: Date.now(),
    },
  };
}

/**
 * Build context event from ESI state
 */
export function buildContextEvent(esiState: ESIState, prefix = 'aeon'): ContextEvent {
  return {
    ...createBaseEvent('context', prefix),
    event: `${prefix}.context` as 'aeon.context',
    user: {
      tier: esiState.userTier,
      id: esiState.userId,
      sessionId: esiState.sessionId,
      isNewSession: esiState.isNewSession,
    },
    emotion: esiState.emotionState,
    preferences: esiState.preferences,
    features: esiState.features,
    device: {
      viewport: esiState.viewport,
      connection: esiState.connection,
    },
    time: {
      localHour: esiState.localHour,
      timezone: esiState.timezone,
    },
    recentPages: esiState.recentPages,
  };
}

/**
 * Build page view event
 */
export function buildPageViewEvent(
  path: string,
  title: string,
  merkleRoot: string,
  esiState: ESIState,
  prefix = 'aeon'
): PageViewEvent {
  return {
    ...createBaseEvent('pageview', prefix),
    event: `${prefix}.pageview` as 'aeon.pageview',
    page: {
      path,
      title,
      merkleRoot,
    },
    user: {
      tier: esiState.userTier,
      id: esiState.userId,
      sessionId: esiState.sessionId,
      isNewSession: esiState.isNewSession,
    },
    emotion: esiState.emotionState,
    features: esiState.features,
    device: {
      viewport: esiState.viewport,
      connection: esiState.connection,
      reducedMotion: esiState.preferences.reducedMotion,
    },
    time: {
      localHour: esiState.localHour,
      timezone: esiState.timezone,
    },
  };
}

/**
 * Build click event
 */
export function buildClickEvent(
  merkleHash: string,
  treePath: string[],
  treePathHashes: string[],
  element: ElementInfo,
  position: PositionInfo,
  context: Partial<ESIState>,
  prefix = 'aeon'
): ClickEvent {
  return {
    ...createBaseEvent('click', prefix),
    event: `${prefix}.click` as 'aeon.click',
    click: {
      merkleHash,
      treePath,
      treePathHashes,
      element,
      position,
    },
    context,
  };
}

// ============================================================================
// Element Info Extraction
// ============================================================================

/**
 * Extract element info for tracking
 */
export function extractElementInfo(
  element: HTMLElement,
  maxTextLength = 100
): ElementInfo {
  // Get text content, truncated
  let text = element.innerText || element.textContent || '';
  if (text.length > maxTextLength) {
    text = text.slice(0, maxTextLength) + '...';
  }
  // Clean whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return {
    tagName: element.tagName,
    text,
    ariaLabel: element.getAttribute('aria-label') || undefined,
    role: element.getAttribute('role') || undefined,
    href: (element as HTMLAnchorElement).href || undefined,
    id: element.id || undefined,
    className: element.className || undefined,
  };
}

/**
 * Extract position info from mouse event
 */
export function extractPositionInfo(event: MouseEvent): PositionInfo {
  return {
    x: event.pageX,
    y: event.pageY,
    viewportX: event.clientX,
    viewportY: event.clientY,
  };
}

// ============================================================================
// Push Helpers
// ============================================================================

/**
 * Push context event to dataLayer
 */
export function pushContextEvent(
  esiState: ESIState,
  config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>
): void {
  const event = buildContextEvent(esiState, config.eventPrefix);
  pushToDataLayer(event, config.dataLayerName);
}

/**
 * Push page view event to dataLayer
 */
export function pushPageViewEvent(
  path: string,
  title: string,
  merkleRoot: string,
  esiState: ESIState,
  config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>
): void {
  const event = buildPageViewEvent(path, title, merkleRoot, esiState, config.eventPrefix);
  pushToDataLayer(event, config.dataLayerName);
}

/**
 * Push click event to dataLayer
 */
export function pushClickEvent(
  merkleHash: string,
  treePath: string[],
  treePathHashes: string[],
  element: ElementInfo,
  position: PositionInfo,
  context: Partial<ESIState>,
  config: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>
): void {
  const event = buildClickEvent(
    merkleHash,
    treePath,
    treePathHashes,
    element,
    position,
    context,
    config.eventPrefix
  );
  pushToDataLayer(event, config.dataLayerName);
}

// ============================================================================
// Debug Mode
// ============================================================================

/**
 * Enable/disable debug logging
 */
export function setDebugMode(enabled: boolean): void {
  (window as Window & { __AEON_ANALYTICS_DEBUG__?: boolean }).__AEON_ANALYTICS_DEBUG__ = enabled;
}

/**
 * Get current dataLayer contents (for debugging)
 */
export function getDataLayer(name = 'dataLayer'): unknown[] {
  return ensureDataLayer(name);
}

/**
 * Clear dataLayer (for testing)
 */
export function clearDataLayer(name = 'dataLayer'): void {
  const w = window as unknown as Record<string, unknown>;
  w[name] = [];
}
