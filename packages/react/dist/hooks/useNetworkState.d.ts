/**
 * useNetworkState Hook
 *
 * React hook for monitoring network state and bandwidth.
 * Provides real-time updates on connection quality and effective type.
 */
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
/**
 * Hook to monitor network state and bandwidth
 */
export declare function useNetworkState(): NetworkStateResult;
export default useNetworkState;
