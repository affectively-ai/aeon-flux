/**
 * OfflineDiagnostics Component
 *
 * Comprehensive diagnostics panel for offline-first applications.
 * Shows network status, service worker state, cache management, and queue stats.
 *
 * Features:
 * - Network status monitoring
 * - Service worker status display
 * - Cache management UI
 * - Queue statistics display
 * - Conflict resolution UI
 * - Composable panels
 */

'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNetworkState, type NetworkState, type BandwidthProfile } from '../hooks/useNetworkState';
import { useConflicts, type Conflict, type ConflictStats } from '../hooks/useConflicts';

// ============================================================================
// Types
// ============================================================================

export interface ServiceWorkerState {
  isSupported: boolean;
  registration: 'none' | 'installing' | 'waiting' | 'active';
  updateAvailable: boolean;
  controller: boolean;
}

export interface CacheInfo {
  name: string;
  itemCount: number;
  sampleUrls: string[];
}

export interface QueueStats {
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  totalBytes: number;
}

export interface OfflineDiagnosticsProps {
  /** Show network status panel */
  showNetworkStatus?: boolean;
  /** Show service worker panel */
  showServiceWorker?: boolean;
  /** Show cache management panel */
  showCacheManagement?: boolean;
  /** Show queue statistics panel */
  showQueueStats?: boolean;
  /** Show conflict resolution panel */
  showConflicts?: boolean;
  /** Callback when cache is cleared */
  onClearCache?: (cacheName?: string) => Promise<void>;
  /** CSS class for container */
  className?: string;
}

// ============================================================================
// Panel Components
// ============================================================================

/**
 * Network Status Panel
 */
