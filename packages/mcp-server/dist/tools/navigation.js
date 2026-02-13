/**
 * Aeon Flux Navigation Tools
 *
 * MCP tools for Cyrano to navigate and personalize the site.
 * Supports auto-accept mode for seamless navigation suggestions.
 */
let state = {
    currentRoute: '/',
    previousRoutes: [],
    pendingSuggestions: [],
    autoAcceptEnabled: false,
    sessionId: '',
};
const eventHandlers = new Set();
export function onNavigationEvent(handler) {
    eventHandlers.add(handler);
    return () => eventHandlers.delete(handler);
}
function emit(type, data) {
    for (const handler of eventHandlers) {
        handler({ type, data });
    }
}
// ============================================================================
// Tool Definitions
// ============================================================================
export const navigateTool = {
    name: 'navigate',
    description: `Navigate to a route in the aeon-flux site. Use this to take the user directly to a page.

Examples:
- navigate({ route: '/breathing/4-7-8' }) - Go to breathing exercise
- navigate({ route: '/insights' }) - Go to insights dashboard
- navigate({ route: '/learning/emotions/joy' }) - Go to joy learning page`,
    inputSchema: {
        type: 'object',
        properties: {
            route: {
                type: 'string',
                description: 'The route to navigate to (e.g., "/breathing/4-7-8", "/insights")',
            },
            autoAccept: {
                type: 'boolean',
                description: 'Whether to navigate immediately without user confirmation (default: false)',
                default: false,
            },
        },
        required: ['route'],
    },
};
export const suggestRouteTool = {
    name: 'suggest_route',
    description: `Suggest a route to the user. Shows a gentle suggestion with a reason.
The user can accept or dismiss the suggestion.

Use this when Cyrano wants to recommend a page based on context.

Examples:
- suggest_route({ route: '/breathing', reason: 'You seem stressed - this might help' })
- suggest_route({ route: '/insights/patterns', reason: 'Your weekly patterns are ready' })`,
    inputSchema: {
        type: 'object',
        properties: {
            route: {
                type: 'string',
                description: 'The route to suggest',
            },
            reason: {
                type: 'string',
                description: 'Why Cyrano is suggesting this route',
            },
            autoAccept: {
                type: 'boolean',
                description: 'If true and user has auto-accept enabled, navigate immediately',
                default: false,
            },
        },
        required: ['route', 'reason'],
    },
};
export const getCurrentRouteTool = {
    name: 'get_current_route',
    description: `Get the current route the user is on. Use this to understand context.`,
    inputSchema: {
        type: 'object',
        properties: {},
    },
};
export const getSitemapTool = {
    name: 'get_sitemap',
    description: `Get the site structure. Useful for finding relevant pages.

Examples:
- get_sitemap() - Get full sitemap
- get_sitemap({ filter: 'breathing' }) - Get pages related to breathing
- get_sitemap({ filter: 'tools' }) - Get all tool pages`,
    inputSchema: {
        type: 'object',
        properties: {
            filter: {
                type: 'string',
                description: 'Optional filter to narrow down results',
            },
        },
    },
};
export const speculateTool = {
    name: 'speculate',
    description: `Get likely next routes for prefetching. Helps optimize navigation.

Based on current context and user patterns, returns probable next destinations.`,
    inputSchema: {
        type: 'object',
        properties: {
            depth: {
                type: 'number',
                description: 'How many routes to speculate (default: 3)',
                default: 3,
            },
        },
    },
};
export const personalizeTool = {
    name: 'personalize',
    description: `Apply personalization to the current page based on user context.

Examples:
- personalize({ theme: 'dark' }) - Switch to dark theme
- personalize({ accent: '#4A90D9' }) - Set accent color (e.g., calming blue)
- personalize({ density: 'comfortable' }) - More spacing for stressed users`,
    inputSchema: {
        type: 'object',
        properties: {
            theme: {
                type: 'string',
                enum: ['light', 'dark'],
                description: 'Theme mode',
            },
            accent: {
                type: 'string',
                description: 'Accent color in hex format',
            },
            density: {
                type: 'string',
                enum: ['compact', 'normal', 'comfortable'],
                description: 'Layout density',
            },
        },
    },
};
export const invokeToolTool = {
    name: 'invoke_tool',
    description: `Invoke a specific tool in the application.

Cyrano can suggest and invoke tools based on user context.
250+ tools available including breathing exercises, journaling, insights, etc.

Examples:
- invoke_tool({ toolId: 'breathing/4-7-8' }) - Start 4-7-8 breathing
- invoke_tool({ toolId: 'grounding/5-4-3-2-1' }) - Start grounding exercise
- invoke_tool({ toolId: 'journaling/freeform' }) - Open journaling
- invoke_tool({ toolId: 'insights/patterns' }) - Show patterns analysis`,
    inputSchema: {
        type: 'object',
        properties: {
            toolId: {
                type: 'string',
                description: 'The tool ID to invoke (e.g., "breathing/4-7-8")',
            },
            params: {
                type: 'object',
                description: 'Optional parameters to pass to the tool',
                additionalProperties: true,
            },
        },
        required: ['toolId'],
    },
};
// ============================================================================
// Tool Handlers
// ============================================================================
export async function handleNavigate(args) {
    const { route, autoAccept = false } = args;
    // Update state
    state.previousRoutes.push(state.currentRoute);
    state.currentRoute = route;
    // Emit navigation event
    emit('navigate', { route, autoAccept });
    return {
        content: [
            {
                type: 'text',
                text: autoAccept
                    ? `Navigated to ${route}`
                    : `Navigation to ${route} initiated. Awaiting user confirmation.`,
            },
        ],
    };
}
export async function handleSuggestRoute(args) {
    const { route, reason, autoAccept = false } = args;
    // Add to pending suggestions
    state.pendingSuggestions.push({
        route,
        reason,
        autoAccept,
        timestamp: Date.now(),
    });
    // Emit suggestion event
    emit('suggest', { route, reason, autoAccept });
    // If auto-accept is enabled and requested, navigate immediately
    if (autoAccept && state.autoAcceptEnabled) {
        state.previousRoutes.push(state.currentRoute);
        state.currentRoute = route;
        return {
            content: [
                {
                    type: 'text',
                    text: `Auto-navigated to ${route}: ${reason}`,
                },
            ],
        };
    }
    return {
        content: [
            {
                type: 'text',
                text: `Suggested ${route}: ${reason}. Awaiting user response.`,
            },
        ],
    };
}
export async function handleGetCurrentRoute() {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    currentRoute: state.currentRoute,
                    previousRoutes: state.previousRoutes.slice(-5),
                    pendingSuggestions: state.pendingSuggestions,
                }, null, 2),
            },
        ],
    };
}
export async function handleGetSitemap(args) {
    const { filter } = args;
    // Simplified sitemap structure (would be loaded from sitemapRAG in production)
    const sitemap = [
        // Core pages
        { route: '/', title: 'Home', category: 'core' },
        { route: '/dashboard', title: 'Dashboard', category: 'core' },
        { route: '/insights', title: 'Insights', category: 'core' },
        { route: '/chat', title: 'Chat with Cyrano', category: 'core' },
        // Tools - Breathing
        { route: '/breathing', title: 'Breathing Exercises', category: 'tools' },
        { route: '/breathing/4-7-8', title: '4-7-8 Breathing', category: 'tools' },
        { route: '/breathing/box', title: 'Box Breathing', category: 'tools' },
        {
            route: '/breathing/coherent',
            title: 'Coherent Breathing',
            category: 'tools',
        },
        // Tools - Grounding
        { route: '/grounding', title: 'Grounding Exercises', category: 'tools' },
        {
            route: '/grounding/5-4-3-2-1',
            title: '5-4-3-2-1 Grounding',
            category: 'tools',
        },
        { route: '/grounding/body-scan', title: 'Body Scan', category: 'tools' },
        // Tools - Journaling
        { route: '/journaling', title: 'Journaling', category: 'tools' },
        {
            route: '/journaling/freeform',
            title: 'Freeform Journaling',
            category: 'tools',
        },
        {
            route: '/journaling/gratitude',
            title: 'Gratitude Journal',
            category: 'tools',
        },
        // Learning
        { route: '/learning', title: 'Learning', category: 'learning' },
        { route: '/learning/emotions', title: 'Emotions', category: 'learning' },
        { route: '/learning/emotions/joy', title: 'Joy', category: 'learning' },
        {
            route: '/learning/emotions/sadness',
            title: 'Sadness',
            category: 'learning',
        },
        { route: '/learning/emotions/anger', title: 'Anger', category: 'learning' },
        { route: '/learning/emotions/fear', title: 'Fear', category: 'learning' },
        // Settings
        { route: '/settings', title: 'Settings', category: 'settings' },
        {
            route: '/settings/privacy',
            title: 'Privacy Settings',
            category: 'settings',
        },
        {
            route: '/settings/notifications',
            title: 'Notification Settings',
            category: 'settings',
        },
        // Account
        { route: '/account', title: 'Account', category: 'account' },
        { route: '/account/profile', title: 'Profile', category: 'account' },
    ];
    // Apply filter if provided
    const filteredSitemap = filter
        ? sitemap.filter((page) => page.route.includes(filter) ||
            page.title.toLowerCase().includes(filter.toLowerCase()) ||
            page.category.includes(filter))
        : sitemap;
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(filteredSitemap, null, 2),
            },
        ],
    };
}
export async function handleSpeculate(args) {
    const { depth = 3 } = args;
    // Speculation based on current route (simplified - would use heuristic adapter in production)
    const speculations = {
        '/': ['/dashboard', '/breathing', '/insights'],
        '/dashboard': ['/insights', '/breathing', '/chat'],
        '/breathing': ['/breathing/4-7-8', '/breathing/box', '/grounding'],
        '/breathing/4-7-8': ['/dashboard', '/breathing', '/insights'],
        '/insights': ['/dashboard', '/learning', '/settings'],
        '/learning': ['/learning/emotions', '/dashboard', '/insights'],
        '/settings': ['/settings/privacy', '/account', '/dashboard'],
    };
    const likelyRoutes = speculations[state.currentRoute] || [
        '/dashboard',
        '/insights',
        '/breathing',
    ];
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    currentRoute: state.currentRoute,
                    likelyNextRoutes: likelyRoutes.slice(0, depth),
                    confidence: 0.7,
                }, null, 2),
            },
        ],
    };
}
export async function handlePersonalize(args) {
    // Emit personalization event
    emit('personalize', args);
    const applied = [];
    if (args.theme)
        applied.push(`theme: ${args.theme}`);
    if (args.accent)
        applied.push(`accent: ${args.accent}`);
    if (args.density)
        applied.push(`density: ${args.density}`);
    return {
        content: [
            {
                type: 'text',
                text: `Applied personalization: ${applied.join(', ')}`,
            },
        ],
    };
}
export async function handleInvokeTool(args) {
    const { toolId, params } = args;
    // Emit tool invocation event
    emit('invoke_tool', { toolId, params });
    // Parse tool category and name
    const [category, name] = toolId.split('/');
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    status: 'invoked',
                    toolId,
                    category,
                    name,
                    params: params || {},
                    timestamp: Date.now(),
                }, null, 2),
            },
        ],
    };
}
// ============================================================================
// State Management
// ============================================================================
export function setNavigationState(newState) {
    state = { ...state, ...newState };
}
export function getNavigationState() {
    return { ...state };
}
export function enableAutoAccept(enabled) {
    state.autoAcceptEnabled = enabled;
}
export function clearPendingSuggestions() {
    state.pendingSuggestions = [];
}
export function acceptSuggestion(route) {
    const index = state.pendingSuggestions.findIndex((s) => s.route === route);
    if (index === -1)
        return false;
    state.pendingSuggestions.splice(index, 1);
    state.previousRoutes.push(state.currentRoute);
    state.currentRoute = route;
    emit('navigate', { route, fromSuggestion: true });
    return true;
}
export function dismissSuggestion(route) {
    const index = state.pendingSuggestions.findIndex((s) => s.route === route);
    if (index === -1)
        return false;
    state.pendingSuggestions.splice(index, 1);
    return true;
}
//# sourceMappingURL=navigation.js.map