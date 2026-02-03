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

import type { PageSession, SerializedComponent, PresenceUser } from './types';

interface Env {
  // D1 database for async propagation
  DB?: D1Database;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<void>;
}

interface WebSocketMessage {
  type: 'cursor' | 'edit' | 'presence' | 'sync' | 'ping';
  payload: unknown;
}

interface CursorPayload {
  x: number;
  y: number;
}

interface EditPayload {
  path: string;
  value: unknown;
  timestamp: string;
}

interface PresencePayload {
  status: 'online' | 'away' | 'offline';
  editing?: string;
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
export class AeonPageSession {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<WebSocket, PresenceUser> = new Map();
  private session: PageSession | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // Handle REST API
    switch (url.pathname) {
      case '/session':
        return this.handleSessionRequest(request);
      case '/tree':
        return this.handleTreeRequest(request);
      case '/presence':
        return this.handlePresenceRequest(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Get user info from query params or headers
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || crypto.randomUUID();
    const role = (url.searchParams.get('role') || 'user') as PresenceUser['role'];

    // Accept the WebSocket
    (server as WebSocket & { accept: () => void }).accept();

    // Create presence entry
    const presence: PresenceUser = {
      userId,
      role,
      status: 'online',
      lastActivity: new Date().toISOString(),
    };

    this.sessions.set(server, presence);

    // Send initial state
    const session = await this.getSession();
    if (session) {
      server.send(JSON.stringify({
        type: 'init',
        payload: {
          session,
          presence: Array.from(this.sessions.values()),
        },
      }));
    }

    // Broadcast join to others
    this.broadcast({
      type: 'presence',
      payload: {
        action: 'join',
        user: presence,
      },
    }, server);

    // Handle messages
    server.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string) as WebSocketMessage;
        await this.handleMessage(server, message);
      } catch (err) {
        console.error('Failed to handle message:', err);
      }
    });

    // Handle disconnect
    server.addEventListener('close', () => {
      const user = this.sessions.get(server);
      this.sessions.delete(server);

      if (user) {
        this.broadcast({
          type: 'presence',
          payload: {
            action: 'leave',
            userId: user.userId,
          },
        });
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleMessage(ws: WebSocket, message: WebSocketMessage): Promise<void> {
    const user = this.sessions.get(ws);
    if (!user) return;

    // Update last activity
    user.lastActivity = new Date().toISOString();

    switch (message.type) {
      case 'cursor': {
        const payload = message.payload as CursorPayload;
        user.cursor = { x: payload.x, y: payload.y };
        this.broadcast({
          type: 'cursor',
          payload: {
            userId: user.userId,
            cursor: user.cursor,
          },
        }, ws);
        break;
      }

      case 'edit': {
        const payload = message.payload as EditPayload;
        await this.applyEdit(payload);
        this.broadcast({
          type: 'edit',
          payload: {
            ...payload,
            userId: user.userId,
          },
        }, ws);
        break;
      }

      case 'presence': {
        const payload = message.payload as PresencePayload;
        user.status = payload.status;
        user.editing = payload.editing;
        this.broadcast({
          type: 'presence',
          payload: {
            action: 'update',
            user,
          },
        }, ws);
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
        break;
      }
    }
  }

  private broadcast(message: object, exclude?: WebSocket): void {
    const data = JSON.stringify(message);
    for (const [ws] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  private async applyEdit(edit: EditPayload): Promise<void> {
    const session = await this.getSession();
    if (!session) return;

    // Apply edit to tree using path
    const parts = edit.path.split('.');
    let current: unknown = session.tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      }
    }

    if (typeof current === 'object' && current !== null) {
      const lastPart = parts[parts.length - 1];
      (current as Record<string, unknown>)[lastPart] = edit.value;
    }

    // Save updated session
    await this.saveSession(session);

    // Async propagate to D1
    if (this.env.DB) {
      this.state.waitUntil(this.propagateToD1(session));
    }
  }

  private async propagateToD1(session: PageSession): Promise<void> {
    if (!this.env.DB) return;

    try {
      await this.env.DB
        .prepare(`
          INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `)
        .bind(
          this.state.id.toString(),
          session.route,
          JSON.stringify(session.tree),
          JSON.stringify(session.data),
          session.schema.version
        )
        .run();
    } catch (err) {
      console.error('Failed to propagate to D1:', err);
    }
  }

  private async handleSessionRequest(request: Request): Promise<Response> {
    switch (request.method) {
      case 'GET': {
        const session = await this.getSession();
        if (!session) {
          return new Response('Not found', { status: 404 });
        }
        return Response.json(session);
      }

      case 'PUT': {
        const session = await request.json() as PageSession;
        await this.saveSession(session);
        return new Response('OK', { status: 200 });
      }

      default:
        return new Response('Method not allowed', { status: 405 });
    }
  }

  private async handleTreeRequest(request: Request): Promise<Response> {
    switch (request.method) {
      case 'GET': {
        const tree = await this.state.storage.get<SerializedComponent>('tree');
        if (!tree) {
          return new Response('Not found', { status: 404 });
        }
        return Response.json(tree);
      }

      case 'PUT': {
        const tree = await request.json() as SerializedComponent;
        await this.state.storage.put('tree', tree);
        return new Response('OK', { status: 200 });
      }

      default:
        return new Response('Method not allowed', { status: 405 });
    }
  }

  private async handlePresenceRequest(_request: Request): Promise<Response> {
    return Response.json(Array.from(this.sessions.values()));
  }

  private async getSession(): Promise<PageSession | null> {
    if (this.session) return this.session;

    const stored = await this.state.storage.get<PageSession>('session');
    if (stored) {
      this.session = stored;
    }
    return this.session;
  }

  private async saveSession(session: PageSession): Promise<void> {
    this.session = session;
    await this.state.storage.put('session', session);
  }
}

/**
 * Aeon Routes Registry Durable Object
 *
 * Singleton that manages the route registry with strong consistency.
 * Used via: namespace.idFromName('__routes__')
 */
export class AeonRoutesRegistry {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/route':
        return this.handleRouteRequest(request);
      case '/routes':
        return this.handleRoutesRequest(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleRouteRequest(request: Request): Promise<Response> {
    switch (request.method) {
      case 'POST': {
        // Get route by path
        const { path } = await request.json() as { action: string; path: string };
        const route = await this.state.storage.get(`route:${path}`);
        if (!route) {
          return new Response('Not found', { status: 404 });
        }
        return Response.json(route);
      }

      case 'PUT': {
        // Save route
        const route = await request.json() as { pattern: string };
        await this.state.storage.put(`route:${route.pattern}`, route);
        return new Response('OK', { status: 200 });
      }

      case 'DELETE': {
        // Delete route
        const { path } = await request.json() as { path: string };
        await this.state.storage.delete(`route:${path}`);
        return new Response('OK', { status: 200 });
      }

      default:
        return new Response('Method not allowed', { status: 405 });
    }
  }

  private async handleRoutesRequest(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const routes = await this.state.storage.list({ prefix: 'route:' });
    return Response.json(Array.from(routes.values()));
  }
}

// Type augmentations for Cloudflare Workers runtime
interface DurableObjectState {
  storage: DurableObjectStorage;
  id: DurableObjectId;
  waitUntil(promise: Promise<unknown>): void;
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T = unknown>(options?: { prefix?: string }): Promise<Map<string, T>>;
}

interface DurableObjectId {
  toString(): string;
}

declare class WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}