export function NetworkStatusPanel(): ReactNode {
  const { state, isOnline, isPoor, bandwidth, timeSinceChange, refresh } = useNetworkState();

  const stateColor = {
    online: '#10b981',
    offline: '#ef4444',
    poor: '#f59e0b',
    unknown: '#6b7280',
  }[state];

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    return `${Math.floor(ms / 60000)}m`;
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: stateColor, display: 'inline-block' }} />
        Network Status
      </h4>
      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Status:</span>
          <span style={{ color: stateColor, fontWeight: 500 }}>{state.charAt(0).toUpperCase() + state.slice(1)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Connection Type:</span>
          <span>{bandwidth.effectiveType || 'Unknown'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Speed:</span>
          <span>{bandwidth.speedKbps >= 1024 ? `${(bandwidth.speedKbps / 1024).toFixed(1)} Mbps` : `${bandwidth.speedKbps} Kbps`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Latency:</span>
          <span>{bandwidth.latencyMs}ms</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Last Change:</span>
          <span>{formatTime(timeSinceChange)} ago</span>
        </div>
      </div>
      <button
        onClick={refresh}
        style={{
          marginTop: '0.75rem',
          padding: '0.375rem 0.75rem',
          backgroundColor: '#e5e7eb',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.75rem',
        }}
      >
        Refresh
      </button>
    </div>
  );
}

/**
 * Service Worker Panel
 */
export function ServiceWorkerPanel(): ReactNode {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    registration: 'none',
    updateAvailable: false,
    controller: false,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkServiceWorker = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    setSwState((prev) => ({ ...prev, isSupported: true }));

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        setSwState((prev) => ({ ...prev, registration: 'none' }));
        return;
      }

      let regState: ServiceWorkerState['registration'] = 'none';
      if (registration.active) regState = 'active';
      else if (registration.waiting) regState = 'waiting';
      else if (registration.installing) regState = 'installing';

      setSwState({
        isSupported: true,
        registration: regState,
        updateAvailable: !!registration.waiting,
        controller: !!navigator.serviceWorker.controller,
      });
    } catch (error) {
      console.error('Error checking service worker:', error);
    }
  }, []);

  useEffect(() => {
    checkServiceWorker();
  }, [checkServiceWorker]);

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        await checkServiceWorker();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUnregister = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        await checkServiceWorker();
      }
    } catch (error) {
      console.error('Error unregistering service worker:', error);
    }
  };

  const regColor = {
    none: '#6b7280',
    installing: '#f59e0b',
    waiting: '#f59e0b',
    active: '#10b981',
  }[swState.registration];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        Service Worker
      </h4>
      {!swState.isSupported ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Service workers are not supported in this browser.
        </p>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Status:</span>
              <span style={{ color: regColor, fontWeight: 500 }}>
                {swState.registration.charAt(0).toUpperCase() + swState.registration.slice(1)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Controller:</span>
              <span>{swState.controller ? 'Yes' : 'No'}</span>
            </div>
            {swState.updateAvailable && (
              <div style={{ color: '#f59e0b', fontWeight: 500 }}>
                ⚠ Update available
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              onClick={handleCheckUpdate}
              disabled={isChecking}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#e5e7eb',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: isChecking ? 'not-allowed' : 'pointer',
                opacity: isChecking ? 0.5 : 1,
                fontSize: '0.75rem',
              }}
            >
              {isChecking ? 'Checking...' : 'Check for Updates'}
            </button>
            <button
              onClick={handleUnregister}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Unregister
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Cache Management Panel
 */
export function CacheManagementPanel({
  onClearCache,
}: {
  onClearCache?: (cacheName?: string) => Promise<void>;
}): ReactNode {
  const [caches, setCaches] = useState<CacheInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState<string | null>(null);

  const loadCaches = useCallback(async () => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      setIsLoading(false);
      return;
    }

    try {
      const cacheNames = await window.caches.keys();
      const cacheInfos: CacheInfo[] = [];

      for (const name of cacheNames) {
        const cache = await window.caches.open(name);
        const keys = await cache.keys();
        cacheInfos.push({
          name,
          itemCount: keys.length,
          sampleUrls: keys.slice(0, 5).map((k) => k.url),
        });
      }

      setCaches(cacheInfos);
    } catch (error) {
      console.error('Error loading caches:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCaches();
  }, [loadCaches]);

  const handleClearCache = async (cacheName?: string) => {
    setIsClearing(cacheName || 'all');
    try {
      if (onClearCache) {
        await onClearCache(cacheName);
      } else if (cacheName) {
        await window.caches.delete(cacheName);
      } else {
        const names = await window.caches.keys();
        await Promise.all(names.map((name) => window.caches.delete(name)));
      }
      await loadCaches();
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(null);
    }
  };

  if (!('caches' in window)) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Cache Storage
        </h4>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Cache API is not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        Cache Storage
      </h4>
      {isLoading ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</p>
      ) : caches.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No caches found.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {caches.map((cache) => (
              <div
                key={cache.name}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{cache.name}</span>
                  <span style={{ color: '#6b7280' }}>{cache.itemCount} items</span>
                </div>
                <button
                  onClick={() => handleClearCache(cache.name)}
                  disabled={isClearing === cache.name}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#fef2f2',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: isClearing === cache.name ? 'not-allowed' : 'pointer',
                    opacity: isClearing === cache.name ? 0.5 : 1,
                    fontSize: '0.75rem',
                  }}
                >
                  {isClearing === cache.name ? 'Clearing...' : 'Clear'}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleClearCache()}
            disabled={isClearing === 'all'}
            style={{
              marginTop: '0.75rem',
              padding: '0.375rem 0.75rem',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: isClearing === 'all' ? 'not-allowed' : 'pointer',
              opacity: isClearing === 'all' ? 0.5 : 1,
              fontSize: '0.75rem',
            }}
          >
            {isClearing === 'all' ? 'Clearing...' : 'Clear All Caches'}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Queue Stats Panel
 */
export function QueueStatsPanel({
  stats,
}: {
  stats?: QueueStats;
}): ReactNode {
  const defaultStats: QueueStats = stats || {
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    totalBytes: 0,
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        Offline Queue
      </h4>
      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Pending:</span>
          <span style={{ color: defaultStats.pending > 0 ? '#f59e0b' : '#10b981' }}>
            {defaultStats.pending}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Syncing:</span>
          <span>{defaultStats.syncing}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Synced:</span>
          <span style={{ color: '#10b981' }}>{defaultStats.synced}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Failed:</span>
          <span style={{ color: defaultStats.failed > 0 ? '#ef4444' : '#6b7280' }}>
            {defaultStats.failed}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Total Size:</span>
          <span>{formatBytes(defaultStats.totalBytes)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Conflicts Panel
 */
export function ConflictsPanel(): ReactNode {
  const { unresolvedConflicts, stats, resolveConflict } = useConflicts();

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
        Conflicts
      </h4>
      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Total:</span>
          <span>{stats.total}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Unresolved:</span>
          <span style={{ color: stats.unresolved > 0 ? '#f59e0b' : '#10b981' }}>
            {stats.unresolved}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>High Severity:</span>
          <span style={{ color: stats.highSeverity > 0 ? '#ef4444' : '#6b7280' }}>
            {stats.highSeverity}
          </span>
        </div>
      </div>
      {unresolvedConflicts.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Unresolved conflicts:
          </p>
          {unresolvedConflicts.slice(0, 3).map((conflict) => (
            <div
              key={conflict.id}
              style={{
                padding: '0.5rem',
                backgroundColor: '#fef3c7',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{conflict.type}</span>
                <span style={{ color: conflict.severity === 'high' ? '#ef4444' : '#f59e0b' }}>
                  {conflict.severity}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                <button
                  onClick={() => resolveConflict(conflict.id, 'local-wins')}
                  style={{
                    padding: '0.125rem 0.375rem',
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    border: 'none',
                    borderRadius: '0.125rem',
                    cursor: 'pointer',
                    fontSize: '0.625rem',
                  }}
                >
                  Keep Local
                </button>
                <button
                  onClick={() => resolveConflict(conflict.id, 'remote-wins')}
                  style={{
                    padding: '0.125rem 0.375rem',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    border: 'none',
                    borderRadius: '0.125rem',
                    cursor: 'pointer',
                    fontSize: '0.625rem',
                  }}
                >
                  Use Remote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Comprehensive offline diagnostics panel
 */
export function OfflineDiagnostics({
  showNetworkStatus = true,
  showServiceWorker = true,
  showCacheManagement = true,
  showQueueStats = true,
  showConflicts = true,
  onClearCache,
  className,
}: OfflineDiagnosticsProps): ReactNode {
  return (
    <div className={className} role="region" aria-label="Offline diagnostics">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
        Offline Diagnostics
      </h3>

      {showNetworkStatus && <NetworkStatusPanel />}
      {showServiceWorker && <ServiceWorkerPanel />}
      {showCacheManagement && <CacheManagementPanel onClearCache={onClearCache} />}
      {showQueueStats && <QueueStatsPanel />}
      {showConflicts && <ConflictsPanel />}
    </div>
  );
}

export default OfflineDiagnostics;
