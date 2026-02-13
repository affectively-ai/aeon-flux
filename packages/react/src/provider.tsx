/**
 * AeonPageProvider - Context provider for Aeon Pages
 *
 * Provides:
 * - Real-time sync via Aeon SyncCoordinator
 * - Presence tracking via WebSocket channel
 * - Offline support via OfflineOperationQueue
 * - Schema versioning via SchemaVersionManager
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  getSyncCoordinator,
  getOfflineQueue,
} from '@affectively/aeon-pages-runtime';

// Types
export interface PresenceSelection {
  start: number;
  end: number;
  direction?: 'forward' | 'backward' | 'none';
  path?: string;
}

export interface PresenceTyping {
  isTyping: boolean;
  field?: string;
  isComposing?: boolean;
  startedAt?: string;
  stoppedAt?: string;
}

export interface PresenceScroll {
  depth: number;
  y?: number;
  viewportHeight?: number;
  documentHeight?: number;
  path?: string;
}

export interface PresenceViewport {
  width: number;
  height: number;
}

export interface PresenceInputState {
  field: string;
  hasFocus: boolean;
  valueLength?: number;
  selectionStart?: number;
  selectionEnd?: number;
  isComposing?: boolean;
  inputMode?: string;
}

export interface PresenceEmotion {
  primary?: string;
  secondary?: string;
  confidence?: number;
  intensity?: number;
  valence?: number;
  arousal?: number;
  dominance?: number;
  source?: 'self-report' | 'inferred' | 'sensor' | 'hybrid';
  updatedAt?: string;
}

export interface PresenceUser {
  userId: string;
  role: 'user' | 'assistant' | 'monitor' | 'admin';
  cursor?: { x: number; y: number };
  focusNode?: string;
  selection?: PresenceSelection;
  typing?: PresenceTyping;
  scroll?: PresenceScroll;
  viewport?: PresenceViewport;
  inputState?: PresenceInputState;
  emotion?: PresenceEmotion;
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
  updateCursor: (position: { x: number; y: number }, path?: string) => void;
  updateEditing: (elementPath: string | null) => void;
  updateFocusNode: (nodePath: string) => void;
  updateSelection: (selection: PresenceSelection) => void;
  updateTyping: (
    isTyping: boolean,
    field?: string,
    isComposing?: boolean,
  ) => void;
  updateScroll: (scroll: PresenceScroll) => void;
  updateViewport: (viewport: PresenceViewport) => void;
  updateInputState: (inputState: PresenceInputState) => void;
  updateEmotionState: (emotion: PresenceEmotion) => void;

  // Sync
  sync: SyncState;
  forcSync: () => Promise<void>; // Kept for backwards compatibility
  forceSync: () => Promise<void>;

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

interface SocketMessage {
  type: string;
  payload?: unknown;
  users?: unknown;
  data?: unknown;
  tree?: unknown;
  version?: unknown;
}

interface PresenceEnvelope {
  action?: 'join' | 'leave' | 'update';
  user?: PresenceUser;
  userId?: string;
}

/**
 * AeonPageProvider - Wraps a page with Aeon collaborative features
 */
