/**
 * Next.js Route Adapter
 *
 * Adapts Next.js App Router API routes to run on Cloudflare Workers.
 * This enables "one is all" - Aeon serves both pages AND API routes.
 *
 * @example
 * ```typescript
 * import { createAeonApp } from '@affectively/aeon-pages-runtime';
 *
 * // Automatically load all routes from Next.js app/api directory
 * export default createAeonApp({
 *   // Pages from Aeon
 *   pagesDir: './pages',
 *
 *   // API routes from Next.js (or local)
 *   apiRoutes: await loadNextjsRoutes('../web-app/src/app/api'),
 * });
 * ```
 */
import type { AeonEnv, AeonContext } from './types';
/** Next.js style request with nextUrl */
export interface NextRequest extends Request {
    nextUrl: URL;
    cookies: {
        get(name: string): {
            value: string;
        } | undefined;
        getAll(): Array<{
            name: string;
            value: string;
        }>;
    };
    headers: Headers;
    geo?: {
        city?: string;
        country?: string;
        region?: string;
    };
    ip?: string;
}
/** Next.js style response */
export interface NextResponse extends Response {
    cookies: {
        set(name: string, value: string, options?: {
            path?: string;
            maxAge?: number;
            httpOnly?: boolean;
        }): void;
        delete(name: string): void;
    };
}
/** Next.js route handler signature */
export type NextRouteHandler = (request: NextRequest, context?: {
    params: Record<string, string | string[]>;
}) => Response | Promise<Response>;
/** Next.js route module */
export interface NextRouteModule {
    GET?: NextRouteHandler;
    POST?: NextRouteHandler;
    PUT?: NextRouteHandler;
    PATCH?: NextRouteHandler;
    DELETE?: NextRouteHandler;
    HEAD?: NextRouteHandler;
    OPTIONS?: NextRouteHandler;
}
/**
 * Adapt a standard Request to Next.js style NextRequest
 */
export declare function adaptRequest(request: Request, params: Record<string, string>): NextRequest;
/**
 * Wrap a Next.js route handler to work with Aeon context
 */
export declare function adaptHandler<E extends AeonEnv = AeonEnv>(handler: NextRouteHandler): (ctx: AeonContext<E>) => Promise<Response>;
/**
 * Adapt an entire Next.js route module
 */
export declare function adaptRouteModule<E extends AeonEnv = AeonEnv>(module: NextRouteModule): Record<string, (ctx: AeonContext<E>) => Promise<Response>>;
/**
 * Create a NextResponse.json() compatible response
 */
export declare function json<T>(data: T, init?: ResponseInit): Response;
/**
 * Create a NextResponse.redirect() compatible response
 */
export declare function redirect(url: string | URL, status?: 301 | 302 | 303 | 307 | 308): Response;
/**
 * Create a NextResponse.rewrite() compatible response
 * Note: In Workers, this is just a redirect
 */
export declare function rewrite(url: string | URL): Response;
/**
 * Create a NextResponse.next() compatible response
 * Used in middleware to continue to the next handler
 */
export declare function next(): Response;
export declare const NextResponse: {
    json: typeof json;
    redirect: typeof redirect;
    rewrite: typeof rewrite;
    next: typeof next;
};
