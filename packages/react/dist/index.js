// src/Link.tsx
import {
  forwardRef,
  useEffect,
  useRef,
  useCallback as useCallback2,
  useState
} from "react";

// src/hooks/useAeonNavigation.ts
import {
  useContext,
  useCallback,
  useSyncExternalStore,
  createContext
} from "react";
import {
  getNavigator
} from "@affectively/aeon-pages-runtime";
var AeonNavigationContext = createContext(null);
function useNavigator() {
  const context = useContext(AeonNavigationContext);
  return context?.navigator ?? getNavigator();
}
function useAeonNavigation() {
  const navigator2 = useNavigator();
  const state = useSyncExternalStore(useCallback((callback) => navigator2.subscribe(callback), [navigator2]), () => navigator2.getState(), () => navigator2.getState());
  const navigate = useCallback(async (href, options) => {
    await navigator2.navigate(href, options);
  }, [navigator2]);
  const prefetch = useCallback(async (href, options) => {
    await navigator2.prefetch(href, options);
  }, [navigator2]);
  const back = useCallback(async () => {
    await navigator2.back();
  }, [navigator2]);
  const isPreloaded = useCallback((href) => {
    return navigator2.isPreloaded(href);
  }, [navigator2]);
  const preloadAll = useCallback(async (onProgress) => {
    await navigator2.preloadAll(onProgress);
  }, [navigator2]);
  const getCacheStats = useCallback(() => {
    return navigator2.getCacheStats();
  }, [navigator2]);
  return {
    current: state.current,
    previous: state.previous,
    history: state.history,
    isNavigating: state.isNavigating,
    navigate,
    prefetch,
    back,
    preloadAll,
    isPreloaded,
    getCacheStats
  };
}
function useRoutePresence() {
  const navigator2 = useNavigator();
  const getPresence = useCallback((route) => {
    return navigator2.getPresence(route);
  }, [navigator2]);
  const subscribePresence = useCallback((callback) => {
    return navigator2.subscribePresence(callback);
  }, [navigator2]);
  return {
    getPresence,
    subscribePresence
  };
}
function useNavigationPrediction() {
  const navigator2 = useNavigator();
  const predict = useCallback((fromRoute) => {
    const state = navigator2.getState();
    return navigator2.predict(fromRoute ?? state.current);
  }, [navigator2]);
  return {
    predict
  };
}
function useLinkObserver(containerRef) {
  const navigator2 = useNavigator();
  const observe = useCallback(() => {
    if (!containerRef.current)
      return () => {
        return;
      };
    return navigator2.observeLinks(containerRef.current);
  }, [navigator2, containerRef]);
  return { observe };
}
function useTotalPreload() {
  const { preloadAll, getCacheStats } = useAeonNavigation();
  const startPreload = useCallback(async (onProgress) => {
    await preloadAll(onProgress);
  }, [preloadAll]);
  return {
    startPreload,
    getStats: getCacheStats
  };
}

