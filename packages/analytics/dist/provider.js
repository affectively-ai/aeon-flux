// src/provider.tsx
import React, { createContext, useContext, useMemo } from "react";

// src/use-analytics.ts
import { useEffect, useRef, useCallback } from "react";

// src/data-layer.ts
var ANALYTICS_VERSION = "1.0.0";
function ensureDataLayer(name = "dataLayer") {
  const w = window;
  if (!w[name]) {
    w[name] = [];
  }
  return w[name];
}
function pushToDataLayer(event, dataLayerName = "dataLayer") {
  const dataLayer = ensureDataLayer(dataLayerName);
  dataLayer.push(event);
  if (window.__AEON_ANALYTICS_DEBUG__) {
    console.log("[Aeon Analytics]", event.event, event);
  }
}
function createBaseEvent(eventName, prefix = "aeon") {
  return {
    event: prefix ? `${prefix}.${eventName}` : eventName,
    aeon: {
      version: ANALYTICS_VERSION,
      timestamp: Date.now()
    }
  };
}
function buildContextEvent(esiState, prefix = "aeon") {
  return {
    ...createBaseEvent("context", prefix),
    event: `${prefix}.context`,
    user: {
      tier: esiState.userTier,
      id: esiState.userId,
      sessionId: esiState.sessionId,
      isNewSession: esiState.isNewSession
    },
    emotion: esiState.emotionState,
    preferences: esiState.preferences,
    features: esiState.features,
    device: {
      viewport: esiState.viewport,
      connection: esiState.connection
    },
    time: {
      localHour: esiState.localHour,
      timezone: esiState.timezone
    },
    recentPages: esiState.recentPages
  };
}
function buildPageViewEvent(path, title, merkleRoot, esiState, prefix = "aeon") {
  return {
    ...createBaseEvent("pageview", prefix),
    event: `${prefix}.pageview`,
    page: {
      path,
      title,
      merkleRoot
    },
    user: {
      tier: esiState.userTier,
      id: esiState.userId,
      sessionId: esiState.sessionId,
      isNewSession: esiState.isNewSession
    },
    emotion: esiState.emotionState,
    features: esiState.features,
    device: {
      viewport: esiState.viewport,
      connection: esiState.connection,
      reducedMotion: esiState.preferences.reducedMotion
    },
    time: {
      localHour: esiState.localHour,
      timezone: esiState.timezone
    }
  };
}
function buildClickEvent(merkleHash, treePath, treePathHashes, element, position, context, prefix = "aeon") {
  return {
    ...createBaseEvent("click", prefix),
    event: `${prefix}.click`,
    click: {
      merkleHash,
      treePath,
      treePathHashes,
      element,
      position
    },
    context
  };
}
function extractElementInfo(element, maxTextLength = 100) {
  let text = element.innerText || element.textContent || "";
  if (text.length > maxTextLength) {
    text = text.slice(0, maxTextLength) + "...";
  }
  text = text.replace(/\s+/g, " ").trim();
  return {
    tagName: element.tagName,
    text,
    ariaLabel: element.getAttribute("aria-label") || undefined,
    role: element.getAttribute("role") || undefined,
    href: element.href || undefined,
    id: element.id || undefined,
    className: element.className || undefined
  };
}
function extractPositionInfo(event) {
  return {
    x: event.pageX,
    y: event.pageY,
    viewportX: event.clientX,
    viewportY: event.clientY
  };
}
function pushContextEvent(esiState, config) {
  const event = buildContextEvent(esiState, config.eventPrefix);
  pushToDataLayer(event, config.dataLayerName);
}
function pushPageViewEvent(path, title, merkleRoot, esiState, config) {
  const event = buildPageViewEvent(path, title, merkleRoot, esiState, config.eventPrefix);
  pushToDataLayer(event, config.dataLayerName);
}
function pushClickEvent(merkleHash, treePath, treePathHashes, element, position, context, config) {
  const event = buildClickEvent(merkleHash, treePath, treePathHashes, element, position, context, config.eventPrefix);
  pushToDataLayer(event, config.dataLayerName);
}
function setDebugMode(enabled) {
  window.__AEON_ANALYTICS_DEBUG__ = enabled;
}

