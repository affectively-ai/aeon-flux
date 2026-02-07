/**
 * Aeon Link Component
 *
 * Drop-in replacement for <a> with superpowers:
 * - Visibility-based prefetch
 * - Hover prefetch
 * - Intent detection (cursor trajectory)
 * - View transitions
 * - Presence awareness
 * - Total preload support
 */

import React, {
  forwardRef,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
  type MouseEvent,
  type AnchorHTMLAttributes,
} from 'react';
import { useAeonNavigation, useRoutePresence } from './hooks/useAeonNavigation';

export type TransitionType = 'slide' | 'fade' | 'morph' | 'none';
export type PrefetchStrategy = 'hover' | 'visible' | 'intent' | 'none';

export interface PresenceRenderProps {
  count: number;
  editing: number;
  hot: boolean;
  users?: { userId: string; name?: string }[];
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  href: string;
  prefetch?: PrefetchStrategy;
  transition?: TransitionType;
  showPresence?: boolean;
  preloadData?: boolean;
  replace?: boolean;
  children?: ReactNode | ((props: { presence: PresenceRenderProps | null }) => ReactNode);
  onNavigateStart?: () => void;
  onNavigateEnd?: () => void;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      prefetch = 'visible',
      transition = 'fade',
      showPresence = false,
      preloadData = true,
      replace = false,
      children,
      onNavigateStart,
      onNavigateEnd,
      onClick,
      onMouseEnter,
      onMouseMove,
      className,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLAnchorElement>(null);
    const linkRef = (ref as React.RefObject<HTMLAnchorElement>) ?? internalRef;
    const trajectoryRef = useRef<{ x: number; y: number; time: number }[]>([]);
    const intentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
      navigate,
      prefetch: doPrefetch,
      isPreloaded,
      isNavigating,
    } = useAeonNavigation();
    const { getPresence, subscribePresence } = useRoutePresence();

    const [presence, setPresence] = useState<PresenceRenderProps | null>(null);
    const [isPrefetched, setIsPrefetched] = useState(false);

    // Check initial prefetch state
    useEffect(() => {
      setIsPrefetched(isPreloaded(href));
    }, [href, isPreloaded]);

    // Visibility-based prefetch
    useEffect(() => {
      if (prefetch !== 'visible' || typeof IntersectionObserver === 'undefined') {
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            doPrefetch(href, { data: preloadData, presence: showPresence });
            setIsPrefetched(true);
          }
        },
        { rootMargin: '100px' }
      );

      const element = linkRef.current;
      if (element) observer.observe(element);

      return () => observer.disconnect();
    }, [href, prefetch, preloadData, showPresence, doPrefetch, linkRef]);

    // Presence subscription
    useEffect(() => {
      if (!showPresence) return;

      // Get initial presence
      const initialPresence = getPresence(href);
      if (initialPresence) {
        const { count, editing, hot, users } = initialPresence;
        setPresence({ count, editing, hot, users });
      }

      // Subscribe to updates
      const unsubscribe = subscribePresence((route, info) => {
        if (route === href) {
          const { count, editing, hot, users } = info;
          setPresence({ count, editing, hot, users });
        }
      });

      return unsubscribe;
    }, [href, showPresence, getPresence, subscribePresence]);

    // Hover prefetch handler
    const handleMouseEnter = useCallback(
      (e: MouseEvent<HTMLAnchorElement>) => {
        onMouseEnter?.(e);

        if (prefetch === 'hover' || prefetch === 'intent') {
          doPrefetch(href, { data: preloadData, presence: showPresence });
          setIsPrefetched(true);
        }
      },
      [href, prefetch, preloadData, showPresence, doPrefetch, onMouseEnter]
    );

    // Intent detection (cursor trajectory prediction)
    const handleMouseMove = useCallback(
      (e: MouseEvent<HTMLAnchorElement>) => {
        onMouseMove?.(e);

        if (prefetch !== 'intent') return;

        // Track cursor trajectory
        const now = Date.now();
        trajectoryRef.current.push({ x: e.clientX, y: e.clientY, time: now });

        // Keep only last 5 points
        if (trajectoryRef.current.length > 5) {
          trajectoryRef.current.shift();
        }

        // Clear previous timeout
        if (intentTimeoutRef.current) {
          clearTimeout(intentTimeoutRef.current);
        }

        // Predict intent after short delay
        intentTimeoutRef.current = setTimeout(() => {
          const points = trajectoryRef.current;
          if (points.length < 2) return;

          const element = linkRef.current;
          if (!element) return;

          // Calculate if cursor is approaching the link
          const rect = element.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const lastPoint = points[points.length - 1];
          const prevPoint = points[points.length - 2];

          const velocityX = lastPoint.x - prevPoint.x;
          const velocityY = lastPoint.y - prevPoint.y;

          // Project cursor position
          const projectedX = lastPoint.x + velocityX * 10;
          const projectedY = lastPoint.y + velocityY * 10;

          // Check if projected position is closer to link
          const currentDist = Math.hypot(lastPoint.x - centerX, lastPoint.y - centerY);
          const projectedDist = Math.hypot(projectedX - centerX, projectedY - centerY);

          if (projectedDist < currentDist) {
            // Cursor is approaching - prefetch with high priority
            doPrefetch(href, {
              data: preloadData,
              presence: showPresence,
              priority: 'high',
            });
            setIsPrefetched(true);
          }
        }, 50);
      },
      [href, prefetch, preloadData, showPresence, doPrefetch, onMouseMove, linkRef]
    );

    // Click navigation with view transition
    const handleClick = useCallback(
      async (e: MouseEvent<HTMLAnchorElement>) => {
        // Call original onClick if provided
        onClick?.(e);

        // Don't handle if default prevented or modified
        if (
          e.defaultPrevented ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return;
        }

        e.preventDefault();

        onNavigateStart?.();

        try {
          await navigate(href, { transition, replace });
        } finally {
          onNavigateEnd?.();
        }
      },
      [href, transition, replace, navigate, onClick, onNavigateStart, onNavigateEnd]
    );

    // Cleanup
    useEffect(() => {
      return () => {
        if (intentTimeoutRef.current) {
          clearTimeout(intentTimeoutRef.current);
        }
      };
    }, []);

    // Render children
    const renderChildren = () => {
      if (typeof children === 'function') {
        return children({ presence });
      }
      return (
        <>
          {children}
          {showPresence && presence && presence.count > 0 && (
            <span className="aeon-presence-badge" aria-label={`${presence.count} active`}>
              {presence.hot ? '\uD83D\uDD25' : '\uD83D\uDC65'} {presence.count}
              {presence.editing > 0 && ` (${presence.editing} editing)`}
            </span>
          )}
        </>
      );
    };

    return (
      <a
        ref={linkRef}
        href={href}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        className={className}
        data-preloaded={isPrefetched ? '' : undefined}
        data-navigating={isNavigating ? '' : undefined}
        data-transition={transition}
        aria-busy={isNavigating}
        {...props}
      >
        {renderChildren()}
      </a>
    );
  }
);

