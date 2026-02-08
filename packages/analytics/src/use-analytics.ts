/**
 * React Hook for Aeon Analytics
 *
 * Initializes GTM, syncs ESI context, and starts click tracking.
 * One hook to rule them all.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { AnalyticsConfig, MerkleTree } from './types';
import { initializeGTM, waitForGTM } from './gtm-loader';
import { initContextBridge, pushPageView, getESIState } from './context-bridge';
import { initClickTracker, trackClick, trackInteraction } from './click-tracker';
import { setDebugMode } from './data-layer';

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseAnalyticsReturn {
  /** Whether analytics is initialized */
  isInitialized: boolean;

  /** Whether GTM is loaded and ready */
  isGTMReady: boolean;

  /** Manually track a click on an element */
  trackClick: (element: HTMLElement, event?: MouseEvent) => void;

  /** Track a custom interaction */
  trackInteraction: (name: string, data: Record<string, unknown>, element?: HTMLElement) => void;

  /** Manually push a page view */
  pushPageView: (merkleRoot?: string) => void;

  /** Set the current Merkle tree (for page view tracking) */
  setMerkleTree: (tree: MerkleTree) => void;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Initialize Aeon Analytics with automatic click tracking
 *
 * @example
 * ```tsx
 * function App() {
 *   useAeonAnalytics({
 *     gtmContainerId: 'GTM-XXXXXX',
 *     trackClicks: true,
 *     syncESIContext: true,
 *   });
 *
 *   return <div>My App</div>;
 * }
 * ```
 */
export function useAeonAnalytics(config: AnalyticsConfig): UseAnalyticsReturn {
  const initializedRef = useRef(false);
  const gtmReadyRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const merkleTreeRef = useRef<MerkleTree | null>(null);
  const configRef = useRef(config);

  // Keep config ref updated
  configRef.current = config;

  // Initialize on mount
  useEffect(() => {
    // Prevent double initialization
    if (initializedRef.current || window.__AEON_ANALYTICS_INITIALIZED__) {
      return;
    }

    initializedRef.current = true;
    window.__AEON_ANALYTICS_INITIALIZED__ = true;

    // Enable debug mode if configured
    if (config.debug) {
      setDebugMode(true);
    }

    const cleanupFunctions: (() => void)[] = [];

    // 1. Initialize GTM
    if (config.gtmContainerId) {
      initializeGTM({
        containerId: config.gtmContainerId,
        dataLayerName: config.dataLayerName,
      });

      // Wait for GTM to be ready
      waitForGTM().then((ready) => {
        gtmReadyRef.current = ready;
      });
    }

    // 2. Initialize ESI context bridge
    if (config.syncESIContext !== false) {
      const cleanup = initContextBridge({
        dataLayerName: config.dataLayerName,
        eventPrefix: config.eventPrefix,
        syncESIContext: config.syncESIContext,
      });
      cleanupFunctions.push(cleanup);
    }

    // 3. Initialize click tracking
    if (config.trackClicks !== false) {
      const cleanup = initClickTracker(config);
      cleanupFunctions.push(cleanup);
    }

    // 4. Push initial page view
    if (config.trackPageViews !== false) {
      const merkleRoot = merkleTreeRef.current?.rootHash || '';
      pushPageView(
        {
          dataLayerName: config.dataLayerName,
          eventPrefix: config.eventPrefix,
        },
        merkleRoot
      );
    }

    // Store cleanup function
    cleanupRef.current = () => {
      for (const cleanup of cleanupFunctions) {
        cleanup();
      }
      window.__AEON_ANALYTICS_INITIALIZED__ = false;
    };

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []); // Only run once on mount

  // Handle route changes
  useEffect(() => {
    if (!initializedRef.current || config.trackPageViews === false) {
      return;
    }

    // Push page view on pathname change
    const merkleRoot = merkleTreeRef.current?.rootHash || '';
    pushPageView(
      {
        dataLayerName: config.dataLayerName,
        eventPrefix: config.eventPrefix,
      },
      merkleRoot
    );
  }, [typeof window !== 'undefined' ? window.location.pathname : '']);

  // Manual track click
  const handleTrackClick = useCallback((element: HTMLElement, event?: MouseEvent) => {
    trackClick(element, event, {
      dataLayerName: configRef.current.dataLayerName,
      eventPrefix: configRef.current.eventPrefix,
      clickOptions: configRef.current.clickOptions,
    });
  }, []);

  // Manual track interaction
  const handleTrackInteraction = useCallback(
    (name: string, data: Record<string, unknown>, element?: HTMLElement) => {
      trackInteraction(name, data, element, {
        dataLayerName: configRef.current.dataLayerName,
        eventPrefix: configRef.current.eventPrefix,
      });
    },
    []
  );

  // Manual push page view
  const handlePushPageView = useCallback((merkleRoot?: string) => {
    pushPageView(
      {
        dataLayerName: configRef.current.dataLayerName,
        eventPrefix: configRef.current.eventPrefix,
      },
      merkleRoot || merkleTreeRef.current?.rootHash || ''
    );
  }, []);

  // Set Merkle tree
  const handleSetMerkleTree = useCallback((tree: MerkleTree) => {
    merkleTreeRef.current = tree;
    window.__AEON_MERKLE_TREE__ = tree;
  }, []);

  return {
    isInitialized: initializedRef.current,
    isGTMReady: gtmReadyRef.current,
    trackClick: handleTrackClick,
    trackInteraction: handleTrackInteraction,
    pushPageView: handlePushPageView,
    setMerkleTree: handleSetMerkleTree,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get current ESI state in a component
 */
export function useESIState() {
  return getESIState();
}

/**
 * Track when a component mounts/unmounts
 */
export function useTrackMount(
  componentName: string,
  config?: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>
) {
  useEffect(() => {
    trackInteraction(
      'component.mount',
      { component: componentName },
      undefined,
      config
    );

    return () => {
      trackInteraction(
        'component.unmount',
        { component: componentName },
        undefined,
        config
      );
    };
  }, [componentName]);
}

/**
 * Track visibility of an element using IntersectionObserver
 */
export function useTrackVisibility(
  ref: React.RefObject<HTMLElement>,
  componentName: string,
  config?: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>
) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!ref.current || hasTracked.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            trackInteraction(
              'component.visible',
              { component: componentName },
              ref.current || undefined,
              config
            );
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [componentName]);
}
