/**
 * React Hook for Aeon Analytics
 *
 * Initializes GTM, syncs ESI context, and starts click tracking.
 * One hook to rule them all.
 */
import type { AnalyticsConfig, MerkleTree } from './types';
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
export declare function useAeonAnalytics(config: AnalyticsConfig): UseAnalyticsReturn;
/**
 * Get current ESI state in a component
 */
export declare function useESIState(): import("./types").ESIState | null;
/**
 * Track when a component mounts/unmounts
 */
export declare function useTrackMount(componentName: string, config?: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>): void;
/**
 * Track visibility of an element using IntersectionObserver
 */
export declare function useTrackVisibility(ref: React.RefObject<HTMLElement>, componentName: string, config?: Pick<AnalyticsConfig, 'dataLayerName' | 'eventPrefix'>): void;
