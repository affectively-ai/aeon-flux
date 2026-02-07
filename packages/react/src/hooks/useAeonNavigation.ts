/**
 * Aeon Navigation Hooks
 *
 * React hooks for the cutting-edge navigation system.
 * The navigation state itself is an Aeon - the site is a session.
 *
 * Recursive Aeon Architecture:
 * - Component = Aeon entity
 * - Page = Aeon session
 * - Site = Aeon of sessions (routes are collaborative)
 * - Federation = Aeon of Aeons (cross-site sync)
 */

import { useContext, useCallback, useSyncExternalStore, createContext } from 'react';
import type {
  AeonNavigationEngine,
  NavigationOptions,
  PrefetchOptions,
  NavigationState,
  PresenceInfo,
} from '@affectively/aeon-pages-runtime';
import { getNavigator } from '@affectively/aeon-pages-runtime';

// Context for providing custom navigation engine
export interface AeonNavigationContextValue {
  navigator: AeonNavigationEngine;
}

export const AeonNavigationContext = createContext<AeonNavigationContextValue | null>(null);

// Get navigator from context or use global singleton
function useNavigator(): AeonNavigationEngine {
  const context = useContext(AeonNavigationContext);
  return context?.navigator ?? getNavigator();
}

/**
 * Main navigation hook - provides navigation, prefetch, and state
 */
export function useAeonNavigation() {
  const navigator = useNavigator();

  // Subscribe to navigation state changes with useSyncExternalStore
  const state = useSyncExternalStore(
    useCallback((callback) => navigator.subscribe(callback), [navigator]),
    () => navigator.getState(),
    () => navigator.getState()
  );

  // Navigation function with view transitions
  const navigate = useCallback(
    async (href: string, options?: NavigationOptions) => {
      await navigator.navigate(href, options);
    },
    [navigator]
  );

  // Prefetch a route (session + presence)
  const prefetch = useCallback(
    async (href: string, options?: PrefetchOptions) => {
      await navigator.prefetch(href, options);
    },
    [navigator]
  );

  // Go back in history
  const back = useCallback(async () => {
    await navigator.back();
  }, [navigator]);

  // Check if route is preloaded
  const isPreloaded = useCallback(
    (href: string): boolean => {
      return navigator.isPreloaded(href);
    },
    [navigator]
  );

  // Preload ALL routes (total preload strategy)
  const preloadAll = useCallback(
    async (onProgress?: (loaded: number, total: number) => void) => {
      await navigator.preloadAll(onProgress);
    },
    [navigator]
  );

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return navigator.getCacheStats();
  }, [navigator]);

  return {
    // State
    current: state.current,
    previous: state.previous,
    history: state.history,
    isNavigating: state.isNavigating,

    // Actions
    navigate,
    prefetch,
    back,
    preloadAll,

    // Utilities
    isPreloaded,
    getCacheStats,
  };
}

/**
 * Route Presence hook - subscribe to who's viewing/editing routes
 *
 * Presence flows upward through the Aeon hierarchy:
 * - Page presence = users on this page
 * - Site presence = aggregate of all page presence
 * - Federation presence = aggregate across sites
 *
 * Note: This is different from usePresence in provider.tsx which is for
 * page-level editing presence. This hook is for navigation-level presence
 * (who's viewing what routes before you navigate there).
 */
export function useRoutePresence() {
  const navigator = useNavigator();

  // Get cached presence for a route
  const getPresence = useCallback(
    (route: string): PresenceInfo | null => {
      return navigator.getPresence(route);
    },
    [navigator]
  );

  // Subscribe to presence updates
  const subscribePresence = useCallback(
    (callback: (route: string, presence: PresenceInfo) => void): (() => void) => {
      return navigator.subscribePresence(callback);
    },
    [navigator]
  );

  return {
    getPresence,
    subscribePresence,
  };
}

/**
 * Navigation prediction hook
 */
export function useNavigationPrediction() {
  const navigator = useNavigator();

  // Get predictions for current route
  const predict = useCallback(
    (fromRoute?: string) => {
      const state = navigator.getState();
      return navigator.predict(fromRoute ?? state.current);
    },
    [navigator]
  );

  return {
    predict,
  };
}

/**
 * Hook for observing links and auto-prefetching
 */
export function useLinkObserver(containerRef: React.RefObject<Element>) {
  const navigator = useNavigator();

  // Set up observation on mount
  const observe = useCallback(() => {
    if (!containerRef.current) return () => {};
    return navigator.observeLinks(containerRef.current);
  }, [navigator, containerRef]);

  return { observe };
}

/**
 * Hook for total preload progress
 */
export function useTotalPreload() {
  const { preloadAll, getCacheStats } = useAeonNavigation();

  // Preload with progress tracking
  const startPreload = useCallback(
    async (onProgress?: (loaded: number, total: number) => void) => {
      await preloadAll(onProgress);
    },
    [preloadAll]
  );

  return {
    startPreload,
    getStats: getCacheStats,
  };
}

// Re-export types for convenience
export type { NavigationOptions, PrefetchOptions, NavigationState, PresenceInfo };
