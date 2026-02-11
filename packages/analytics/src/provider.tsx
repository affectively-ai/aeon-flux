/**
 * Aeon Analytics Provider
 *
 * React context provider for analytics configuration.
 * Wraps useAeonAnalytics in a provider pattern for easier usage.
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { AnalyticsConfig, MerkleTree } from './types';
import { useAeonAnalytics, type UseAnalyticsReturn } from './use-analytics';

// ============================================================================
// Context
// ============================================================================

interface AnalyticsContextValue extends UseAnalyticsReturn {
  config: AnalyticsConfig;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

// ============================================================================
// Provider Props
// ============================================================================

export interface AeonAnalyticsProviderProps extends AnalyticsConfig {
  children: React.ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

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
export function AeonAnalyticsProvider({
  children,
  ...config
}: AeonAnalyticsProviderProps): React.JSX.Element {
  // Initialize analytics
  const analytics = useAeonAnalytics(config);

  // Memoize context value
  const contextValue = useMemo<AnalyticsContextValue>(
    () => ({
      ...analytics,
      config,
    }),
    [
      analytics.isInitialized,
      analytics.isGTMReady,
      config.gtmContainerId,
      config.trackClicks,
      config.trackPageViews,
      config.syncESIContext,
    ],
  );

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ============================================================================
// Hook to use Analytics Context
// ============================================================================

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
export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error(
      'useAnalytics must be used within an AeonAnalyticsProvider. ' +
        'Wrap your app with <AeonAnalyticsProvider gtmContainerId="GTM-XXXXXX">.',
    );
  }

  return context;
}

/**
 * Optional analytics context (returns null if not in provider)
 */
export function useAnalyticsOptional(): AnalyticsContextValue | null {
  return useContext(AnalyticsContext);
}

// ============================================================================
// Higher-Order Component
// ============================================================================

/**
 * HOC to inject analytics props into a component
 */
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P & { analytics: AnalyticsContextValue }>,
): React.FC<P> {
  return function WrappedComponent(props: P) {
    const analytics = useAnalytics();
    return <Component {...props} analytics={analytics} />;
  };
}

// ============================================================================
// Render Props Component
// ============================================================================

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
export function Analytics({ children }: AnalyticsRenderProps): React.ReactNode {
  const analytics = useAnalytics();
  return children(analytics);
}

// ============================================================================
// Merkle Tree Provider
// ============================================================================

interface MerkleTreeProviderProps {
  tree: MerkleTree;
  children: React.ReactNode;
}

/**
 * Provide Merkle tree for current page
 *
 * Use this when you have a Merkle tree from SSR/build time.
 */
export function MerkleTreeProvider({
  tree,
  children,
}: MerkleTreeProviderProps): React.JSX.Element {
  const analytics = useAnalyticsOptional();

  // Set Merkle tree on mount
  React.useEffect(() => {
    if (analytics) {
      analytics.setMerkleTree(tree);
    } else {
      // No provider, set directly on window
      window.__AEON_MERKLE_TREE__ = tree;
    }
  }, [tree, analytics]);

  return <>{children}</>;
}

// ============================================================================
// Track Component
// ============================================================================

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
export function Track({
  event,
  data = {},
  onMount = false,
  onClick = false,
  onVisible = false,
  children,
}: TrackProps): React.ReactElement {
  const analytics = useAnalyticsOptional();
  const ref = React.useRef<HTMLElement>(null);
  const hasTrackedVisibility = React.useRef(false);

  // Track on mount
  React.useEffect(() => {
    if (onMount && analytics) {
      analytics.trackInteraction(event, { ...data, trigger: 'mount' });
    }
  }, [onMount, event]);

  // Track on visibility
  React.useEffect(() => {
    if (!onVisible || !analytics || hasTrackedVisibility.current) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasTrackedVisibility.current) {
            hasTrackedVisibility.current = true;
            analytics.trackInteraction(
              event,
              { ...data, trigger: 'visible' },
              element,
            );
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [onVisible, event, analytics]);

  // Clone child with click handler
  if (onClick && analytics) {
    return React.cloneElement(children, {
      ref,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        analytics.trackInteraction(
          event,
          { ...data, trigger: 'click' },
          e.currentTarget,
        );
        // Call original onClick if exists
        if (children.props.onClick) {
          children.props.onClick(e);
        }
      },
    });
  }

  return React.cloneElement(children, { ref });
}
