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

import type {
  AeonEnv,
  AeonContext,
  ExecutionContext,
} from './types';

// =============================================================================
// TYPES
// =============================================================================

/** Next.js style request with nextUrl */
export interface NextRequest extends Request {
  nextUrl: URL;
  cookies: {
    get(name: string): { value: string } | undefined;
    getAll(): Array<{ name: string; value: string }>;
  };
  headers: Headers;
  geo?: { city?: string; country?: string; region?: string };
  ip?: string;
}

/** Next.js style response */
export interface NextResponse extends Response {
  cookies: {
    set(name: string, value: string, options?: { path?: string; maxAge?: number; httpOnly?: boolean }): void;
    delete(name: string): void;
  };
}

/** Next.js route handler signature */
export type NextRouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string | string[]> }
) => Response | Promise<Response>;

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

// =============================================================================
// REQUEST ADAPTER
// =============================================================================

/**
 * Adapt a standard Request to Next.js style NextRequest
 */
export function adaptRequest(request: Request, params: Record<string, string>): NextRequest {
  const url = new URL(request.url);

  // Create cookies accessor
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);

  const nextRequest = request as NextRequest;

  // Add nextUrl
  Object.defineProperty(nextRequest, 'nextUrl', {
    value: url,
    writable: false,
  });

  // Add cookies accessor
  Object.defineProperty(nextRequest, 'cookies', {
    value: {
      get(name: string) {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
      getAll() {
        return Object.entries(cookies).map(([name, value]) => ({ name, value }));
      },
    },
    writable: false,
  });

  // Add Cloudflare-specific properties
  const cfProps = (request as unknown as { cf?: Record<string, unknown> }).cf;
  if (cfProps) {
    Object.defineProperty(nextRequest, 'geo', {
      value: {
        city: cfProps.city as string,
        country: cfProps.country as string,
        region: cfProps.region as string,
      },
      writable: false,
    });
    Object.defineProperty(nextRequest, 'ip', {
      value: request.headers.get('CF-Connecting-IP') || undefined,
      writable: false,
    });
  }

  return nextRequest;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = valueParts.join('=');
    }
  });

  return cookies;
}

// =============================================================================
// ROUTE HANDLER ADAPTER
// =============================================================================

/**
 * Wrap a Next.js route handler to work with Aeon context
 */
export function adaptHandler<E extends AeonEnv = AeonEnv>(
  handler: NextRouteHandler
): (ctx: AeonContext<E>) => Promise<Response> {
  return async (ctx: AeonContext<E>): Promise<Response> => {
    const nextRequest = adaptRequest(ctx.request, ctx.params);

    // Convert params to Next.js format (string | string[])
    const nextParams: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(ctx.params)) {
      // Handle catch-all routes
      if (value.includes('/')) {
        nextParams[key] = value.split('/');
      } else {
        nextParams[key] = value;
      }
    }

    try {
      const response = await handler(nextRequest, { params: nextParams });
      return response;
    } catch (error) {
      console.error('Next.js route handler error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Adapt an entire Next.js route module
 */
export function adaptRouteModule<E extends AeonEnv = AeonEnv>(
  module: NextRouteModule
): Record<string, (ctx: AeonContext<E>) => Promise<Response>> {
  const adapted: Record<string, (ctx: AeonContext<E>) => Promise<Response>> = {};

  const methods: (keyof NextRouteModule)[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  for (const method of methods) {
    const handler = module[method];
    if (handler) {
      adapted[method] = adaptHandler(handler);
    }
  }

  return adapted;
}

// =============================================================================
// NEXT.JS RESPONSE HELPERS
// =============================================================================

/**
 * Create a NextResponse.json() compatible response
 */
export function json<T>(data: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

/**
 * Create a NextResponse.redirect() compatible response
 */
export function redirect(url: string | URL, status: 301 | 302 | 303 | 307 | 308 = 307): Response {
  return new Response(null, {
    status,
    headers: { Location: url.toString() },
  });
}

/**
 * Create a NextResponse.rewrite() compatible response
 * Note: In Workers, this is just a redirect
 */
export function rewrite(url: string | URL): Response {
  return new Response(null, {
    status: 307,
    headers: { Location: url.toString() },
  });
}

/**
 * Create a NextResponse.next() compatible response
 * Used in middleware to continue to the next handler
 */
export function next(): Response {
  return new Response(null, {
    status: 200,
    headers: { 'x-middleware-next': '1' },
  });
}

// Export as NextResponse-like object
export const NextResponse = {
  json,
  redirect,
  rewrite,
  next,
};
