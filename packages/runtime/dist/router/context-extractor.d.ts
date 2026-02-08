/**
 * User Context Extractor
 *
 * Middleware that extracts UserContext from HTTP requests.
 * Gathers signals from headers, cookies, and request properties.
 */
import type { ConnectionType, EmotionState, UserContext, UserTier } from './types';
/**
 * Admin capability verifier function type
 * This should be provided by the auth system (e.g., UCAN token verification)
 */
export type AdminVerifier = (token: string) => Promise<boolean>;
export interface ContextExtractorOptions {
    /** Custom emotion detector (e.g., call edge-workers) */
    detectEmotion?: (request: Request) => Promise<EmotionState | undefined>;
    /** Custom user tier resolver (e.g., from database) */
    resolveUserTier?: (userId: string) => Promise<UserTier>;
    /**
     * Verify admin capability from auth token (REQUIRED for admin access)
     * This should verify the UCAN token has the 'admin' capability
     * If not provided, isAdmin will always be false
     */
    verifyAdminCapability?: AdminVerifier;
    /** Additional context enrichment */
    enrich?: (context: UserContext, request: Request) => Promise<UserContext>;
}
/**
 * Extract UserContext from an HTTP request
 */
export declare function extractUserContext(request: Request, options?: ContextExtractorOptions): Promise<UserContext>;
/**
 * Create middleware for user context extraction
 */
export declare function createContextMiddleware(options?: ContextExtractorOptions): (request: Request) => Promise<UserContext>;
/**
 * Set context tracking cookies in response
 */
export declare function setContextCookies(response: Response, context: UserContext, currentPath: string): Response;
/**
 * Add speculation hints to response headers
 */
export declare function addSpeculationHeaders(response: Response, prefetch: string[], prerender: string[]): Response;
/**
 * ESI State for global injection in <head>
 * This is consumed by ESI components before React hydration
 */
export interface ESIState {
    /** User subscription tier for feature gating */
    userTier: UserTier;
    /** Admin flag - bypasses ALL tier restrictions */
    isAdmin?: boolean;
    /** Current emotional state for personalization */
    emotionState?: {
        primary: string;
        valence: number;
        arousal: number;
        confidence?: number;
    };
    /** User preferences for UI adaptation */
    preferences: {
        theme?: 'light' | 'dark' | 'auto';
        reducedMotion: boolean;
        language?: string;
    };
    /** Session information */
    sessionId?: string;
    /** Local time context */
    localHour: number;
    timezone: string;
    /** Feature flags based on tier */
    features: {
        aiInference: boolean;
        emotionTracking: boolean;
        collaboration: boolean;
        advancedInsights: boolean;
        customThemes: boolean;
        voiceSynthesis: boolean;
        imageAnalysis: boolean;
    };
    /** User ID (if authenticated) */
    userId?: string;
    /** Is this a new session? */
    isNewSession: boolean;
    /** Recent pages for personalization */
    recentPages: string[];
    /** Viewport information */
    viewport: {
        width: number;
        height: number;
    };
    /** Connection quality */
    connection: ConnectionType;
}
/**
 * Serialize UserContext to ESIState for global injection
 */
export declare function serializeToESIState(context: UserContext): ESIState;
/**
 * Generate inline script for ESI state injection in <head>
 * This must execute before any ESI components render
 */
export declare function generateESIStateScript(esiState: ESIState): string;
/**
 * Generate ESI state script from UserContext
 */
export declare function generateESIStateScriptFromContext(context: UserContext): string;
/**
 * Create an admin verifier from a UCAN auth instance
 *
 * @example
 * ```ts
 * import { auth } from './auth';
 * import { createAdminVerifier, extractUserContext } from '@affectively/aeon-pages-runtime';
 *
 * const verifyAdmin = createAdminVerifier(auth);
 *
 * const context = await extractUserContext(request, {
 *   verifyAdminCapability: verifyAdmin,
 * });
 * ```
 */
export declare function createAdminVerifier<T>(auth: {
    verifyCapability: (opts: {
        capability: T;
        resource: string;
        token: string;
    }) => Promise<boolean>;
}, adminCapability?: T, adminResource?: string): AdminVerifier;
