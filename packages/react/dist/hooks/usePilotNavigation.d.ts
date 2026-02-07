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
import { type NavigationOptions } from './useAeonNavigation';
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
type NavigationConsentCallback = (intent: PilotNavigationIntent) => Promise<boolean> | boolean;
/**
 * Hook for AI-piloted navigation with user consent
 */
export declare function usePilotNavigation(options?: {
    /** Custom consent handler (if not provided, uses built-in pending state) */
    onConsentRequired?: NavigationConsentCallback;
    /** Maximum intent history to keep */
    maxHistory?: number;
}): {
    pendingIntent: PilotNavigationIntent | null;
    intentHistory: PilotNavigationIntent[];
    isNavigating: boolean;
    current: string;
    pilot: (destination: string, pilotOptions?: PilotNavigationOptions) => Promise<boolean>;
    approve: () => Promise<boolean>;
    reject: () => void;
    clearPending: () => void;
    navigateDirect: (destination: string, navOptions?: NavigationOptions) => Promise<void>;
    prefetch: (href: string, options?: import("@affectively/aeon-pages-runtime").PrefetchOptions) => Promise<void>;
    back: () => Promise<void>;
    isPreloaded: (href: string) => boolean;
};
/**
 * Parse navigation tags from AI response
 * Returns array of destinations extracted from [navigate:/path] tags
 */
export declare function parseNavigationTags(text: string): {
    destination: string;
    fullMatch: string;
}[];
/**
 * Remove navigation tags from text for display
 */
export declare function stripNavigationTags(text: string): string;
export {};
