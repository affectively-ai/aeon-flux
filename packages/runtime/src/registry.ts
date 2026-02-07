/**
 * Aeon Route Registry - Collaborative route management
 *
 * Routes are stored as Aeon entities, enabling:
 * - Distributed sync across nodes
 * - Conflict resolution for concurrent route mutations
 * - Schema versioning for route structure changes
 */

import type { RouteDefinition, RouteMetadata, RouteOperation } from './types';

// Import Aeon modules (these would come from @affectively/aeon)
// For now, we'll define minimal interfaces to compile
interface SyncCoordinatorLike {
  getLocalNodeId(): string;
  getOnlineNodes(): { id: string }[];
  createSyncSession(initiator: string, participants: string[]): Promise<void>;
  on(event: string, callback: (data: unknown) => void): void;
}

interface StateReconcilerLike {
  recordVersion(nodeId: string, state: unknown, timestamp: number): void;
  reconcile(): { state: unknown } | null;
}

interface SchemaVersionManagerLike {
  getCurrentVersion(): Promise<string>;
  registerVersion(version: string, metadata: { description: string }): void;
}

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
export class AeonRouteRegistry {
  private routes: Map<string, AeonRoute> = new Map();
  private coordinator: SyncCoordinatorLike | null = null;
  private reconciler: StateReconcilerLike | null = null;
  private versions: SchemaVersionManagerLike | null = null;
  private syncMode: 'distributed' | 'local';
  private versioningEnabled: boolean;
  private mutationCallbacks: ((operation: RouteOperation) => void)[] = [];
  private connectedSockets: Set<unknown> = new Set();

  constructor(options: RegistryOptions) {
    this.syncMode = options.syncMode;
    this.versioningEnabled = options.versioningEnabled;

    // Initialize Aeon modules (lazy loading to avoid circular deps)
    this.initializeAeonModules();
  }

  private async initializeAeonModules(): Promise<void> {
    try {
      // Try to import Aeon modules
      const aeon = await import('@affectively/aeon');

      if (this.syncMode === 'distributed') {
        this.coordinator = new aeon.SyncCoordinator() as unknown as SyncCoordinatorLike;
        this.reconciler = new aeon.StateReconciler() as unknown as StateReconcilerLike;

        // Subscribe to sync events
        this.coordinator.on('sync-completed', (session: unknown) => {
          this.handleSyncCompleted(session);
        });
      }

      if (this.versioningEnabled) {
        this.versions = new aeon.SchemaVersionManager() as unknown as SchemaVersionManagerLike;
        this.versions.registerVersion('1.0.0', {
          description: 'Initial route schema',
        });
      }
    } catch (error) {
      console.warn('[aeon-registry] Aeon modules not available, running in standalone mode');
    }
  }

  /**
   * Add a new route collaboratively
   */
  async addRoute(path: string, component: string, metadata: RouteMetadata): Promise<void> {
    const operation: RouteOperation = {
      type: 'route-add',
      path,
      component,
      metadata,
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? 'local',
    };

    // Sync with other nodes if in distributed mode
    if (this.syncMode === 'distributed' && this.coordinator) {
      const participants = this.coordinator.getOnlineNodes().map((n) => n.id);
      if (participants.length > 0) {
        await this.coordinator.createSyncSession(
          this.coordinator.getLocalNodeId(),
          participants
        );
      }
    }

    // Apply locally
    const version = this.versioningEnabled && this.versions
      ? await this.versions.getCurrentVersion()
      : '1.0.0';

    this.routes.set(path, {
      path,
      component,
      metadata,
      version,
    });

    // Notify listeners
    this.notifyMutation(operation);

    // Persist to file system
    await this.persistRoute(path, component);
  }

  /**
   * Update an existing route
   */
  async updateRoute(path: string, updates: Partial<AeonRoute>): Promise<void> {
    const existing = this.routes.get(path);
    if (!existing) {
      throw new Error(`Route not found: ${path}`);
    }

    const operation: RouteOperation = {
      type: 'route-update',
      path,
      component: updates.component,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        updatedBy: this.coordinator?.getLocalNodeId() ?? 'local',
      },
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? 'local',
    };

