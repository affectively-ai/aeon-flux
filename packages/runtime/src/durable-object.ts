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

import type {
  PageSession,
  SerializedComponent,
  PresenceUser,
  WebhookConfig,
  WebhookPayload,
} from './types';
import { compileTreeToTSX } from './tree-compiler';

interface Env {
  // D1 database for async propagation
  DB?: D1Database;
  // GitHub integration for tree PRs
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string; // "owner/repo"
  GITHUB_TREE_PATH?: string; // e.g., "apps/web/trees" or "packages/app/src/trees"
  GITHUB_BASE_BRANCH?: string; // Target branch for PRs (default: repo default)
  GITHUB_DEV_BRANCH?: string; // Branch to create from (default: base branch)
  GITHUB_AUTO_MERGE?: string; // "true" to auto-merge PRs
  // Webhook secret for GitHub verification
  GITHUB_WEBHOOK_SECRET?: string;
  // Callback URL when session changes (for sync)
  SYNC_WEBHOOK_URL?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<void>;
}

interface WebSocketMessage {
  type:
    | 'cursor'
    | 'edit'
    | 'presence'
    | 'sync'
    | 'ping'
    | 'publish'
    | 'merge'
    | 'queue-sync'
    | 'conflict'
    | 'conflict-resolved';
  payload: unknown;
}

