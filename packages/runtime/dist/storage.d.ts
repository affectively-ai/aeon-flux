/**
 * Aeon Flux Storage Adapters
 *
 * Pluggable backend storage for routes and page content.
 *
 * Supported backends:
 * - Dash (recommended for AFFECTIVELY ecosystem)
 * - File system (default, development)
 * - Cloudflare D1 (production, distributed)
 * - Cloudflare Durable Objects (strong consistency)
 * - Hybrid (D1 + Durable Objects)
 * - Custom adapters
 */
import type { RouteDefinition, PageSession, SerializedComponent } from './types';
/**
 * Storage adapter interface - implement this for custom backends
 */
export interface StorageAdapter {
    /** Adapter name for logging */
    name: string;
    /** Initialize the storage (create tables, etc.) */
    init(): Promise<void>;
    /** Get a route by path */
    getRoute(path: string): Promise<RouteDefinition | null>;
    /** Get all routes */
    getAllRoutes(): Promise<RouteDefinition[]>;
    /** Save a route */
    saveRoute(route: RouteDefinition): Promise<void>;
    /** Delete a route */
    deleteRoute(path: string): Promise<void>;
    /** Get a page session */
    getSession(sessionId: string): Promise<PageSession | null>;
    /** Save a page session */
    saveSession(session: PageSession): Promise<void>;
    /** Get component tree for a session */
    getTree(sessionId: string): Promise<SerializedComponent | null>;
    /** Save component tree for a session */
    saveTree(sessionId: string, tree: SerializedComponent): Promise<void>;
}
/**
 * File system storage adapter (default for development)
 */
export declare class FileStorageAdapter implements StorageAdapter {
    name: string;
    private pagesDir;
    private dataDir;
    constructor(options: {
        pagesDir: string;
        dataDir?: string;
    });
    init(): Promise<void>;
    getRoute(path: string): Promise<RouteDefinition | null>;
    getAllRoutes(): Promise<RouteDefinition[]>;
    saveRoute(route: RouteDefinition): Promise<void>;
    deleteRoute(path: string): Promise<void>;
    getSession(sessionId: string): Promise<PageSession | null>;
    saveSession(session: PageSession): Promise<void>;
    getTree(sessionId: string): Promise<SerializedComponent | null>;
    saveTree(sessionId: string, tree: SerializedComponent): Promise<void>;
    private pathToKey;
}
/**
 * Cloudflare D1 storage adapter (production, distributed)
 */
export declare class D1StorageAdapter implements StorageAdapter {
    name: string;
    private db;
    constructor(db: D1Database);
    init(): Promise<void>;
    getRoute(path: string): Promise<RouteDefinition | null>;
    getAllRoutes(): Promise<RouteDefinition[]>;
    saveRoute(route: RouteDefinition): Promise<void>;
    deleteRoute(path: string): Promise<void>;
    getSession(sessionId: string): Promise<PageSession | null>;
    saveSession(session: PageSession): Promise<void>;
    getTree(sessionId: string): Promise<SerializedComponent | null>;
    saveTree(sessionId: string, tree: SerializedComponent): Promise<void>;
    private routeToSessionId;
}
/**
 * Cloudflare D1 database interface (matches Cloudflare Workers API)
 */
interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<void>;
}
interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first(): Promise<Record<string, unknown> | null>;
    all(): Promise<{
        results: Record<string, unknown>[];
    }>;
    run(): Promise<void>;
}
interface DurableObjectId {
    toString(): string;
    equals(other: DurableObjectId): boolean;
}
interface DurableObjectNamespace {
    get(id: DurableObjectId): DurableObjectStub;
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    newUniqueId(): DurableObjectId;
}
interface DurableObjectStub {
    id: DurableObjectId;
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}
/**
 * Cloudflare Durable Objects storage adapter (strong consistency)
 *
 * Each Aeon session maps to a Durable Object instance, providing:
 * - Strong consistency for real-time collaborative editing
 * - Automatic coalescing of WebSocket connections
 * - Sub-millisecond latency within the same colo
 *
 * Use in combination with D1 for read replicas and historical data.
 */