    this.routes.set(path, {
      ...existing,
      ...updates,
      metadata: operation.metadata!,
    });

    this.notifyMutation(operation);
  }

  /**
   * Remove a route
   */
  async removeRoute(path: string): Promise<void> {
    const operation: RouteOperation = {
      type: 'route-remove',
      path,
      timestamp: new Date().toISOString(),
      nodeId: this.coordinator?.getLocalNodeId() ?? 'local',
    };

    this.routes.delete(path);
    this.notifyMutation(operation);
  }

  /**
   * Get a route by path
   */
  getRoute(path: string): AeonRoute | undefined {
    return this.routes.get(path);
  }

  /**
   * Get session ID for a path
   */
  getSessionId(path: string): string {
    return path.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
  }

  /**
   * Get all routes
   */
  getAllRoutes(): AeonRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Subscribe to route mutations
   */
  subscribeToMutations(callback: (operation: RouteOperation) => void): () => void {
    this.mutationCallbacks.push(callback);
    return () => {
      const idx = this.mutationCallbacks.indexOf(callback);
      if (idx >= 0) {
        this.mutationCallbacks.splice(idx, 1);
      }
    };
  }

  /**
   * Handle WebSocket connection for Aeon sync
   */
  handleConnect(ws: unknown): void {
    this.connectedSockets.add(ws);
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(ws: unknown): void {
    this.connectedSockets.delete(ws);
  }

  /**
   * Handle incoming sync message
   */
  handleSyncMessage(ws: unknown, message: unknown): void {
    // Parse and apply sync message
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;

      if (data.type === 'route-operation') {
        this.applyRemoteOperation(data.operation as RouteOperation);
      }
    } catch (error) {
      console.error('[aeon-registry] Error handling sync message:', error);
    }
  }

  // Private methods

  private notifyMutation(operation: RouteOperation): void {
    for (const callback of this.mutationCallbacks) {
      try {
        callback(operation);
      } catch (error) {
        console.error('[aeon-registry] Error in mutation callback:', error);
      }
    }

    // Broadcast to connected sockets
    const message = JSON.stringify({ type: 'route-operation', operation });
    for (const ws of this.connectedSockets) {
      try {
        // @ts-expect-error - WebSocket send method
        ws.send?.(message);
      } catch {
        // Ignore send errors
      }
    }
  }

  private handleSyncCompleted(session: unknown): void {
    // Apply reconciled state from sync session
    if (this.reconciler) {
      const result = this.reconciler.reconcile();
      if (result?.state) {
        // Apply reconciled routes
        const routes = result.state as Map<string, AeonRoute>;
        for (const [path, route] of routes) {
          this.routes.set(path, route);
        }
      }
    }
  }

  private applyRemoteOperation(operation: RouteOperation): void {
    switch (operation.type) {
      case 'route-add':
        if (operation.component && operation.metadata) {
          this.routes.set(operation.path, {
            path: operation.path,
            component: operation.component,
            metadata: operation.metadata,
            version: '1.0.0',
          });
        }
        break;

      case 'route-update':
        const existing = this.routes.get(operation.path);
        if (existing && operation.component) {
          this.routes.set(operation.path, {
            ...existing,
            component: operation.component,
            metadata: operation.metadata ?? existing.metadata,
          });
        }
        break;

      case 'route-remove':
        this.routes.delete(operation.path);
        break;
    }

    // Notify local listeners
    for (const callback of this.mutationCallbacks) {
      try {
        callback(operation);
      } catch (error) {
        console.error('[aeon-registry] Error in mutation callback:', error);
      }
    }
  }

  private async persistRoute(path: string, component: string): Promise<void> {
    // Convert path to file path
    const filePath = path === '/' ? 'page.tsx' : `${path.slice(1)}/page.tsx`;

    // Generate minimal page content
    const content = `'use aeon';

export default function Page() {
  return <${component} />;
}
`;

    try {
      // This would write to the file system
      // In production, this would be gated by permissions
      console.log(`[aeon-registry] Would persist route to: ${filePath}`);
    } catch (error) {
      console.error(`[aeon-registry] Error persisting route:`, error);
    }
  }
}
