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
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { navigateTool, suggestRouteTool, getCurrentRouteTool, getSitemapTool, speculateTool, personalizeTool, invokeToolTool, handleNavigate, handleSuggestRoute, handleGetCurrentRoute, handleGetSitemap, handleSpeculate, handlePersonalize, handleInvokeTool, } from './tools/navigation';
import { sitemapResource, sessionResource, consciousnessResource, handleReadSitemap, handleReadSession, handleReadConsciousness, } from './resources';
// ============================================================================
// Server Setup
// ============================================================================
const server = new Server({
    name: 'aeon-flux',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
// ============================================================================
// Tool Handlers
// ============================================================================
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            navigateTool,
            suggestRouteTool,
            getCurrentRouteTool,
            getSitemapTool,
            speculateTool,
            personalizeTool,
            invokeToolTool,
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'navigate':
            return handleNavigate(args);
        case 'suggest_route':
            return handleSuggestRoute(args);
        case 'get_current_route':
            return handleGetCurrentRoute();
        case 'get_sitemap':
            return handleGetSitemap(args);
        case 'speculate':
            return handleSpeculate(args);
        case 'personalize':
            return handlePersonalize(args);
        case 'invoke_tool':
            return handleInvokeTool(args);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
// ============================================================================
// Resource Handlers
// ============================================================================
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            sitemapResource,
            sessionResource,
            consciousnessResource,
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    switch (uri) {
        case 'aeon://sitemap':
            return handleReadSitemap();
        case 'aeon://session':
            return handleReadSession();
        case 'aeon://consciousness':
            return handleReadConsciousness();
        default:
            throw new Error(`Unknown resource: ${uri}`);
    }
});
// ============================================================================
// Main
// ============================================================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Aeon Flux MCP Server running on stdio');
}
main().catch(console.error);
export { server };
//# sourceMappingURL=index.js.map