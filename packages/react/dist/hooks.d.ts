/**
 * Additional React hooks for Aeon Pages
 */
import { type PresenceUser } from './provider';
/**
 * useAeonVersion - Access version and migration tools
 */
export declare function useAeonVersion(): {
    migrate: (toVersion: string) => Promise<void>;
    current: string;
    latest: string;
    needsMigration: boolean;
};
/**
 * useAeonTree - Access the component tree for advanced manipulation
 */
export declare function useAeonTree(): {
    tree: unknown;
    updateTree: (path: string, value: unknown) => void;
};
/**
 * useCursorTracking - Automatically track cursor movement
 */
export declare function useCursorTracking(enabled?: boolean): void;
/**
 * useEditableElement - Make an element collaboratively editable
 */
export declare function useEditableElement(elementPath: string): {
    isFocused: boolean;
    isBeingEditedByOther: boolean;
    onFocus: () => void;
    onBlur: () => void;
    onChange: (value: unknown) => void;
};
/**
 * useOtherCursors - Get cursors of other users (excluding self)
 */
export declare function useOtherCursors(): PresenceUser[];
/**
 * useOfflineStatus - Track offline status and pending operations
 */
export declare function useOfflineStatus(): {
    isOffline: boolean;
    isSyncing: boolean;
    pendingOperations: number;
    lastSyncAt: string | undefined;
};
/**
 * useCollaborativeInput - Hook for collaborative text input
 *
 * @example
 * ```tsx
 * function EditableTitle() {
 *   const { value, onChange, onFocus, onBlur, isEditing, editingBy } = useCollaborativeInput('title');
 *
 *   return (
 *     <input
 *       value={value}
 *       onChange={(e) => onChange(e.target.value)}
 *       onFocus={onFocus}
 *       onBlur={onBlur}
 *       style={{ borderColor: editingBy ? 'blue' : undefined }}
 *     />
 *   );
 * }
 * ```
 */
export declare function useCollaborativeInput(key: string): {
    value: string;
    onChange: (newValue: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    isEditing: boolean;
    editingBy: PresenceUser | undefined;
};
/**
 * useAeonEffect - Run effect when Aeon data changes
 */
export declare function useAeonEffect(key: string, effect: (value: unknown) => void | (() => void)): void;
/**
 * useSessionId - Get the current session ID
 */
export declare function useSessionId(): string;
/**
 * useRoute - Get the current route
 */
export declare function useRoute(): string;