export declare class DurableObjectStorageAdapter implements StorageAdapter {
    name: string;
    private namespace;
    private routeCache;
    constructor(namespace: DurableObjectNamespace);
    init(): Promise<void>;
    getRoute(path: string): Promise<RouteDefinition | null>;
    getAllRoutes(): Promise<RouteDefinition[]>;
    saveRoute(route: RouteDefinition): Promise<void>;
    deleteRoute(path: string): Promise<void>;
    getSession(sessionId: string): Promise<PageSession | null>;
    saveSession(session: PageSession): Promise<void>;
    getTree(sessionId: string): Promise<SerializedComponent | null>;
    saveTree(sessionId: string, tree: SerializedComponent): Promise<void>;
    /**
     * Get a direct stub for WebSocket connections
     * This allows real-time collaboration via Durable Object WebSockets
     */
    getSessionStub(sessionId: string): DurableObjectStub;
    private routeToSessionId;
}
/**
 * Hybrid storage adapter (D1 + Durable Objects)
 *
 * Combines the best of both:
 * - Durable Objects for real-time collaborative editing (strong consistency)
 * - D1 for read replicas and historical snapshots (eventual consistency)
 *
 * Write path: Durable Object → async propagate to D1
 * Read path: Durable Object (real-time) or D1 (historical)
 */
export declare class HybridStorageAdapter implements StorageAdapter {
    name: string;
    private do;
    private d1;
    constructor(options: {
        namespace: DurableObjectNamespace;
        db: D1Database;
    });
    init(): Promise<void>;
    getRoute(path: string): Promise<RouteDefinition | null>;
    getAllRoutes(): Promise<RouteDefinition[]>;
    saveRoute(route: RouteDefinition): Promise<void>;
    deleteRoute(path: string): Promise<void>;
    getSession(sessionId: string): Promise<PageSession | null>;
    saveSession(session: PageSession): Promise<void>;
    getTree(sessionId: string): Promise<SerializedComponent | null>;
    saveTree(sessionId: string, tree: SerializedComponent): Promise<void>;
    /**
     * Get historical snapshots from D1
     */
    getHistoricalSession(sessionId: string): Promise<PageSession | null>;
    /**
     * Get direct Durable Object stub for WebSocket connections
     */
    getSessionStub(sessionId: string): DurableObjectStub;
}
/**
 * Dash client interface
 *
 * Dash is AFFECTIVELY's real-time sync system built on Aeon.
 * It provides:
 * - Real-time subscriptions via WebSocket
 * - Automatic conflict resolution (CRDT-based)
 * - Offline-first with sync on reconnect
 * - Cross-platform (web, mobile, edge)
 *
 * @example
 * ```typescript
 * import { createDashClient } from '@affectively/dash';
 *
 * const dash = createDashClient({
 *   endpoint: 'wss://dash.affectively.com',
 *   auth: { token: 'your-auth-token' },
 * });
 *
 * const storage = new DashStorageAdapter(dash);
 * ```
 */
interface DashClient {
    /** Connect to Dash server */
    connect(): Promise<void>;
    /** Disconnect from Dash server */
    disconnect(): Promise<void>;
    /** Check connection status */
    isConnected(): boolean;
    /** Get a document by collection and id */
    get<T>(collection: string, id: string): Promise<T | null>;
    /** Query documents in a collection */
    query<T>(collection: string, filter?: DashFilter): Promise<T[]>;
    /** Set/update a document */
    set<T>(collection: string, id: string, data: T): Promise<void>;
    /** Delete a document */
    delete(collection: string, id: string): Promise<void>;
    /** Subscribe to real-time updates */
    subscribe<T>(collection: string, filter: DashFilter | undefined, callback: (changes: DashChange<T>[]) => void): DashSubscription;
    /** Batch operations */
    batch(operations: DashOperation[]): Promise<void>;
}
interface DashFilter {
    where?: Array<{
        field: string;
        op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'contains';
        value: unknown;
    }>;
    orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    limit?: number;
    offset?: number;
}
interface DashChange<T> {
    type: 'added' | 'modified' | 'removed';
    id: string;
    data: T | null;
    previousData?: T;
}
interface DashSubscription {
    unsubscribe(): void;
}
interface DashOperation {
    type: 'set' | 'delete';
    collection: string;
    id: string;
    data?: unknown;
}
/**
 * Dash storage adapter
 *
 * Uses AFFECTIVELY's Dash real-time sync system as the backend.
 * This is the recommended adapter for the AFFECTIVELY ecosystem
 * as it integrates seamlessly with other Dash-powered features.
 *
 * Features:
 * - Real-time sync across all connected clients
 * - CRDT-based conflict resolution (no data loss)
 * - Offline-first with automatic sync on reconnect
 * - Presence tracking built-in
 * - Works with existing Dash infrastructure
 *
 * @example
 * ```typescript
 * import { createDashClient } from '@affectively/dash';
 * import { DashStorageAdapter } from '@affectively/aeon-flux';
 *
 * const dash = createDashClient({
 *   endpoint: process.env.DASH_ENDPOINT,
 *   auth: { token: await getAuthToken() },
 * });
 *
 * const storage = new DashStorageAdapter(dash, {
 *   routesCollection: 'aeon-routes',
 *   sessionsCollection: 'aeon-sessions',
 *   presenceCollection: 'aeon-presence',
 * });
 *
 * // Use with Aeon Flux server
 * const server = await createAeonServer({
 *   storage,
 *   // ...
 * });
 * ```
 */
