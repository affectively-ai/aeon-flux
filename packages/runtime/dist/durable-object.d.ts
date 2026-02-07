/**
 * Aeon Pages Durable Object
 *
 * This is the Cloudflare Durable Object that provides:
 * - Strong consistency for page sessions
 * - Real-time WebSocket connections for collaboration
 * - Presence tracking across connected clients
 * - CRDT-based conflict resolution
 *
 * Deploy this alongside your Cloudflare Worker.
 */
interface Env {
    DB?: D1Database;
    GITHUB_TOKEN?: string;
    GITHUB_REPO?: string;
    GITHUB_TREE_PATH?: string;
    GITHUB_BASE_BRANCH?: string;
    GITHUB_DEV_BRANCH?: string;
    GITHUB_AUTO_MERGE?: string;
    GITHUB_WEBHOOK_SECRET?: string;
    SYNC_WEBHOOK_URL?: string;
}
interface D1Database {
    prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    run(): Promise<void>;
}
/**
 * Aeon Page Session Durable Object
 *
 * One instance per page session, handles:
 * - Session state (component tree, data)
 * - Real-time presence
 * - WebSocket connections
 * - Collaborative editing
 */
export declare class AeonPageSession {
    private state;
    private env;
    private sessions;
    private session;
    private webhooks;
    constructor(state: DurableObjectState, env: Env);
    fetch(request: Request): Promise<Response>;
    private handleWebSocket;
    private handleMessage;
    private broadcast;
    private applyEdit;
    private propagateToD1;
    /**
     * Create a GitHub PR when tree changes
     */
    private createTreePR;
    /**
     * Merge a GitHub PR
     */
    private mergePR;
    /**
     * Handle GitHub webhook callbacks (push events)
     * This is called when GitHub pushes changes to the repo
     */
    private handleWebhookEndpoint;
    /**
     * Verify GitHub webhook signature
     */
    private verifyGitHubSignature;
    /**
     * Process GitHub webhook events
     */
    private processGitHubWebhook;
    /**
     * Handle webhook configuration (register/list)
     */
    private handleWebhooksConfig;
    /**
     * Handle version request
     */
    private handleVersionRequest;
    /**
     * Fire webhooks for an event
     */
    private fireWebhook;
    private handleSessionRequest;
    private handleTreeRequest;
    private handlePresenceRequest;
    private getSession;
    private saveSession;
}
/**
 * Aeon Routes Registry Durable Object
 *
 * Singleton that manages the route registry with strong consistency.
 * Used via: namespace.idFromName('__routes__')
 */
export declare class AeonRoutesRegistry {
    private state;
    private env;
    constructor(state: DurableObjectState, env: Env);
    fetch(request: Request): Promise<Response>;
    private handleRouteRequest;
    private handleRoutesRequest;
}
interface DurableObjectState {
    storage: DurableObjectStorage;
    id: DurableObjectId;
    waitUntil(promise: Promise<unknown>): void;
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}
interface DurableObjectStorage {
    get<T = unknown>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<boolean>;
    list<T = unknown>(options?: {
        prefix?: string;
    }): Promise<Map<string, T>>;
}
interface DurableObjectId {
    toString(): string;
}
export {};
