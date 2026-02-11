/**
 * Service Worker Hooks - Client communication with Aeon SW
 *
 * Provides React hooks for:
 * - Total preload progress tracking
 * - Cache status monitoring
 * - Manual preload triggers
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  isComplete: boolean;
  cachedRoutes: string[];
}

export interface CacheStatus {
  cached: number;
  total: number;
  routes: string[];
  isReady: boolean;
}

/**
 * Hook to register and track the Aeon service worker
 */
export function useAeonServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          '/.aeon/sw.js',
          { scope: '/' },
        );

        registrationRef.current = registration;
        setIsRegistered(true);

        // Check if active
        if (registration.active) {
          setIsActive(true);
        }

        // Listen for state changes
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                setIsActive(true);
              }
            });
          }
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to register SW'),
        );
      }
    };

    registerSW();
  }, []);

  const update = useCallback(async () => {
    if (registrationRef.current) {
      await registrationRef.current.update();
    }
  }, []);

  const unregister = useCallback(async () => {
    if (registrationRef.current) {
      await registrationRef.current.unregister();
      setIsRegistered(false);
      setIsActive(false);
    }
  }, []);

  return {
    isRegistered,
    isActive,
    error,
    update,
    unregister,
  };
}

/**
 * Hook to track total preload progress
 */
export function usePreloadProgress(): PreloadProgress {
  const [progress, setProgress] = useState<PreloadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    isComplete: false,
    cachedRoutes: [],
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      if (data.type === 'PRELOAD_PROGRESS') {
        setProgress({
          loaded: data.loaded,
          total: data.total,
          percentage: data.percentage,
          isComplete: false,
          cachedRoutes: [],
        });
      } else if (data.type === 'PRELOAD_COMPLETE') {
        setProgress({
          loaded: data.loaded,
          total: data.total,
          percentage: 100,
          isComplete: true,
          cachedRoutes: data.cachedRoutes || [],
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return progress;
}

/**
 * Hook to get current cache status
 */
export function useCacheStatus(): CacheStatus & { refresh: () => void } {
  const [status, setStatus] = useState<CacheStatus>({
    cached: 0,
    total: 0,
    routes: [],
    isReady: false,
  });

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }

    // Use MessageChannel for request/response
    const channel = new MessageChannel();

    channel.port1.onmessage = (event: MessageEvent) => {
      const data = event.data;
      setStatus({
        cached: data.cached,
        total: data.total,
        routes: data.routes,
        isReady: data.cached === data.total && data.total > 0,
      });
    };

    controller.postMessage({ type: 'GET_CACHE_STATUS' }, [channel.port2]);
  }, []);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Refresh periodically
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { ...status, refresh };
}

/**
 * Hook to trigger manual preload
 */
export function useManualPreload() {
  const [isPreloading, setIsPreloading] = useState(false);
  const progress = usePreloadProgress();

  const triggerPreload = useCallback(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }

    setIsPreloading(true);
    controller.postMessage({ type: 'TRIGGER_PRELOAD' });
  }, []);

  // Reset isPreloading when complete
  useEffect(() => {
    if (progress.isComplete) {
      setIsPreloading(false);
    }
  }, [progress.isComplete]);

  return {
    triggerPreload,
    isPreloading,
    progress,
  };
}

/**
 * Hook to prefetch a specific route
 */
export function usePrefetchRoute() {
  const prefetch = useCallback((route: string) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }

    controller.postMessage({ type: 'PREFETCH_ROUTE', route });
  }, []);

  return prefetch;
}

/**
 * Hook to clear the cache
 */
export function useClearCache() {
  const [isClearing, setIsClearing] = useState(false);

  const clearCache = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }

    setIsClearing(true);
    controller.postMessage({ type: 'CLEAR_CACHE' });

    // Wait a bit for cache to clear
    await new Promise((r) => setTimeout(r, 100));
    setIsClearing(false);
  }, []);

  return { clearCache, isClearing };
}