interface PublishPayload {
  prNumber?: number; // For merge operations
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
  private webhooks: WebhookConfig[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Load webhooks from storage on init
    this.state.blockConcurrencyWhile(async () => {
      this.webhooks =
        (await this.state.storage.get<WebhookConfig[]>('webhooks')) || [];
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // Handle REST API
    switch (url.pathname) {
      case '/':
      case '/session':
        return this.handleSessionRequest(request);
      case '/init':
        return this.handleInitRequest(request);
      case '/tree':
        return this.handleTreeRequest(request);
      case '/presence':
        return this.handlePresenceRequest(request);
      case '/webhook':
        return this.handleWebhookEndpoint(request);
      case '/webhooks':
        return this.handleWebhooksConfig(request);
      case '/version':
        return this.handleVersionRequest(request);
      case '/sync-queue':
        return this.handleSyncQueueRequest(request);
      case '/queue-status':
        return this.handleQueueStatusRequest(request);
      case '/resolve-conflict':
        return this.handleResolveConflictRequest(request);
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
    const role = (url.searchParams.get('role') ||
      'user') as PresenceUser['role'];

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
      server.send(
        JSON.stringify({
          type: 'init',
          payload: {
            session,
            presence: Array.from(this.sessions.values()),
          },
        }),
      );
    }

    // Broadcast join to others
    this.broadcast(
      {
        type: 'presence',
        payload: {
          action: 'join',
          user: presence,
        },
      },
      server,
    );

    // Handle messages
    server.addEventListener('message', async (event: MessageEvent) => {
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

  private async handleMessage(
    ws: WebSocket,
    message: WebSocketMessage,
  ): Promise<void> {
    const user = this.sessions.get(ws);
    if (!user) return;

    // Update last activity
    user.lastActivity = new Date().toISOString();

    switch (message.type) {
      case 'cursor': {
        const payload = message.payload as CursorPayload;
        user.cursor = { x: payload.x, y: payload.y };
        this.broadcast(
          {
            type: 'cursor',
            payload: {
              userId: user.userId,
              cursor: user.cursor,
            },
          },
          ws,
        );
        break;
      }

      case 'edit': {
        const payload = message.payload as EditPayload;
        await this.applyEdit(payload, user.userId);
        this.broadcast(
          {
            type: 'edit',
            payload: {
              ...payload,
              userId: user.userId,
            },
          },
          ws,
        );
        break;
      }

      case 'presence': {
        const payload = message.payload as PresencePayload;
        user.status = payload.status;
        user.editing = payload.editing;
        this.broadcast(
          {
            type: 'presence',
            payload: {
              action: 'update',
              user,
            },
          },
          ws,
        );
        break;
      }

      case 'ping': {
        ws.send(
          JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }),
        );
        break;
      }

      case 'publish': {
        // Trigger a PR for current tree state
        const session = await this.getSession();
        if (session) {
          const prNumber = await this.createTreePR(session);
          const autoMerged = this.env.GITHUB_AUTO_MERGE === 'true';
          ws.send(
            JSON.stringify({
              type: 'publish',
              payload: {
                status: 'created',
                route: session.route,
                prNumber,
                autoMerged,
              },
            }),
          );
          this.broadcast(
            {
              type: 'publish',
              payload: {
                status: 'created',
                userId: user.userId,
                route: session.route,
                prNumber,
                autoMerged,
              },
            },
            ws,
          );

          // Fire webhook for publish event
          await this.fireWebhook(
            'session.published',
            session,
            prNumber as number | undefined,
            user.userId,
          );
        }
        break;
      }

      case 'merge': {
        // Merge a specific PR
        const payload = message.payload as PublishPayload;
        if (payload.prNumber) {
          const merged = await this.mergePR(payload.prNumber);
          ws.send(
            JSON.stringify({
              type: 'merge',
              payload: {
                status: merged ? 'merged' : 'failed',
                prNumber: payload.prNumber,
              },
            }),
          );
          if (merged) {
            this.broadcast(
              {
                type: 'merge',
                payload: {
                  status: 'merged',
                  userId: user.userId,
                  prNumber: payload.prNumber,
                },
              },
              ws,
            );

            // Fire webhook for merge event
            const session = await this.getSession();
            if (session) {
              await this.fireWebhook(
                'session.merged',
                session,
                payload.prNumber,
                user.userId,
              );
            }
          }
        }
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

  private async applyEdit(edit: EditPayload, userId?: string): Promise<void> {
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

    // Save updated session with version increment and webhook
    await this.saveSession(session, userId);

    // Async propagate to D1
    if (this.env.DB) {
      this.state.waitUntil(this.propagateToD1(session));
    }
  }

  private async propagateToD1(session: PageSession): Promise<void> {
    if (!this.env.DB) return;

    try {
      await this.env.DB.prepare(
        `
          INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
      )
        .bind(
          this.state.id.toString(),
          session.route,
          JSON.stringify(session.tree),
          JSON.stringify(session.data),
          session.schema.version,
        )
        .run();
    } catch (err) {
      console.error('Failed to propagate to D1:', err);
    }
  }

  /**
   * Create a GitHub PR when tree changes
   */
  private async createTreePR(
    session: PageSession,
  ): Promise<number | undefined> {
    if (!this.env.GITHUB_TOKEN || !this.env.GITHUB_REPO) return undefined;

    const [owner, repo] = this.env.GITHUB_REPO.split('/');
    const branch = `tree/${session.route.replace(/\//g, '-') || 'index'}-${Date.now()}`;
    const basePath = this.env.GITHUB_TREE_PATH || 'pages';
    const routePath = session.route === '/' ? '/index' : session.route;
    const path = `${basePath}${routePath}/page.tsx`;

    // Compile tree to TSX
    const tsx = compileTreeToTSX(session.tree as any, {
      route: session.route,
      useAeon: true,
    });
    const content = btoa(tsx);

    try {
      const headers = {
        Authorization: `token ${this.env.GITHUB_TOKEN}`,
        'User-Agent': 'aeon-flux',
      };

      // Get repo info for default branch
      const repoRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers },
      );
      const repoData = (await repoRes.json()) as { default_branch: string };

      // Determine branches
      const baseBranch = this.env.GITHUB_BASE_BRANCH || repoData.default_branch;
      const devBranch = this.env.GITHUB_DEV_BRANCH || baseBranch;

      // Get SHA from dev branch (branch off from here)
      const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${devBranch}`,
        { headers },
      );
      const refData = (await refRes.json()) as { object: { sha: string } };

      // Create feature branch
      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: refData.object.sha,
        }),
      });

      // Create/update file
      await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Update tree: ${session.route}`,
            content,
            branch,
          }),
        },
      );

      // Create PR targeting base branch
      const prRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `🌳 Tree update: ${session.route}`,
            head: branch,
            base: baseBranch,
            body: `Automated PR from aeon-flux collaborative editing.\n\n**Route:** \`${session.route}\`\n**Session:** \`${this.state.id.toString()}\`\n**From:** \`${devBranch}\` → \`${baseBranch}\``,
          }),
        },
      );
      const prData = (await prRes.json()) as { number: number };

      // Auto-merge if enabled
      if (this.env.GITHUB_AUTO_MERGE === 'true' && prData.number) {
        await this.mergePR(prData.number);
      }

      return prData.number;
    } catch (err) {
      console.error('Failed to create PR:', err);
      return undefined;
    }
  }

