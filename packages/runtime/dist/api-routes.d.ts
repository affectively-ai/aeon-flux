/**
 * Aeon Pages API Routes
 *
 * Server-side route handling for API endpoints.
 * Enables full-stack functionality without a separate backend.
 */
import type { AeonEnv, AeonContext, ApiRoute, ApiRouteMatch, ApiRouteModule, ApiRouteHandler, ExecutionContext } from './types';
/**
 * API Router - matches requests to registered API routes
 */
export declare class ApiRouter<E extends AeonEnv = AeonEnv> {
    private routes;
    /**
     * Register an API route
     */
    register(pattern: string, module: ApiRouteModule<E>): void;
    /**
     * Register multiple routes from a route map
     */
    registerAll(routes: Record<string, ApiRouteModule<E>>): void;
    /**
     * Match a request to a route
     */
    match(request: Request): ApiRouteMatch | null;
    /**
     * Handle an API request
     */
    handle(request: Request, env: E, ctx: ExecutionContext): Promise<Response | null>;
    /**
     * Parse a route pattern into segments
     */
    private parsePattern;
    /**
     * Match path segments against route segments
     */
    private matchSegments;
    /**
     * Get the handler for a given HTTP method
     */
    private getHandler;
    /**
     * Get all registered routes (for debugging/introspection)
     */
    getRoutes(): ApiRoute[];
}
/**
 * Create a new API router instance
 */
export declare function createApiRouter<E extends AeonEnv = AeonEnv>(): ApiRouter<E>;
/**
 * Helper to create a JSON response
 */
export declare function json<T>(data: T, init?: ResponseInit): Response;
/**
 * Helper to create a redirect response
 */
export declare function redirect(url: string, status?: 301 | 302 | 303 | 307 | 308): Response;
/**
 * Helper to create an error response
 */
export declare function error(message: string, status?: number): Response;
/**
 * Helper to create a not found response
 */
export declare function notFound(message?: string): Response;
/**
 * Helper to create a bad request response
 */
export declare function badRequest(message?: string): Response;
/**
 * Helper to create an unauthorized response
 */
export declare function unauthorized(message?: string): Response;
/**
 * Helper to create a forbidden response
 */
export declare function forbidden(message?: string): Response;
/** Middleware function type */
export type Middleware<E extends AeonEnv = AeonEnv> = (context: AeonContext<E>, next: () => Promise<Response>) => Response | Promise<Response>;
/**
 * Compose multiple middleware into a single handler
 */
export declare function composeMiddleware<E extends AeonEnv = AeonEnv>(...middlewares: Middleware<E>[]): (handler: ApiRouteHandler<E>) => ApiRouteHandler<E>;
/**
 * CORS middleware factory
 */
export declare function cors(options?: {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
}): Middleware;
/**
 * Auth middleware factory - validates Authorization header
 */
export declare function requireAuth<E extends AeonEnv = AeonEnv>(validate: (token: string, context: AeonContext<E>) => boolean | Promise<boolean>): Middleware<E>;
/**
 * Rate limiting middleware (uses KV for distributed rate limiting)
 */
export declare function rateLimit<E extends AeonEnv = AeonEnv>(options: {
    /** KV namespace key in env */
    kvKey?: keyof E;
    /** Requests per window */
    limit: number;
    /** Window size in seconds */
    window: number;
    /** Function to extract client identifier (default: IP) */
    keyGenerator?: (context: AeonContext<E>) => string;
}): Middleware<E>;
