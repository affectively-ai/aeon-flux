/**
 * Aeon Route Registry - Collaborative route management
 *
 * Routes are stored as Aeon entities, enabling:
 * - Distributed sync across nodes
 * - Conflict resolution for concurrent route mutations
 * - Schema versioning for route structure changes
 */
import type { RouteMetadata, RouteOperation } from './types';
interface RegistryOptions {
    syncMode: 'distributed' | 'local';
    versioningEnabled: boolean;
}
interface AeonRoute {
    path: string;
    component: string;
    metadata: RouteMetadata;
    version: string;
}
/**
 * Collaborative route registry using Aeon distributed sync
 */
export declare class AeonRouteRegistry {
    private routes;
    private coordinator;
    private reconciler;
    private versions;
    private syncMode;
    private versioningEnabled;
    private mutationCallbacks;
    private connectedSockets;
    constructor(options: RegistryOptions);
    private initializeAeonModules;
    /**
     * Add a new route collaboratively
     */
    addRoute(path: string, component: string, metadata: RouteMetadata): Promise<void>;
    /**
     * Update an existing route
     */
    updateRoute(path: string, updates: Partial<AeonRoute>): Promise<void>;
    /**
     * Remove a route
     */
    removeRoute(path: string): Promise<void>;
    /**
     * Get a route by path
     */
    getRoute(path: string): AeonRoute | undefined;
    /**
     * Get session ID for a path
     */
    getSessionId(path: string): string;
    /**
     * Get all routes
     */
    getAllRoutes(): AeonRoute[];
    /**
     * Subscribe to route mutations
     */
    subscribeToMutations(callback: (operation: RouteOperation) => void): () => void;
    /**
     * Handle WebSocket connection for Aeon sync
     */
    handleConnect(ws: unknown): void;
    /**
     * Handle WebSocket disconnection
     */
    handleDisconnect(ws: unknown): void;
    /**
     * Handle incoming sync message
     */
    handleSyncMessage(ws: unknown, message: unknown): void;
    private notifyMutation;
    private handleSyncCompleted;
    private applyRemoteOperation;
    private persistRoute;
}
export {};