// src/gtm-loader.ts
var gtmInjected = false;
function generateGTMScript(containerId, dataLayerName) {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','${dataLayerName}','${containerId}');`;
}
function validateContainerId(containerId) {
  return /^GTM-[A-Z0-9]{6,8}$/i.test(containerId);
}
function injectGTM(config) {
  if (gtmInjected) {
    console.warn("[Aeon Analytics] GTM already injected");
    return false;
  }
  if (!validateContainerId(config.containerId)) {
    console.error(`[Aeon Analytics] Invalid GTM container ID: ${config.containerId}. ` + "Expected format: GTM-XXXXXX");
    return false;
  }
  const dataLayerName = config.dataLayerName || "dataLayer";
  ensureDataLayer(dataLayerName);
  const script = document.createElement("script");
  script.innerHTML = generateGTMScript(config.containerId, dataLayerName);
  if (document.head.firstChild) {
    document.head.insertBefore(script, document.head.firstChild);
  } else {
    document.head.appendChild(script);
  }
  gtmInjected = true;
  return true;
}
function injectGTMNoScript(containerId) {
  if (!validateContainerId(containerId)) {
    return false;
  }
  const existingNoscript = document.querySelector(`noscript iframe[src*="googletagmanager.com/ns.html?id=${containerId}"]`);
  if (existingNoscript) {
    return false;
  }
  const noscript = document.createElement("noscript");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  noscript.appendChild(iframe);
  if (document.body.firstChild) {
    document.body.insertBefore(noscript, document.body.firstChild);
  } else {
    document.body.appendChild(noscript);
  }
  return true;
}
function initializeGTM(config) {
  const scriptInjected = injectGTM(config);
  if (scriptInjected) {
    injectGTMNoScript(config.containerId);
  }
  return scriptInjected;
}
function isGTMReady() {
  if (!gtmInjected)
    return false;
  const dataLayer = window.dataLayer;
  if (!dataLayer)
    return false;
  return dataLayer.some((item) => typeof item === "object" && item !== null && item.event === "gtm.js");
}
function waitForGTM(timeout = 5000) {
  return new Promise((resolve) => {
    if (isGTMReady()) {
      resolve(true);
      return;
    }
    const startTime = Date.now();
    const check = () => {
      if (isGTMReady()) {
        resolve(true);
        return;
      }
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
}

// src/context-bridge.ts
function getESIState() {
  return window.__AEON_ESI_STATE__ || null;
}
var unsubscribe = null;
function subscribeToESIChanges(callback) {
  const state = window.__AEON_ESI_STATE__;
  if (state?.subscribe) {
    return state.subscribe(callback);
  }
  return () => {};
}
function syncESIToDataLayer(config) {
  const esiState = getESIState();
  if (!esiState) {
    return false;
  }
  pushContextEvent(esiState, config);
  return true;
}
function pushPageView(config, merkleRoot = "") {
  const esiState = getESIState();
  if (!esiState) {
    return false;
  }
  pushPageViewEvent(window.location.pathname, document.title, merkleRoot, esiState, config);
  return true;
}
function watchESIChanges(config) {
  if (unsubscribe) {
    unsubscribe();
  }
  unsubscribe = subscribeToESIChanges(() => {
    syncESIToDataLayer(config);
  });
  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}
function initContextBridge(config) {
  if (config.syncESIContext === false) {
    return () => {};
  }
  syncESIToDataLayer(config);
  return watchESIChanges(config);
}
function getESIContextSnapshot() {
  const state = getESIState();
  if (!state) {
    return {};
  }
  return {
    userTier: state.userTier,
    isAdmin: state.isAdmin,
    userId: state.userId,
    sessionId: state.sessionId,
    isNewSession: state.isNewSession,
    emotionState: state.emotionState,
    features: state.features,
    viewport: state.viewport,
    connection: state.connection,
    localHour: state.localHour,
    timezone: state.timezone
  };
}

// src/merkle-tree.ts
function parseMerkleFromElement(element) {
  const hash = element.getAttribute("data-aeon-merkle");
  if (!hash)
    return null;
  const pathStr = element.getAttribute("data-aeon-path");
  const pathHashesStr = element.getAttribute("data-aeon-path-hashes");
  const type = element.getAttribute("data-aeon-type") || "unknown";
  let path = [];
  let pathHashes = [];
  try {
    if (pathStr)
      path = JSON.parse(pathStr);
    if (pathHashesStr)
      pathHashes = JSON.parse(pathHashesStr);
  } catch {}
  return { hash, path, pathHashes, type };
}
function findNearestMerkleElement(element) {
  let current = element;
  while (current) {
    if (current.hasAttribute("data-aeon-merkle")) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

// src/click-tracker.ts
var activeHandler = null;
var debounceTimer = null;
var lastClickTime = 0;
function shouldExclude(element, excludeSelectors) {
  for (const selector of excludeSelectors) {
    if (element.matches(selector) || element.closest(selector)) {
      return true;
    }
  }
  return false;
}
function createClickHandler(config, options) {
  return (event) => {
    const target = event.target;
    if (!target || !(target instanceof HTMLElement)) {
      return;
    }
    if (options.excludeSelectors?.length) {
      if (shouldExclude(target, options.excludeSelectors)) {
        return;
      }
    }
    if (options.debounceMs && options.debounceMs > 0) {
      const now = Date.now();
      if (now - lastClickTime < options.debounceMs) {
        return;
      }
      lastClickTime = now;
    }
    const merkleElement = findNearestMerkleElement(target);
    let merkleHash = "unknown";
    let treePath = [];
    let treePathHashes = [];
    if (merkleElement) {
      const merkleInfo = parseMerkleFromElement(merkleElement);
      if (merkleInfo) {
        merkleHash = merkleInfo.hash;
        treePath = options.includeTreePath !== false ? merkleInfo.path : [];
        treePathHashes = options.includeTreePath !== false ? merkleInfo.pathHashes : [];
      }
    } else {
      treePath = generateDOMPath(target);
    }
    const elementInfo = extractElementInfo(target, options.maxTextLength);
    const position = options.includePosition !== false ? extractPositionInfo(event) : { x: 0, y: 0, viewportX: 0, viewportY: 0 };
    const context = getESIContextSnapshot();
    pushClickEvent(merkleHash, treePath, treePathHashes, elementInfo, position, context, {
      dataLayerName: config.dataLayerName,
      eventPrefix: config.eventPrefix
    });
  };
}
function generateDOMPath(element) {
  const path = [];
  let current = element;
  while (current && current !== document.body) {
    let identifier = current.tagName.toLowerCase();
    if (current.id) {
      identifier += `#${current.id}`;
    } else if (current.className && typeof current.className === "string") {
      const classes = current.className.split(" ").filter(Boolean);
      const meaningfulClass = classes.find((c) => !c.startsWith("_") && !c.match(/^[a-z]{1,3}\d+/));
      if (meaningfulClass) {
        identifier += `.${meaningfulClass}`;
      }
    }
    path.unshift(identifier);
    current = current.parentElement;
  }
  if (path.length > 10) {
    return ["...", ...path.slice(-9)];
  }
  return path;
}
function initClickTracker(config) {
  if (config.trackClicks === false) {
    return () => {};
  }
  if (activeHandler) {
    activeHandler.cleanup();
  }
  const options = {
    debounceMs: 0,
    maxTextLength: 100,
    excludeSelectors: [],
    includePosition: true,
    includeTreePath: true,
    ...config.clickOptions
  };
  const listener = createClickHandler(config, options);
  document.addEventListener("click", listener, {
    capture: true,
    passive: true
  });
  const cleanup = () => {
    document.removeEventListener("click", listener, { capture: true });
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    activeHandler = null;
  };
  activeHandler = { listener, cleanup };
  return cleanup;
}
function trackClick(element, event, config) {
  const options = config?.clickOptions || {};
  const merkleElement = findNearestMerkleElement(element);
  let merkleHash = "unknown";
  let treePath = [];
  let treePathHashes = [];
  if (merkleElement) {
    const merkleInfo = parseMerkleFromElement(merkleElement);
    if (merkleInfo) {
      merkleHash = merkleInfo.hash;
      treePath = merkleInfo.path;
      treePathHashes = merkleInfo.pathHashes;
    }
  } else {
    treePath = generateDOMPath(element);
  }
  const elementInfo = extractElementInfo(element, options.maxTextLength || 100);
  const position = event ? extractPositionInfo(event) : { x: 0, y: 0, viewportX: 0, viewportY: 0 };
  const context = getESIContextSnapshot();
  pushClickEvent(merkleHash, treePath, treePathHashes, elementInfo, position, context, {
    dataLayerName: config?.dataLayerName || "dataLayer",
    eventPrefix: config?.eventPrefix || "aeon"
  });
}
function trackInteraction(name, data, element, config) {
  const context = getESIContextSnapshot();
  let treePath = [];
  let merkleHash = "none";
  if (element) {
    const merkleElement = findNearestMerkleElement(element);
    if (merkleElement) {
      const merkleInfo = parseMerkleFromElement(merkleElement);
      if (merkleInfo) {
        merkleHash = merkleInfo.hash;
        treePath = merkleInfo.path;
      }
    } else {
      treePath = generateDOMPath(element);
    }
  }
  const dataLayerName = config?.dataLayerName || "dataLayer";
  const eventPrefix = config?.eventPrefix || "aeon";
  const event = {
    event: `${eventPrefix}.interaction`,
    aeon: {
      version: "1.0.0",
      timestamp: Date.now()
    },
    interaction: {
      name,
      merkleHash,
      treePath,
      data
    },
    context
  };
  const w = window;
  const dataLayer = w[dataLayerName];
  if (dataLayer) {
    dataLayer.push(event);
  }
}

// src/use-analytics.ts
function useAeonAnalytics(config) {
  const initializedRef = useRef(false);
  const gtmReadyRef = useRef(false);
  const cleanupRef = useRef(null);
  const merkleTreeRef = useRef(null);
  const configRef = useRef(config);
  configRef.current = config;
  useEffect(() => {
    if (initializedRef.current || window.__AEON_ANALYTICS_INITIALIZED__) {
      return;
    }
    initializedRef.current = true;
    window.__AEON_ANALYTICS_INITIALIZED__ = true;
    if (config.debug) {
      setDebugMode(true);
    }
    const cleanupFunctions = [];
    if (config.gtmContainerId) {
      initializeGTM({
        containerId: config.gtmContainerId,
        dataLayerName: config.dataLayerName
      });
      waitForGTM().then((ready) => {
        gtmReadyRef.current = ready;
      });
    }
    if (config.syncESIContext !== false) {
      const cleanup = initContextBridge({
        dataLayerName: config.dataLayerName,
        eventPrefix: config.eventPrefix,
        syncESIContext: config.syncESIContext
      });
      cleanupFunctions.push(cleanup);
    }
    if (config.trackClicks !== false) {
      const cleanup = initClickTracker(config);
      cleanupFunctions.push(cleanup);
    }
    if (config.trackPageViews !== false) {
      const merkleRoot = merkleTreeRef.current?.rootHash || "";
      pushPageView({
        dataLayerName: config.dataLayerName,
        eventPrefix: config.eventPrefix
      }, merkleRoot);
    }
    cleanupRef.current = () => {
      for (const cleanup of cleanupFunctions) {
        cleanup();
      }
      window.__AEON_ANALYTICS_INITIALIZED__ = false;
    };
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (!initializedRef.current || config.trackPageViews === false) {
      return;
    }
    const merkleRoot = merkleTreeRef.current?.rootHash || "";
    pushPageView({
      dataLayerName: config.dataLayerName,
      eventPrefix: config.eventPrefix
    }, merkleRoot);
  }, [typeof window !== "undefined" ? window.location.pathname : ""]);
  const handleTrackClick = useCallback((element, event) => {
    trackClick(element, event, {
      dataLayerName: configRef.current.dataLayerName,
      eventPrefix: configRef.current.eventPrefix,
      clickOptions: configRef.current.clickOptions
    });
  }, []);
  const handleTrackInteraction = useCallback((name, data, element) => {
    trackInteraction(name, data, element, {
      dataLayerName: configRef.current.dataLayerName,
      eventPrefix: configRef.current.eventPrefix
    });
  }, []);
  const handlePushPageView = useCallback((merkleRoot) => {
    pushPageView({
      dataLayerName: configRef.current.dataLayerName,
      eventPrefix: configRef.current.eventPrefix
    }, merkleRoot || merkleTreeRef.current?.rootHash || "");
  }, []);
  const handleSetMerkleTree = useCallback((tree) => {
    merkleTreeRef.current = tree;
    window.__AEON_MERKLE_TREE__ = tree;
  }, []);
  return {
    isInitialized: initializedRef.current,
    isGTMReady: gtmReadyRef.current,
    trackClick: handleTrackClick,
    trackInteraction: handleTrackInteraction,
    pushPageView: handlePushPageView,
    setMerkleTree: handleSetMerkleTree
  };
}

// src/provider.tsx
import { jsxDEV, Fragment } from "react/jsx-dev-runtime";
var AnalyticsContext = createContext(null);
function AeonAnalyticsProvider({
  children,
  ...config
}) {
  const analytics = useAeonAnalytics(config);
  const contextValue = useMemo(() => ({
    ...analytics,
    config
  }), [
    analytics.isInitialized,
    analytics.isGTMReady,
    config.gtmContainerId,
    config.trackClicks,
    config.trackPageViews,
    config.syncESIContext
  ]);
  return /* @__PURE__ */ jsxDEV(AnalyticsContext.Provider, {
    value: contextValue,
    children
  }, undefined, false, undefined, this);
}
function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AeonAnalyticsProvider. " + 'Wrap your app with <AeonAnalyticsProvider gtmContainerId="GTM-XXXXXX">.');
  }
  return context;
}
function useAnalyticsOptional() {
  return useContext(AnalyticsContext);
}
function withAnalytics(Component) {
  return function WrappedComponent(props) {
    const analytics = useAnalytics();
    return /* @__PURE__ */ jsxDEV(Component, {
      ...props,
      analytics
    }, undefined, false, undefined, this);
  };
}
function Analytics({ children }) {
  const analytics = useAnalytics();
  return children(analytics);
}
function MerkleTreeProvider({
  tree,
  children
}) {
  const analytics = useAnalyticsOptional();
  React.useEffect(() => {
    if (analytics) {
      analytics.setMerkleTree(tree);
    } else {
      window.__AEON_MERKLE_TREE__ = tree;
    }
  }, [tree, analytics]);
  return /* @__PURE__ */ jsxDEV(Fragment, {
    children
  }, undefined, false, undefined, this);
}
function Track({
  event,
  data = {},
  onMount = false,
  onClick = false,
  onVisible = false,
  children
}) {
  const analytics = useAnalyticsOptional();
  const ref = React.useRef(null);
  const hasTrackedVisibility = React.useRef(false);
  React.useEffect(() => {
    if (onMount && analytics) {
      analytics.trackInteraction(event, { ...data, trigger: "mount" });
    }
  }, [onMount, event]);
  React.useEffect(() => {
    if (!onVisible || !analytics || hasTrackedVisibility.current) {
      return;
    }
    const element = ref.current;
    if (!element)
      return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !hasTrackedVisibility.current) {
          hasTrackedVisibility.current = true;
          analytics.trackInteraction(event, { ...data, trigger: "visible" }, element);
          observer.disconnect();
        }
      }
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible, event, analytics]);
  if (onClick && analytics) {
    return React.cloneElement(children, {
      ref,
      onClick: (e) => {
        analytics.trackInteraction(event, { ...data, trigger: "click" }, e.currentTarget);
        if (children.props.onClick) {
          children.props.onClick(e);
        }
      }
    });
  }
  return React.cloneElement(children, { ref });
}
export {
  withAnalytics,
  useAnalyticsOptional,
  useAnalytics,
  Track,
  MerkleTreeProvider,
  Analytics,
  AeonAnalyticsProvider
};

//# debugId=36C4AFA20745E37B64756E2164756E21