// src/Link.tsx
import { jsxDEV, Fragment } from "react/jsx-dev-runtime";
var Link = forwardRef(({
  href,
  prefetch = "visible",
  transition = "fade",
  showPresence = false,
  preloadData = true,
  replace = false,
  children,
  onNavigateStart,
  onNavigateEnd,
  onClick,
  onMouseEnter,
  onMouseMove,
  className,
  ...props
}, ref) => {
  const internalRef = useRef(null);
  const linkRef = ref ?? internalRef;
  const trajectoryRef = useRef([]);
  const intentTimeoutRef = useRef(null);
  const {
    navigate,
    prefetch: doPrefetch,
    isPreloaded,
    isNavigating
  } = useAeonNavigation();
  const { getPresence, subscribePresence } = useRoutePresence();
  const [presence, setPresence] = useState(null);
  const [isPrefetched, setIsPrefetched] = useState(false);
  useEffect(() => {
    setIsPrefetched(isPreloaded(href));
  }, [href, isPreloaded]);
  useEffect(() => {
    if (prefetch !== "visible" || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        doPrefetch(href, { data: preloadData, presence: showPresence });
        setIsPrefetched(true);
      }
    }, { rootMargin: "100px" });
    const element = linkRef.current;
    if (element)
      observer.observe(element);
    return () => observer.disconnect();
  }, [href, prefetch, preloadData, showPresence, doPrefetch, linkRef]);
  useEffect(() => {
    if (!showPresence)
      return;
    const initialPresence = getPresence(href);
    if (initialPresence) {
      const { count, editing, hot, users } = initialPresence;
      setPresence({ count, editing, hot, users });
    }
    const unsubscribe = subscribePresence((route, info) => {
      if (route === href) {
        const { count, editing, hot, users } = info;
        setPresence({ count, editing, hot, users });
      }
    });
    return unsubscribe;
  }, [href, showPresence, getPresence, subscribePresence]);
  const handleMouseEnter = useCallback2((e) => {
    onMouseEnter?.(e);
    if (prefetch === "hover" || prefetch === "intent") {
      doPrefetch(href, { data: preloadData, presence: showPresence });
      setIsPrefetched(true);
    }
  }, [href, prefetch, preloadData, showPresence, doPrefetch, onMouseEnter]);
  const handleMouseMove = useCallback2((e) => {
    onMouseMove?.(e);
    if (prefetch !== "intent")
      return;
    const now = Date.now();
    trajectoryRef.current.push({ x: e.clientX, y: e.clientY, time: now });
    if (trajectoryRef.current.length > 5) {
      trajectoryRef.current.shift();
    }
    if (intentTimeoutRef.current) {
      clearTimeout(intentTimeoutRef.current);
    }
    intentTimeoutRef.current = setTimeout(() => {
      const points = trajectoryRef.current;
      if (points.length < 2)
        return;
      const element = linkRef.current;
      if (!element)
        return;
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const lastPoint = points[points.length - 1];
      const prevPoint = points[points.length - 2];
      const velocityX = lastPoint.x - prevPoint.x;
      const velocityY = lastPoint.y - prevPoint.y;
      const projectedX = lastPoint.x + velocityX * 10;
      const projectedY = lastPoint.y + velocityY * 10;
      const currentDist = Math.hypot(lastPoint.x - centerX, lastPoint.y - centerY);
      const projectedDist = Math.hypot(projectedX - centerX, projectedY - centerY);
      if (projectedDist < currentDist) {
        doPrefetch(href, {
          data: preloadData,
          presence: showPresence,
          priority: "high"
        });
        setIsPrefetched(true);
      }
    }, 50);
  }, [
    href,
    prefetch,
    preloadData,
    showPresence,
    doPrefetch,
    onMouseMove,
    linkRef
  ]);
  const handleClick = useCallback2(async (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    onNavigateStart?.();
    try {
      await navigate(href, { transition, replace });
    } finally {
      onNavigateEnd?.();
    }
  }, [
    href,
    transition,
    replace,
    navigate,
    onClick,
    onNavigateStart,
    onNavigateEnd
  ]);
  useEffect(() => {
    return () => {
      if (intentTimeoutRef.current) {
        clearTimeout(intentTimeoutRef.current);
      }
    };
  }, []);
  const renderChildren = () => {
    if (typeof children === "function") {
      return children({ presence });
    }
    return /* @__PURE__ */ jsxDEV(Fragment, {
      children: [
        children,
        showPresence && presence && presence.count > 0 && /* @__PURE__ */ jsxDEV("span", {
          className: "aeon-presence-badge",
          "aria-label": `${presence.count} active`,
          children: [
            presence.hot ? "\uD83D\uDD25" : "\uD83D\uDC65",
            " ",
            presence.count,
            presence.editing > 0 && ` (${presence.editing} editing)`
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  return /* @__PURE__ */ jsxDEV("a", {
    ref: linkRef,
    href,
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    className,
    "data-preloaded": isPrefetched ? "" : undefined,
    "data-navigating": isNavigating ? "" : undefined,
    "data-transition": transition,
    "aria-busy": isNavigating,
    ...props,
    children: renderChildren()
  }, undefined, false, undefined, this);
});
Link.displayName = "Link";
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .aeon-presence-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      padding: 0.125rem 0.375rem;
      margin-left: 0.5rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 9999px;
    }

    [data-preloaded]::after {
      content: '';
      display: inline-block;
      width: 4px;
      height: 4px;
      margin-left: 0.25rem;
      background: #10b981;
      border-radius: 50%;
      opacity: 0.5;
    }

    /* View transition styles */
    ::view-transition-old(aeon-page) {
      animation: aeon-fade-out 200ms ease-out;
    }

    ::view-transition-new(aeon-page) {
      animation: aeon-fade-in 300ms ease-out;
    }

    @keyframes aeon-fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes aeon-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Slide transition */
    [data-transition="slide"]::view-transition-old(aeon-page) {
      animation: aeon-slide-out 200ms ease-out;
    }

    [data-transition="slide"]::view-transition-new(aeon-page) {
      animation: aeon-slide-in 300ms ease-out;
    }

    @keyframes aeon-slide-out {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(-20px); opacity: 0; }
    }

    @keyframes aeon-slide-in {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  if (!document.getElementById("aeon-link-styles")) {
    style.id = "aeon-link-styles";
    document.head.appendChild(style);
  }
}
// src/provider.tsx
import {
  createContext as createContext2,
  useContext as useContext2,
  useEffect as useEffect2,
  useState as useState2,
  useCallback as useCallback3,
  useRef as useRef2
} from "react";
import {
  getSyncCoordinator,
  getOfflineQueue
} from "@affectively/aeon-pages-runtime";
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
var AeonPageContext = createContext2(null);
function AeonPageProvider({
  route,
  children,
  initialData = {}
}) {
  const sessionId = route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  const [presence, setPresence] = useState2([]);
  const [localUser, setLocalUser] = useState2(null);
  const [sync, setSync] = useState2({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingOperations: 0
  });
  const [version, setVersion] = useState2({
    current: "1.0.0",
    latest: "1.0.0",
    needsMigration: false
  });
  const [data, setDataState] = useState2(initialData);
  const [tree, setTree] = useState2(null);
  const syncCoordinatorRef = useRef2(null);
  const presenceManagerRef = useRef2(null);
  const offlineQueueRef = useRef2(null);
  const versionManagerRef = useRef2(null);
  const wsRef = useRef2(null);
  const updatePresenceUser = useCallback3((userId, patch) => {
    const now = new Date().toISOString();
    setPresence((prev) => {
      const index = prev.findIndex((user) => user.userId === userId);
      if (index < 0) {
        return [
          ...prev,
          {
            userId,
            role: "user",
            status: "online",
            lastActivity: now,
            ...patch
          }
        ];
      }
      const next = [...prev];
      next[index] = {
        ...next[index],
        ...patch,
        lastActivity: patch.lastActivity ?? now
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
        lastActivity: patch.lastActivity ?? now
      };
    });
  }, []);
  const removePresenceUser = useCallback3((userId) => {
    setPresence((prev) => prev.filter((user) => user.userId !== userId));
  }, []);
  const setPresenceSnapshot = useCallback3((users) => {
    setPresence(users);
  }, []);
  const sendSocketMessage = useCallback3((message) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, []);
  const connectWebSocket = useCallback3((targetSessionId, userId, role = "user") => {
    if (typeof window === "undefined")
      return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const params = new URLSearchParams({
      session: targetSessionId,
      userId,
      role
    });
    const wsUrl = `${protocol}//${window.location.host}/_aeon/ws?${params.toString()}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      console.log("[aeon-provider] WebSocket connected");
      sendSocketMessage({
        type: "presence",
        payload: { status: "online" }
      });
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleSyncMessage(message);
      } catch (error) {
        console.error("[aeon-provider] Error parsing message:", error);
      }
    };
    ws.onclose = () => {
      console.log("[aeon-provider] WebSocket disconnected");
      setTimeout(() => connectWebSocket(targetSessionId, userId, role), 1000);
    };
    ws.onerror = (error) => {
      console.error("[aeon-provider] WebSocket error:", error);
    };
  }, [sendSocketMessage]);
  const handleSyncMessage = useCallback3((message) => {
    if (!isRecord(message) || typeof message.type !== "string") {
      return;
    }
    const msg = message;
    switch (msg.type) {
      case "init": {
        if (!isRecord(msg.payload))
          break;
        const payload = msg.payload;
        if (isRecord(payload.session)) {
          const session = payload.session;
          if ("tree" in session) {
            setTree(session.tree);
          }
          if (isRecord(session.data)) {
            setDataState((prev) => ({
              ...prev,
              ...session.data
            }));
          }
        }
        if (Array.isArray(payload.presence)) {
          setPresenceSnapshot(payload.presence);
        }
        break;
      }
      case "presence-update": {
        if (Array.isArray(msg.users)) {
          setPresenceSnapshot(msg.users);
          break;
        }
        if (isRecord(msg.payload) && Array.isArray(msg.payload.users)) {
          setPresenceSnapshot(msg.payload.users);
        }
        break;
      }
      case "presence": {
        if (!isRecord(msg.payload))
          break;
        const payload = msg.payload;
        if ((payload.action === "join" || payload.action === "update") && payload.user) {
          const user = payload.user;
          updatePresenceUser(user.userId, user);
        } else if (payload.action === "leave" && typeof payload.userId === "string") {
          removePresenceUser(payload.userId);
        }
        break;
      }
      case "cursor": {
        if (!isRecord(msg.payload) || typeof msg.payload.userId !== "string") {
          break;
        }
        if (isRecord(msg.payload.cursor)) {
          updatePresenceUser(msg.payload.userId, {
            cursor: {
              x: Number(msg.payload.cursor.x ?? 0),
              y: Number(msg.payload.cursor.y ?? 0)
            }
          });
        }
        break;
      }
      case "typing": {
        if (!isRecord(msg.payload) || typeof msg.payload.userId !== "string") {
          break;
        }
        const typing = toPresenceTyping(msg.payload.typing);
        if (typing) {
          updatePresenceUser(msg.payload.userId, {
            typing
          });
        }
        break;
      }
      case "focus": {
        if (!isRecord(msg.payload) || typeof msg.payload.userId !== "string") {
          break;
        }
        if (typeof msg.payload.focusNode === "string") {
          updatePresenceUser(msg.payload.userId, {
            focusNode: msg.payload.focusNode
          });
        }
        break;
      }
      case "selection": {
        if (!isRecord(msg.payload) || typeof msg.payload.userId !== "string") {
          break;
        }
        const selection = toPresenceSelection(msg.payload.selection);
        if (selection) {
          updatePresenceUser(msg.payload.userId, {
            selection
          });
        }
        break;
      }
      case "scroll": {
        if (!isRecord(msg.payload) || typeof msg.payload.userId !== "string") {
          break;
        }
        const scroll = toPresenceScroll(msg.payload.scroll);
        if (scroll) {
          updatePresenceUser(msg.payload.userId, {
            scroll
          });
        }
        break;
      }
      case "viewport": {
        if (!isRecord(msg.payload) || typeof msg.payload.userId !== "string") {
          break;
        }
        const viewport = toPresenceViewport(msg.payload.viewport);
        if (viewport) {
          updatePresenceUser(msg.payload.userId, {
            viewport
          });
        }
        break;
      }
      case "input-state": {
        if (!isRecord(msg.payload) || typeof msg.payload.userId !== "string") {
          break;
        }
        const inputState = toPresenceInputState(msg.payload.inputState);
        if (inputState) {
          updatePresenceUser(msg.payload.userId, {
            inputState
          });
        }
        break;
      }
      case "emotion": {
        if (!isRecord(msg.payload) || typeof msg.payload.userId !== "string") {
          break;
        }
        const emotion = toPresenceEmotion(msg.payload.emotion);
        if (emotion) {
          updatePresenceUser(msg.payload.userId, {
            emotion
          });
        }
        break;
      }
      case "data-update":
        if (isRecord(msg.data)) {
          setDataState((prev) => ({
            ...prev,
            ...msg.data
          }));
        }
        break;
      case "tree-update":
        setTree(msg.tree);
        break;
      case "version-info": {
        const parsedVersion = toVersionInfo(msg.version);
        if (parsedVersion) {
          setVersion(parsedVersion);
        }
        break;
      }
    }
  }, [removePresenceUser, setPresenceSnapshot, updatePresenceUser]);
  useEffect2(() => {
    const initAeon = async () => {
      try {
        syncCoordinatorRef.current = getSyncCoordinator();
        offlineQueueRef.current = getOfflineQueue();
        presenceManagerRef.current = null;
        versionManagerRef.current = null;
        const userId = generateUserId();
        const initialUser = {
          userId,
          role: "user",
          status: "online",
          lastActivity: new Date().toISOString()
        };
        setLocalUser(initialUser);
        connectWebSocket(sessionId, initialUser.userId, initialUser.role);
      } catch (error) {
        console.warn("[aeon-provider] Aeon modules not available:", error);
      }
    };
    initAeon();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWebSocket, sessionId]);
  useEffect2(() => {
    if (typeof window === "undefined")
      return;
    const handleOnline = () => {
      setSync((prev) => ({ ...prev, isOnline: true }));
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setSync((prev) => ({ ...prev, isOnline: false }));
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const patchLocalUser = useCallback3((patch) => {
    const now = new Date().toISOString();
    setLocalUser((prev) => {
      if (!prev)
        return prev;
      return {
        ...prev,
        ...patch,
        lastActivity: now
      };
    });
  }, []);
  const flushOfflineQueue = useCallback3(async () => {
    if (!offlineQueueRef.current)
      return;
    setSync((prev) => ({ ...prev, isSyncing: true }));
    try {
      await offlineQueueRef.current.flush();
      setSync((prev) => ({
        ...prev,
        isSyncing: false,
        pendingOperations: 0,
        lastSyncAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error("[aeon-provider] Error flushing offline queue:", error);
      setSync((prev) => ({ ...prev, isSyncing: false }));
    }
  }, []);
  const updateCursor = useCallback3((position, path) => {
    patchLocalUser({
      cursor: position,
      focusNode: path
    });
    sendSocketMessage({
      type: "cursor",
      payload: {
        ...position,
        path
      }
    });
  }, [patchLocalUser, sendSocketMessage]);
  const updateEditing = useCallback3((elementPath) => {
    patchLocalUser({
      editing: elementPath ?? undefined
    });
    sendSocketMessage({
      type: "presence",
      payload: {
        status: localUser?.status ?? "online",
        editing: elementPath
      }
    });
  }, [localUser?.status, patchLocalUser, sendSocketMessage]);
  const updateFocusNode = useCallback3((nodePath) => {
    patchLocalUser({ focusNode: nodePath });
    sendSocketMessage({
      type: "focus",
      payload: { nodePath }
    });
  }, [patchLocalUser, sendSocketMessage]);
  const updateSelection = useCallback3((selection) => {
    patchLocalUser({ selection });
    sendSocketMessage({
      type: "selection",
      payload: selection
    });
  }, [patchLocalUser, sendSocketMessage]);
  const updateTyping = useCallback3((isTyping, field, isComposing = false) => {
    const now = new Date().toISOString();
    patchLocalUser({
      typing: {
        isTyping,
        field,
        isComposing,
        startedAt: isTyping ? now : undefined,
        stoppedAt: isTyping ? undefined : now
      }
    });
    sendSocketMessage({
      type: "typing",
      payload: {
        isTyping,
        field,
        isComposing
      }
    });
  }, [patchLocalUser, sendSocketMessage]);
  const updateScroll = useCallback3((scroll) => {
    const normalized = {
      ...scroll,
      depth: Math.max(0, Math.min(1, scroll.depth))
    };
    patchLocalUser({ scroll: normalized });
    sendSocketMessage({
      type: "scroll",
      payload: normalized
    });
  }, [patchLocalUser, sendSocketMessage]);
  const updateViewport = useCallback3((viewport) => {
    patchLocalUser({ viewport });
    sendSocketMessage({
      type: "viewport",
      payload: viewport
    });
  }, [patchLocalUser, sendSocketMessage]);
  const updateInputState = useCallback3((inputState) => {
    patchLocalUser({ inputState });
    sendSocketMessage({
      type: "input-state",
      payload: inputState
    });
  }, [patchLocalUser, sendSocketMessage]);
  const updateEmotionState = useCallback3((emotion) => {
    const enrichedEmotion = {
      ...emotion,
      updatedAt: new Date().toISOString()
    };
    patchLocalUser({ emotion: enrichedEmotion });
    sendSocketMessage({
      type: "emotion",
      payload: emotion
    });
  }, [patchLocalUser, sendSocketMessage]);
  const forceSync = useCallback3(async () => {
    if (!sync.isOnline) {
      throw new Error("Cannot sync while offline");
    }
    setSync((prev) => ({ ...prev, isSyncing: true }));
    try {
      await syncCoordinatorRef.current?.sync();
      setSync((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date().toISOString()
      }));
    } catch (error) {
      setSync((prev) => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [sync.isOnline]);
  const migrate = useCallback3(async (toVersion) => {
    await versionManagerRef.current?.migrate(toVersion);
    setVersion((prev) => ({
      ...prev,
      current: toVersion,
      needsMigration: false
    }));
  }, []);
  const setData = useCallback3((key, value) => {
    setDataState((prev) => ({ ...prev, [key]: value }));
    if (sync.isOnline && wsRef.current) {
      sendSocketMessage({
        type: "data-set",
        key,
        value
      });
    } else {
      offlineQueueRef.current?.enqueue({
        type: "data-set",
        key,
        value
      });
      setSync((prev) => ({
        ...prev,
        pendingOperations: prev.pendingOperations + 1
      }));
    }
  }, [sendSocketMessage, sync.isOnline]);
  const updateTree = useCallback3((path, value) => {
    sendSocketMessage({
      type: "tree-patch",
      path,
      value
    });
  }, [sendSocketMessage]);
  const contextValue = {
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
    updateTree
  };
  return /* @__PURE__ */ jsxDEV2(AeonPageContext.Provider, {
    value: contextValue,
    children
  }, undefined, false, undefined, this);
}
function useAeonPage() {
  const context = useContext2(AeonPageContext);
  if (!context) {
    throw new Error("useAeonPage must be used within an AeonPageProvider");
  }
  return context;
}
function usePresence() {
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
    updateEmotionState
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
    updateEmotionState
  };
}
function useAeonSync() {
  const { sync, forceSync } = useAeonPage();
  return { ...sync, forceSync };
}
function useAeonData(key) {
  const { data, setData } = useAeonPage();
  const value = data[key];
  const setValue = useCallback3((newValue) => setData(key, newValue), [key, setData]);
  return [value, setValue];
}
function generateUserId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function toPresenceSelection(value) {
  if (!isRecord(value))
    return null;
  if (typeof value.start !== "number" || typeof value.end !== "number") {
    return null;
  }
  return {
    start: value.start,
    end: value.end,
    direction: value.direction === "forward" || value.direction === "backward" || value.direction === "none" ? value.direction : undefined,
    path: typeof value.path === "string" ? value.path : undefined
  };
}
function toPresenceTyping(value) {
  if (!isRecord(value) || typeof value.isTyping !== "boolean") {
    return null;
  }
  return {
    isTyping: value.isTyping,
    field: typeof value.field === "string" ? value.field : undefined,
    isComposing: typeof value.isComposing === "boolean" ? value.isComposing : undefined,
    startedAt: typeof value.startedAt === "string" ? value.startedAt : undefined,
    stoppedAt: typeof value.stoppedAt === "string" ? value.stoppedAt : undefined
  };
}
function toPresenceScroll(value) {
  if (!isRecord(value) || typeof value.depth !== "number") {
    return null;
  }
  return {
    depth: value.depth,
    y: typeof value.y === "number" ? value.y : undefined,
    viewportHeight: typeof value.viewportHeight === "number" ? value.viewportHeight : undefined,
    documentHeight: typeof value.documentHeight === "number" ? value.documentHeight : undefined,
    path: typeof value.path === "string" ? value.path : undefined
  };
}
function toPresenceViewport(value) {
  if (!isRecord(value) || typeof value.width !== "number" || typeof value.height !== "number") {
    return null;
  }
  return {
    width: value.width,
    height: value.height
  };
}
function toPresenceInputState(value) {
  if (!isRecord(value) || typeof value.field !== "string" || typeof value.hasFocus !== "boolean") {
    return null;
  }
  return {
    field: value.field,
    hasFocus: value.hasFocus,
    valueLength: typeof value.valueLength === "number" ? value.valueLength : undefined,
    selectionStart: typeof value.selectionStart === "number" ? value.selectionStart : undefined,
    selectionEnd: typeof value.selectionEnd === "number" ? value.selectionEnd : undefined,
    isComposing: typeof value.isComposing === "boolean" ? value.isComposing : undefined,
    inputMode: typeof value.inputMode === "string" ? value.inputMode : undefined
  };
}
function toPresenceEmotion(value) {
  if (!isRecord(value))
    return null;
  const emotion = {
    primary: typeof value.primary === "string" ? value.primary : undefined,
    secondary: typeof value.secondary === "string" ? value.secondary : undefined,
    confidence: typeof value.confidence === "number" ? value.confidence : undefined,
    intensity: typeof value.intensity === "number" ? value.intensity : undefined,
    valence: typeof value.valence === "number" ? value.valence : undefined,
    arousal: typeof value.arousal === "number" ? value.arousal : undefined,
    dominance: typeof value.dominance === "number" ? value.dominance : undefined,
    source: value.source === "self-report" || value.source === "inferred" || value.source === "sensor" || value.source === "hybrid" ? value.source : undefined,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined
  };
  if (!emotion.primary && !emotion.secondary && emotion.confidence === undefined && emotion.intensity === undefined && emotion.valence === undefined && emotion.arousal === undefined && emotion.dominance === undefined && !emotion.source && !emotion.updatedAt) {
    return null;
  }
  return emotion;
}
function toVersionInfo(value) {
  if (!isRecord(value) || typeof value.current !== "string" || typeof value.latest !== "string" || typeof value.needsMigration !== "boolean") {
    return null;
  }
  return {
    current: value.current,
    latest: value.latest,
    needsMigration: value.needsMigration
  };
}
// src/hooks.ts
import { useEffect as useEffect3, useRef as useRef3, useCallback as useCallback4, useState as useState3 } from "react";
function useAeonVersion() {
  const { version, migrate } = useAeonPage();
  return { ...version, migrate };
}
function useAeonTree() {
  const { tree, updateTree } = useAeonPage();
  return { tree, updateTree };
}
function useCursorTracking(enabled = true) {
  const { updateCursor } = useAeonPage();
  const throttleRef = useRef3(null);
  useEffect3(() => {
    if (!enabled)
      return;
    const handleMouseMove = (e) => {
      if (throttleRef.current)
        return;
      throttleRef.current = window.requestAnimationFrame(() => {
        updateCursor({ x: e.clientX, y: e.clientY });
        throttleRef.current = null;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (throttleRef.current) {
        window.cancelAnimationFrame(throttleRef.current);
      }
    };
  }, [enabled, updateCursor]);
}
function useEditableElement(elementPath) {
  const { updateEditing, updateFocusNode, updateTree } = useAeonPage();
  const [isFocused, setIsFocused] = useState3(false);
  const onFocus = useCallback4(() => {
    setIsFocused(true);
    updateEditing(elementPath);
    updateFocusNode(elementPath);
  }, [elementPath, updateEditing, updateFocusNode]);
  const onBlur = useCallback4(() => {
    setIsFocused(false);
    updateEditing(null);
  }, [updateEditing]);
  const onChange = useCallback4((value) => {
    updateTree(elementPath, value);
  }, [elementPath, updateTree]);
  return {
    isFocused,
    isBeingEditedByOther: false,
    onFocus,
    onBlur,
    onChange
  };
}
function useOtherCursors() {
  const { presence, localUser } = useAeonPage();
  return presence.filter((user) => user.userId !== localUser?.userId);
}
function useOfflineStatus() {
  const { sync } = useAeonPage();
  return {
    isOffline: !sync.isOnline,
    isSyncing: sync.isSyncing,
    pendingOperations: sync.pendingOperations,
    lastSyncAt: sync.lastSyncAt
  };
}
function useEmotionPresence() {
  const { presence, localUser, updateEmotionState } = useAeonPage();
  const others = presence.filter((user) => user.userId !== localUser?.userId);
  return {
    localEmotion: localUser?.emotion,
    others,
    updateEmotionState
  };
}
function useCollaborativeInput(key) {
  const {
    data,
    setData,
    presence,
    localUser,
    updateEditing,
    updateFocusNode,
    updateSelection,
    updateTyping,
    updateInputState
  } = useAeonPage();
  const [isEditing, setIsEditing] = useState3(false);
  const value = data[key] ?? "";
  const editingBy = presence.find((user) => user.editing === key && user.userId !== localUser?.userId);
  const onChange = useCallback4((newValue) => {
    setData(key, newValue);
    updateTyping(true, key, false);
    updateInputState({
      field: key,
      hasFocus: true,
      valueLength: newValue.length
    });
  }, [key, setData, updateInputState, updateTyping]);
  const onFocus = useCallback4(() => {
    setIsEditing(true);
    updateEditing(key);
    updateFocusNode(key);
    updateTyping(true, key, false);
  }, [key, updateEditing, updateFocusNode, updateTyping]);
  const onBlur = useCallback4(() => {
    setIsEditing(false);
    updateTyping(false, key, false);
    updateInputState({
      field: key,
      hasFocus: false,
      valueLength: value.length
    });
    updateEditing(null);
  }, [key, updateEditing, updateInputState, updateTyping, value.length]);
  const onSelect = useCallback4((eventOrTarget) => {
    const target = "currentTarget" in eventOrTarget ? eventOrTarget.currentTarget : eventOrTarget;
    if (typeof target.selectionStart !== "number" || typeof target.selectionEnd !== "number") {
      return;
    }
    updateSelection({
      start: target.selectionStart,
      end: target.selectionEnd,
      direction: target.selectionDirection ?? undefined,
      path: key
    });
    updateInputState({
      field: key,
      hasFocus: true,
      valueLength: target.value?.length ?? value.length,
      selectionStart: target.selectionStart,
      selectionEnd: target.selectionEnd
    });
  }, [key, updateInputState, updateSelection, value.length]);
  const onCompositionStart = useCallback4(() => {
    updateTyping(true, key, true);
    updateInputState({
      field: key,
      hasFocus: true,
      valueLength: value.length,
      isComposing: true
    });
  }, [key, updateInputState, updateTyping, value.length]);
  const onCompositionEnd = useCallback4(() => {
    updateTyping(true, key, false);
    updateInputState({
      field: key,
      hasFocus: true,
      valueLength: value.length,
      isComposing: false
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
    editingBy
  };
}
function useScrollPresenceTracking(enabled = true) {
  const { updateScroll } = useAeonPage();
  const rafRef = useRef3(null);
  useEffect3(() => {
    if (!enabled)
      return;
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
        documentHeight
      });
    };
    const handleScroll = () => {
      if (rafRef.current)
        return;
      rafRef.current = window.requestAnimationFrame(() => {
        emitScroll();
        rafRef.current = null;
      });
    };
    emitScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, updateScroll]);
}
function useViewportPresenceTracking(enabled = true) {
  const { updateViewport } = useAeonPage();
  useEffect3(() => {
    if (!enabled)
      return;
    const emitViewport = () => {
      updateViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    emitViewport();
    window.addEventListener("resize", emitViewport);
    return () => {
      window.removeEventListener("resize", emitViewport);
    };
  }, [enabled, updateViewport]);
}
function useAeonEffect(key, effect) {
  const { data } = useAeonPage();
  const value = data[key];
  useEffect3(() => {
    return effect(value);
  }, [value, effect]);
}
function useSessionId() {
  const { sessionId } = useAeonPage();
  return sessionId;
}
function useRoute() {
  const { route } = useAeonPage();
  return route;
}
// src/hooks/useServiceWorker.ts
import { useEffect as useEffect4, useState as useState4, useCallback as useCallback5, useRef as useRef4 } from "react";
function useAeonServiceWorker() {
  const [isRegistered, setIsRegistered] = useState4(false);
  const [isActive, setIsActive] = useState4(false);
  const [error, setError] = useState4(null);
  const registrationRef = useRef4(null);
  useEffect4(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/.aeon/sw.js", { scope: "/" });
        registrationRef.current = registration;
        setIsRegistered(true);
        if (registration.active) {
          setIsActive(true);
        }
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                setIsActive(true);
              }
            });
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to register SW"));
      }
    };
    registerSW();
  }, []);
  const update = useCallback5(async () => {
    if (registrationRef.current) {
      await registrationRef.current.update();
    }
  }, []);
  const unregister = useCallback5(async () => {
    if (registrationRef.current) {
      await registrationRef.current.unregister();
      setIsRegistered(false);
      setIsActive(false);
    }
  }, []);
  return {
    isRegistered,
    isActive,
    error,
    update,
    unregister
  };
}
function usePreloadProgress() {
  const [progress, setProgress] = useState4({
    loaded: 0,
    total: 0,
    percentage: 0,
    isComplete: false,
    cachedRoutes: []
  });
  useEffect4(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const handleMessage = (event) => {
      const data = event.data;
      if (data.type === "PRELOAD_PROGRESS") {
        setProgress({
          loaded: data.loaded,
          total: data.total,
          percentage: data.percentage,
          isComplete: false,
          cachedRoutes: []
        });
      } else if (data.type === "PRELOAD_COMPLETE") {
        setProgress({
          loaded: data.loaded,
          total: data.total,
          percentage: 100,
          isComplete: true,
          cachedRoutes: data.cachedRoutes || []
        });
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);
  return progress;
}
function useCacheStatus() {
  const [status, setStatus] = useState4({
    cached: 0,
    total: 0,
    routes: [],
    isReady: false
  });
  const refresh = useCallback5(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }
    const channel = new MessageChannel;
    channel.port1.onmessage = (event) => {
      const data = event.data;
      setStatus({
        cached: data.cached,
        total: data.total,
        routes: data.routes,
        isReady: data.cached === data.total && data.total > 0
      });
    };
    controller.postMessage({ type: "GET_CACHE_STATUS" }, [channel.port2]);
  }, []);
  useEffect4(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);
  return { ...status, refresh };
}
function useManualPreload() {
  const [isPreloading, setIsPreloading] = useState4(false);
  const progress = usePreloadProgress();
  const triggerPreload = useCallback5(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }
    setIsPreloading(true);
    controller.postMessage({ type: "TRIGGER_PRELOAD" });
  }, []);
  useEffect4(() => {
    if (progress.isComplete) {
      setIsPreloading(false);
    }
  }, [progress.isComplete]);
  return {
    triggerPreload,
    isPreloading,
    progress
  };
}
function usePrefetchRoute() {
  const prefetch = useCallback5((route) => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }
    controller.postMessage({ type: "PREFETCH_ROUTE", route });
  }, []);
  return prefetch;
}
function useClearCache() {
  const [isClearing, setIsClearing] = useState4(false);
  const clearCache = useCallback5(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }
    setIsClearing(true);
    controller.postMessage({ type: "CLEAR_CACHE" });
    await new Promise((r) => setTimeout(r, 100));
    setIsClearing(false);
  }, []);
  return { clearCache, isClearing };
}
// src/hooks/usePilotNavigation.ts
import { useState as useState5, useCallback as useCallback6, useMemo } from "react";
function usePilotNavigation(options) {
  const { onConsentRequired, maxHistory = 50 } = options ?? {};
  const navigation = useAeonNavigation();
  const [pendingIntent, setPendingIntent] = useState5(null);
  const [intentHistory, setIntentHistory] = useState5([]);
  const pilot = useCallback6(async (destination, pilotOptions) => {
    const {
      requireConsent = true,
      reason,
      source = "user",
      confidence,
      metadata,
      autoNavigateDelay,
      ...navOptions
    } = pilotOptions ?? {};
    const intent = {
      id: `nav-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      destination,
      reason,
      source,
      confidence,
      timestamp: Date.now(),
      metadata
    };
    setIntentHistory((prev) => [...prev.slice(-maxHistory + 1), intent]);
    const needsConsent = requireConsent && (source === "cyrano" || source === "esi");
    if (!needsConsent) {
      await navigation.navigate(destination, navOptions);
      return true;
    }
    if (onConsentRequired) {
      const consented = await onConsentRequired(intent);
      if (consented) {
        await navigation.navigate(destination, navOptions);
        return true;
      }
      return false;
    }
    setPendingIntent(intent);
    if (autoNavigateDelay && autoNavigateDelay > 0) {
      setTimeout(async () => {
        setPendingIntent((current) => {
          if (current?.id === intent.id) {
            navigation.navigate(destination, navOptions);
            return null;
          }
          return current;
        });
      }, autoNavigateDelay);
    }
    return false;
  }, [navigation, onConsentRequired, maxHistory]);
  const approve = useCallback6(async () => {
    if (!pendingIntent)
      return false;
    const destination = pendingIntent.destination;
    setPendingIntent(null);
    await navigation.navigate(destination);
    return true;
  }, [pendingIntent, navigation]);
  const reject = useCallback6(() => {
    if (!pendingIntent)
      return;
    setPendingIntent(null);
  }, [pendingIntent]);
  const clearPending = useCallback6(() => {
    setPendingIntent(null);
  }, []);
  const navigateDirect = useCallback6(async (destination, navOptions) => {
    await navigation.navigate(destination, navOptions);
  }, [navigation]);
  return useMemo(() => ({
    pendingIntent,
    intentHistory,
    isNavigating: navigation.isNavigating,
    current: navigation.current,
    pilot,
    approve,
    reject,
    clearPending,
    navigateDirect,
    prefetch: navigation.prefetch,
    back: navigation.back,
    isPreloaded: navigation.isPreloaded
  }), [
    pendingIntent,
    intentHistory,
    navigation.isNavigating,
    navigation.current,
    pilot,
    approve,
    reject,
    clearPending,
    navigateDirect,
    navigation.prefetch,
    navigation.back,
    navigation.isPreloaded
  ]);
}
function parseNavigationTags(text) {
  const regex = /\[navigate:([^\]]+)\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      destination: match[1],
      fullMatch: match[0]
    });
  }
  return matches;
}
function stripNavigationTags(text) {
  return text.replace(/\[navigate:[^\]]+\]/g, "").trim();
}
// src/hooks/useNetworkState.ts
import { useState as useState6, useEffect as useEffect6, useCallback as useCallback7 } from "react";
function useNetworkState() {
  const [state, setState] = useState6("unknown");
  const [lastChange, setLastChange] = useState6(Date.now());
  const [bandwidth, setBandwidth] = useState6({
    speedKbps: 1024,
    latencyMs: 50,
    reliability: 1,
    effectiveType: "unknown"
  });
  const getConnection = useCallback7(() => {
    if (typeof navigator === "undefined")
      return;
    const nav = navigator;
    return nav.connection || nav.mozConnection || nav.webkitConnection;
  }, []);
  const updateBandwidth = useCallback7(() => {
    const conn = getConnection();
    if (!conn)
      return;
    const effectiveType = conn.effectiveType || "unknown";
    let speedKbps = 1024;
    let latencyMs = 50;
    let reliability = 1;
    switch (effectiveType) {
      case "slow-2g":
        speedKbps = 50;
        latencyMs = 2000;
        reliability = 0.5;
        break;
      case "2g":
        speedKbps = 150;
        latencyMs = 1000;
        reliability = 0.7;
        break;
      case "3g":
        speedKbps = 750;
        latencyMs = 400;
        reliability = 0.85;
        break;
      case "4g":
        speedKbps = 5000;
        latencyMs = 50;
        reliability = 0.95;
        break;
    }
    if (conn.downlink) {
      speedKbps = conn.downlink * 1024;
    }
    if (conn.rtt) {
      latencyMs = conn.rtt;
    }
    setBandwidth({
      speedKbps,
      latencyMs,
      reliability,
      effectiveType
    });
    if (effectiveType === "slow-2g" || effectiveType === "2g") {
      setState((prev) => {
        if (prev !== "poor") {
          setLastChange(Date.now());
        }
        return "poor";
      });
    }
  }, [getConnection]);
  const updateOnlineState = useCallback7(() => {
    if (typeof navigator === "undefined")
      return;
    const isOnline = navigator.onLine;
    setState((prev) => {
      const newState = isOnline ? "online" : "offline";
      if (prev !== newState) {
        setLastChange(Date.now());
      }
      return newState;
    });
    if (isOnline) {
      updateBandwidth();
    }
  }, [updateBandwidth]);
  const refresh = useCallback7(() => {
    updateOnlineState();
  }, [updateOnlineState]);
  useEffect6(() => {
    updateOnlineState();
    const handleOnline = () => {
      setState("online");
      setLastChange(Date.now());
      updateBandwidth();
    };
    const handleOffline = () => {
      setState("offline");
      setLastChange(Date.now());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    const conn = getConnection();
    if (conn?.addEventListener) {
      conn.addEventListener("change", updateBandwidth);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
      if (conn?.removeEventListener) {
        conn.removeEventListener("change", updateBandwidth);
      }
    };
  }, [getConnection, updateBandwidth, updateOnlineState]);
  return {
    state,
    isOnline: state === "online" || state === "poor",
    isPoor: state === "poor",
    bandwidth,
    timeSinceChange: Date.now() - lastChange,
    refresh
  };
}
// src/hooks/useConflicts.ts
import { useState as useState7, useEffect as useEffect7, useCallback as useCallback8, useMemo as useMemo2 } from "react";
var conflictStore = new Map;
var listeners = new Set;
function notifyListeners() {
  listeners.forEach((listener) => listener());
}
function useConflicts(sessionId) {
  const [conflicts, setConflicts] = useState7([]);
  const [isLoading, setIsLoading] = useState7(false);
  const loadConflicts = useCallback8(() => {
    const allConflicts = Array.from(conflictStore.values());
    const filtered = sessionId ? allConflicts.filter((c) => c.sessionId === sessionId) : allConflicts;
    setConflicts(filtered);
  }, [sessionId]);
  useEffect7(() => {
    loadConflicts();
    const listener = () => loadConflicts();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [loadConflicts]);
  const unresolvedConflicts = useMemo2(() => conflicts.filter((c) => !c.resolution), [conflicts]);
  const highSeverityConflicts = useMemo2(() => conflicts.filter((c) => !c.resolution && c.severity === "high"), [conflicts]);
  const stats = useMemo2(() => {
    const byType = {
      update_update: 0,
      delete_update: 0,
      update_delete: 0,
      concurrent: 0
    };
    const byStrategy = {
      "local-wins": 0,
      "remote-wins": 0,
      merge: 0,
      "last-modified": 0,
      manual: 0
    };
    let unresolved = 0;
    let highSeverity = 0;
    for (const conflict of conflicts) {
      byType[conflict.type]++;
      if (!conflict.resolution) {
        unresolved++;
        if (conflict.severity === "high") {
          highSeverity++;
        }
      } else {
        byStrategy[conflict.resolution.strategy]++;
      }
    }
    return {
      total: conflicts.length,
      unresolved,
      highSeverity,
      byType,
      byStrategy
    };
  }, [conflicts]);
  const resolveConflict = useCallback8(async (conflictId, strategy, customData) => {
    setIsLoading(true);
    try {
      const conflict = conflictStore.get(conflictId);
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }
      let resolvedData;
      switch (strategy) {
        case "local-wins":
          resolvedData = conflict.localData;
          break;
        case "remote-wins":
          resolvedData = conflict.remoteData;
          break;
        case "merge":
          resolvedData = { ...conflict.remoteData, ...conflict.localData };
          break;
        case "last-modified":
          resolvedData = conflict.localData;
          break;
        case "manual":
          if (!customData) {
            throw new Error("Manual resolution requires customData");
          }
          resolvedData = customData;
          break;
        default:
          resolvedData = conflict.localData;
      }
      conflict.resolution = {
        strategy,
        resolvedData,
        resolvedAt: Date.now()
      };
      conflictStore.set(conflictId, conflict);
      notifyListeners();
    } finally {
      setIsLoading(false);
    }
  }, []);
  const dismissConflict = useCallback8((conflictId) => {
    conflictStore.delete(conflictId);
    notifyListeners();
  }, []);
  const clearResolved = useCallback8(() => {
    for (const [id, conflict] of conflictStore) {
      if (conflict.resolution) {
        conflictStore.delete(id);
      }
    }
    notifyListeners();
  }, []);
  const refresh = useCallback8(() => {
    loadConflicts();
  }, [loadConflicts]);
  return {
    conflicts,
    unresolvedConflicts,
    highSeverityConflicts,
    stats,
    resolveConflict,
    dismissConflict,
    clearResolved,
    refresh,
    isLoading
  };
}
function addConflict(conflict) {
  conflictStore.set(conflict.id, conflict);
  notifyListeners();
}
function getAllConflicts() {
  return Array.from(conflictStore.values());
}
function clearAllConflicts() {
  conflictStore.clear();
  notifyListeners();
}
// src/components/InstallPrompt.tsx
import { useState as useState8, useEffect as useEffect8, useCallback as useCallback9 } from "react";
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
"use client";
function useInstallPrompt() {
  const [isIOS, setIsIOS] = useState8(false);
  const [isInstalled, setIsInstalled] = useState8(false);
  const [deferredPrompt, setDeferredPrompt] = useState8(null);
  const [canInstall, setCanInstall] = useState8(false);
  useEffect8(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsInstalled(standalone);
    if (iOS && !standalone) {
      setCanInstall(true);
    }
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);
  const install = useCallback9(async () => {
    if (!deferredPrompt) {
      return "unavailable";
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setCanInstall(false);
    }
    return outcome;
  }, [deferredPrompt]);
  const dismiss = useCallback9(() => {
    setCanInstall(false);
    setDeferredPrompt(null);
  }, []);
  return {
    canInstall,
    isInstalled,
    isIOS,
    install,
    dismiss
  };
}
function InstallPrompt({
  renderInstalled,
  renderPrompt,
  renderIOSInstructions,
  showOnlyWhenInstallable = true,
  className
}) {
  const state = useInstallPrompt();
  if (state.isInstalled) {
    return renderInstalled?.() || null;
  }
  if (showOnlyWhenInstallable && !state.canInstall) {
    return null;
  }
  if (state.isIOS) {
    if (renderIOSInstructions) {
      return renderIOSInstructions();
    }
    return /* @__PURE__ */ jsxDEV3("div", {
      className,
      role: "region",
      "aria-label": "Install app instructions",
      children: [
        /* @__PURE__ */ jsxDEV3("h3", {
          style: {
            fontSize: "1.125rem",
            fontWeight: 600,
            marginBottom: "0.5rem"
          },
          children: "Install App"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV3("p", {
          style: { fontSize: "0.875rem", marginBottom: "0.5rem" },
          children: "To install this app on your iOS device:"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV3("ol", {
          style: {
            fontSize: "0.875rem",
            paddingLeft: "1.5rem",
            listStyleType: "decimal"
          },
          children: [
            /* @__PURE__ */ jsxDEV3("li", {
              children: "Tap the share button in Safari"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV3("li", {
              children: 'Scroll down and tap "Add to Home Screen"'
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV3("li", {
              children: 'Tap "Add" to confirm'
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (renderPrompt) {
    return renderPrompt(state);
  }
  if (!state.canInstall) {
    return null;
  }
  return /* @__PURE__ */ jsxDEV3("div", {
    className,
    role: "region",
    "aria-label": "Install app prompt",
    children: [
      /* @__PURE__ */ jsxDEV3("h3", {
        style: {
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "0.5rem"
        },
        children: "Install App"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("p", {
        style: { fontSize: "0.875rem", marginBottom: "1rem" },
        children: "Install this app on your device for a better experience."
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("div", {
        style: { display: "flex", gap: "0.5rem" },
        children: [
          /* @__PURE__ */ jsxDEV3("button", {
            onClick: () => state.install(),
            style: {
              padding: "0.5rem 1rem",
              backgroundColor: "#0d9488",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem"
            },
            "aria-label": "Install application",
            children: "Add to Home Screen"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3("button", {
            onClick: state.dismiss,
            style: {
              padding: "0.5rem 1rem",
              backgroundColor: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem"
            },
            "aria-label": "Dismiss install prompt",
            children: "Not now"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
// src/components/PushNotifications.tsx
import { useState as useState9, useEffect as useEffect9, useCallback as useCallback10 } from "react";
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
"use client";
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0;i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
function serializeSubscription(sub) {
  const p256dh = sub.getKey("p256dh");
  const auth = sub.getKey("auth");
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : "",
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : ""
    }
  };
}
function usePushNotifications(config = {}) {
  const [isSupported, setIsSupported] = useState9(false);
  const [permission, setPermission] = useState9("unsupported");
  const [subscription, setSubscription] = useState9(null);
  const [isLoading, setIsLoading] = useState9(false);
  const [error, setError] = useState9(null);
  const { vapidPublicKey, serviceWorkerUrl = "/sw.js" } = config;
  useEffect9(() => {
    if (typeof window === "undefined")
      return;
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    if (!supported) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then(async (registration) => {
      try {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          setSubscription(serializeSubscription(existingSub));
        }
      } catch (err) {
        console.error("Error loading push subscription:", err);
      }
    });
  }, []);
  const requestPermission = useCallback10(async () => {
    if (!isSupported) {
      return "denied";
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);
  const subscribe = useCallback10(async () => {
    if (!isSupported) {
      setError("Push notifications are not supported");
      return null;
    }
    if (!vapidPublicKey) {
      setError("VAPID public key is required");
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      let registration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
          scope: "/"
        });
      }
      if (Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") {
          throw new Error("Notification permission denied");
        }
      } else if (Notification.permission !== "granted") {
        throw new Error("Notification permission not granted");
      }
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      const serialized = serializeSubscription(sub);
      setSubscription(serialized);
      return serialized;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidPublicKey, serviceWorkerUrl]);
  const unsubscribe = useCallback10(async () => {
    if (!isSupported) {
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
      setSubscription(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);
  const clearError = useCallback10(() => {
    setError(null);
  }, []);
  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    clearError
  };
}
function PushNotifications({
  vapidPublicKey,
  onSubscribe,
  onUnsubscribe,
  render,
  showUI = true,
  className
}) {
  const state = usePushNotifications({ vapidPublicKey });
  const handleSubscribe = async () => {
    const sub = await state.subscribe();
    if (sub && onSubscribe) {
      await onSubscribe(sub);
    }
  };
  const handleUnsubscribe = async () => {
    const endpoint = state.subscription?.endpoint;
    const success = await state.unsubscribe();
    if (success && endpoint && onUnsubscribe) {
      await onUnsubscribe(endpoint);
    }
  };
  if (render) {
    return render(state);
  }
  if (!showUI) {
    return null;
  }
  if (!state.isSupported) {
    return /* @__PURE__ */ jsxDEV4("div", {
      className,
      role: "region",
      "aria-label": "Push notifications",
      children: /* @__PURE__ */ jsxDEV4("p", {
        style: { color: "#6b7280", fontSize: "0.875rem" },
        children: "Push notifications are not supported in this browser."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV4("div", {
    className,
    role: "region",
    "aria-label": "Push notifications",
    children: [
      /* @__PURE__ */ jsxDEV4("h3", {
        style: {
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "0.5rem"
        },
        children: "Push Notifications"
      }, undefined, false, undefined, this),
      state.error && /* @__PURE__ */ jsxDEV4("div", {
        style: {
          padding: "0.75rem",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "0.375rem",
          color: "#dc2626",
          fontSize: "0.875rem",
          marginBottom: "1rem"
        },
        role: "alert",
        children: [
          state.error,
          /* @__PURE__ */ jsxDEV4("button", {
            onClick: state.clearError,
            style: {
              marginLeft: "0.5rem",
              color: "#dc2626",
              background: "none",
              border: "none",
              cursor: "pointer"
            },
            "aria-label": "Dismiss error",
            children: "✕"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      state.subscription ? /* @__PURE__ */ jsxDEV4("div", {
        children: [
          /* @__PURE__ */ jsxDEV4("p", {
            style: {
              color: "#10b981",
              fontSize: "0.875rem",
              marginBottom: "1rem"
            },
            children: "✓ You are subscribed to push notifications."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4("button", {
            onClick: handleUnsubscribe,
            disabled: state.isLoading,
            style: {
              padding: "0.5rem 1rem",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: state.isLoading ? "not-allowed" : "pointer",
              opacity: state.isLoading ? 0.5 : 1,
              fontSize: "0.875rem"
            },
            "aria-label": "Unsubscribe from push notifications",
            children: state.isLoading ? "Unsubscribing..." : "Unsubscribe"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV4("div", {
        children: [
          /* @__PURE__ */ jsxDEV4("p", {
            style: {
              color: "#6b7280",
              fontSize: "0.875rem",
              marginBottom: "1rem"
            },
            children: "You are not subscribed to push notifications."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4("button", {
            onClick: handleSubscribe,
            disabled: state.isLoading || !vapidPublicKey,
            style: {
              padding: "0.5rem 1rem",
              backgroundColor: "#0d9488",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: state.isLoading || !vapidPublicKey ? "not-allowed" : "pointer",
              opacity: state.isLoading || !vapidPublicKey ? 0.5 : 1,
              fontSize: "0.875rem"
            },
            "aria-label": "Subscribe to push notifications",
            children: state.isLoading ? "Subscribing..." : "Subscribe"
          }, undefined, false, undefined, this),
          !vapidPublicKey && /* @__PURE__ */ jsxDEV4("p", {
            style: {
              color: "#f59e0b",
              fontSize: "0.75rem",
              marginTop: "0.5rem"
            },
            children: "VAPID public key is required for push notifications."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
// src/components/OfflineDiagnostics.tsx
import { useState as useState10, useEffect as useEffect10, useCallback as useCallback11 } from "react";
import { jsxDEV as jsxDEV5, Fragment as Fragment2 } from "react/jsx-dev-runtime";
"use client";
function NetworkStatusPanel() {
  const { state, isOnline, isPoor, bandwidth, timeSinceChange, refresh } = useNetworkState();
  const stateColor = {
    online: "#10b981",
    offline: "#ef4444",
    poor: "#f59e0b",
    unknown: "#6b7280"
  }[state];
  const formatTime = (ms) => {
    if (ms < 1000)
      return `${ms}ms`;
    if (ms < 60000)
      return `${Math.floor(ms / 1000)}s`;
    return `${Math.floor(ms / 60000)}m`;
  };
  return /* @__PURE__ */ jsxDEV5("div", {
    style: { marginBottom: "1.5rem" },
    children: [
      /* @__PURE__ */ jsxDEV5("h4", {
        style: {
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        },
        children: [
          /* @__PURE__ */ jsxDEV5("span", {
            style: {
              width: "0.75rem",
              height: "0.75rem",
              borderRadius: "50%",
              backgroundColor: stateColor,
              display: "inline-block"
            }
          }, undefined, false, undefined, this),
          "Network Status"
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5("div", {
        style: { display: "grid", gap: "0.5rem", fontSize: "0.875rem" },
        children: [
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Status:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: stateColor, fontWeight: 500 },
                children: state.charAt(0).toUpperCase() + state.slice(1)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Connection Type:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                children: bandwidth.effectiveType || "Unknown"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Speed:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                children: bandwidth.speedKbps >= 1024 ? `${(bandwidth.speedKbps / 1024).toFixed(1)} Mbps` : `${bandwidth.speedKbps} Kbps`
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Latency:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                children: [
                  bandwidth.latencyMs,
                  "ms"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Last Change:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                children: [
                  formatTime(timeSinceChange),
                  " ago"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5("button", {
        onClick: refresh,
        style: {
          marginTop: "0.75rem",
          padding: "0.375rem 0.75rem",
          backgroundColor: "#e5e7eb",
          border: "none",
          borderRadius: "0.375rem",
          cursor: "pointer",
          fontSize: "0.75rem"
        },
        children: "Refresh"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function ServiceWorkerPanel() {
  const [swState, setSwState] = useState10({
    isSupported: false,
    registration: "none",
    updateAvailable: false,
    controller: false
  });
  const [isChecking, setIsChecking] = useState10(false);
  const checkServiceWorker = useCallback11(async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    setSwState((prev) => ({ ...prev, isSupported: true }));
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setSwState((prev) => ({ ...prev, registration: "none" }));
        return;
      }
      let regState = "none";
      if (registration.active)
        regState = "active";
      else if (registration.waiting)
        regState = "waiting";
      else if (registration.installing)
        regState = "installing";
      setSwState({
        isSupported: true,
        registration: regState,
        updateAvailable: !!registration.waiting,
        controller: !!navigator.serviceWorker.controller
      });
    } catch (error) {
      console.error("Error checking service worker:", error);
    }
  }, []);
  useEffect10(() => {
    checkServiceWorker();
  }, [checkServiceWorker]);
  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        await checkServiceWorker();
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    } finally {
      setIsChecking(false);
    }
  };
  const handleUnregister = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        await checkServiceWorker();
      }
    } catch (error) {
      console.error("Error unregistering service worker:", error);
    }
  };
  const regColor = {
    none: "#6b7280",
    installing: "#f59e0b",
    waiting: "#f59e0b",
    active: "#10b981"
  }[swState.registration];
  return /* @__PURE__ */ jsxDEV5("div", {
    style: { marginBottom: "1.5rem" },
    children: [
      /* @__PURE__ */ jsxDEV5("h4", {
        style: { fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" },
        children: "Service Worker"
      }, undefined, false, undefined, this),
      !swState.isSupported ? /* @__PURE__ */ jsxDEV5("p", {
        style: { color: "#6b7280", fontSize: "0.875rem" },
        children: "Service workers are not supported in this browser."
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV5(Fragment2, {
        children: [
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "grid", gap: "0.5rem", fontSize: "0.875rem" },
            children: [
              /* @__PURE__ */ jsxDEV5("div", {
                style: { display: "flex", justifyContent: "space-between" },
                children: [
                  /* @__PURE__ */ jsxDEV5("span", {
                    style: { color: "#6b7280" },
                    children: "Status:"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV5("span", {
                    style: { color: regColor, fontWeight: 500 },
                    children: swState.registration.charAt(0).toUpperCase() + swState.registration.slice(1)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV5("div", {
                style: { display: "flex", justifyContent: "space-between" },
                children: [
                  /* @__PURE__ */ jsxDEV5("span", {
                    style: { color: "#6b7280" },
                    children: "Controller:"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV5("span", {
                    children: swState.controller ? "Yes" : "No"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              swState.updateAvailable && /* @__PURE__ */ jsxDEV5("div", {
                style: { color: "#f59e0b", fontWeight: 500 },
                children: "⚠ Update available"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", gap: "0.5rem", marginTop: "0.75rem" },
            children: [
              /* @__PURE__ */ jsxDEV5("button", {
                onClick: handleCheckUpdate,
                disabled: isChecking,
                style: {
                  padding: "0.375rem 0.75rem",
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: isChecking ? "not-allowed" : "pointer",
                  opacity: isChecking ? 0.5 : 1,
                  fontSize: "0.75rem"
                },
                children: isChecking ? "Checking..." : "Check for Updates"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("button", {
                onClick: handleUnregister,
                style: {
                  padding: "0.375rem 0.75rem",
                  backgroundColor: "#fef2f2",
                  color: "#ef4444",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "0.75rem"
                },
                children: "Unregister"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function CacheManagementPanel({
  onClearCache
}) {
  const [caches, setCaches] = useState10([]);
  const [isLoading, setIsLoading] = useState10(true);
  const [isClearing, setIsClearing] = useState10(null);
  const loadCaches = useCallback11(async () => {
    if (typeof window === "undefined" || !("caches" in window)) {
      setIsLoading(false);
      return;
    }
    try {
      const cacheNames = await window.caches.keys();
      const cacheInfos = [];
      for (const name of cacheNames) {
        const cache = await window.caches.open(name);
        const keys = await cache.keys();
        cacheInfos.push({
          name,
          itemCount: keys.length,
          sampleUrls: keys.slice(0, 5).map((k) => k.url)
        });
      }
      setCaches(cacheInfos);
    } catch (error) {
      console.error("Error loading caches:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect10(() => {
    loadCaches();
  }, [loadCaches]);
  const handleClearCache = async (cacheName) => {
    setIsClearing(cacheName || "all");
    try {
      if (onClearCache) {
        await onClearCache(cacheName);
      } else if (cacheName) {
        await window.caches.delete(cacheName);
      } else {
        const names = await window.caches.keys();
        await Promise.all(names.map((name) => window.caches.delete(name)));
      }
      await loadCaches();
    } catch (error) {
      console.error("Error clearing cache:", error);
    } finally {
      setIsClearing(null);
    }
  };
  if (!("caches" in window)) {
    return /* @__PURE__ */ jsxDEV5("div", {
      style: { marginBottom: "1.5rem" },
      children: [
        /* @__PURE__ */ jsxDEV5("h4", {
          style: { fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" },
          children: "Cache Storage"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV5("p", {
          style: { color: "#6b7280", fontSize: "0.875rem" },
          children: "Cache API is not supported in this browser."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV5("div", {
    style: { marginBottom: "1.5rem" },
    children: [
      /* @__PURE__ */ jsxDEV5("h4", {
        style: { fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" },
        children: "Cache Storage"
      }, undefined, false, undefined, this),
      isLoading ? /* @__PURE__ */ jsxDEV5("p", {
        style: { color: "#6b7280", fontSize: "0.875rem" },
        children: "Loading..."
      }, undefined, false, undefined, this) : caches.length === 0 ? /* @__PURE__ */ jsxDEV5("p", {
        style: { color: "#6b7280", fontSize: "0.875rem" },
        children: "No caches found."
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV5(Fragment2, {
        children: [
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "grid", gap: "0.75rem" },
            children: caches.map((cache) => /* @__PURE__ */ jsxDEV5("div", {
              style: {
                padding: "0.75rem",
                backgroundColor: "#f3f4f6",
                borderRadius: "0.375rem",
                fontSize: "0.875rem"
              },
              children: [
                /* @__PURE__ */ jsxDEV5("div", {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  },
                  children: [
                    /* @__PURE__ */ jsxDEV5("span", {
                      style: { fontWeight: 500 },
                      children: cache.name
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV5("span", {
                      style: { color: "#6b7280" },
                      children: [
                        cache.itemCount,
                        " items"
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsxDEV5("button", {
                  onClick: () => handleClearCache(cache.name),
                  disabled: isClearing === cache.name,
                  style: {
                    marginTop: "0.5rem",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#fef2f2",
                    color: "#ef4444",
                    border: "none",
                    borderRadius: "0.25rem",
                    cursor: isClearing === cache.name ? "not-allowed" : "pointer",
                    opacity: isClearing === cache.name ? 0.5 : 1,
                    fontSize: "0.75rem"
                  },
                  children: isClearing === cache.name ? "Clearing..." : "Clear"
                }, undefined, false, undefined, this)
              ]
            }, cache.name, true, undefined, this))
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV5("button", {
            onClick: () => handleClearCache(),
            disabled: isClearing === "all",
            style: {
              marginTop: "0.75rem",
              padding: "0.375rem 0.75rem",
              backgroundColor: "#fef2f2",
              color: "#ef4444",
              border: "none",
              borderRadius: "0.375rem",
              cursor: isClearing === "all" ? "not-allowed" : "pointer",
              opacity: isClearing === "all" ? 0.5 : 1,
              fontSize: "0.75rem"
            },
            children: isClearing === "all" ? "Clearing..." : "Clear All Caches"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function QueueStatsPanel({ stats }) {
  const defaultStats = stats || {
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    totalBytes: 0
  };
  const formatBytes = (bytes) => {
    if (bytes < 1024)
      return `${bytes} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  return /* @__PURE__ */ jsxDEV5("div", {
    style: { marginBottom: "1.5rem" },
    children: [
      /* @__PURE__ */ jsxDEV5("h4", {
        style: { fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" },
        children: "Offline Queue"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5("div", {
        style: { display: "grid", gap: "0.5rem", fontSize: "0.875rem" },
        children: [
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Pending:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: defaultStats.pending > 0 ? "#f59e0b" : "#10b981" },
                children: defaultStats.pending
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Syncing:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                children: defaultStats.syncing
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Synced:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#10b981" },
                children: defaultStats.synced
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Failed:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: defaultStats.failed > 0 ? "#ef4444" : "#6b7280" },
                children: defaultStats.failed
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Total Size:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                children: formatBytes(defaultStats.totalBytes)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function ConflictsPanel() {
  const { unresolvedConflicts, stats, resolveConflict } = useConflicts();
  return /* @__PURE__ */ jsxDEV5("div", {
    style: { marginBottom: "1.5rem" },
    children: [
      /* @__PURE__ */ jsxDEV5("h4", {
        style: { fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" },
        children: "Conflicts"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5("div", {
        style: { display: "grid", gap: "0.5rem", fontSize: "0.875rem" },
        children: [
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Total:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                children: stats.total
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "Unresolved:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: stats.unresolved > 0 ? "#f59e0b" : "#10b981" },
                children: stats.unresolved
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            style: { display: "flex", justifyContent: "space-between" },
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: "#6b7280" },
                children: "High Severity:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                style: { color: stats.highSeverity > 0 ? "#ef4444" : "#6b7280" },
                children: stats.highSeverity
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      unresolvedConflicts.length > 0 && /* @__PURE__ */ jsxDEV5("div", {
        style: { marginTop: "0.75rem" },
        children: [
          /* @__PURE__ */ jsxDEV5("p", {
            style: {
              fontSize: "0.75rem",
              color: "#6b7280",
              marginBottom: "0.5rem"
            },
            children: "Unresolved conflicts:"
          }, undefined, false, undefined, this),
          unresolvedConflicts.slice(0, 3).map((conflict) => /* @__PURE__ */ jsxDEV5("div", {
            style: {
              padding: "0.5rem",
              backgroundColor: "#fef3c7",
              borderRadius: "0.25rem",
              marginBottom: "0.5rem",
              fontSize: "0.75rem"
            },
            children: [
              /* @__PURE__ */ jsxDEV5("div", {
                style: { display: "flex", justifyContent: "space-between" },
                children: [
                  /* @__PURE__ */ jsxDEV5("span", {
                    children: conflict.type
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV5("span", {
                    style: {
                      color: conflict.severity === "high" ? "#ef4444" : "#f59e0b"
                    },
                    children: conflict.severity
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV5("div", {
                style: {
                  display: "flex",
                  gap: "0.25rem",
                  marginTop: "0.25rem"
                },
                children: [
                  /* @__PURE__ */ jsxDEV5("button", {
                    onClick: () => resolveConflict(conflict.id, "local-wins"),
                    style: {
                      padding: "0.125rem 0.375rem",
                      backgroundColor: "#dbeafe",
                      color: "#1d4ed8",
                      border: "none",
                      borderRadius: "0.125rem",
                      cursor: "pointer",
                      fontSize: "0.625rem"
                    },
                    children: "Keep Local"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV5("button", {
                    onClick: () => resolveConflict(conflict.id, "remote-wins"),
                    style: {
                      padding: "0.125rem 0.375rem",
                      backgroundColor: "#dcfce7",
                      color: "#15803d",
                      border: "none",
                      borderRadius: "0.125rem",
                      cursor: "pointer",
                      fontSize: "0.625rem"
                    },
                    children: "Use Remote"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, conflict.id, true, undefined, this))
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function OfflineDiagnostics({
  showNetworkStatus = true,
  showServiceWorker = true,
  showCacheManagement = true,
  showQueueStats = true,
  showConflicts = true,
  onClearCache,
  className
}) {
  return /* @__PURE__ */ jsxDEV5("div", {
    className,
    role: "region",
    "aria-label": "Offline diagnostics",
    children: [
      /* @__PURE__ */ jsxDEV5("h3", {
        style: { fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" },
        children: "Offline Diagnostics"
      }, undefined, false, undefined, this),
      showNetworkStatus && /* @__PURE__ */ jsxDEV5(NetworkStatusPanel, {}, undefined, false, undefined, this),
      showServiceWorker && /* @__PURE__ */ jsxDEV5(ServiceWorkerPanel, {}, undefined, false, undefined, this),
      showCacheManagement && /* @__PURE__ */ jsxDEV5(CacheManagementPanel, {
        onClearCache
      }, undefined, false, undefined, this),
      showQueueStats && /* @__PURE__ */ jsxDEV5(QueueStatsPanel, {}, undefined, false, undefined, this),
      showConflicts && /* @__PURE__ */ jsxDEV5(ConflictsPanel, {}, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
// src/components/PresenceKit.tsx
import {
  useCallback as useCallback12,
  useEffect as useEffect11,
  useMemo as useMemo3,
  useRef as useRef5,
  useState as useState11
} from "react";
import { jsxDEV as jsxDEV6 } from "react/jsx-dev-runtime";
"use client";
var USER_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#14b8a6",
  "#f97316",
  "#ec4899",
  "#84cc16"
];
function hashColor(userId) {
  let hash = 0;
  for (let i = 0;i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}
function displayUser(userId) {
  return userId.length > 10 ? userId.slice(0, 8) : userId;
}
function clampDepth(depth) {
  return Math.max(0, Math.min(1, depth));
}
function formatLastActivity(lastActivity) {
  if (!lastActivity)
    return "unknown activity";
  const ts = Date.parse(lastActivity);
  if (Number.isNaN(ts))
    return lastActivity;
  const deltaMs = Date.now() - ts;
  const deltaSec = Math.max(0, Math.floor(deltaMs / 1000));
  if (deltaSec < 10)
    return "just now";
  if (deltaSec < 60)
    return `${deltaSec}s ago`;
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60)
    return `${deltaMin}m ago`;
  const deltaHour = Math.floor(deltaMin / 60);
  if (deltaHour < 24)
    return `${deltaHour}h ago`;
  const deltaDay = Math.floor(deltaHour / 24);
  return `${deltaDay}d ago`;
}
function panelStyle(base) {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    background: "#ffffff",
    ...base
  };
}
var DEFAULT_SCROLL_ACCENT = "#3b82f6";
var DEFAULT_SCROLL_MARKER_LIMIT = 32;
var SCROLL_DENSITY_BUCKETS = 16;
var SCROLL_ACTIVITY_WINDOW_MS = 120000;
var LOCAL_SCROLL_DEPTH_EPSILON = 0.0025;
function hashLaneOffset(userId, laneSpacingPx = 4, laneCount = 5) {
  if (laneCount <= 1) {
    return 0;
  }
  let hash = 0;
  for (let index = 0;index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index);
    hash |= 0;
  }
  const lane = Math.abs(hash) % laneCount;
  const centeredLane = lane - (laneCount - 1) / 2;
  return Math.round(centeredLane * laneSpacingPx);
}
function computeScrollActivity(user, now) {
  let activity = 0.15;
  if (user.status === "online")
    activity += 0.2;
  if (user.status === "away")
    activity += 0.06;
  if (user.typing?.isTyping)
    activity += 0.22;
  if (user.focusNode)
    activity += 0.12;
  if (user.selection)
    activity += 0.08;
  if (user.inputState?.hasFocus)
    activity += 0.1;
  if (user.editing)
    activity += 0.08;
  if (user.emotion) {
    const emotionIntensity = clampDepth(user.emotion.intensity ?? user.emotion.confidence ?? 0.3);
    activity += 0.08 + emotionIntensity * 0.12;
  }
  const lastActivityAt = Date.parse(user.lastActivity);
  if (!Number.isNaN(lastActivityAt)) {
    const ageMs = Math.max(0, now - lastActivityAt);
    const freshness = 1 - Math.min(1, ageMs / SCROLL_ACTIVITY_WINDOW_MS);
    activity *= 0.35 + freshness * 0.65;
  }
  return clampDepth(activity);
}
function summarizeScrollSignal(user) {
  const signals = [];
  if (user.typing?.isTyping) {
    signals.push("typing");
  }
  if (user.focusNode) {
    signals.push("focused");
  }
  if (user.selection) {
    signals.push("selecting");
  }
  if (user.inputState?.hasFocus) {
    signals.push("editing");
  }
  if (user.emotion?.primary) {
    signals.push(user.emotion.primary);
  }
  if (signals.length === 0) {
    signals.push(user.status);
  }
  return signals.join(" · ");
}
function buildScrollSignals(presence, localUserId, markerLimit = DEFAULT_SCROLL_MARKER_LIMIT) {
  const now = Date.now();
  const normalizedLimit = Math.max(0, Math.trunc(markerLimit));
  if (normalizedLimit === 0) {
    return [];
  }
  const signals = presence.filter((user) => Boolean(user.scroll)).map((user) => {
    const shortLabel = displayUser(user.userId);
    return {
      user,
      userId: user.userId,
      label: shortLabel,
      shortLabel,
      depth: clampDepth(user.scroll.depth),
      color: hashColor(user.userId),
      isLocal: user.userId === localUserId,
      activity: computeScrollActivity(user, now),
      laneOffsetPx: 0,
      socialSignal: summarizeScrollSignal(user)
    };
  }).sort((left, right) => {
    if (left.isLocal !== right.isLocal) {
      return left.isLocal ? -1 : 1;
    }
    if (right.activity !== left.activity) {
      return right.activity - left.activity;
    }
    return left.userId.localeCompare(right.userId);
  }).slice(0, normalizedLimit);
  return signals.map((signal, index) => ({
    ...signal,
    laneOffsetPx: signal.isLocal ? 0 : hashLaneOffset(signal.userId, 4, 5) + (index % 3 - 1)
  }));
}
function buildScrollDensityMap(signals, bucketCount = SCROLL_DENSITY_BUCKETS) {
  const buckets = Array.from({ length: bucketCount }, () => 0);
  if (signals.length === 0) {
    return buckets;
  }
  for (const signal of signals) {
    const bucketIndex = Math.min(bucketCount - 1, Math.max(0, Math.round(signal.depth * (bucketCount - 1))));
    const weight = 0.2 + signal.activity * 0.8;
    buckets[bucketIndex] += weight;
    if (bucketIndex > 0) {
      buckets[bucketIndex - 1] += weight * 0.28;
    }
    if (bucketIndex < bucketCount - 1) {
      buckets[bucketIndex + 1] += weight * 0.28;
    }
  }
  const peak = Math.max(1, ...buckets);
  return buckets.map((value) => clampDepth(value / peak));
}
function PresenceCursorLayer({
  presence,
  localUserId,
  width = "100%",
  height = 320,
  className
}) {
  const users = presence.filter((user) => user.userId !== localUserId && user.cursor);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle({
      position: "relative",
      width,
      height,
      overflow: "hidden"
    }),
    children: [
      users.map((user) => {
        if (!user.cursor)
          return null;
        const color = hashColor(user.userId);
        return /* @__PURE__ */ jsxDEV6("div", {
          style: {
            position: "absolute",
            left: user.cursor.x,
            top: user.cursor.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none"
          },
          children: [
            /* @__PURE__ */ jsxDEV6("div", {
              style: {
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "2px solid #ffffff",
                background: color,
                boxShadow: "0 1px 6px rgba(0,0,0,0.2)"
              }
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV6("div", {
              style: {
                marginTop: 4,
                fontSize: 11,
                color: "#111827",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 999,
                background: "#ffffff",
                border: `1px solid ${color}`,
                whiteSpace: "nowrap"
              },
              children: displayUser(user.userId)
            }, undefined, false, undefined, this)
          ]
        }, user.userId, true, undefined, this);
      }),
      users.length === 0 && /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No remote cursors"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceFocusList({
  presence,
  localUserId,
  maxItems = 8,
  className
}) {
  const focused = presence.filter((user) => user.userId !== localUserId && user.focusNode).slice(0, maxItems);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Focus Nodes"
      }, undefined, false, undefined, this),
      focused.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No remote focus"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("div", {
        style: { display: "grid", gap: 6 },
        children: focused.map((user) => /* @__PURE__ */ jsxDEV6("div", {
          style: {
            border: `1px solid ${hashColor(user.userId)}44`,
            borderRadius: 8,
            padding: "6px 8px",
            fontSize: 12
          },
          children: [
            /* @__PURE__ */ jsxDEV6("span", {
              style: { fontWeight: 600 },
              children: displayUser(user.userId)
            }, undefined, false, undefined, this),
            " ",
            /* @__PURE__ */ jsxDEV6("span", {
              style: { color: "#6b7280" },
              children: "focused"
            }, undefined, false, undefined, this),
            " ",
            /* @__PURE__ */ jsxDEV6("code", {
              style: { color: "#111827" },
              children: user.focusNode
            }, undefined, false, undefined, this)
          ]
        }, user.userId, true, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceTypingList({
  presence,
  localUserId,
  className
}) {
  const typing = presence.filter((user) => user.userId !== localUserId && user.typing?.isTyping);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Typing"
      }, undefined, false, undefined, this),
      typing.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No one is typing"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("div", {
        style: { display: "grid", gap: 6 },
        children: typing.map((user) => /* @__PURE__ */ jsxDEV6("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            borderRadius: 8,
            padding: "6px 8px",
            background: "#f9fafb"
          },
          children: [
            /* @__PURE__ */ jsxDEV6("div", {
              style: {
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: hashColor(user.userId)
              }
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV6("span", {
              style: { fontWeight: 600 },
              children: displayUser(user.userId)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV6("span", {
              style: { color: "#6b7280" },
              children: user.typing?.field ? `typing in ${user.typing.field}` : "typing"
            }, undefined, false, undefined, this),
            user.typing?.isComposing ? /* @__PURE__ */ jsxDEV6("span", {
              style: { color: "#92400e" },
              children: "(composing)"
            }, undefined, false, undefined, this) : null
          ]
        }, user.userId, true, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceSelectionList({
  presence,
  localUserId,
  className
}) {
  const selections = presence.filter((user) => user.userId !== localUserId && user.selection);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Selections"
      }, undefined, false, undefined, this),
      selections.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No active selections"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("div", {
        style: { display: "grid", gap: 6 },
        children: selections.map((user) => /* @__PURE__ */ jsxDEV6("div", {
          style: {
            borderLeft: `4px solid ${hashColor(user.userId)}`,
            paddingLeft: 8,
            fontSize: 12
          },
          children: [
            /* @__PURE__ */ jsxDEV6("div", {
              style: { fontWeight: 600 },
              children: displayUser(user.userId)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV6("div", {
              style: { color: "#6b7280" },
              children: [
                user.selection?.path ?? "document",
                ": ",
                user.selection?.start,
                " -",
                " ",
                user.selection?.end
              ]
            }, undefined, true, undefined, this)
          ]
        }, user.userId, true, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceScrollBar({
  presence,
  localUserId,
  height = 220,
  className,
  accentColor = DEFAULT_SCROLL_ACCENT,
  markerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
  showLegend = true
}) {
  const signals = useMemo3(() => buildScrollSignals(presence, localUserId, markerLimit), [localUserId, markerLimit, presence]);
  const trackSignals = useMemo3(() => [...signals].sort((left, right) => left.depth - right.depth), [signals]);
  const density = useMemo3(() => buildScrollDensityMap(trackSignals), [trackSignals]);
  const legendSignals = useMemo3(() => [...signals].sort((left, right) => {
    if (right.activity !== left.activity) {
      return right.activity - left.activity;
    }
    return left.depth - right.depth;
  }).slice(0, 8), [signals]);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Scroll Presence"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6("div", {
        style: {
          display: "grid",
          gridTemplateColumns: showLegend ? "24px minmax(0, 1fr)" : "24px",
          gap: 12,
          alignItems: "start"
        },
        children: [
          /* @__PURE__ */ jsxDEV6("div", {
            style: {
              position: "relative",
              width: 24,
              height,
              borderRadius: 999,
              background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 8%, #f8fafc), #e5e7eb)`,
              boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.28), inset 0 12px 20px rgba(15, 23, 42, 0.08)",
              overflow: "hidden"
            },
            children: [
              density.map((value, index) => {
                const top = index / density.length * 100;
                const segmentHeight = 100 / density.length + 0.8;
                return /* @__PURE__ */ jsxDEV6("span", {
                  style: {
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: `${top.toFixed(3)}%`,
                    height: `${segmentHeight.toFixed(3)}%`,
                    background: `color-mix(in srgb, ${accentColor} ${(10 + value * 36).toFixed(2)}%, #dbe4f4)`,
                    opacity: (0.12 + value * 0.62).toFixed(3),
                    pointerEvents: "none"
                  }
                }, `density-${index}`, false, undefined, this);
              }),
              trackSignals.map((signal) => {
                const markerSize = 6 + signal.activity * (signal.isLocal ? 4 : 3.5);
                const markerScale = 0.84 + signal.activity * 0.36;
                const markerColor = signal.color;
                const glowColor = `color-mix(in srgb, ${markerColor} ${(40 + signal.activity * 42).toFixed(1)}%, transparent)`;
                return /* @__PURE__ */ jsxDEV6("span", {
                  title: `${signal.label}: ${Math.round(signal.depth * 100)}% · ${signal.socialSignal}`,
                  style: {
                    position: "absolute",
                    left: `calc(50% + ${signal.laneOffsetPx}px)`,
                    top: `${(signal.depth * 100).toFixed(3)}%`,
                    width: markerSize,
                    height: markerSize,
                    transform: `translate(-50%, -50%) scale(${markerScale.toFixed(3)})`,
                    borderRadius: 999,
                    border: signal.isLocal ? `1px solid color-mix(in srgb, ${accentColor} 72%, #ffffff)` : "1px solid rgba(255,255,255,0.72)",
                    background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${markerColor} 38%, #ffffff), ${markerColor})`,
                    boxShadow: `0 0 0 1px rgba(15,23,42,0.32), 0 0 ${(8 + signal.activity * 14).toFixed(1)}px ${glowColor}`
                  }
                }, signal.userId, false, undefined, this);
              })
            ]
          }, undefined, true, undefined, this),
          showLegend ? /* @__PURE__ */ jsxDEV6("div", {
            style: { display: "grid", gap: 7, fontSize: 12, minWidth: 0 },
            children: legendSignals.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
              style: { color: "#6b7280" },
              children: "No scroll telemetry yet"
            }, undefined, false, undefined, this) : legendSignals.map((signal) => {
              const depthPct = Math.round(signal.depth * 100);
              const activityPct = Math.round(signal.activity * 100);
              return /* @__PURE__ */ jsxDEV6("div", {
                style: {
                  display: "grid",
                  gap: 3
                },
                children: [
                  /* @__PURE__ */ jsxDEV6("div", {
                    style: {
                      display: "grid",
                      gridTemplateColumns: "minmax(64px, auto) minmax(0, 1fr) auto",
                      gap: 8,
                      alignItems: "center",
                      minWidth: 0
                    },
                    children: [
                      /* @__PURE__ */ jsxDEV6("span", {
                        style: {
                          fontWeight: signal.isLocal ? 700 : 600,
                          color: signal.isLocal ? "#111827" : "#1f2937",
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        },
                        children: signal.shortLabel
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV6("span", {
                        style: {
                          position: "relative",
                          height: 5,
                          borderRadius: 999,
                          background: "#e5e7eb",
                          overflow: "hidden"
                        },
                        children: /* @__PURE__ */ jsxDEV6("span", {
                          style: {
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${Math.max(6, depthPct)}%`,
                            borderRadius: 999,
                            background: signal.color
                          }
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV6("span", {
                        style: {
                          color: "#6b7280",
                          fontVariantNumeric: "tabular-nums"
                        },
                        children: [
                          depthPct,
                          "%"
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV6("div", {
                    style: {
                      color: "#9ca3af",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    },
                    children: [
                      /* @__PURE__ */ jsxDEV6("span", {
                        children: signal.socialSignal
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV6("span", {
                        style: { color: "#cbd5e1" },
                        children: "·"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV6("span", {
                        children: [
                          activityPct,
                          "% active"
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, `legend-${signal.userId}`, true, undefined, this);
            })
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceViewportList({
  presence,
  localUserId,
  className
}) {
  const users = presence.filter((user) => user.userId !== localUserId && user.viewport);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Viewports"
      }, undefined, false, undefined, this),
      users.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No viewport data"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("div", {
        style: { display: "grid", gap: 8 },
        children: users.map((user) => {
          const viewport = user.viewport;
          if (!viewport)
            return null;
          const ratio = viewport.width / Math.max(1, viewport.height);
          return /* @__PURE__ */ jsxDEV6("div", {
            style: { fontSize: 12 },
            children: [
              /* @__PURE__ */ jsxDEV6("div", {
                style: { marginBottom: 4 },
                children: [
                  /* @__PURE__ */ jsxDEV6("span", {
                    style: { fontWeight: 600 },
                    children: displayUser(user.userId)
                  }, undefined, false, undefined, this),
                  " ",
                  /* @__PURE__ */ jsxDEV6("span", {
                    style: { color: "#6b7280" },
                    children: [
                      viewport.width,
                      "x",
                      viewport.height
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV6("div", {
                style: {
                  height: 6,
                  borderRadius: 999,
                  background: "#e5e7eb",
                  overflow: "hidden"
                },
                children: /* @__PURE__ */ jsxDEV6("div", {
                  style: {
                    width: `${Math.min(100, Math.max(10, ratio * 40))}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: hashColor(user.userId)
                  }
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, user.userId, true, undefined, this);
        })
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceInputStateList({
  presence,
  localUserId,
  className
}) {
  const users = presence.filter((user) => user.userId !== localUserId && user.inputState);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Input States"
      }, undefined, false, undefined, this),
      users.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No active input state"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("div", {
        style: { display: "grid", gap: 6 },
        children: users.map((user) => {
          const state = user.inputState;
          if (!state)
            return null;
          return /* @__PURE__ */ jsxDEV6("div", {
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 12,
              padding: "6px 8px",
              borderRadius: 8,
              background: "#f9fafb"
            },
            children: [
              /* @__PURE__ */ jsxDEV6("span", {
                style: { fontWeight: 600 },
                children: displayUser(user.userId)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6("span", {
                style: { color: "#6b7280" },
                children: state.field
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6("span", {
                children: state.hasFocus ? "focused" : "blurred"
              }, undefined, false, undefined, this),
              state.selectionStart !== undefined && state.selectionEnd !== undefined ? /* @__PURE__ */ jsxDEV6("span", {
                style: { color: "#6b7280" },
                children: [
                  "caret ",
                  state.selectionStart,
                  "-",
                  state.selectionEnd
                ]
              }, undefined, true, undefined, this) : null,
              state.valueLength !== undefined ? /* @__PURE__ */ jsxDEV6("span", {
                style: { color: "#6b7280" },
                children: [
                  "len ",
                  state.valueLength
                ]
              }, undefined, true, undefined, this) : null
            ]
          }, user.userId, true, undefined, this);
        })
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceEmotionList({
  presence,
  localUserId,
  className
}) {
  const users = presence.filter((user) => user.userId !== localUserId && user.emotion);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Emotion Channel"
      }, undefined, false, undefined, this),
      users.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No emotion signal"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("div", {
        style: { display: "grid", gap: 8 },
        children: users.map((user) => {
          const emotion = user.emotion;
          if (!emotion)
            return null;
          const intensity = Math.max(0, Math.min(1, emotion.intensity ?? emotion.confidence ?? 0));
          return /* @__PURE__ */ jsxDEV6("div", {
            style: { fontSize: 12 },
            children: [
              /* @__PURE__ */ jsxDEV6("div", {
                style: { marginBottom: 4 },
                children: [
                  /* @__PURE__ */ jsxDEV6("span", {
                    style: { fontWeight: 600 },
                    children: displayUser(user.userId)
                  }, undefined, false, undefined, this),
                  " ",
                  /* @__PURE__ */ jsxDEV6("span", {
                    style: { color: "#6b7280" },
                    children: emotion.primary ?? "unspecified"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV6("div", {
                style: {
                  height: 6,
                  borderRadius: 999,
                  background: "#e5e7eb",
                  overflow: "hidden"
                },
                children: /* @__PURE__ */ jsxDEV6("div", {
                  style: {
                    width: `${Math.round(intensity * 100)}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: hashColor(user.userId)
                  }
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, user.userId, true, undefined, this);
        })
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceEditingList({
  presence,
  localUserId,
  className
}) {
  const users = presence.filter((user) => user.userId !== localUserId && user.editing);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Editing Targets"
      }, undefined, false, undefined, this),
      users.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No active edit targets"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("div", {
        style: { display: "grid", gap: 6 },
        children: users.map((user) => /* @__PURE__ */ jsxDEV6("div", {
          style: {
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontSize: 12
          },
          children: [
            /* @__PURE__ */ jsxDEV6("span", {
              style: { fontWeight: 600 },
              children: displayUser(user.userId)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV6("code", {
              style: { color: "#6b7280" },
              children: user.editing
            }, undefined, false, undefined, this)
          ]
        }, user.userId, true, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceStatusList({
  presence,
  localUserId,
  className
}) {
  const users = presence.filter((user) => user.userId !== localUserId);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: panelStyle(),
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        style: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
        children: "Status"
      }, undefined, false, undefined, this),
      users.length === 0 ? /* @__PURE__ */ jsxDEV6("div", {
        style: { color: "#6b7280", fontSize: 13 },
        children: "No collaborators online"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("div", {
        style: { display: "grid", gap: 6 },
        children: users.map((user) => {
          const color = user.status === "online" ? "#10b981" : user.status === "away" ? "#f59e0b" : "#9ca3af";
          return /* @__PURE__ */ jsxDEV6("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12
            },
            children: [
              /* @__PURE__ */ jsxDEV6("span", {
                style: {
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color
                }
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6("span", {
                style: { fontWeight: 600 },
                children: displayUser(user.userId)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6("span", {
                style: { color: "#6b7280" },
                children: [
                  user.role,
                  " ",
                  user.status
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV6("span", {
                style: { color: "#9ca3af" },
                children: formatLastActivity(user.lastActivity)
              }, undefined, false, undefined, this)
            ]
          }, user.userId, true, undefined, this);
        })
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PresenceElementsPanel({
  presence,
  localUserId,
  className,
  showCursorLayer = true,
  cursorLayerHeight = 220,
  scrollBarAccentColor = DEFAULT_SCROLL_ACCENT,
  scrollBarMarkerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
  showScrollLegend = true
}) {
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: { display: "grid", gap: 10 },
    children: [
      showCursorLayer ? /* @__PURE__ */ jsxDEV6(PresenceCursorLayer, {
        presence,
        localUserId,
        height: cursorLayerHeight
      }, undefined, false, undefined, this) : null,
      /* @__PURE__ */ jsxDEV6(PresenceStatusList, {
        presence,
        localUserId
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(PresenceEditingList, {
        presence,
        localUserId
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(PresenceTypingList, {
        presence,
        localUserId
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(PresenceFocusList, {
        presence,
        localUserId
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(PresenceSelectionList, {
        presence,
        localUserId
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(PresenceScrollBar, {
        presence,
        localUserId,
        accentColor: scrollBarAccentColor,
        markerLimit: scrollBarMarkerLimit,
        showLegend: showScrollLegend
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(PresenceViewportList, {
        presence,
        localUserId
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(PresenceInputStateList, {
        presence,
        localUserId
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(PresenceEmotionList, {
        presence,
        localUserId
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function CollaborativePresenceScrollContainer({
  children,
  presence,
  localUserId,
  height = 320,
  className,
  style,
  accentColor = DEFAULT_SCROLL_ACCENT,
  markerLimit = DEFAULT_SCROLL_MARKER_LIMIT,
  onScrollStateChange
}) {
  const containerRef = useRef5(null);
  const [localDepth, setLocalDepth] = useState11(0);
  const localDepthRef = useRef5(0);
  const frameRef = useRef5(null);
  const markers = useMemo3(() => buildScrollSignals(presence, localUserId, markerLimit).filter((signal) => !signal.isLocal), [localUserId, markerLimit, presence]);
  const density = useMemo3(() => buildScrollDensityMap(markers), [markers]);
  const publishScrollState = useCallback12((element) => {
    const denominator = Math.max(1, element.scrollHeight - element.clientHeight);
    const depth = clampDepth(element.scrollTop / denominator);
    const depthDelta = Math.abs(depth - localDepthRef.current);
    const shouldCommitDepth = depthDelta >= LOCAL_SCROLL_DEPTH_EPSILON || depth === 0 || depth === 1;
    if (shouldCommitDepth) {
      localDepthRef.current = depth;
      setLocalDepth(depth);
    }
    onScrollStateChange?.({
      depth,
      y: element.scrollTop,
      viewportHeight: element.clientHeight,
      documentHeight: element.scrollHeight
    });
  }, [onScrollStateChange]);
  useEffect11(() => {
    const element = containerRef.current;
    if (!element)
      return;
    const scheduleUpdate = () => {
      if (typeof window === "undefined") {
        publishScrollState(element);
        return;
      }
      if (frameRef.current !== null) {
        return;
      }
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        publishScrollState(element);
      });
    };
    scheduleUpdate();
    element.addEventListener("scroll", scheduleUpdate, { passive: true });
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      scheduleUpdate();
    }) : null;
    resizeObserver?.observe(element);
    if (typeof window !== "undefined") {
      window.addEventListener("resize", scheduleUpdate, { passive: true });
    }
    return () => {
      element.removeEventListener("scroll", scheduleUpdate);
      resizeObserver?.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", scheduleUpdate);
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      }
    };
  }, [publishScrollState]);
  return /* @__PURE__ */ jsxDEV6("div", {
    className,
    style: {
      ...panelStyle({
        position: "relative",
        height,
        overflow: "hidden",
        padding: 0,
        border: `1px solid color-mix(in srgb, ${accentColor} 24%, #d1d5db)`,
        background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 5%, #ffffff), #ffffff)`
      }),
      ...style
    },
    children: [
      /* @__PURE__ */ jsxDEV6("div", {
        ref: containerRef,
        style: {
          height: "100%",
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: 12,
          paddingRight: 30
        },
        children
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6("div", {
        style: {
          position: "absolute",
          top: 10,
          bottom: 10,
          right: 7,
          width: 16,
          borderRadius: 999,
          background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 6%, #f8fafc), #e5e7eb)`,
          boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.28), inset 0 8px 16px rgba(15, 23, 42, 0.08)"
        },
        children: [
          density.map((value, index) => {
            const top = index / density.length * 100;
            const segmentHeight = 100 / density.length + 0.8;
            return /* @__PURE__ */ jsxDEV6("span", {
              style: {
                position: "absolute",
                left: 0,
                right: 0,
                top: `${top.toFixed(3)}%`,
                height: `${segmentHeight.toFixed(3)}%`,
                background: `color-mix(in srgb, ${accentColor} ${(12 + value * 42).toFixed(2)}%, #dbe4f4)`,
                opacity: (0.12 + value * 0.62).toFixed(3),
                pointerEvents: "none"
              }
            }, `density-${index}`, false, undefined, this);
          }),
          /* @__PURE__ */ jsxDEV6("div", {
            style: {
              position: "absolute",
              left: "50%",
              width: 11,
              height: 5,
              top: `${(localDepth * 100).toFixed(3)}%`,
              transform: "translate(-50%, -50%)",
              borderRadius: 999,
              background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 62%, #ffffff), ${accentColor})`,
              boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.36), 0 0 10px rgba(59, 130, 246, 0.35)"
            },
            title: localUserId ? `${displayUser(localUserId)} (you)` : "you"
          }, undefined, false, undefined, this),
          markers.map((signal) => {
            const markerSize = 5 + signal.activity * 3.8;
            const glowColor = `color-mix(in srgb, ${signal.color} ${(40 + signal.activity * 42).toFixed(1)}%, transparent)`;
            return /* @__PURE__ */ jsxDEV6("span", {
              title: `${signal.label}: ${Math.round(signal.depth * 100)}% · ${signal.socialSignal}`,
              style: {
                position: "absolute",
                left: `calc(50% + ${signal.laneOffsetPx}px)`,
                top: `${(signal.depth * 100).toFixed(3)}%`,
                width: markerSize,
                height: markerSize,
                transform: "translate(-50%, -50%)",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.7)",
                background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${signal.color} 38%, #ffffff), ${signal.color})`,
                boxShadow: `0 0 0 1px rgba(15,23,42,0.32), 0 0 ${(8 + signal.activity * 12).toFixed(1)}px ${glowColor}`
              }
            }, signal.userId, false, undefined, this);
          })
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
export {
  useViewportPresenceTracking,
  useTotalPreload,
  useSessionId,
  useScrollPresenceTracking,
  useRoutePresence,
  useRoute,
  usePushNotifications,
  usePresence,
  usePreloadProgress,
  usePrefetchRoute,
  usePilotNavigation,
  useOtherCursors,
  useOfflineStatus,
  useNetworkState,
  useNavigationPrediction,
  useManualPreload,
  useLinkObserver,
  useInstallPrompt,
  useEmotionPresence,
  useEditableElement,
  useCursorTracking,
  useConflicts,
  useCollaborativeInput,
  useClearCache,
  useCacheStatus,
  useAeonVersion,
  useAeonTree,
  useAeonSync,
  useAeonServiceWorker,
  useAeonPage,
  useAeonNavigation,
  useAeonEffect,
  useAeonData,
  stripNavigationTags,
  parseNavigationTags,
  getAllConflicts,
  clearAllConflicts,
  addConflict,
  ServiceWorkerPanel,
  QueueStatsPanel,
  PushNotifications,
  PresenceViewportList,
  PresenceTypingList,
  PresenceStatusList,
  PresenceSelectionList,
  PresenceScrollBar,
  PresenceInputStateList,
  PresenceFocusList,
  PresenceEmotionList,
  PresenceElementsPanel,
  PresenceEditingList,
  PresenceCursorLayer,
  OfflineDiagnostics,
  NetworkStatusPanel,
  Link,
  InstallPrompt,
  ConflictsPanel,
  CollaborativePresenceScrollContainer,
  CacheManagementPanel,
  AeonPageProvider,
  AeonNavigationContext
};
