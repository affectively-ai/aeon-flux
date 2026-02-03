/**
 * Additional React hooks for Aeon Pages
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAeonPage, type PresenceUser } from './provider';

/**
 * useAeonVersion - Access version and migration tools
 */
export function useAeonVersion() {
  const { version, migrate } = useAeonPage();
  return { ...version, migrate };
}

/**
 * useAeonTree - Access the component tree for advanced manipulation
 */
export function useAeonTree() {
  const { tree, updateTree } = useAeonPage();
  return { tree, updateTree };
}

/**
 * useCursorTracking - Automatically track cursor movement
 */
export function useCursorTracking(enabled = true) {
  const { updateCursor } = useAeonPage();
  const throttleRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle to ~60fps
      if (throttleRef.current) return;

      throttleRef.current = window.requestAnimationFrame(() => {
        updateCursor({ x: e.clientX, y: e.clientY });
        throttleRef.current = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (throttleRef.current) {
        window.cancelAnimationFrame(throttleRef.current);
      }
    };
  }, [enabled, updateCursor]);
}

/**
 * useEditableElement - Make an element collaboratively editable
 */
export function useEditableElement(elementPath: string) {
  const { updateEditing, updateTree, localUser } = useAeonPage();
  const [isFocused, setIsFocused] = useState(false);

  const onFocus = useCallback(() => {
    setIsFocused(true);
    updateEditing(elementPath);
  }, [elementPath, updateEditing]);

  const onBlur = useCallback(() => {
    setIsFocused(false);
    updateEditing(null);
  }, [updateEditing]);

  const onChange = useCallback(
    (value: unknown) => {
      updateTree(elementPath, value);
    },
    [elementPath, updateTree]
  );

  return {
    isFocused,
    isBeingEditedByOther: false, // Would check presence
    onFocus,
    onBlur,
    onChange,
  };
}

/**
 * useOtherCursors - Get cursors of other users (excluding self)
 */
export function useOtherCursors(): PresenceUser[] {
  const { presence, localUser } = useAeonPage();
  return presence.filter((user) => user.userId !== localUser?.userId);
}

/**
 * useOfflineStatus - Track offline status and pending operations
 */
export function useOfflineStatus() {
  const { sync } = useAeonPage();
  return {
    isOffline: !sync.isOnline,
    isSyncing: sync.isSyncing,
    pendingOperations: sync.pendingOperations,
    lastSyncAt: sync.lastSyncAt,
  };
}

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
export function useCollaborativeInput(key: string) {
  const { data, setData, presence, localUser, updateEditing } = useAeonPage();
  const [isEditing, setIsEditing] = useState(false);

  const value = (data[key] as string) ?? '';

  // Find if someone else is editing this field
  const editingBy = presence.find(
    (user) => user.editing === key && user.userId !== localUser?.userId
  );

  const onChange = useCallback(
    (newValue: string) => {
      setData(key, newValue);
    },
    [key, setData]
  );

  const onFocus = useCallback(() => {
    setIsEditing(true);
    updateEditing(key);
  }, [key, updateEditing]);

  const onBlur = useCallback(() => {
    setIsEditing(false);
    updateEditing(null);
  }, [updateEditing]);

  return {
    value,
    onChange,
    onFocus,
    onBlur,
    isEditing,
    editingBy,
  };
}

/**
 * useAeonEffect - Run effect when Aeon data changes
 */
export function useAeonEffect(key: string, effect: (value: unknown) => void | (() => void)) {
  const { data } = useAeonPage();
  const value = data[key];

  useEffect(() => {
    return effect(value);
  }, [value, effect]);
}

/**
 * useSessionId - Get the current session ID
 */
export function useSessionId(): string {
  const { sessionId } = useAeonPage();
  return sessionId;
}

/**
 * useRoute - Get the current route
 */
export function useRoute(): string {
  const { route } = useAeonPage();
  return route;
}