  /**
   * Merge a GitHub PR
   */
  private async mergePR(prNumber: number): Promise<boolean> {
    if (!this.env.GITHUB_TOKEN || !this.env.GITHUB_REPO) return false;

    const [owner, repo] = this.env.GITHUB_REPO.split('/');
    const headers = {
      Authorization: `token ${this.env.GITHUB_TOKEN}`,
      'User-Agent': 'aeon-flux',
    };

    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
        {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commit_title: `🌳 Merge tree update #${prNumber}`,
            merge_method: 'squash',
          }),
        },
      );
      return res.ok;
    } catch (err) {
      console.error('Failed to merge PR:', err);
      return false;
    }
  }

  /**
   * Handle GitHub webhook callbacks (push events)
   * This is called when GitHub pushes changes to the repo
   */
  private async handleWebhookEndpoint(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Verify GitHub signature if secret is configured
    if (this.env.GITHUB_WEBHOOK_SECRET) {
      const signature = request.headers.get('X-Hub-Signature-256');
      if (!signature) {
        return new Response('Missing signature', { status: 401 });
      }

      const body = await request.text();
      const isValid = await this.verifyGitHubSignature(body, signature);
      if (!isValid) {
        return new Response('Invalid signature', { status: 401 });
      }

      // Parse the verified body
      const payload = JSON.parse(body) as {
        ref?: string;
        commits?: Array<{ modified?: string[]; added?: string[] }>;
      };
      return this.processGitHubWebhook(
        payload,
        request.headers.get('X-GitHub-Event') || 'push',
      );
    }

    // No secret configured, process directly
    const payload = (await request.json()) as {
      ref?: string;
      commits?: Array<{ modified?: string[]; added?: string[] }>;
    };
    return this.processGitHubWebhook(
      payload,
      request.headers.get('X-GitHub-Event') || 'push',
    );
  }

  /**
   * Verify GitHub webhook signature
   */
  private async verifyGitHubSignature(
    body: string,
    signature: string,
  ): Promise<boolean> {
    if (!this.env.GITHUB_WEBHOOK_SECRET) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.env.GITHUB_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const computed =
      'sha256=' +
      Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return signature === computed;
  }

  /**
   * Process GitHub webhook events
   */
  private async processGitHubWebhook(
    payload: {
      ref?: string;
      commits?: Array<{ modified?: string[]; added?: string[] }>;
    },
    event: string,
  ): Promise<Response> {
    // Only process push events
    if (event !== 'push') {
      return Response.json({ status: 'ignored', event });
    }

    // Check if this push affects our tree path
    const treePath = this.env.GITHUB_TREE_PATH || 'pages';
    const affectedFiles = [
      ...(payload.commits?.flatMap((c) => c.modified || []) || []),
      ...(payload.commits?.flatMap((c) => c.added || []) || []),
    ];

    const relevantFiles = affectedFiles.filter((f) => f.startsWith(treePath));
    if (relevantFiles.length === 0) {
      return Response.json({ status: 'ignored', reason: 'no relevant files' });
    }

    // Fire webhook to notify sync system
    const session = await this.getSession();
    if (session) {
      await this.fireWebhook('github.push', session, undefined, 'github');
    }

    // Broadcast to connected clients
    this.broadcast({
      type: 'sync',
      payload: {
        action: 'github-push',
        files: relevantFiles,
        timestamp: new Date().toISOString(),
      },
    });

    return Response.json({ status: 'processed', files: relevantFiles });
  }

  /**
   * Handle webhook configuration (register/list)
   */
  private async handleWebhooksConfig(request: Request): Promise<Response> {
    switch (request.method) {
      case 'GET': {
        // List registered webhooks (without secrets)
        const safeWebhooks = this.webhooks.map((w) => ({
          url: w.url,
          events: w.events,
          hasSecret: !!w.secret,
        }));
        return Response.json(safeWebhooks);
      }

      case 'POST': {
        // Register a new webhook
        const config = (await request.json()) as WebhookConfig;
        if (!config.url || !config.events || config.events.length === 0) {
          return new Response('Invalid webhook config', { status: 400 });
        }

        // Add webhook
        this.webhooks.push(config);
        await this.state.storage.put('webhooks', this.webhooks);

        return Response.json({ status: 'registered', url: config.url });
      }

      case 'DELETE': {
        // Remove a webhook by URL
        const { url } = (await request.json()) as { url: string };
        this.webhooks = this.webhooks.filter((w) => w.url !== url);
        await this.state.storage.put('webhooks', this.webhooks);

        return Response.json({ status: 'removed', url });
      }

      default:
        return new Response('Method not allowed', { status: 405 });
    }
  }

  /**
   * Handle version request
   */
  private async handleVersionRequest(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const session = await this.getSession();
    if (!session) {
      return new Response('Not found', { status: 404 });
    }

    return Response.json({
      version: session.version || 0,
      updatedAt: session.updatedAt,
      updatedBy: session.updatedBy,
      schemaVersion: session.schema.version,
    });
  }

  /**
   * Fire webhooks for an event
   */
  private async fireWebhook(
    event: WebhookPayload['event'],
    session: PageSession,
    prNumber?: number,
    triggeredBy?: string,
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      sessionId: this.state.id.toString(),
      route: session.route,
      version: session.version || 0,
      timestamp: new Date().toISOString(),
      prNumber,
      triggeredBy,
    };

    // Fire to registered webhooks
    const eventType = event.split('.')[1] as
      | 'edit'
      | 'publish'
      | 'merge'
      | 'all';
    const relevantWebhooks = this.webhooks.filter(
      (w) => w.events.includes('all') || w.events.includes(eventType as any),
    );

    const webhookPromises = relevantWebhooks.map(async (webhook) => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Aeon-Event': event,
          'X-Aeon-Session': this.state.id.toString(),
        };

        // Add HMAC signature if secret is configured
        if (webhook.secret) {
          const body = JSON.stringify(payload);
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(webhook.secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
          );
          const sig = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(body),
          );
          headers['X-Aeon-Signature'] = Array.from(new Uint8Array(sig))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }

        await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error(`Failed to fire webhook to ${webhook.url}:`, err);
      }
    });

    // Also fire to env-configured sync webhook
    if (this.env.SYNC_WEBHOOK_URL) {
      webhookPromises.push(
        fetch(this.env.SYNC_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Aeon-Event': event,
            'X-Aeon-Session': this.state.id.toString(),
          },
          body: JSON.stringify(payload),
        })
          .then(() => {})
          .catch((err) => console.error('Failed to fire sync webhook:', err)),
      );
    }

    // Fire all webhooks in parallel, don't wait
    this.state.waitUntil(Promise.all(webhookPromises));
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
        const session = (await request.json()) as PageSession;
        await this.saveSession(session);
        return new Response('OK', { status: 200 });
      }

      default:
        return new Response('Method not allowed', { status: 405 });
    }
  }

  /**
   * Handle session initialization (POST /init)
   * Creates a new session or returns existing one
   */
  private async handleInitRequest(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = (await request.json()) as PageSession;

      // Check if session already exists
      const existing = await this.getSession();
      if (existing) {
        return Response.json({ status: 'exists', session: existing });
      }

      // Create new session
      const session: PageSession = {
        route: body.route || '/',
        tree: body.tree || { type: 'div', props: {}, children: [] },
        data: body.data || {},
        schema: body.schema || { version: '1.0.0' },
        version: 1,
        updatedAt: new Date().toISOString(),
        presence: [],
      };

      await this.saveSession(session, 'bootstrap', false);

      return Response.json({ status: 'created', session });
    } catch (err) {
      console.error('Failed to initialize session:', err);
      return new Response(
        JSON.stringify({
          error: 'Failed to initialize session',
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
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
        const tree = (await request.json()) as SerializedComponent;
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

  private async saveSession(
    session: PageSession,
    triggeredBy?: string,
    fireWebhooks = true,
  ): Promise<void> {
    // Increment version
    session.version = (session.version || 0) + 1;
    session.updatedAt = new Date().toISOString();
    if (triggeredBy) {
      session.updatedBy = triggeredBy;
    }

    this.session = session;
    await this.state.storage.put('session', session);

    // Fire webhooks for session update
    if (fireWebhooks) {
      await this.fireWebhook(
        'session.updated',
        session,
        undefined,
        triggeredBy,
      );
    }
  }

  // ============================================================================
  // Sync Queue Endpoints (for offline-first support)
  // ============================================================================

  /**
   * Handle sync queue batch (POST /sync-queue)
   * Receives a batch of offline operations to sync
   */
  private async handleSyncQueueRequest(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const batch = (await request.json()) as {
        batchId: string;
        operations: Array<{
          operationId: string;
          type: string;
          sessionId: string;
          data: Record<string, unknown>;
          timestamp: number;
        }>;
      };

      const synced: string[] = [];
      const failed: Array<{
        operationId: string;
        error: string;
        retryable: boolean;
      }> = [];
      const conflicts: Array<{
        operationId: string;
        remoteVersion: Record<string, unknown>;
        strategy: string;
      }> = [];

      // Process each operation
      for (const op of batch.operations) {
        try {
          // Check for conflicts with current session state
          const session = await this.getSession();
          if (
            session &&
            (op.type === 'session_update' || op.type === 'tree_update')
          ) {
            // Simple last-write-wins for now
            // More sophisticated CRDT-based resolution could be added
            const currentVersion = session.version || 0;
            const opVersion = (op.data as { version?: number })?.version || 0;

            if (opVersion < currentVersion) {
              conflicts.push({
                operationId: op.operationId,
                remoteVersion: {
                  version: currentVersion,
                  updatedAt: session.updatedAt || '',
                },
                strategy: 'remote-wins',
              });
              continue;
            }
          }

          // Apply the operation
          if (op.type === 'session_update') {
            const currentSession = await this.getSession();
            if (currentSession) {
              const newSession = { ...currentSession, ...op.data };
              await this.saveSession(
                newSession as PageSession,
                'sync-queue',
                true,
              );
            }
          } else if (op.type === 'tree_update') {
            const tree = op.data as unknown as SerializedComponent;
            await this.state.storage.put('tree', tree);
          } else if (op.type === 'data_update') {
            const session = await this.getSession();
            if (session) {
              session.data = { ...session.data, ...op.data };
              await this.saveSession(session, 'sync-queue', true);
            }
          }

          synced.push(op.operationId);
        } catch (err) {
          failed.push({
            operationId: op.operationId,
            error: err instanceof Error ? err.message : 'Unknown error',
            retryable: true,
          });
        }
      }

      // Store sync record for audit
      await this.state.storage.put(`sync:${batch.batchId}`, {
        batchId: batch.batchId,
        processedAt: Date.now(),
        synced: synced.length,
        failed: failed.length,
        conflicts: conflicts.length,
      });

      return Response.json({
        success: failed.length === 0,
        synced,
        failed,
        conflicts,
        serverTimestamp: Date.now(),
      });
    } catch (err) {
      console.error('Failed to process sync queue:', err);
      return new Response(
        JSON.stringify({
          error: 'Failed to process sync queue',
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle queue status request (GET /queue-status)
   * Returns pending operations for this session
   */
  private async handleQueueStatusRequest(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Get all stored sync records
      const syncRecords = await this.state.storage.list<{
        batchId: string;
        processedAt: number;
        synced: number;
        failed: number;
        conflicts: number;
      }>({ prefix: 'sync:' });

      // Get pending conflicts
      const conflicts = await this.state.storage.list<{
        conflictId: string;
        operationId: string;
        localData: Record<string, unknown>;
        remoteData: Record<string, unknown>;
        detectedAt: number;
      }>({ prefix: 'conflict:' });

      const unresolvedConflicts = Array.from(conflicts.values()).filter(
        (c) => !(c as { resolved?: boolean }).resolved,
      );

      return Response.json({
        pendingOperations: 0, // Operations are processed immediately
        recentSyncs: Array.from(syncRecords.values()).slice(-10),
        unresolvedConflicts: unresolvedConflicts.length,
        conflicts: unresolvedConflicts,
      });
    } catch (err) {
      console.error('Failed to get queue status:', err);
      return new Response(
        JSON.stringify({ error: 'Failed to get queue status' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle conflict resolution (POST /resolve-conflict)
   * Manually resolve a detected conflict
   */
  private async handleResolveConflictRequest(
    request: Request,
  ): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { conflictId, strategy, resolvedData, resolvedBy } =
        (await request.json()) as {
          conflictId: string;
          strategy: 'local-wins' | 'remote-wins' | 'merge' | 'manual';
          resolvedData?: Record<string, unknown>;
          resolvedBy?: string;
        };

      // Get the conflict
      const conflict = await this.state.storage.get<{
        conflictId: string;
        operationId: string;
        localData: Record<string, unknown>;
        remoteData: Record<string, unknown>;
        detectedAt: number;
      }>(`conflict:${conflictId}`);

      if (!conflict) {
        return new Response(JSON.stringify({ error: 'Conflict not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Determine resolved data based on strategy
      let finalData: Record<string, unknown>;
      switch (strategy) {
        case 'local-wins':
          finalData = conflict.localData;
          break;
        case 'remote-wins':
          finalData = conflict.remoteData;
          break;
        case 'merge':
          finalData = { ...conflict.remoteData, ...conflict.localData };
          break;
        case 'manual':
          if (!resolvedData) {
            return new Response(
              JSON.stringify({
                error: 'resolvedData required for manual strategy',
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
          }
          finalData = resolvedData;
          break;
      }

      // Apply the resolution
      const session = await this.getSession();
      if (session) {
        session.data = { ...session.data, ...finalData };
        await this.saveSession(
          session,
          resolvedBy || 'conflict-resolution',
          true,
        );
      }

      // Mark conflict as resolved
      await this.state.storage.put(`conflict:${conflictId}`, {
        ...conflict,
        resolved: true,
        resolution: {
          strategy,
          resolvedData: finalData,
          resolvedAt: Date.now(),
          resolvedBy,
        },
      });

      // Broadcast resolution to connected clients
      this.broadcast({
        type: 'conflict-resolved',
        payload: {
          conflictId,
          strategy,
          resolvedData: finalData,
        },
      });

      return Response.json({
        success: true,
        conflictId,
        strategy,
        resolvedData: finalData,
      });
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
      return new Response(
        JSON.stringify({
          error: 'Failed to resolve conflict',
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
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
        const { path } = (await request.json()) as {
          action: string;
          path: string;
        };
        const route = await this.state.storage.get(`route:${path}`);
        if (!route) {
          return new Response('Not found', { status: 404 });
        }
        return Response.json(route);
      }

      case 'PUT': {
        // Save route
        const route = (await request.json()) as { pattern: string };
        await this.state.storage.put(`route:${route.pattern}`, route);
        return new Response('OK', { status: 200 });
      }

      case 'DELETE': {
        // Delete route
        const { path } = (await request.json()) as { path: string };
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
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
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