Link.displayName = 'Link';

// CSS for presence badge (can be overridden)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .aeon-presence-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      padding: 0.125rem 0.375rem;
      margin-left: 0.5rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 9999px;
    }

    [data-preloaded]::after {
      content: '';
      display: inline-block;
      width: 4px;
      height: 4px;
      margin-left: 0.25rem;
      background: #10b981;
      border-radius: 50%;
      opacity: 0.5;
    }

    /* View transition styles */
    ::view-transition-old(aeon-page) {
      animation: aeon-fade-out 200ms ease-out;
    }

    ::view-transition-new(aeon-page) {
      animation: aeon-fade-in 300ms ease-out;
    }

    @keyframes aeon-fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes aeon-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Slide transition */
    [data-transition="slide"]::view-transition-old(aeon-page) {
      animation: aeon-slide-out 200ms ease-out;
    }

    [data-transition="slide"]::view-transition-new(aeon-page) {
      animation: aeon-slide-in 300ms ease-out;
    }

    @keyframes aeon-slide-out {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(-20px); opacity: 0; }
    }

    @keyframes aeon-slide-in {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;

  // Only inject once
  if (!document.getElementById('aeon-link-styles')) {
    style.id = 'aeon-link-styles';
    document.head.appendChild(style);
  }
}
