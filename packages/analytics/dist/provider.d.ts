/**
 * Aeon Analytics Provider
 *
 * React context provider for analytics configuration.
 * Wraps useAeonAnalytics in a provider pattern for easier usage.
 */
import React from 'react';
import type { AnalyticsConfig, MerkleTree } from './types';
import { type UseAnalyticsReturn } from './use-analytics';
interface AnalyticsContextValue extends UseAnalyticsReturn {
    config: AnalyticsConfig;
}
export interface AeonAnalyticsProviderProps extends AnalyticsConfig {
    children: React.ReactNode;
}
/**
 * Aeon Analytics Provider
 *
 * Wrap your app with this provider to enable automatic click tracking.
 *
 * @example
 * ```tsx
 * import { AeonAnalyticsProvider } from '@affectively/aeon-pages-analytics/react';
 *
 * export default function App({ Component, pageProps }) {
 *   return (
 *     <AeonAnalyticsProvider
 *       gtmContainerId="GTM-XXXXXX"
 *       trackClicks={true}
 *       syncESIContext={true}
 *     >
 *       <Component {...pageProps} />
 *     </AeonAnalyticsProvider>
 *   );
 * }
 * ```
 */
export declare function AeonAnalyticsProvider({ children, ...config }: AeonAnalyticsProviderProps): React.JSX.Element;
/**
 * Use analytics context in a component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackClick, trackInteraction } = useAnalytics();
 *
 *   return (
 *     <button onClick={(e) => trackInteraction('custom_action', { value: 123 })}>
 *       Track Me
 *     </button>
 *   );
 * }
 * ```
 */
export declare function useAnalytics(): AnalyticsContextValue;
/**
 * Optional analytics context (returns null if not in provider)
 */
export declare function useAnalyticsOptional(): AnalyticsContextValue | null;
/**
 * HOC to inject analytics props into a component
 */
export declare function withAnalytics<P extends object>(Component: React.ComponentType<P & {
    analytics: AnalyticsContextValue;
}>): React.FC<P>;
interface AnalyticsRenderProps {
    children: (analytics: AnalyticsContextValue) => React.ReactNode;
}
/**
 * Render props component for analytics
 *
 * @example
 * ```tsx
 * <Analytics>
 *   {({ trackInteraction }) => (
 *     <button onClick={() => trackInteraction('click', {})}>
 *       Click me
 *     </button>
 *   )}
 * </Analytics>
 * ```
 */
export declare function Analytics({ children }: AnalyticsRenderProps): React.ReactNode;
interface MerkleTreeProviderProps {
    tree: MerkleTree;
    children: React.ReactNode;
}
/**
 * Provide Merkle tree for current page
 *
 * Use this when you have a Merkle tree from SSR/build time.
 */
export declare function MerkleTreeProvider({ tree, children, }: MerkleTreeProviderProps): React.JSX.Element;
interface TrackProps {
    /** Tracking event name */
    event: string;
    /** Additional data to track */
    data?: Record<string, unknown>;
    /** Track on mount */
    onMount?: boolean;
    /** Track on click */
    onClick?: boolean;
    /** Track on visibility */
    onVisible?: boolean;
    /** Children to render */
    children: React.ReactElement;
}
/**
 * Wrapper component that automatically tracks events
 *
 * @example
 * ```tsx
 * <Track event="cta_view" onVisible data={{ variant: 'A' }}>
 *   <button>Sign Up</button>
 * </Track>
 * ```
 */
export declare function Track({ event, data, onMount, onClick, onVisible, children, }: TrackProps): React.ReactElement;
export {};
