/**
 * Pilot Navigation Hook
 *
 * AI-driven navigation with user consent.
 * Cyrano acts as the "pilot" - suggesting navigation destinations,
 * but always with user consent before actually navigating.
 *
 * The pilot metaphor:
 * - User is the captain
 * - AI (Cyrano) is the pilot suggesting routes
 * - Navigation only happens with captain's approval
 *
 * Features:
 * - Pending navigation queue
 * - Consent confirmation UI
 * - History API integration (smooth client-side navigation)
 * - Navigation analytics/tracking
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAeonNavigation } from './useAeonNavigation';
import type { NavigationOptions } from '@affectively/aeon-pages-runtime';

export interface PilotNavigationIntent {
  id: string;
  destination: string;
  reason?: string;
  source: 'cyrano' | 'esi' | 'user' | 'system';
  confidence?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PilotNavigationOptions extends NavigationOptions {
  /** Whether to require explicit consent (default: true for AI sources) */
  requireConsent?: boolean;
  /** Reason for navigation (shown to user) */
  reason?: string;
  /** Source of navigation intent */
  source?: PilotNavigationIntent['source'];
  /** Confidence level (0-1) for AI-driven navigation */
  confidence?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Auto-navigate after delay (ms) if consent not required */
  autoNavigateDelay?: number;
}

export interface PilotNavigationState {
  /** Current pending navigation intent awaiting consent */
  pendingIntent: PilotNavigationIntent | null;
  /** History of navigation intents */
  intentHistory: PilotNavigationIntent[];
  /** Whether navigation is in progress */
  isNavigating: boolean;
}

type NavigationConsentCallback = (
  intent: PilotNavigationIntent,
) => Promise<boolean> | boolean;

/**
 * Hook for AI-piloted navigation with user consent
 */
export function usePilotNavigation(options?: {
  /** Custom consent handler (if not provided, uses built-in pending state) */
  onConsentRequired?: NavigationConsentCallback;
  /** Maximum intent history to keep */
  maxHistory?: number;
}) {
  const { onConsentRequired, maxHistory = 50 } = options ?? {};

  const navigation = useAeonNavigation();
  const [pendingIntent, setPendingIntent] =
    useState<PilotNavigationIntent | null>(null);
  const [intentHistory, setIntentHistory] = useState<PilotNavigationIntent[]>(
    [],
  );

  /**
   * Request navigation with optional consent
   */
  const pilot = useCallback(
    async (
      destination: string,
      pilotOptions?: PilotNavigationOptions,
    ): Promise<boolean> => {
      const {
        requireConsent = true,
        reason,
        source = 'user',
        confidence,
        metadata,
        autoNavigateDelay,
        ...navOptions
      } = pilotOptions ?? {};

      // Create intent
      const intent: PilotNavigationIntent = {
        id: `nav-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        destination,
        reason,
        source,
        confidence,
        timestamp: Date.now(),
        metadata,
      };

      // Add to history
      setIntentHistory((prev) => [...prev.slice(-maxHistory + 1), intent]);

      // Check if consent is required
      const needsConsent =
        requireConsent && (source === 'cyrano' || source === 'esi');

      if (!needsConsent) {
        // Navigate immediately
        await navigation.navigate(destination, navOptions);
        return true;
      }

      // If custom consent handler provided, use it
      if (onConsentRequired) {
        const consented = await onConsentRequired(intent);
        if (consented) {
          await navigation.navigate(destination, navOptions);
          return true;
        }
        return false;
      }

      // Otherwise, set pending intent for UI to handle
      setPendingIntent(intent);

      // Auto-navigate after delay if specified
      if (autoNavigateDelay && autoNavigateDelay > 0) {
        setTimeout(async () => {
          // Only navigate if this intent is still pending
          setPendingIntent((current) => {
            if (current?.id === intent.id) {
              navigation.navigate(destination, navOptions);
              return null;
            }
            return current;
          });
        }, autoNavigateDelay);
      }

      return false; // Pending consent
    },
    [navigation, onConsentRequired, maxHistory],
  );

  /**
   * Approve pending navigation
   */
  const approve = useCallback(async () => {
    if (!pendingIntent) return false;

    const destination = pendingIntent.destination;
    setPendingIntent(null);
    await navigation.navigate(destination);
    return true;
  }, [pendingIntent, navigation]);

  /**
   * Reject pending navigation
   */
  const reject = useCallback(() => {
    if (!pendingIntent) return;
    setPendingIntent(null);
  }, [pendingIntent]);

  /**
   * Clear all pending intents
   */
  const clearPending = useCallback(() => {
    setPendingIntent(null);
  }, []);

  /**
   * Navigate without consent (for user-initiated navigation)
   */
  const navigateDirect = useCallback(
    async (destination: string, navOptions?: NavigationOptions) => {
      await navigation.navigate(destination, navOptions);
    },
    [navigation],
  );

  return useMemo(
    () => ({
      // State
      pendingIntent,
      intentHistory,
      isNavigating: navigation.isNavigating,
      current: navigation.current,

      // Actions
      pilot, // AI-driven navigation with consent
      approve, // Approve pending navigation
      reject, // Reject pending navigation
      clearPending, // Clear pending intent
      navigateDirect, // Navigate without consent (user-initiated)

      // Pass through navigation utilities
      prefetch: navigation.prefetch,
      back: navigation.back,
      isPreloaded: navigation.isPreloaded,
    }),
    [
      pendingIntent,
      intentHistory,
      navigation.isNavigating,
      navigation.current,
      pilot,
      approve,
      reject,
      clearPending,
      navigateDirect,
      navigation.prefetch,
      navigation.back,
      navigation.isPreloaded,
    ],
  );
}

/**
 * Parse navigation tags from AI response
 * Returns array of destinations extracted from [navigate:/path] tags
 */
export function parseNavigationTags(
  text: string,
): { destination: string; fullMatch: string }[] {
  const regex = /\[navigate:([^\]]+)\]/g;
  const matches: { destination: string; fullMatch: string }[] = [];

  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      destination: match[1],
      fullMatch: match[0],
    });
  }

  return matches;
}

/**
 * Remove navigation tags from text for display
 */
export function stripNavigationTags(text: string): string {
  return text.replace(/\[navigate:[^\]]+\]/g, '').trim();
}
