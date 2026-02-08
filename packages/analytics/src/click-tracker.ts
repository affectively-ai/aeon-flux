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

import type { AnalyticsConfig, ClickTrackingOptions, ESIState } from './types';
import {
  extractElementInfo,
  extractPositionInfo,
  pushClickEvent,
} from './data-layer';
import { parseMerkleFromElement, findNearestMerkleElement } from './merkle-tree';
import { getESIContextSnapshot } from './context-bridge';

// ============================================================================
// Types
// ============================================================================

interface ClickHandler {
  listener: (event: MouseEvent) => void;
  cleanup: () => void;
}

// ============================================================================
// State
// ============================================================================

/** Active click handler */
let activeHandler: ClickHandler | null = null;

/** Debounce timer */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Last click timestamp for debouncing */
let lastClickTime = 0;

// ============================================================================
// Click Handler
// ============================================================================

/**
 * Check if element should be excluded from tracking
 */
function shouldExclude(element: HTMLElement, excludeSelectors: string[]): boolean {
  for (const selector of excludeSelectors) {
    if (element.matches(selector) || element.closest(selector)) {
      return true;
    }
  }
  return false;
}

/**
 * Create click event handler
 */
function createClickHandler(
  config: AnalyticsConfig,
  options: ClickTrackingOptions
): (event: MouseEvent) => void {
  return (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (!target || !(target instanceof HTMLElement)) {
      return;
    }

    // Check exclusions
    if (options.excludeSelectors?.length) {
      if (shouldExclude(target, options.excludeSelectors)) {
        return;
      }
    }

    // Debounce if configured
    if (options.debounceMs && options.debounceMs > 0) {
      const now = Date.now();
      if (now - lastClickTime < options.debounceMs) {
        return;
      }
      lastClickTime = now;
    }

    // Find nearest element with Merkle attributes
    const merkleElement = findNearestMerkleElement(target);

    // Parse Merkle info
    let merkleHash = 'unknown';
    let treePath: string[] = [];
    let treePathHashes: string[] = [];

    if (merkleElement) {
      const merkleInfo = parseMerkleFromElement(merkleElement);
      if (merkleInfo) {
        merkleHash = merkleInfo.hash;
        treePath = options.includeTreePath !== false ? merkleInfo.path : [];
        treePathHashes = options.includeTreePath !== false ? merkleInfo.pathHashes : [];
      }
    } else {
      // No Merkle element found - generate path from DOM structure
      treePath = generateDOMPath(target);
    }

    // Extract element info (from clicked element, not Merkle ancestor)
    const elementInfo = extractElementInfo(target, options.maxTextLength);

    // Extract position if enabled
    const position = options.includePosition !== false
      ? extractPositionInfo(event)
      : { x: 0, y: 0, viewportX: 0, viewportY: 0 };

    // Get ESI context snapshot
    const context = getESIContextSnapshot();

    // Push to dataLayer
    pushClickEvent(
      merkleHash,
      treePath,
      treePathHashes,
      elementInfo,
      position,
      context,
      {
        dataLayerName: config.dataLayerName,
        eventPrefix: config.eventPrefix,
      }
    );
  };
}

/**
 * Generate DOM path for elements without Merkle attributes
 */
function generateDOMPath(element: HTMLElement): string[] {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let identifier = current.tagName.toLowerCase();

    // Add ID if present
    if (current.id) {
      identifier += `#${current.id}`;
    }
    // Or first meaningful class
    else if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ').filter(Boolean);
      const meaningfulClass = classes.find(
        (c) => !c.startsWith('_') && !c.match(/^[a-z]{1,3}\d+/)
      );
      if (meaningfulClass) {
        identifier += `.${meaningfulClass}`;
      }
    }

    path.unshift(identifier);
    current = current.parentElement;
  }

  // Limit depth
  if (path.length > 10) {
    return ['...', ...path.slice(-9)];
  }

  return path;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize click tracking
 */