export function AeonPageProvider({
  route,
  children,
  initialData = {},
}: AeonPageProviderProps) {
  // Generate session ID from route
  const sessionId =
    route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';

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

  // Refs for Aeon modules (initialized on demand)
  const syncCoordinatorRef = useRef<unknown>(null);
  const presenceManagerRef = useRef<unknown>(null);
  const offlineQueueRef = useRef<unknown>(null);
  const versionManagerRef = useRef<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const updatePresenceUser = useCallback(
    (userId: string, patch: Partial<PresenceUser>) => {
      const now = new Date().toISOString();

      setPresence((prev) => {
        const index = prev.findIndex((user) => user.userId === userId);
        if (index < 0) {
          return [
            ...prev,
            {
              userId,
              role: 'user',
              status: 'online',
              lastActivity: now,
              ...patch,
            },
          ];
        }

        const next = [...prev];
        next[index] = {
          ...next[index],
          ...patch,
          lastActivity: patch.lastActivity ?? now,
        };
        return next;
      });

      setLocalUser((prev) => {
        if (!prev || prev.userId !== userId) {
          return prev;
        }
        return {
          ...prev,
          ...patch,
          lastActivity: patch.lastActivity ?? now,
        };
      });
    },
    [],
  );

  const removePresenceUser = useCallback((userId: string) => {
    setPresence((prev) => prev.filter((user) => user.userId !== userId));
  }, []);

  const setPresenceSnapshot = useCallback((users: PresenceUser[]) => {
    setPresence(users);
  }, []);

  const sendSocketMessage = useCallback((message: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, []);

  const connectWebSocket = useCallback(
    (
      targetSessionId: string,
      userId: string,
      role: PresenceUser['role'] = 'user',
    ) => {
      if (typeof window === 'undefined') return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams({
        session: targetSessionId,
        userId,
        role,
      });
      const wsUrl = `${protocol}//${window.location.host}/_aeon/ws?${params.toString()}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[aeon-provider] WebSocket connected');
        sendSocketMessage({
          type: 'presence',
          payload: { status: 'online' },
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as SocketMessage;
          handleSyncMessage(message);
        } catch (error) {
          console.error('[aeon-provider] Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('[aeon-provider] WebSocket disconnected');
        setTimeout(() => connectWebSocket(targetSessionId, userId, role), 1000);
      };

      ws.onerror = (error) => {
        console.error('[aeon-provider] WebSocket error:', error);
      };
    },
    [sendSocketMessage],
  );

  const handleSyncMessage = useCallback(
    (message: unknown) => {
      if (!isRecord(message) || typeof message.type !== 'string') {
        return;
      }

      const msg = message as unknown as SocketMessage;

      switch (msg.type) {
        case 'init': {
          if (!isRecord(msg.payload)) break;

          const payload = msg.payload;
          if (isRecord(payload.session)) {
            const session = payload.session;
            if ('tree' in session) {
              setTree(session.tree);
            }
            if (isRecord(session.data)) {
              setDataState((prev) => ({
                ...prev,
                ...(session.data as Record<string, unknown>),
              }));
            }
          }

          if (Array.isArray(payload.presence)) {
            setPresenceSnapshot(payload.presence as PresenceUser[]);
          }
          break;
        }

        case 'presence-update': {
          if (Array.isArray(msg.users)) {
            setPresenceSnapshot(msg.users as PresenceUser[]);
            break;
          }
          if (isRecord(msg.payload) && Array.isArray(msg.payload.users)) {
            setPresenceSnapshot(msg.payload.users as PresenceUser[]);
          }
          break;
        }

        case 'presence': {
          if (!isRecord(msg.payload)) break;

          const payload = msg.payload as PresenceEnvelope;
          if (
            (payload.action === 'join' || payload.action === 'update') &&
            payload.user
          ) {
            const user = payload.user;
            updatePresenceUser(user.userId, user);
          } else if (
            payload.action === 'leave' &&
            typeof payload.userId === 'string'
          ) {
            removePresenceUser(payload.userId);
          }
          break;
        }

        case 'cursor': {
          if (!isRecord(msg.payload) || typeof msg.payload.userId !== 'string') {
            break;
          }
          if (isRecord(msg.payload.cursor)) {
            updatePresenceUser(msg.payload.userId, {
              cursor: {
                x: Number(msg.payload.cursor.x ?? 0),
                y: Number(msg.payload.cursor.y ?? 0),
              },
            });
          }
          break;
        }

        case 'typing': {
          if (!isRecord(msg.payload) || typeof msg.payload.userId !== 'string') {
            break;
          }
          const typing = toPresenceTyping(msg.payload.typing);
          if (typing) {
            updatePresenceUser(msg.payload.userId, {
              typing,
            });
          }
          break;
        }

        case 'focus': {
          if (!isRecord(msg.payload) || typeof msg.payload.userId !== 'string') {
            break;
          }
          if (typeof msg.payload.focusNode === 'string') {
            updatePresenceUser(msg.payload.userId, {
              focusNode: msg.payload.focusNode,
            });
          }
          break;
        }

        case 'selection': {
          if (!isRecord(msg.payload) || typeof msg.payload.userId !== 'string') {
            break;
          }
          const selection = toPresenceSelection(msg.payload.selection);
          if (selection) {
            updatePresenceUser(msg.payload.userId, {
              selection,
            });
          }
          break;
        }

        case 'scroll': {
          if (!isRecord(msg.payload) || typeof msg.payload.userId !== 'string') {
            break;
          }
          const scroll = toPresenceScroll(msg.payload.scroll);
          if (scroll) {
            updatePresenceUser(msg.payload.userId, {
              scroll,
            });
          }
          break;
        }

        case 'viewport': {
          if (!isRecord(msg.payload) || typeof msg.payload.userId !== 'string') {
            break;
          }
          const viewport = toPresenceViewport(msg.payload.viewport);
          if (viewport) {
            updatePresenceUser(msg.payload.userId, {
              viewport,
            });
          }
          break;
        }

        case 'input-state': {
          if (!isRecord(msg.payload) || typeof msg.payload.userId !== 'string') {
            break;
          }
          const inputState = toPresenceInputState(msg.payload.inputState);
          if (inputState) {
            updatePresenceUser(msg.payload.userId, {
              inputState,
            });
          }
          break;
        }

        case 'emotion': {
          if (!isRecord(msg.payload) || typeof msg.payload.userId !== 'string') {
            break;
          }
          const emotion = toPresenceEmotion(msg.payload.emotion);
          if (emotion) {
            updatePresenceUser(msg.payload.userId, {
              emotion,
            });
          }
          break;
        }

        case 'data-update':
          if (isRecord(msg.data)) {
            setDataState((prev) => ({
              ...prev,
              ...(msg.data as Record<string, unknown>),
            }));
          }
          break;

        case 'tree-update':
          setTree(msg.tree);
          break;

        case 'version-info': {
          const parsedVersion = toVersionInfo(msg.version);
          if (parsedVersion) {
            setVersion(parsedVersion);
          }
          break;
        }
      }
    },
    [removePresenceUser, setPresenceSnapshot, updatePresenceUser],
  );

  // Initialize Aeon modules
  useEffect(() => {
    const initAeon = async () => {
      try {
        // Initialize sync coordinator
        syncCoordinatorRef.current = getSyncCoordinator();

        // Initialize offline queue
        offlineQueueRef.current = getOfflineQueue();

        // Presence manager and version manager are handled via WebSocket
        presenceManagerRef.current = null;
        versionManagerRef.current = null;

        // Set up local user
        const userId = generateUserId();
        const initialUser: PresenceUser = {
          userId,
          role: 'user',
          status: 'online',
          lastActivity: new Date().toISOString(),
        };
        setLocalUser(initialUser);

        // Connect WebSocket for real-time sync
        connectWebSocket(sessionId, initialUser.userId, initialUser.role);
      } catch (error) {
        console.warn('[aeon-provider] Aeon modules not available:', error);
      }
    };

    initAeon();

    // Cleanup
    return () => {
      wsRef.current?.close();
    };
  }, [connectWebSocket, sessionId]);

  // Online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setSync((prev) => ({ ...prev, isOnline: true }));
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

  const patchLocalUser = useCallback((patch: Partial<PresenceUser>) => {
    const now = new Date().toISOString();
    setLocalUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...patch,
        lastActivity: now,
      };
    });
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

  // Presence update helpers
  const updateCursor = useCallback(
    (position: { x: number; y: number }, path?: string) => {
      patchLocalUser({
        cursor: position,
        focusNode: path,
      });

      sendSocketMessage({
        type: 'cursor',
        payload: {
          ...position,
          path,
        },
      });
    },
    [patchLocalUser, sendSocketMessage],
  );

  const updateEditing = useCallback(
    (elementPath: string | null) => {
      patchLocalUser({
        editing: elementPath ?? undefined,
      });

      sendSocketMessage({
        type: 'presence',
        payload: {
          status: localUser?.status ?? 'online',
          editing: elementPath,
        },
      });
    },
    [localUser?.status, patchLocalUser, sendSocketMessage],
  );

  const updateFocusNode = useCallback(
    (nodePath: string) => {
      patchLocalUser({ focusNode: nodePath });
      sendSocketMessage({
        type: 'focus',
        payload: { nodePath },
      });
    },
    [patchLocalUser, sendSocketMessage],
  );

  const updateSelection = useCallback(
    (selection: PresenceSelection) => {
      patchLocalUser({ selection });
      sendSocketMessage({
        type: 'selection',
        payload: selection,
      });
    },
    [patchLocalUser, sendSocketMessage],
  );

  const updateTyping = useCallback(
    (isTyping: boolean, field?: string, isComposing = false) => {
      const now = new Date().toISOString();
      patchLocalUser({
        typing: {
          isTyping,
          field,
          isComposing,
          startedAt: isTyping ? now : undefined,
          stoppedAt: isTyping ? undefined : now,
        },
      });
      sendSocketMessage({
        type: 'typing',
        payload: {
          isTyping,
          field,
          isComposing,
        },
      });
    },
    [patchLocalUser, sendSocketMessage],
  );

  const updateScroll = useCallback(
    (scroll: PresenceScroll) => {
      const normalized: PresenceScroll = {
        ...scroll,
        depth: Math.max(0, Math.min(1, scroll.depth)),
      };
      patchLocalUser({ scroll: normalized });
      sendSocketMessage({
        type: 'scroll',
        payload: normalized,
      });
    },
    [patchLocalUser, sendSocketMessage],
  );

  const updateViewport = useCallback(
    (viewport: PresenceViewport) => {
      patchLocalUser({ viewport });
      sendSocketMessage({
        type: 'viewport',
        payload: viewport,
      });
    },
    [patchLocalUser, sendSocketMessage],
  );

  const updateInputState = useCallback(
    (inputState: PresenceInputState) => {
      patchLocalUser({ inputState });
      sendSocketMessage({
        type: 'input-state',
        payload: inputState,
      });
    },
    [patchLocalUser, sendSocketMessage],
  );

  const updateEmotionState = useCallback(
    (emotion: PresenceEmotion) => {
      const enrichedEmotion: PresenceEmotion = {
        ...emotion,
        updatedAt: new Date().toISOString(),
      };
      patchLocalUser({ emotion: enrichedEmotion });
      sendSocketMessage({
        type: 'emotion',
        payload: emotion,
      });
    },
    [patchLocalUser, sendSocketMessage],
  );

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
  const setData = useCallback(
    (key: string, value: unknown) => {
      setDataState((prev) => ({ ...prev, [key]: value }));

      // Queue for sync
      if (sync.isOnline && wsRef.current) {
        sendSocketMessage({
          type: 'data-set',
          key,
          value,
        });
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
    },
    [sendSocketMessage, sync.isOnline],
  );

  // Update tree
  const updateTree = useCallback(
    (path: string, value: unknown) => {
      // This applies a patch to the remote tree
      sendSocketMessage({
        type: 'tree-patch',
        path,
        value,
      });
    },
    [sendSocketMessage],
  );

  // Context value
  const contextValue: AeonPageContextValue = {
    route,
    sessionId,
    presence,
    localUser,
    updateCursor,
    updateEditing,
    updateFocusNode,
    updateSelection,
    updateTyping,
    updateScroll,
    updateViewport,
    updateInputState,
    updateEmotionState,
    sync,
    forcSync: forceSync,
    forceSync,
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
  const {
    presence,
    localUser,
    updateCursor,
    updateEditing,
    updateFocusNode,
    updateSelection,
    updateTyping,
    updateScroll,
    updateViewport,
    updateInputState,
    updateEmotionState,
  } = useAeonPage();
  return {
    presence,
    localUser,
    updateCursor,
    updateEditing,
    updateFocusNode,
    updateSelection,
    updateTyping,
    updateScroll,
    updateViewport,
    updateInputState,
    updateEmotionState,
  };
}

/**
 * useAeonSync - Just the sync state
 */
export function useAeonSync() {
  const { sync, forceSync } = useAeonPage();
  return { ...sync, forceSync };
}

/**
 * useAeonData - Just the data store
 */
export function useAeonData<T = unknown>(
  key: string,
): [T | undefined, (value: T) => void] {
  const { data, setData } = useAeonPage();
  const value = data[key] as T | undefined;
  const setValue = useCallback(
    (newValue: T) => setData(key, newValue),
    [key, setData],
  );
  return [value, setValue];
}

// Helper to generate user ID
function generateUserId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toPresenceSelection(value: unknown): PresenceSelection | null {
  if (!isRecord(value)) return null;
  if (typeof value.start !== 'number' || typeof value.end !== 'number') {
    return null;
  }
  return {
    start: value.start,
    end: value.end,
    direction:
      value.direction === 'forward' ||
      value.direction === 'backward' ||
      value.direction === 'none'
        ? value.direction
        : undefined,
    path: typeof value.path === 'string' ? value.path : undefined,
  };
}

function toPresenceTyping(value: unknown): PresenceTyping | null {
  if (!isRecord(value) || typeof value.isTyping !== 'boolean') {
    return null;
  }
  return {
    isTyping: value.isTyping,
    field: typeof value.field === 'string' ? value.field : undefined,
    isComposing:
      typeof value.isComposing === 'boolean' ? value.isComposing : undefined,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : undefined,
    stoppedAt: typeof value.stoppedAt === 'string' ? value.stoppedAt : undefined,
  };
}

function toPresenceScroll(value: unknown): PresenceScroll | null {
  if (!isRecord(value) || typeof value.depth !== 'number') {
    return null;
  }
  return {
    depth: value.depth,
    y: typeof value.y === 'number' ? value.y : undefined,
    viewportHeight:
      typeof value.viewportHeight === 'number' ? value.viewportHeight : undefined,
    documentHeight:
      typeof value.documentHeight === 'number' ? value.documentHeight : undefined,
    path: typeof value.path === 'string' ? value.path : undefined,
  };
}

function toPresenceViewport(value: unknown): PresenceViewport | null {
  if (
    !isRecord(value) ||
    typeof value.width !== 'number' ||
    typeof value.height !== 'number'
  ) {
    return null;
  }
  return {
    width: value.width,
    height: value.height,
  };
}

function toPresenceInputState(value: unknown): PresenceInputState | null {
  if (
    !isRecord(value) ||
    typeof value.field !== 'string' ||
    typeof value.hasFocus !== 'boolean'
  ) {
    return null;
  }
  return {
    field: value.field,
    hasFocus: value.hasFocus,
    valueLength: typeof value.valueLength === 'number' ? value.valueLength : undefined,
    selectionStart:
      typeof value.selectionStart === 'number' ? value.selectionStart : undefined,
    selectionEnd:
      typeof value.selectionEnd === 'number' ? value.selectionEnd : undefined,
    isComposing:
      typeof value.isComposing === 'boolean' ? value.isComposing : undefined,
    inputMode: typeof value.inputMode === 'string' ? value.inputMode : undefined,
  };
}

function toPresenceEmotion(value: unknown): PresenceEmotion | null {
  if (!isRecord(value)) return null;

  const emotion: PresenceEmotion = {
    primary: typeof value.primary === 'string' ? value.primary : undefined,
    secondary: typeof value.secondary === 'string' ? value.secondary : undefined,
    confidence: typeof value.confidence === 'number' ? value.confidence : undefined,
    intensity: typeof value.intensity === 'number' ? value.intensity : undefined,
    valence: typeof value.valence === 'number' ? value.valence : undefined,
    arousal: typeof value.arousal === 'number' ? value.arousal : undefined,
    dominance: typeof value.dominance === 'number' ? value.dominance : undefined,
    source:
      value.source === 'self-report' ||
      value.source === 'inferred' ||
      value.source === 'sensor' ||
      value.source === 'hybrid'
        ? value.source
        : undefined,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
  };

  if (
    !emotion.primary &&
    !emotion.secondary &&
    emotion.confidence === undefined &&
    emotion.intensity === undefined &&
    emotion.valence === undefined &&
    emotion.arousal === undefined &&
    emotion.dominance === undefined &&
    !emotion.source &&
    !emotion.updatedAt
  ) {
    return null;
  }

  return emotion;
}

function toVersionInfo(value: unknown): VersionInfo | null {
  if (
    !isRecord(value) ||
    typeof value.current !== 'string' ||
    typeof value.latest !== 'string' ||
    typeof value.needsMigration !== 'boolean'
  ) {
    return null;
  }
  return {
    current: value.current,
    latest: value.latest,
    needsMigration: value.needsMigration,
  };
}

export default AeonPageProvider;
