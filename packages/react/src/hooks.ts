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
  const throttleRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null,
  );

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
  const { updateEditing, updateFocusNode, updateTree } = useAeonPage();
  const [isFocused, setIsFocused] = useState(false);

  const onFocus = useCallback(() => {
    setIsFocused(true);
    updateEditing(elementPath);
    updateFocusNode(elementPath);
  }, [elementPath, updateEditing, updateFocusNode]);

  const onBlur = useCallback(() => {
    setIsFocused(false);
    updateEditing(null);
  }, [updateEditing]);

  const onChange = useCallback(
    (value: unknown) => {
      updateTree(elementPath, value);
    },
    [elementPath, updateTree],
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
 * useEmotionPresence - Local + remote optional emotional state channel
 */
export function useEmotionPresence() {
  const { presence, localUser, updateEmotionState } = useAeonPage();
  const others = presence.filter((user) => user.userId !== localUser?.userId);

  return {
    localEmotion: localUser?.emotion,
    others,
    updateEmotionState,
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
  const {
    data,
    setData,
    presence,
    localUser,
    updateEditing,
    updateFocusNode,
    updateSelection,
    updateTyping,
    updateInputState,
  } = useAeonPage();
  const [isEditing, setIsEditing] = useState(false);

  const value = (data[key] as string) ?? '';

  // Find if someone else is editing this field
  const editingBy = presence.find(
    (user) => user.editing === key && user.userId !== localUser?.userId,
  );

  const onChange = useCallback(
    (newValue: string) => {
      setData(key, newValue);
      updateTyping(true, key, false);
      updateInputState({
        field: key,
        hasFocus: true,
        valueLength: newValue.length,
      });
    },
    [key, setData, updateInputState, updateTyping],
  );

  const onFocus = useCallback(() => {
    setIsEditing(true);
    updateEditing(key);
    updateFocusNode(key);
    updateTyping(true, key, false);
  }, [key, updateEditing, updateFocusNode, updateTyping]);

  const onBlur = useCallback(() => {
    setIsEditing(false);
    updateTyping(false, key, false);
    updateInputState({
      field: key,
      hasFocus: false,
      valueLength: value.length,
    });
    updateEditing(null);
  }, [key, updateEditing, updateInputState, updateTyping, value.length]);

  const onSelect = useCallback(
    (
      eventOrTarget:
        | {
            currentTarget: {
              selectionStart: number | null;
              selectionEnd: number | null;
              selectionDirection?: 'forward' | 'backward' | 'none' | null;
              value?: string;
            };
          }
        | {
            selectionStart: number | null;
            selectionEnd: number | null;
            selectionDirection?: 'forward' | 'backward' | 'none' | null;
            value?: string;
          },
    ) => {
      const target =
        'currentTarget' in eventOrTarget
          ? eventOrTarget.currentTarget
          : eventOrTarget;

      if (
        typeof target.selectionStart !== 'number' ||
        typeof target.selectionEnd !== 'number'
      ) {
        return;
      }

      updateSelection({
        start: target.selectionStart,
        end: target.selectionEnd,
        direction: target.selectionDirection ?? undefined,
        path: key,
      });
      updateInputState({
        field: key,
        hasFocus: true,
        valueLength: target.value?.length ?? value.length,
        selectionStart: target.selectionStart,
        selectionEnd: target.selectionEnd,
      });
    },
    [key, updateInputState, updateSelection, value.length],
  );

  const onCompositionStart = useCallback(() => {
    updateTyping(true, key, true);
    updateInputState({
      field: key,
      hasFocus: true,
      valueLength: value.length,
      isComposing: true,
    });
  }, [key, updateInputState, updateTyping, value.length]);

  const onCompositionEnd = useCallback(() => {
    updateTyping(true, key, false);
    updateInputState({
      field: key,
      hasFocus: true,
      valueLength: value.length,
      isComposing: false,
    });
  }, [key, updateInputState, updateTyping, value.length]);

  return {
    value,
    onChange,
    onFocus,
    onBlur,
    onSelect,
    onCompositionStart,
    onCompositionEnd,
    isEditing,
    editingBy,
  };
}

/**
 * useScrollPresenceTracking - Track scroll depth and position
 */
export function useScrollPresenceTracking(enabled = true) {
  const { updateScroll } = useAeonPage();
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const emitScroll = () => {
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const y = window.scrollY;
      const denominator = Math.max(1, documentHeight - viewportHeight);
      const depth = Math.max(0, Math.min(1, y / denominator));

      updateScroll({
        depth,
        y,
        viewportHeight,
        documentHeight,
      });
    };

    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = window.requestAnimationFrame(() => {
        emitScroll();
        rafRef.current = null;
      });
    };

    emitScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, updateScroll]);
}

/**
 * useViewportPresenceTracking - Track viewport changes
 */
export function useViewportPresenceTracking(enabled = true) {
  const { updateViewport } = useAeonPage();

  useEffect(() => {
    if (!enabled) return;

    const emitViewport = () => {
      updateViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    emitViewport();
    window.addEventListener('resize', emitViewport);

    return () => {
      window.removeEventListener('resize', emitViewport);
    };
  }, [enabled, updateViewport]);
}

/**
 * useAeonEffect - Run effect when Aeon data changes
 */
export function useAeonEffect(
  key: string,
  effect: (value: unknown) => void | (() => void),
) {
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