export function initClickTracker(config: AnalyticsConfig): () => void {
  // Skip if disabled
  if (config.trackClicks === false) {
    return () => {};
  }

  // Clean up existing handler
  if (activeHandler) {
    activeHandler.cleanup();
  }

  const options: ClickTrackingOptions = {
    debounceMs: 0,
    maxTextLength: 100,
    excludeSelectors: [],
    includePosition: true,
    includeTreePath: true,
    ...config.clickOptions,
  };

  // Create handler
  const listener = createClickHandler(config, options);

  // Add event listener with capture for earliest interception
  document.addEventListener('click', listener, {
    capture: true,
    passive: true,
  });

  // Cleanup function
  const cleanup = () => {
    document.removeEventListener('click', listener, { capture: true });

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    activeHandler = null;
  };

  activeHandler = { listener, cleanup };

  return cleanup;
}

/**
 * Stop click tracking
 */
export function stopClickTracker(): void {
  if (activeHandler) {
    activeHandler.cleanup();
  }
}

/**
 * Check if click tracking is active
 */
export function isClickTrackerActive(): boolean {
  return activeHandler !== null;
}

// ============================================================================
// Manual Tracking
// ============================================================================

/**
 * Manually track a click event
 * Useful for custom elements or programmatic clicks
 */
export function trackClick(
  element: HTMLElement,
  event?: MouseEvent,
  config?: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix' | 'clickOptions'>
): void {
  const options = config?.clickOptions || {};

  // Find Merkle element
  const merkleElement = findNearestMerkleElement(element);

  let merkleHash = 'unknown';
  let treePath: string[] = [];
  let treePathHashes: string[] = [];

  if (merkleElement) {
    const merkleInfo = parseMerkleFromElement(merkleElement);
    if (merkleInfo) {
      merkleHash = merkleInfo.hash;
      treePath = merkleInfo.path;
      treePathHashes = merkleInfo.pathHashes;
    }
  } else {
    treePath = generateDOMPath(element);
  }

  // Extract element info
  const elementInfo = extractElementInfo(element, options.maxTextLength || 100);

  // Extract position if event provided
  const position = event
    ? extractPositionInfo(event)
    : { x: 0, y: 0, viewportX: 0, viewportY: 0 };

  // Get context
  const context = getESIContextSnapshot();

  // Push to dataLayer
  pushClickEvent(
    merkleHash,
    treePath,
    treePathHashes,
    elementInfo,
    position,
    context,
    {
      dataLayerName: config?.dataLayerName || 'dataLayer',
      eventPrefix: config?.eventPrefix || 'aeon',
    }
  );
}

// ============================================================================
// Custom Event Tracking
// ============================================================================

/**
 * Track a custom interaction (not necessarily a click)
 */
export function trackInteraction(
  name: string,
  data: Record<string, unknown>,
  element?: HTMLElement,
  config?: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>
): void {
  const context = getESIContextSnapshot();

  let treePath: string[] = [];
  let merkleHash = 'none';

  if (element) {
    const merkleElement = findNearestMerkleElement(element);
    if (merkleElement) {
      const merkleInfo = parseMerkleFromElement(merkleElement);
      if (merkleInfo) {
        merkleHash = merkleInfo.hash;
        treePath = merkleInfo.path;
      }
    } else {
      treePath = generateDOMPath(element);
    }
  }

  const dataLayerName = config?.dataLayerName || 'dataLayer';
  const eventPrefix = config?.eventPrefix || 'aeon';

  const event = {
    event: `${eventPrefix}.interaction`,
    aeon: {
      version: '1.0.0',
      timestamp: Date.now(),
    },
    interaction: {
      name,
      merkleHash,
      treePath,
      data,
    },
    context,
  };

  const w = window as unknown as Record<string, unknown[]>;
  const dataLayer = w[dataLayerName];
  if (dataLayer) {
    dataLayer.push(event);
  }
}
