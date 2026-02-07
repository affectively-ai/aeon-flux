/**
 * Aeon Router - TypeScript wrapper for WASM router
 *
 * Handles route matching with Next.js-style patterns:
 * - Static: /about
 * - Dynamic: /blog/[slug]
 * - Catch-all: /api/[...path]
 * - Optional catch-all: /docs/[[...slug]]
 */
import type { RouteDefinition, RouteMatch } from './types';
interface RouterOptions {
    routesDir: string;
    componentsDir?: string;
}
/**
 * Aeon Router - file-based routing with dynamic segment support
 */
export declare class AeonRouter {
    private routes;
    private routesDir;
    private componentsDir?;
    constructor(options: RouterOptions);
    /**
     * Scan the routes directory and build the route table
     */
    scan(): Promise<void>;
    /**
     * Reload routes (for hot reload)
     */
    reload(): Promise<void>;
    /**
     * Match a URL path to a route
     */
    match(path: string): RouteMatch | null;
    /**
     * Check if a route exists
     */
    hasRoute(path: string): boolean;
    /**
     * Get all registered routes
     */
    getRoutes(): RouteDefinition[];
    /**
     * Add a route manually (for dynamic creation)
     */
    addRoute(definition: RouteDefinition): void;
    private scanDirectory;
    private createRouteFromFile;
    private parsePattern;
    private matchSegments;
    private generateSessionId;
    private resolveSessionId;
    private sortRoutes;
    private routeSpecificity;
}
export {};
