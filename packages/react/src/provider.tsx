/**
 * AeonPageProvider - Context provider for Aeon Pages
 *
 * Provides:
 * - Real-time sync via Aeon SyncCoordinator
 * - Presence tracking via AgentPresenceManager
 * - Offline support via OfflineOperationQueue
 * - Schema versioning via SchemaVersionManager
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';

// Types
export interface PresenceUser {
  userId: string;
  role: 'user' | 'assistant' | 'monitor' | 'admin';
  cursor?: { x: number; y: number };
  editing?: string;
  status: 'online' | 'away' | 'offline';
  lastActivity: string;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: string;
  pendingOperations: number;
}

export interface VersionInfo {
  current: string;
  latest: string;
  needsMigration: boolean;
}

export interface AeonPageContextValue {
  // Route info
  route: string;
  sessionId: string;

  // Presence
  presence: PresenceUser[];
  localUser: PresenceUser | null;
  updateCursor: (position: { x: number; y: number }) => void;
  updateEditing: (elementPath: string | null) => void;

  // Sync
  sync: SyncState;
  forcSync: () => Promise<void>;

  // Versioning
  version: VersionInfo;
  migrate: (toVersion: string) => Promise<void>;

  // Data
  data: Record<string, unknown>;
  setData: (key: string, value: unknown) => void;

  // Component tree
  tree: unknown;
  updateTree: (path: string, value: unknown) => void;
}

const AeonPageContext = createContext<AeonPageContextValue | null>(null);

export interface AeonPageProviderProps {
  route: string;
  children: ReactNode;
  initialData?: Record<string, unknown>;
}

/**
 * AeonPageProvider - Wraps a page with Aeon collaborative features
 */
