/**
 * useNetworkState Hook
 *
 * React hook for monitoring network state and bandwidth.
 * Provides real-time updates on connection quality and effective type.
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type NetworkState = 'online' | 'offline' | 'poor' | 'unknown';

export interface BandwidthProfile {
  /** Estimated bandwidth in Kbps */
  speedKbps: number;
  /** Estimated latency in ms */
  latencyMs: number;
  /** Reliability score (0-1) */
  reliability: number;
  /** Effective connection type */
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
}

export interface NetworkStateResult {
  /** Current network state */
  state: NetworkState;
  /** Whether currently online */
  isOnline: boolean;
  /** Whether on poor connection */
  isPoor: boolean;
  /** Bandwidth profile */
  bandwidth: BandwidthProfile;
  /** Time since last state change */
  timeSinceChange: number;
  /** Force refresh network state */
  refresh: () => void;
}

// Network Information API types
interface NetworkInformation {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, callback: () => void) => void;
  removeEventListener?: (event: string, callback: () => void) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to monitor network state and bandwidth
 */
export function useNetworkState(): NetworkStateResult {
  const [state, setState] = useState<NetworkState>('unknown');
  const [lastChange, setLastChange] = useState(Date.now());
  const [bandwidth, setBandwidth] = useState<BandwidthProfile>({
    speedKbps: 1024,
    latencyMs: 50,
    reliability: 1,
    effectiveType: 'unknown',
  });

  const getConnection = useCallback((): NetworkInformation | undefined => {
    if (typeof navigator === 'undefined') return undefined;
    const nav = navigator as NavigatorWithConnection;
    return nav.connection || nav.mozConnection || nav.webkitConnection;
  }, []);

  const updateBandwidth = useCallback(() => {
    const conn = getConnection();
    if (!conn) return;

    const effectiveType = conn.effectiveType || 'unknown';
    let speedKbps = 1024;
    let latencyMs = 50;
    let reliability = 1;

    switch (effectiveType) {
      case 'slow-2g':
        speedKbps = 50;
        latencyMs = 2000;
        reliability = 0.5;
        break;
      case '2g':
        speedKbps = 150;
        latencyMs = 1000;
        reliability = 0.7;
        break;
      case '3g':
        speedKbps = 750;
        latencyMs = 400;
        reliability = 0.85;
        break;
      case '4g':
        speedKbps = 5000;
        latencyMs = 50;
        reliability = 0.95;
        break;
    }

    // Use actual values if available
    if (conn.downlink) {
      speedKbps = conn.downlink * 1024;
    }
    if (conn.rtt) {
      latencyMs = conn.rtt;
    }

    setBandwidth({
      speedKbps,
      latencyMs,
      reliability,
      effectiveType,
    });

    // Update state based on connection quality
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      setState((prev) => {
        if (prev !== 'poor') {
          setLastChange(Date.now());
        }
        return 'poor';
      });
    }
  }, [getConnection]);

  const updateOnlineState = useCallback(() => {
    if (typeof navigator === 'undefined') return;

    const isOnline = navigator.onLine;
    setState((prev) => {
      const newState = isOnline ? 'online' : 'offline';
      if (prev !== newState) {
        setLastChange(Date.now());
      }
      return newState;
    });

    if (isOnline) {
      updateBandwidth();
    }
  }, [updateBandwidth]);

  const refresh = useCallback(() => {
    updateOnlineState();
  }, [updateOnlineState]);

  useEffect(() => {
    // Initial state
    updateOnlineState();

    // Listen for online/offline events
    const handleOnline = () => {
      setState('online');
      setLastChange(Date.now());
      updateBandwidth();
    };

    const handleOffline = () => {
      setState('offline');
      setLastChange(Date.now());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Listen for connection changes
    const conn = getConnection();
    if (conn?.addEventListener) {
      conn.addEventListener('change', updateBandwidth);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }

      if (conn?.removeEventListener) {
        conn.removeEventListener('change', updateBandwidth);
      }
    };
  }, [getConnection, updateBandwidth, updateOnlineState]);

  return {
    state,
    isOnline: state === 'online' || state === 'poor',
    isPoor: state === 'poor',
    bandwidth,
    timeSinceChange: Date.now() - lastChange,
    refresh,
  };
}

export default useNetworkState;
