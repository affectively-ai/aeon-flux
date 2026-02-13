/**
 * AeonPageProvider - Context provider for Aeon Pages
 *
 * Provides:
 * - Real-time sync via Aeon SyncCoordinator
 * - Presence tracking via WebSocket channel
 * - Offline support via OfflineOperationQueue
 * - Schema versioning via SchemaVersionManager
 */
import { type ReactNode } from 'react';
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
    cursor?: {
        x: number;
        y: number;
    };
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
    route: string;
    sessionId: string;
    presence: PresenceUser[];
    localUser: PresenceUser | null;
    updateCursor: (position: {
        x: number;
        y: number;
    }, path?: string) => void;
    updateEditing: (elementPath: string | null) => void;
    updateFocusNode: (nodePath: string) => void;
    updateSelection: (selection: PresenceSelection) => void;
    updateTyping: (isTyping: boolean, field?: string, isComposing?: boolean) => void;
    updateScroll: (scroll: PresenceScroll) => void;
    updateViewport: (viewport: PresenceViewport) => void;
    updateInputState: (inputState: PresenceInputState) => void;
    updateEmotionState: (emotion: PresenceEmotion) => void;
    sync: SyncState;
    forcSync: () => Promise<void>;
    forceSync: () => Promise<void>;
    version: VersionInfo;
    migrate: (toVersion: string) => Promise<void>;
    data: Record<string, unknown>;
    setData: (key: string, value: unknown) => void;
    tree: unknown;
    updateTree: (path: string, value: unknown) => void;
}
export interface AeonPageProviderProps {
    route: string;
    children: ReactNode;
    initialData?: Record<string, unknown>;
}
/**
 * AeonPageProvider - Wraps a page with Aeon collaborative features
 */
export declare function AeonPageProvider({ route, children, initialData, }: AeonPageProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * useAeonPage - Access Aeon page context
 */
export declare function useAeonPage(): AeonPageContextValue;
/**
 * usePresence - Just the presence data
 */
export declare function usePresence(): {
    presence: PresenceUser[];
    localUser: PresenceUser | null;
    updateCursor: (position: {
        x: number;
        y: number;
    }, path?: string) => void;
    updateEditing: (elementPath: string | null) => void;
    updateFocusNode: (nodePath: string) => void;
    updateSelection: (selection: PresenceSelection) => void;
    updateTyping: (isTyping: boolean, field?: string, isComposing?: boolean) => void;
    updateScroll: (scroll: PresenceScroll) => void;
    updateViewport: (viewport: PresenceViewport) => void;
    updateInputState: (inputState: PresenceInputState) => void;
    updateEmotionState: (emotion: PresenceEmotion) => void;
};
/**
 * useAeonSync - Just the sync state
 */
export declare function useAeonSync(): {
    forceSync: () => Promise<void>;
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncAt?: string;
    pendingOperations: number;
};
/**
 * useAeonData - Just the data store
 */
export declare function useAeonData<T = unknown>(key: string): [T | undefined, (value: T) => void];
export default AeonPageProvider;
