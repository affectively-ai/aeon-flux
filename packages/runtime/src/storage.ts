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

import type {
  RouteDefinition,
  PageSession,
  SerializedComponent,
} from './types';

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
export class FileStorageAdapter implements StorageAdapter {
  name = 'file';
  private pagesDir: string;
  private dataDir: string;

  constructor(options: { pagesDir: string; dataDir?: string }) {
    this.pagesDir = options.pagesDir;
    this.dataDir = options.dataDir ?? '.aeon/data';
  }

  async init(): Promise<void> {
    const fs = await import('fs/promises');
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  async getRoute(path: string): Promise<RouteDefinition | null> {
    try {
      const fs = await import('fs/promises');
      const filePath = `${this.dataDir}/routes/${this.pathToKey(path)}.json`;
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getAllRoutes(): Promise<RouteDefinition[]> {
    try {
      const fs = await import('fs/promises');
      const routesDir = `${this.dataDir}/routes`;
      const files = await fs.readdir(routesDir);
      const routes: RouteDefinition[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(`${routesDir}/${file}`, 'utf-8');
          routes.push(JSON.parse(content));
        }
      }

      return routes;
    } catch {
      return [];
    }
  }

  async saveRoute(route: RouteDefinition): Promise<void> {
    const fs = await import('fs/promises');
    const routesDir = `${this.dataDir}/routes`;
    await fs.mkdir(routesDir, { recursive: true });
    const filePath = `${routesDir}/${this.pathToKey(route.pattern)}.json`;
    await fs.writeFile(filePath, JSON.stringify(route, null, 2));
  }

  async deleteRoute(path: string): Promise<void> {
    const fs = await import('fs/promises');
    const filePath = `${this.dataDir}/routes/${this.pathToKey(path)}.json`;
    await fs.unlink(filePath).catch(() => undefined);
  }

  async getSession(sessionId: string): Promise<PageSession | null> {
    try {
      const fs = await import('fs/promises');
      const filePath = `${this.dataDir}/sessions/${sessionId}.json`;
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async saveSession(session: PageSession): Promise<void> {
    const fs = await import('fs/promises');
    const sessionsDir = `${this.dataDir}/sessions`;
    await fs.mkdir(sessionsDir, { recursive: true });
    const filePath = `${sessionsDir}/${this.pathToKey(session.route)}.json`;
    await fs.writeFile(filePath, JSON.stringify(session, null, 2));
  }

  async getTree(sessionId: string): Promise<SerializedComponent | null> {
    const session = await this.getSession(sessionId);
    return session?.tree ?? null;
  }

  async saveTree(sessionId: string, tree: SerializedComponent): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.tree = tree;
      await this.saveSession(session);
    }
  }

  private pathToKey(path: string): string {
    return path.replace(/\//g, '_').replace(/^_/, '') || 'index';
  }
}

/**
 * Cloudflare D1 storage adapter (production, distributed)
 */
export class D1StorageAdapter implements StorageAdapter {
  name = 'd1';
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async init(): Promise<void> {
    // Create tables if they don't exist
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        path TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        session_id TEXT NOT NULL,
        component_id TEXT NOT NULL,
        layout TEXT,
        is_aeon INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        route TEXT NOT NULL,
        tree TEXT NOT NULL,
        data TEXT DEFAULT '{}',
        schema_version TEXT DEFAULT '1.0.0',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS presence (
        session_id TEXT,
        user_id TEXT,
        role TEXT DEFAULT 'user',
        cursor_x INTEGER,
        cursor_y INTEGER,
        focus_node TEXT,
        selection_start INTEGER,
        selection_end INTEGER,
        selection_direction TEXT,
        selection_path TEXT,
        typing INTEGER,
        typing_field TEXT,
        typing_composing INTEGER,
        typing_started_at TEXT,
        typing_stopped_at TEXT,
        scroll_depth REAL,
        scroll_y INTEGER,
        scroll_viewport_height INTEGER,
        scroll_document_height INTEGER,
        scroll_path TEXT,
        viewport_width INTEGER,
        viewport_height INTEGER,
        input_field TEXT,
        input_has_focus INTEGER,
        input_value_length INTEGER,
        input_selection_start INTEGER,
        input_selection_end INTEGER,
        input_composing INTEGER,
        input_mode TEXT,
        emotion_primary TEXT,
        emotion_secondary TEXT,
        emotion_confidence REAL,
        emotion_intensity REAL,
        emotion_valence REAL,
        emotion_arousal REAL,
        emotion_dominance REAL,
        emotion_source TEXT,
        emotion_updated_at TEXT,
        editing TEXT,
        status TEXT DEFAULT 'online',
        last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_routes_pattern ON routes(pattern);
      CREATE INDEX IF NOT EXISTS idx_sessions_route ON sessions(route);
    `);
  }

  async getRoute(path: string): Promise<RouteDefinition | null> {
    const result = await this.db
      .prepare('SELECT * FROM routes WHERE path = ?')
      .bind(path)
      .first();

    if (!result) return null;

    return {
      pattern: result.pattern as string,
      sessionId: result.session_id as string,
      componentId: result.component_id as string,
      layout: result.layout as string | undefined,
      isAeon: Boolean(result.is_aeon),
    };
  }

  async getAllRoutes(): Promise<RouteDefinition[]> {
    const results = await this.db
      .prepare('SELECT * FROM routes ORDER BY pattern')
      .all();

    return results.results.map((row) => ({
      pattern: row.pattern as string,
      sessionId: row.session_id as string,
      componentId: row.component_id as string,
      layout: row.layout as string | undefined,
      isAeon: Boolean(row.is_aeon),
    }));
  }

  async saveRoute(route: RouteDefinition): Promise<void> {
    await this.db
      .prepare(
        `
        INSERT OR REPLACE INTO routes (path, pattern, session_id, component_id, layout, is_aeon, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      )
      .bind(
        route.pattern,
        route.pattern,
        route.sessionId,
        route.componentId,
        route.layout ?? null,
        route.isAeon ? 1 : 0,
      )
      .run();
  }

  async deleteRoute(path: string): Promise<void> {
    await this.db.prepare('DELETE FROM routes WHERE path = ?').bind(path).run();
  }

  async getSession(sessionId: string): Promise<PageSession | null> {
    const result = await this.db
      .prepare('SELECT * FROM sessions WHERE session_id = ?')
      .bind(sessionId)
      .first();

    if (!result) return null;

    // Get presence for this session
    const presenceResults = await this.db
      .prepare('SELECT * FROM presence WHERE session_id = ?')
      .bind(sessionId)
      .all();

    return {
      route: result.route as string,
      tree: JSON.parse(result.tree as string),
      data: JSON.parse(result.data as string),
      schema: { version: result.schema_version as string },
      presence: presenceResults.results.map((p) => ({
        userId: p.user_id as string,
        role: p.role as 'user' | 'assistant' | 'monitor' | 'admin',
        cursor:
          p.cursor_x !== null
            ? { x: p.cursor_x as number, y: p.cursor_y as number }
            : undefined,
        focusNode: (p.focus_node as string | null) ?? undefined,
        selection:
          p.selection_start != null && p.selection_end != null
            ? {
                start: p.selection_start as number,
                end: p.selection_end as number,
                direction: (p.selection_direction as
                  | 'forward'
                  | 'backward'
                  | 'none'
                  | null) ?? undefined,
                path: (p.selection_path as string | null) ?? undefined,
              }
            : undefined,
        typing:
          p.typing != null
            ? {
                isTyping: Boolean(p.typing),
                field: (p.typing_field as string | null) ?? undefined,
                isComposing:
                  p.typing_composing != null
                    ? Boolean(p.typing_composing)
                    : undefined,
                startedAt:
                  (p.typing_started_at as string | null) ?? undefined,
                stoppedAt:
                  (p.typing_stopped_at as string | null) ?? undefined,
              }
            : undefined,
        scroll:
          p.scroll_depth != null
            ? {
                depth: p.scroll_depth as number,
                y: (p.scroll_y as number | null) ?? undefined,
                viewportHeight:
                  (p.scroll_viewport_height as number | null) ?? undefined,
                documentHeight:
                  (p.scroll_document_height as number | null) ?? undefined,
                path: (p.scroll_path as string | null) ?? undefined,
              }
            : undefined,
        viewport:
          p.viewport_width != null && p.viewport_height != null
            ? {
                width: p.viewport_width as number,
                height: p.viewport_height as number,
              }
            : undefined,
        inputState:
          p.input_field != null
            ? {
                field: p.input_field as string,
                hasFocus: Boolean(p.input_has_focus),
                valueLength:
                  (p.input_value_length as number | null) ?? undefined,
                selectionStart:
                  (p.input_selection_start as number | null) ?? undefined,
                selectionEnd:
                  (p.input_selection_end as number | null) ?? undefined,
                isComposing:
                  p.input_composing != null
                    ? Boolean(p.input_composing)
                    : undefined,
                inputMode: (p.input_mode as string | null) ?? undefined,
              }
            : undefined,
        emotion:
          p.emotion_primary != null ||
          p.emotion_secondary != null ||
          p.emotion_confidence != null ||
          p.emotion_intensity != null ||
          p.emotion_valence != null ||
          p.emotion_arousal != null ||
          p.emotion_dominance != null ||
          p.emotion_source != null
            ? {
                primary: (p.emotion_primary as string | null) ?? undefined,
                secondary: (p.emotion_secondary as string | null) ?? undefined,
                confidence:
                  (p.emotion_confidence as number | null) ?? undefined,
                intensity: (p.emotion_intensity as number | null) ?? undefined,
                valence: (p.emotion_valence as number | null) ?? undefined,
                arousal: (p.emotion_arousal as number | null) ?? undefined,
                dominance: (p.emotion_dominance as number | null) ?? undefined,
                source:
                  (p.emotion_source as
                    | 'self-report'
                    | 'inferred'
                    | 'sensor'
                    | 'hybrid'
                    | null) ?? undefined,
                updatedAt:
                  (p.emotion_updated_at as string | null) ?? undefined,
              }
            : undefined,
        editing: p.editing as string | undefined,
        status: p.status as 'online' | 'away' | 'offline',
        lastActivity: p.last_activity as string,
      })),
    };
  }

  async saveSession(session: PageSession): Promise<void> {
    await this.db
      .prepare(
        `
        INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      )
      .bind(
        this.routeToSessionId(session.route),
        session.route,
        JSON.stringify(session.tree),
        JSON.stringify(session.data),
        session.schema.version,
      )
      .run();
  }

  async getTree(sessionId: string): Promise<SerializedComponent | null> {
    const result = await this.db
      .prepare('SELECT tree FROM sessions WHERE session_id = ?')
      .bind(sessionId)
      .first();

    if (!result) return null;
    return JSON.parse(result.tree as string);
  }

  async saveTree(sessionId: string, tree: SerializedComponent): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE sessions SET tree = ?, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `,
      )
      .bind(JSON.stringify(tree), sessionId)
      .run();
  }

  private routeToSessionId(route: string): string {
    return route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
  }
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
  all(): Promise<{ results: Record<string, unknown>[] }>;
  run(): Promise<void>;
}

/**
 * Cloudflare Durable Object interface (matches Cloudflare Workers API)
 */
interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
  put<T>(key: string, value: T): Promise<void>;
  put<T>(entries: Record<string, T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  delete(keys: string[]): Promise<number>;
  list<T = unknown>(options?: {
    prefix?: string;
    limit?: number;
  }): Promise<Map<string, T>>;
  transaction<T>(
    closure: (txn: DurableObjectStorage) => Promise<T>,
  ): Promise<T>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
  id: DurableObjectId;
  waitUntil(promise: Promise<unknown>): void;
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
export class DurableObjectStorageAdapter implements StorageAdapter {
  name = 'durable-object';
  private namespace: DurableObjectNamespace;
  private routeCache: Map<string, RouteDefinition> = new Map();

  constructor(namespace: DurableObjectNamespace) {
    this.namespace = namespace;
  }

  async init(): Promise<void> {
    return Promise.resolve();
  }

  async getRoute(path: string): Promise<RouteDefinition | null> {
    // Check cache first
    if (this.routeCache.has(path)) {
      return this.routeCache.get(path)!;
    }

    // Get from the routes Durable Object
    const routesId = this.namespace.idFromName('__routes__');
    const routesStub = this.namespace.get(routesId);

    const response = await routesStub.fetch(
      new Request('http://internal/route', {
        method: 'POST',
        body: JSON.stringify({ action: 'get', path }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    if (!response.ok) return null;

    const route = (await response.json()) as RouteDefinition | null;
    if (route) {
      this.routeCache.set(path, route);
    }
    return route;
  }

  async getAllRoutes(): Promise<RouteDefinition[]> {
    const routesId = this.namespace.idFromName('__routes__');
    const routesStub = this.namespace.get(routesId);

    const response = await routesStub.fetch(
      new Request('http://internal/routes', {
        method: 'GET',
      }),
    );

    if (!response.ok) return [];
    return response.json() as Promise<RouteDefinition[]>;
  }

  async saveRoute(route: RouteDefinition): Promise<void> {
    const routesId = this.namespace.idFromName('__routes__');
    const routesStub = this.namespace.get(routesId);

    await routesStub.fetch(
      new Request('http://internal/route', {
        method: 'PUT',
        body: JSON.stringify(route),
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // Update cache
    this.routeCache.set(route.pattern, route);
  }

  async deleteRoute(path: string): Promise<void> {
    const routesId = this.namespace.idFromName('__routes__');
    const routesStub = this.namespace.get(routesId);

    await routesStub.fetch(
      new Request('http://internal/route', {
        method: 'DELETE',
        body: JSON.stringify({ path }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    this.routeCache.delete(path);
  }

  async getSession(sessionId: string): Promise<PageSession | null> {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);

    const response = await stub.fetch(
      new Request('http://internal/session', {
        method: 'GET',
      }),
    );

    if (!response.ok) return null;
    return response.json() as Promise<PageSession>;
  }

  async saveSession(session: PageSession): Promise<void> {
    const sessionId = this.routeToSessionId(session.route);
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);

    await stub.fetch(
      new Request('http://internal/session', {
        method: 'PUT',
        body: JSON.stringify(session),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  async getTree(sessionId: string): Promise<SerializedComponent | null> {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);

    const response = await stub.fetch(
      new Request('http://internal/tree', {
        method: 'GET',
      }),
    );

    if (!response.ok) return null;
    return response.json() as Promise<SerializedComponent>;
  }

  async saveTree(sessionId: string, tree: SerializedComponent): Promise<void> {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);

    await stub.fetch(
      new Request('http://internal/tree', {
        method: 'PUT',
        body: JSON.stringify(tree),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  /**
   * Get a direct stub for WebSocket connections
   * This allows real-time collaboration via Durable Object WebSockets
   */
  getSessionStub(sessionId: string): DurableObjectStub {
    const doId = this.namespace.idFromName(sessionId);
    return this.namespace.get(doId);
  }

  private routeToSessionId(route: string): string {
    return route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
  }
}

/** Fire-and-forget async operation (errors are silently ignored) */
const propagate = (promise: Promise<unknown>): void => {
  void promise.catch(() => undefined);
};

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
export class HybridStorageAdapter implements StorageAdapter {
  name = 'hybrid';
  private do: DurableObjectStorageAdapter;
  private d1: D1StorageAdapter;

  constructor(options: { namespace: DurableObjectNamespace; db: D1Database }) {
    this.do = new DurableObjectStorageAdapter(options.namespace);
    this.d1 = new D1StorageAdapter(options.db);
  }

  async init(): Promise<void> {
    await Promise.all([this.do.init(), this.d1.init()]);
  }

  async getRoute(path: string): Promise<RouteDefinition | null> {
    // Prefer Durable Object for latest data
    const route = await this.do.getRoute(path);
    if (route) return route;

    // Fall back to D1 for historical/replicated data
    return this.d1.getRoute(path);
  }

  async getAllRoutes(): Promise<RouteDefinition[]> {
    // Get from D1 for complete list (more efficient for large lists)
    return this.d1.getAllRoutes();
  }

  async saveRoute(route: RouteDefinition): Promise<void> {
    // Write to Durable Object first (strong consistency)
    await this.do.saveRoute(route);
    // Async propagate to D1 (eventual consistency, non-blocking)
    propagate(this.d1.saveRoute(route));
  }

  async deleteRoute(path: string): Promise<void> {
    // Delete from both in parallel
    await this.do.deleteRoute(path);
    propagate(this.d1.deleteRoute(path));
  }

  async getSession(sessionId: string): Promise<PageSession | null> {
    // Always get from Durable Object for real-time data
    return this.do.getSession(sessionId);
  }

  async saveSession(session: PageSession): Promise<void> {
    // Write to Durable Object first
    await this.do.saveSession(session);
    // Async propagate to D1 (non-blocking)
    propagate(this.d1.saveSession(session));
  }

  async getTree(sessionId: string): Promise<SerializedComponent | null> {
    return this.do.getTree(sessionId);
  }

  async saveTree(sessionId: string, tree: SerializedComponent): Promise<void> {
    await this.do.saveTree(sessionId, tree);
    // Async propagate to D1 (non-blocking)
    propagate(this.d1.saveTree(sessionId, tree));
  }

  /**
   * Get historical snapshots from D1
   */
  async getHistoricalSession(sessionId: string): Promise<PageSession | null> {
    return this.d1.getSession(sessionId);
  }

  /**
   * Get direct Durable Object stub for WebSocket connections
   */
  getSessionStub(sessionId: string): DurableObjectStub {
    return this.do.getSessionStub(sessionId);
  }
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
  subscribe<T>(
    collection: string,
    filter: DashFilter | undefined,
    callback: (changes: DashChange<T>[]) => void,
  ): DashSubscription;

  /** Batch operations */
  batch(operations: DashOperation[]): Promise<void>;
}

interface DashFilter {
  where?: Array<{
    field: string;
    op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'contains';
    value: unknown;
  }>;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
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
export class DashStorageAdapter implements StorageAdapter {
  name = 'dash';
  private client: DashClient;
  private collections: {
    routes: string;
    sessions: string;
    presence: string;
  };
  private subscriptions: DashSubscription[] = [];

  constructor(
    client: DashClient,
    options?: {
      routesCollection?: string;
      sessionsCollection?: string;
      presenceCollection?: string;
    },
  ) {
    this.client = client;
    this.collections = {
      routes: options?.routesCollection ?? 'aeon-routes',
      sessions: options?.sessionsCollection ?? 'aeon-sessions',
      presence: options?.presenceCollection ?? 'aeon-presence',
    };
  }

  async init(): Promise<void> {
    // Connect to Dash if not already connected
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }

  async getRoute(path: string): Promise<RouteDefinition | null> {
    const route = await this.client.get<RouteDefinition>(
      this.collections.routes,
      this.pathToId(path),
    );
    return route;
  }

  async getAllRoutes(): Promise<RouteDefinition[]> {
    const routes = await this.client.query<RouteDefinition>(
      this.collections.routes,
      { orderBy: { field: 'pattern', direction: 'asc' } },
    );
    return routes;
  }

  async saveRoute(route: RouteDefinition): Promise<void> {
    await this.client.set(
      this.collections.routes,
      this.pathToId(route.pattern),
      route,
    );
  }

  async deleteRoute(path: string): Promise<void> {
    await this.client.delete(this.collections.routes, this.pathToId(path));
  }

  async getSession(sessionId: string): Promise<PageSession | null> {
    const session = await this.client.get<PageSession>(
      this.collections.sessions,
      sessionId,
    );

    if (!session) return null;

    // Get presence for this session
    const presence = await this.client.query<PresenceRecord>(
      this.collections.presence,
      {
        where: [{ field: 'sessionId', op: '==', value: sessionId }],
      },
    );

    return {
      ...session,
      presence: presence.map((p) => ({
        userId: p.userId,
        role: p.role,
        cursor: p.cursor,
        focusNode: p.focusNode,
        selection: p.selection,
        typing: p.typing,
        scroll: p.scroll,
        viewport: p.viewport,
        inputState: p.inputState,
        emotion: p.emotion,
        editing: p.editing,
        status: p.status,
        lastActivity: p.lastActivity,
      })),
    };
  }

  async saveSession(session: PageSession): Promise<void> {
    const sessionId = this.routeToSessionId(session.route);

    // Save session (without presence, that's managed separately)
    const { presence: _, ...sessionData } = session;
    await this.client.set(this.collections.sessions, sessionId, sessionData);
  }

  async getTree(sessionId: string): Promise<SerializedComponent | null> {
    const session = await this.getSession(sessionId);
    return session?.tree ?? null;
  }

  async saveTree(sessionId: string, tree: SerializedComponent): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.client.set(this.collections.sessions, sessionId, {
        ...session,
        tree,
      });
    }
  }

  /**
   * Subscribe to real-time route changes
   */
  subscribeToRoutes(
    callback: (changes: DashChange<RouteDefinition>[]) => void,
  ): DashSubscription {
    const sub = this.client.subscribe<RouteDefinition>(
      this.collections.routes,
      undefined,
      callback,
    );
    this.subscriptions.push(sub);
    return sub;
  }

  /**
   * Subscribe to real-time session changes
   */
  subscribeToSession(
    sessionId: string,
    callback: (changes: DashChange<PageSession>[]) => void,
  ): DashSubscription {
    const sub = this.client.subscribe<PageSession>(
      this.collections.sessions,
      { where: [{ field: 'id', op: '==', value: sessionId }] },
      callback,
    );
    this.subscriptions.push(sub);
    return sub;
  }

  /**
   * Subscribe to presence updates for a session
   */
  subscribeToPresence(
    sessionId: string,
    callback: (changes: DashChange<PresenceRecord>[]) => void,
  ): DashSubscription {
    const sub = this.client.subscribe<PresenceRecord>(
      this.collections.presence,
      { where: [{ field: 'sessionId', op: '==', value: sessionId }] },
      callback,
    );
    this.subscriptions.push(sub);
    return sub;
  }

  /**
   * Update presence for current user
   */
  async updatePresence(
    sessionId: string,
    userId: string,
    presence: Partial<PresenceRecord>,
  ): Promise<void> {
    await this.client.set(this.collections.presence, `${sessionId}:${userId}`, {
      sessionId,
      userId,
      ...presence,
      lastActivity: new Date().toISOString(),
    });
  }

  /**
   * Clean up subscriptions
   */
  destroy(): void {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
  }

  private pathToId(path: string): string {
    return path.replace(/\//g, '_').replace(/^_/, '') || 'index';
  }

  private routeToSessionId(route: string): string {
    return route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
  }
}

interface PresenceRecord {
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'monitor' | 'admin';
  cursor?: { x: number; y: number };
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
  viewport?: { width: number; height: number };
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
export function createStorageAdapter(config: {
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
}): StorageAdapter {
  switch (config.type) {
    case 'd1':
      if (!config.d1) {
        throw new Error('D1 database required for d1 storage adapter');
      }
      return new D1StorageAdapter(config.d1);

    case 'durable-object':
      if (!config.durableObjectNamespace) {
        throw new Error(
          'Durable Object namespace required for durable-object storage adapter',
        );
      }
      return new DurableObjectStorageAdapter(config.durableObjectNamespace);

    case 'hybrid':
      if (!config.durableObjectNamespace || !config.d1) {
        throw new Error(
          'Both Durable Object namespace and D1 database required for hybrid storage adapter',
        );
      }
      return new HybridStorageAdapter({
        namespace: config.durableObjectNamespace,
        db: config.d1,
      });

    case 'dash':
      if (!config.dash) {
        throw new Error('Dash client required for dash storage adapter');
      }
      return new DashStorageAdapter(config.dash, {
        routesCollection: config.dashCollections?.routes,
        sessionsCollection: config.dashCollections?.sessions,
        presenceCollection: config.dashCollections?.presence,
      });

    case 'custom':
      if (!config.custom) {
        throw new Error('Custom adapter required for custom storage');
      }
      return config.custom;

    case 'file':
    default:
      return new FileStorageAdapter({
        pagesDir: config.pagesDir ?? './pages',
        dataDir: config.dataDir ?? '.aeon/data',
      });
  }
}

// All adapters are exported inline with their class declarations