export function AeonPageProvider({ route, children, initialData = {} }: AeonPageProviderProps) {
  // Generate session ID from route
  const sessionId = route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';

  // State
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [localUser, setLocalUser] = useState<PresenceUser | null>(null);
  const [sync, setSync] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingOperations: 0,
  });
  const [version, setVersion] = useState<VersionInfo>({
    current: '1.0.0',
    latest: '1.0.0',
    needsMigration: false,
  });
  const [data, setDataState] = useState<Record<string, unknown>>(initialData);
  const [tree, setTree] = useState<unknown>(null);

  // Refs for Aeon modules (lazy loaded)
  const syncCoordinatorRef = useRef<unknown>(null);
  const presenceManagerRef = useRef<unknown>(null);
  const offlineQueueRef = useRef<unknown>(null);
  const versionManagerRef = useRef<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize Aeon modules
  useEffect(() => {
    const initAeon = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const aeon = await import('@affectively/aeon-pages-runtime');

        // Initialize sync coordinator
        syncCoordinatorRef.current = aeon.getSyncCoordinator();

        // Initialize offline queue
        offlineQueueRef.current = aeon.getOfflineQueue();

        // Presence manager and version manager are handled via WebSocket
        presenceManagerRef.current = null;
        versionManagerRef.current = null;

        // Set up local user
        const userId = generateUserId();
        setLocalUser({
          userId,
          role: 'user',
          status: 'online',
          lastActivity: new Date().toISOString(),
        });

        // Connect WebSocket for real-time sync
        connectWebSocket(sessionId);
      } catch (error) {
        console.warn('[aeon-provider] Aeon modules not available:', error);
      }
    };

    initAeon();

    // Cleanup
    return () => {
      wsRef.current?.close();
    };
  }, [sessionId]);

  // Online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setSync((prev) => ({ ...prev, isOnline: true }));
      // Flush offline queue
      flushOfflineQueue();
    };

    const handleOffline = () => {
      setSync((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Connect WebSocket
  const connectWebSocket = useCallback((sessionId: string) => {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/_aeon/ws?session=${sessionId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[aeon-provider] WebSocket connected');
      // Join session
      ws.send(JSON.stringify({ type: 'join', sessionId }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleSyncMessage(message);
      } catch (error) {
        console.error('[aeon-provider] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[aeon-provider] WebSocket disconnected');
      // Reconnect after delay
      setTimeout(() => connectWebSocket(sessionId), 1000);
    };

    ws.onerror = (error) => {
      console.error('[aeon-provider] WebSocket error:', error);
    };
  }, []);

  // Handle incoming sync messages
  const handleSyncMessage = useCallback((message: unknown) => {
    const msg = message as { type: string; [key: string]: unknown };

    switch (msg.type) {
      case 'presence-update':
        setPresence(msg.users as PresenceUser[]);
        break;

      case 'data-update':
        setDataState((prev) => ({
          ...prev,
          ...(msg.data as Record<string, unknown>),
        }));
        break;

      case 'tree-update':
        setTree(msg.tree);
        break;

      case 'version-info':
        setVersion(msg.version as VersionInfo);
        break;
    }
  }, []);

  // Flush offline queue when back online
  const flushOfflineQueue = useCallback(async () => {
    if (!offlineQueueRef.current) return;

    setSync((prev) => ({ ...prev, isSyncing: true }));

    try {
      // @ts-expect-error - Aeon module method
      await offlineQueueRef.current.flush();
      setSync((prev) => ({
        ...prev,
        isSyncing: false,
        pendingOperations: 0,
        lastSyncAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('[aeon-provider] Error flushing offline queue:', error);
      setSync((prev) => ({ ...prev, isSyncing: false }));
    }
  }, []);

  // Update cursor position
  const updateCursor = useCallback((position: { x: number; y: number }) => {
    if (!localUser) return;

    setLocalUser((prev) =>
      prev ? { ...prev, cursor: position, lastActivity: new Date().toISOString() } : null
    );

    // Send to WebSocket
    wsRef.current?.send(
      JSON.stringify({
        type: 'cursor-update',
        position,
      })
    );
  }, [localUser]);

  // Update editing element
  const updateEditing = useCallback((elementPath: string | null) => {
    if (!localUser) return;

    setLocalUser((prev) =>
      prev ? { ...prev, editing: elementPath ?? undefined, lastActivity: new Date().toISOString() } : null
    );

    // Send to WebSocket
    wsRef.current?.send(
      JSON.stringify({
        type: 'editing-update',
        elementPath,
      })
    );
  }, [localUser]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!sync.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    setSync((prev) => ({ ...prev, isSyncing: true }));

    try {
      // @ts-expect-error - Aeon module method
      await syncCoordinatorRef.current?.sync();
      setSync((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
      }));
    } catch (error) {
      setSync((prev) => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [sync.isOnline]);

  // Migrate to new version
  const migrate = useCallback(async (toVersion: string) => {
    // @ts-expect-error - Aeon module method
    await versionManagerRef.current?.migrate(toVersion);
    setVersion((prev) => ({
      ...prev,
      current: toVersion,
      needsMigration: false,
    }));
  }, []);

  // Set data
  const setData = useCallback((key: string, value: unknown) => {
    setDataState((prev) => ({ ...prev, [key]: value }));

    // Queue for sync
    if (sync.isOnline && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'data-set',
          key,
          value,
        })
      );
    } else {
      // Queue offline
      // @ts-expect-error - Aeon module method
      offlineQueueRef.current?.enqueue({
        type: 'data-set',
        key,
        value,
      });
      setSync((prev) => ({
        ...prev,
        pendingOperations: prev.pendingOperations + 1,
      }));
    }
  }, [sync.isOnline]);

  // Update tree
  const updateTree = useCallback((path: string, value: unknown) => {
    // This would apply a patch to the tree
    wsRef.current?.send(
      JSON.stringify({
        type: 'tree-patch',
        path,
        value,
      })
    );
  }, []);

  // Context value
  const contextValue: AeonPageContextValue = {
    route,
    sessionId,
    presence,
    localUser,
    updateCursor,
    updateEditing,
    sync,
    forcSync: forceSync,
    version,
    migrate,
    data,
    setData,
    tree,
    updateTree,
  };

  return (
    <AeonPageContext.Provider value={contextValue}>
      {children}
    </AeonPageContext.Provider>
  );
}

/**
 * useAeonPage - Access Aeon page context
 */
export function useAeonPage(): AeonPageContextValue {
  const context = useContext(AeonPageContext);
  if (!context) {
    throw new Error('useAeonPage must be used within an AeonPageProvider');
  }
  return context;
}

/**
 * usePresence - Just the presence data
 */
export function usePresence() {
  const { presence, localUser, updateCursor, updateEditing } = useAeonPage();
  return { presence, localUser, updateCursor, updateEditing };
}

/**
 * useAeonSync - Just the sync state
 */
export function useAeonSync() {
  const { sync, forcSync: forceSync } = useAeonPage();
  return { ...sync, forceSync };
}

/**
 * useAeonData - Just the data store
 */
export function useAeonData<T = unknown>(key: string): [T | undefined, (value: T) => void] {
  const { data, setData } = useAeonPage();
  const value = data[key] as T | undefined;
  const setValue = useCallback((newValue: T) => setData(key, newValue), [key, setData]);
  return [value, setValue];
}

// Helper to generate user ID
function generateUserId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default AeonPageProvider;
