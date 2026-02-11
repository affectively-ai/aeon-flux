/**
 * Aeon Pages API Routes
 *
 * Server-side route handling for API endpoints.
 * Enables full-stack functionality without a separate backend.
 */

import type {
  AeonEnv,
  AeonContext,
  ApiRoute,
  ApiRouteMatch,
  ApiRouteModule,
  ApiRouteHandler,
  ApiRouteSegment,
  HttpMethod,
  ExecutionContext,
} from './types';

/**
 * API Router - matches requests to registered API routes
 */
export class ApiRouter<E extends AeonEnv = AeonEnv> {
  private routes: ApiRoute[] = [];

  /**
   * Register an API route
   */
  register(pattern: string, module: ApiRouteModule<E>): void {
    const segments = this.parsePattern(pattern);
    this.routes.push({ pattern, segments, module: module as ApiRouteModule });
  }

  /**
   * Register multiple routes from a route map
   */
  registerAll(routes: Record<string, ApiRouteModule<E>>): void {
    for (const [pattern, module] of Object.entries(routes)) {
      this.register(pattern, module);
    }
  }

  /**
   * Match a request to a route
   */
  match(request: Request): ApiRouteMatch | null {
    const url = new URL(request.url);
    const method = request.method.toUpperCase() as HttpMethod;
    const pathSegments = url.pathname.split('/').filter(Boolean);

    for (const route of this.routes) {
      const params = this.matchSegments(route.segments, pathSegments);
      if (params !== null) {
        const handler = this.getHandler(route.module, method);
        if (handler) {
          return { route, params, handler };
        }
      }
    }

    return null;
  }

  /**
   * Handle an API request
   */
  async handle(
    request: Request,
    env: E,
    ctx: ExecutionContext,
  ): Promise<Response | null> {
    const match = this.match(request);
    if (!match) {
      return null;
    }

    const url = new URL(request.url);
    const context: AeonContext<E> = {
      request,
      env,
      params: match.params,
      url,
      ctx,
    };

    try {
      return await match.handler(context);
    } catch (error) {
      console.error('API route error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  /**
   * Parse a route pattern into segments
   */
  private parsePattern(pattern: string): ApiRouteSegment[] {
    return pattern
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        // Catch-all: [...slug]
        if (segment.startsWith('[...') && segment.endsWith(']')) {
          return {
            value: segment.slice(4, -1),
            isDynamic: true,
            isCatchAll: true,
          };
        }
        // Dynamic: [id]
        if (segment.startsWith('[') && segment.endsWith(']')) {
          return {
            value: segment.slice(1, -1),
            isDynamic: true,
            isCatchAll: false,
          };
        }
        // Static
        return {
          value: segment,
          isDynamic: false,
          isCatchAll: false,
        };
      });
  }

  /**
   * Match path segments against route segments
   */
  private matchSegments(
    routeSegments: ApiRouteSegment[],
    pathSegments: string[],
  ): Record<string, string> | null {
    const params: Record<string, string> = {};
    let pathIndex = 0;

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];

      if (routeSegment.isCatchAll) {
        // Catch-all consumes remaining segments
        params[routeSegment.value] = pathSegments.slice(pathIndex).join('/');
        return params;
      }

      if (pathIndex >= pathSegments.length) {
        // No more path segments but route expects more
        return null;
      }

      if (routeSegment.isDynamic) {
        // Dynamic segment - capture value
        params[routeSegment.value] = pathSegments[pathIndex];
        pathIndex++;
      } else {
        // Static segment - must match exactly
        if (routeSegment.value !== pathSegments[pathIndex]) {
          return null;
        }
        pathIndex++;
      }
    }

    // All path segments must be consumed
    if (pathIndex !== pathSegments.length) {
      return null;
    }

    return params;
  }

  /**
   * Get the handler for a given HTTP method
   */
  private getHandler(
    module: ApiRouteModule,
    method: HttpMethod,
  ): ApiRouteHandler | null {
    const handler = module[method];
    if (handler) {
      return handler;
    }
    // Fall back to default handler
    if (module.default) {
      return module.default;
    }
    return null;
  }

  /**
   * Get all registered routes (for debugging/introspection)
   */
  getRoutes(): ApiRoute[] {
    return [...this.routes];
  }
}

/**
 * Create a new API router instance
 */
export function createApiRouter<E extends AeonEnv = AeonEnv>(): ApiRouter<E> {
  return new ApiRouter<E>();
}

