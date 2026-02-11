/**
 * Aeon Pages Cloudflare Worker
 *
 * Entry point for Cloudflare Workers deployment.
 * Handles routing to Durable Objects, API routes, and static assets.
 */

// Export Durable Object classes
export { AeonPageSession, AeonRoutesRegistry } from './durable-object';

// Import API router
import { ApiRouter, createApiRouter } from './api-routes';
import type {
  AeonEnv,
  ApiRouteModule,
  ExecutionContext,
  DurableObjectNamespace,
} from './types';

// =============================================================================
// WORKER FACTORY
// =============================================================================

/** Options for creating an Aeon worker */
export interface AeonWorkerOptions<E extends AeonEnv = AeonEnv> {
  /** API routes to register */
  apiRoutes?: Record<string, ApiRouteModule<E>>;

  /** CORS configuration */
  cors?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  };

  /** Custom fetch handler to run before Aeon routing */
  onRequest?: (
    request: Request,
    env: E,
    ctx: ExecutionContext,
  ) => Promise<Response | null>;

  /** Custom 404 handler */
  notFound?: (request: Request, env: E) => Response | Promise<Response>;
}

/**
 * Create an Aeon worker with API route support
 *
 * @example
 * ```typescript
 * import { createAeonWorker } from '@affectively/aeon-pages-runtime/worker';
 *
 * export default createAeonWorker({
 *   apiRoutes: {
 *     '/api/chat': {
 *       POST: async ({ request, env }) => {
 *         const body = await request.json();
 *         const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', { ... });
 *         return Response.json({ result });
 *       },
 *     },
 *     '/api/users/[id]': {
 *       GET: async ({ params, env }) => {
 *         const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
 *           .bind(params.id)
 *           .first();
 *         return Response.json(user);
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function createAeonWorker<E extends AeonEnv = AeonEnv>(
  options: AeonWorkerOptions<E> = {},
): ExportedHandler<E> {
  // Create API router and register routes
  const apiRouter = createApiRouter<E>();
  if (options.apiRoutes) {
    apiRouter.registerAll(options.apiRoutes);
  }

  // Build CORS headers
  const corsConfig = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
    credentials: false,
    ...options.cors,
  };

  const getCorsHeaders = (
    requestOrigin?: string | null,
  ): Record<string, string> => {
    let allowedOrigin = '*';
    if (typeof corsConfig.origin === 'string') {
      allowedOrigin = corsConfig.origin;
    } else if (Array.isArray(corsConfig.origin) && requestOrigin) {
      if (corsConfig.origin.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    }

    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': corsConfig.methods.join(', '),
      'Access-Control-Allow-Headers': corsConfig.headers.join(', '),
    };

    if (corsConfig.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
  };

  return {
    async fetch(
      request: Request,
      env: E,
      ctx: ExecutionContext,
    ): Promise<Response> {
      const url = new URL(request.url);
      const corsHeaders = getCorsHeaders(request.headers.get('Origin'));

      // Handle preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders,
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      try {
        // Custom onRequest handler
        if (options.onRequest) {
          const customResponse = await options.onRequest(request, env, ctx);
          if (customResponse) {
            return addCorsHeaders(customResponse, corsHeaders);
          }
        }

        // API routes - /api/*
        if (url.pathname.startsWith('/api/')) {
          const response = await apiRouter.handle(request, env, ctx);
          if (response) {
            return addCorsHeaders(response, corsHeaders);
          }
          // No matching API route - fall through to 404
        }

        // Session routes - /session/*
        if (url.pathname.startsWith('/session/')) {
          return handleSessionRequest(
            request,
            env as unknown as BaseEnv,
            corsHeaders,
          );
        }

        // Routes registry - /routes
        if (url.pathname.startsWith('/routes')) {
          return handleRoutesRequest(
            request,
            env as unknown as BaseEnv,
            corsHeaders,
          );
        }

        // Health check
        if (url.pathname === '/health') {
          return new Response(
            JSON.stringify({ status: 'ok', env: env.ENVIRONMENT }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        // Custom 404 handler
        if (options.notFound) {
          const notFoundResponse = await options.notFound(request, env);
          return addCorsHeaders(notFoundResponse, corsHeaders);
        }

        return new Response('Not found', { status: 404, headers: corsHeaders });
      } catch (error) {
        console.error('Worker error:', error);
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    },
  };
}

/** Add CORS headers to a response */
function addCorsHeaders(
  response: Response,
  corsHeaders: Record<string, string>,
): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/** Cloudflare Worker exported handler interface */
interface ExportedHandler<E = unknown> {
  fetch(request: Request, env: E, ctx: ExecutionContext): Promise<Response>;
}

// =============================================================================
// LEGACY DEFAULT EXPORT (for backwards compatibility)
// =============================================================================

interface BaseEnv {
  PAGE_SESSIONS: DurableObjectNamespace;
  ROUTES_REGISTRY: DurableObjectNamespace;
  ENVIRONMENT?: string;
}

export default createAeonWorker();

/**
 * Handle session requests - route to PageSession Durable Object
 */
async function handleSessionRequest(
  request: Request,
  env: BaseEnv,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const url = new URL(request.url);

  // Extract session ID from path: /session/:sessionId/...
  const pathParts = url.pathname.split('/').filter(Boolean);
  const sessionId = pathParts[1];

  if (!sessionId) {
    return new Response('Session ID required', {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Get or create the Durable Object instance
  const id = env.PAGE_SESSIONS.idFromName(sessionId);
  const stub = env.PAGE_SESSIONS.get(id);

  // Forward the request to the DO
  const doUrl = new URL(request.url);
  doUrl.pathname = '/' + pathParts.slice(2).join('/') || '/session';

  const doRequest = new Request(doUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  const response = await stub.fetch(doRequest);

  // Add CORS headers to response
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Handle routes registry requests - route to singleton RoutesRegistry DO
 */
async function handleRoutesRequest(
  request: Request,
  env: BaseEnv,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  // Use a singleton DO for routes registry
  const id = env.ROUTES_REGISTRY.idFromName('__routes__');
  const stub = env.ROUTES_REGISTRY.get(id);

  const url = new URL(request.url);
  const doUrl = new URL(request.url);
  doUrl.pathname = url.pathname.replace('/routes', '') || '/routes';

  const doRequest = new Request(doUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  const response = await stub.fetch(doRequest);

  // Add CORS headers
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
