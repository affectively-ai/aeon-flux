/**
 * Aeon Pages Cloudflare Worker
 *
 * Entry point for Cloudflare Workers deployment.
 * Handles routing to Durable Objects, API routes, and static assets.
 */
export { AeonPageSession, AeonRoutesRegistry } from './durable-object';
import type { AeonEnv, ApiRouteModule, ExecutionContext } from './types';
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
    onRequest?: (request: Request, env: E, ctx: ExecutionContext) => Promise<Response | null>;
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
export declare function createAeonWorker<E extends AeonEnv = AeonEnv>(options?: AeonWorkerOptions<E>): ExportedHandler<E>;
/** Cloudflare Worker exported handler interface */
interface ExportedHandler<E = unknown> {
    fetch(request: Request, env: E, ctx: ExecutionContext): Promise<Response>;
}
declare const _default: ExportedHandler<AeonEnv>;
export default _default;
