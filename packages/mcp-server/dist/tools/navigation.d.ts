/**
 * Aeon Flux Navigation Tools
 *
 * MCP tools for Cyrano to navigate and personalize the site.
 * Supports auto-accept mode for seamless navigation suggestions.
 */
import type { Tool, TextContent } from '@modelcontextprotocol/sdk/types.js';
interface NavigationState {
    currentRoute: string;
    previousRoutes: string[];
    pendingSuggestions: Array<{
        route: string;
        reason: string;
        autoAccept: boolean;
        timestamp: number;
    }>;
    autoAcceptEnabled: boolean;
    sessionId: string;
}
type NavigationEventHandler = (event: {
    type: 'navigate' | 'suggest' | 'personalize' | 'invoke_tool';
    data: unknown;
}) => void;
export declare function onNavigationEvent(handler: NavigationEventHandler): () => void;
export declare const navigateTool: Tool;
export declare const suggestRouteTool: Tool;
export declare const getCurrentRouteTool: Tool;
export declare const getSitemapTool: Tool;
export declare const speculateTool: Tool;
export declare const personalizeTool: Tool;
export declare const invokeToolTool: Tool;
export declare function handleNavigate(args: {
    route: string;
    autoAccept?: boolean;
}): Promise<{
    content: TextContent[];
}>;
export declare function handleSuggestRoute(args: {
    route: string;
    reason: string;
    autoAccept?: boolean;
}): Promise<{
    content: TextContent[];
}>;
export declare function handleGetCurrentRoute(): Promise<{
    content: TextContent[];
}>;
export declare function handleGetSitemap(args: {
    filter?: string;
}): Promise<{
    content: TextContent[];
}>;
export declare function handleSpeculate(args: {
    depth?: number;
}): Promise<{
    content: TextContent[];
}>;
export declare function handlePersonalize(args: {
    theme?: 'light' | 'dark';
    accent?: string;
    density?: 'compact' | 'normal' | 'comfortable';
}): Promise<{
    content: TextContent[];
}>;
export declare function handleInvokeTool(args: {
    toolId: string;
    params?: Record<string, unknown>;
}): Promise<{
    content: TextContent[];
}>;
export declare function setNavigationState(newState: Partial<NavigationState>): void;
export declare function getNavigationState(): NavigationState;
export declare function enableAutoAccept(enabled: boolean): void;
export declare function clearPendingSuggestions(): void;
export declare function acceptSuggestion(route: string): boolean;
export declare function dismissSuggestion(route: string): boolean;
export {};
//# sourceMappingURL=navigation.d.ts.map