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
import { type ReactNode } from 'react';
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
/**
 * Network Status Panel
 */
export declare function NetworkStatusPanel(): ReactNode;
/**
 * Service Worker Panel
 */
export declare function ServiceWorkerPanel(): ReactNode;
/**
 * Cache Management Panel
 */
export declare function CacheManagementPanel({ onClearCache, }: {
    onClearCache?: (cacheName?: string) => Promise<void>;
}): ReactNode;
/**
 * Queue Stats Panel
 */
export declare function QueueStatsPanel({ stats, }: {
    stats?: QueueStats;
}): ReactNode;
/**
 * Conflicts Panel
 */
export declare function ConflictsPanel(): ReactNode;
/**
 * Comprehensive offline diagnostics panel
 */
export declare function OfflineDiagnostics({ showNetworkStatus, showServiceWorker, showCacheManagement, showQueueStats, showConflicts, onClearCache, className, }: OfflineDiagnosticsProps): ReactNode;
export default OfflineDiagnostics;
