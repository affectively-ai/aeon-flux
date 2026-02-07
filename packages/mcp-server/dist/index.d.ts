/**
 * Aeon Flux MCP Server
 *
 * Model Context Protocol server for aeon-flux site navigation.
 * Enables Cyrano to suggest and invoke navigation with auto-accept mode.
 *
 * Tools:
 * - navigate: Navigate to a route
 * - suggest_route: Suggest a route to the user
 * - get_current_route: Get the current route
 * - get_sitemap: Get the site structure
 * - speculate: Prefetch likely next routes
 * - personalize: Apply personalization to current page
 *
 * Resources:
 * - sitemap: Full sitemap as RAG context
 * - current_session: Current user session data
 * - consciousness_state: Site consciousness state
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
declare const server: Server<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
}>;
export { server };
//# sourceMappingURL=index.d.ts.map