export declare class DashStorageAdapter implements StorageAdapter {
    name: string;
    private client;
    private collections;
    private subscriptions;
    constructor(client: DashClient, options?: {
        routesCollection?: string;
        sessionsCollection?: string;
        presenceCollection?: string;
    });
    init(): Promise<void>;
    getRoute(path: string): Promise<RouteDefinition | null>;
    getAllRoutes(): Promise<RouteDefinition[]>;
    saveRoute(route: RouteDefinition): Promise<void>;
    deleteRoute(path: string): Promise<void>;
    getSession(sessionId: string): Promise<PageSession | null>;
    saveSession(session: PageSession): Promise<void>;
    getTree(sessionId: string): Promise<SerializedComponent | null>;
    saveTree(sessionId: string, tree: SerializedComponent): Promise<void>;
    /**
     * Subscribe to real-time route changes
     */
    subscribeToRoutes(callback: (changes: DashChange<RouteDefinition>[]) => void): DashSubscription;
    /**
     * Subscribe to real-time session changes
     */
    subscribeToSession(sessionId: string, callback: (changes: DashChange<PageSession>[]) => void): DashSubscription;
    /**
     * Subscribe to presence updates for a session
     */
    subscribeToPresence(sessionId: string, callback: (changes: DashChange<PresenceRecord>[]) => void): DashSubscription;
    /**
     * Update presence for current user
     */
    updatePresence(sessionId: string, userId: string, presence: Partial<PresenceRecord>): Promise<void>;
    /**
     * Clean up subscriptions
     */
    destroy(): void;
    private pathToId;
    private routeToSessionId;
}
interface PresenceRecord {
    sessionId: string;
    userId: string;
    role: 'user' | 'assistant' | 'monitor' | 'admin';
    cursor?: {
        x: number;
        y: number;
    };
    focusNode?: string;
    selection?: {
        start: number;
        end: number;
        direction?: 'forward' | 'backward' | 'none';
        path?: string;
    };
    typing?: {
        isTyping: boolean;
        field?: string;
        isComposing?: boolean;
        startedAt?: string;
        stoppedAt?: string;
    };
    scroll?: {
        depth: number;
        y?: number;
        viewportHeight?: number;
        documentHeight?: number;
        path?: string;
    };
    viewport?: {
        width: number;
        height: number;
    };
    inputState?: {
        field: string;
        hasFocus: boolean;
        valueLength?: number;
        selectionStart?: number;
        selectionEnd?: number;
        isComposing?: boolean;
        inputMode?: string;
    };
    emotion?: {
        primary?: string;
        secondary?: string;
        confidence?: number;
        intensity?: number;
        valence?: number;
        arousal?: number;
        dominance?: number;
        source?: 'self-report' | 'inferred' | 'sensor' | 'hybrid';
        updatedAt?: string;
    };
    editing?: string;
    status: 'online' | 'away' | 'offline';
    lastActivity: string;
}
/**
 * Create a storage adapter based on configuration
 */
export declare function createStorageAdapter(config: {
    type: 'file' | 'd1' | 'durable-object' | 'hybrid' | 'dash' | 'custom';
    pagesDir?: string;
    dataDir?: string;
    d1?: D1Database;
    durableObjectNamespace?: DurableObjectNamespace;
    dash?: DashClient;
    dashCollections?: {
        routes?: string;
        sessions?: string;
        presence?: string;
    };
    custom?: StorageAdapter;
}): StorageAdapter;
export {};
