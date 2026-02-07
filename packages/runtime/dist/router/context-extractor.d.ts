/**
 * User Context Extractor
 *
 * Middleware that extracts UserContext from HTTP requests.
 * Gathers signals from headers, cookies, and request properties.
 */
import type { EmotionState, UserContext, UserTier } from './types';
export interface ContextExtractorOptions {
    /** Custom emotion detector (e.g., call edge-workers) */
    detectEmotion?: (request: Request) => Promise<EmotionState | undefined>;
    /** Custom user tier resolver (e.g., from database) */
    resolveUserTier?: (userId: string) => Promise<UserTier>;
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