/**
 * Helper to create a JSON response
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
 * Helper to create a redirect response
 */
export function redirect(
  url: string,
  status: 301 | 302 | 303 | 307 | 308 = 302,
): Response {
  return new Response(null, {
    status,
    headers: { Location: url },
  });
}

/**
 * Helper to create an error response
 */
export function error(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Helper to create a not found response
 */
export function notFound(message = 'Not found'): Response {
  return error(message, 404);
}

/**
 * Helper to create a bad request response
 */
export function badRequest(message = 'Bad request'): Response {
  return error(message, 400);
}

/**
 * Helper to create an unauthorized response
 */
export function unauthorized(message = 'Unauthorized'): Response {
  return error(message, 401);
}

/**
 * Helper to create a forbidden response
 */
export function forbidden(message = 'Forbidden'): Response {
  return error(message, 403);
}

// =============================================================================
// MIDDLEWARE SUPPORT
// =============================================================================

/** Middleware function type */
export type Middleware<E extends AeonEnv = AeonEnv> = (
  context: AeonContext<E>,
  next: () => Promise<Response>,
) => Response | Promise<Response>;

/**
 * Compose multiple middleware into a single handler
 */
export function composeMiddleware<E extends AeonEnv = AeonEnv>(
  ...middlewares: Middleware<E>[]
): (handler: ApiRouteHandler<E>) => ApiRouteHandler<E> {
  return (handler: ApiRouteHandler<E>): ApiRouteHandler<E> => {
    return async (context: AeonContext<E>): Promise<Response> => {
      let index = 0;

      const next = async (): Promise<Response> => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          return middleware(context, next);
        }
        return handler(context);
      };

      return next();
    };
  };
}

/**
 * CORS middleware factory
 */
export function cors(options?: {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}): Middleware {
  const opts = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400,
    ...options,
  };

  return async (context, next) => {
    const requestOrigin = context.request.headers.get('Origin') || '';

    // Determine allowed origin
    let allowedOrigin = '*';
    if (typeof opts.origin === 'string') {
      allowedOrigin = opts.origin;
    } else if (Array.isArray(opts.origin)) {
      if (opts.origin.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    } else if (typeof opts.origin === 'function') {
      if (opts.origin(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    }

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': opts.methods.join(', '),
      'Access-Control-Allow-Headers': opts.headers.join(', '),
    };

    if (opts.credentials) {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }

    // Handle preflight
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': String(opts.maxAge),
        },
      });
    }

    const response = await next();

    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Auth middleware factory - validates Authorization header
 */
export function requireAuth<E extends AeonEnv = AeonEnv>(
  validate: (
    token: string,
    context: AeonContext<E>,
  ) => boolean | Promise<boolean>,
): Middleware<E> {
  return async (context, next) => {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader) {
      return unauthorized('Missing Authorization header');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const isValid = await validate(token, context);

    if (!isValid) {
      return unauthorized('Invalid token');
    }

    return next();
  };
}

/**
 * Rate limiting middleware (uses KV for distributed rate limiting)
 */
export function rateLimit<E extends AeonEnv = AeonEnv>(options: {
  /** KV namespace key in env */
  kvKey?: keyof E;
  /** Requests per window */
  limit: number;
  /** Window size in seconds */
  window: number;
  /** Function to extract client identifier (default: IP) */
  keyGenerator?: (context: AeonContext<E>) => string;
}): Middleware<E> {
  return async (context, next) => {
    const kv = options.kvKey
      ? (context.env[options.kvKey] as unknown)
      : context.env.CACHE;
    if (!kv || typeof (kv as Record<string, unknown>).get !== 'function') {
      // No KV available, skip rate limiting
      return next();
    }

    const kvNamespace = kv as {
      get: (key: string) => Promise<string | null>;
      put: (
        key: string,
        value: string,
        options?: { expirationTtl?: number },
      ) => Promise<void>;
    };
    const clientKey = options.keyGenerator
      ? options.keyGenerator(context)
      : context.request.headers.get('CF-Connecting-IP') || 'unknown';

    const rateLimitKey = `ratelimit:${clientKey}`;
    const current = await kvNamespace.get(rateLimitKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= options.limit) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(options.window),
        },
      });
    }

    // Increment counter
    await kvNamespace.put(rateLimitKey, String(count + 1), {
      expirationTtl: options.window,
    });

    return next();
  };
}
