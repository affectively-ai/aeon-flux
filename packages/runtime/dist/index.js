import {
  AeonRouteRegistry,
  AeonRouter,
  createAeonServer
} from "./chunk-q2dqk224.js";
import {
  DEFAULT_ESI_CONFIG,
  DEFAULT_ROUTER_CONFIG,
  EdgeWorkersESIProcessor,
  HeuristicAdapter,
  addSpeculationHeaders,
  createContextMiddleware,
  esiEmbed,
  esiEmotion,
  esiInfer,
  esiVision,
  esiWithContext,
  extractUserContext,
  setContextCookies
} from "./chunk-z57r8rre.js";
import"./chunk-e71hvfe9.js";
import {
  __require
} from "./chunk-m17t3vjq.js";
// src/cache.ts
class NavigationCache {
  cache = new Map;
  accessOrder = [];
  hits = 0;
  misses = 0;
  maxSize;
  defaultTtl;
  onEvict;
  constructor(options = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtl = options.defaultTtl ?? 5 * 60 * 1000;
    this.onEvict = options.onEvict;
  }
  get(sessionId) {
    const session = this.cache.get(sessionId);
    if (!session) {
      this.misses++;
      return null;
    }
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.cache.delete(sessionId);
      this.removeFromAccessOrder(sessionId);
      this.misses++;
      return null;
    }
    this.hits++;
    this.updateAccessOrder(sessionId);
    return session;
  }
  set(session, ttl) {
    const sessionId = session.sessionId;
    if (!this.cache.has(sessionId) && this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    const cached = {
      ...session,
      cachedAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : Date.now() + this.defaultTtl
    };
    this.cache.set(sessionId, cached);
    this.updateAccessOrder(sessionId);
  }
  has(sessionId) {
    const session = this.cache.get(sessionId);
    if (!session)
      return false;
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.cache.delete(sessionId);
      this.removeFromAccessOrder(sessionId);
      return false;
    }
    return true;
  }
  async prefetch(sessionId, fetcher) {
    const cached = this.get(sessionId);
    if (cached)
      return cached;
    const session = await fetcher();
    this.set(session);
    return session;
  }
  async prefetchMany(sessionIds, fetcher) {
    const promises = sessionIds.map(async (sessionId) => {
      const cached = this.get(sessionId);
      if (cached)
        return cached;
      const session = await fetcher(sessionId);
      this.set(session);
      return session;
    });
    return Promise.all(promises);
  }
  async preloadAll(manifest, fetcher, options = {}) {
    const total = manifest.length;
    let loaded = 0;
    const batchSize = 10;
    for (let i = 0;i < manifest.length; i += batchSize) {
      const batch = manifest.slice(i, i + batchSize);
      await Promise.all(batch.map(async ({ sessionId }) => {
        if (!this.has(sessionId)) {
          try {
            const session = await fetcher(sessionId);
            this.set(session, Infinity);
          } catch {}
        }
        loaded++;
        options.onProgress?.(loaded, total);
      }));
      await new Promise((r) => setTimeout(r, 10));
    }
  }
  invalidate(sessionId) {
    const session = this.cache.get(sessionId);
    if (session && this.onEvict) {
      this.onEvict(session);
    }
    this.cache.delete(sessionId);
    this.removeFromAccessOrder(sessionId);
  }
  clear() {
    if (this.onEvict) {
      for (const session of this.cache.values()) {
        this.onEvict(session);
      }
    }
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }
  getStats() {
    let totalBytes = 0;
    for (const session of this.cache.values()) {
      totalBytes += JSON.stringify(session).length;
    }
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      totalBytes,
      hitRate: total > 0 ? this.hits / total : 0,
      preloadedRoutes: this.cache.size
    };
  }
  keys() {
    return Array.from(this.cache.keys());
  }
  export() {
    return Array.from(this.cache.values());
  }
  import(sessions) {
    for (const session of sessions) {
      this.set(session);
    }
  }
  evictLRU() {
    if (this.accessOrder.length === 0)
      return;
    const lruId = this.accessOrder.shift();
    const session = this.cache.get(lruId);
    if (session && this.onEvict) {
      this.onEvict(session);
    }
    this.cache.delete(lruId);
  }
  updateAccessOrder(sessionId) {
    this.removeFromAccessOrder(sessionId);
    this.accessOrder.push(sessionId);
  }
  removeFromAccessOrder(sessionId) {
    const index = this.accessOrder.indexOf(sessionId);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}
var globalCache = null;
function getNavigationCache() {
  if (!globalCache) {
    globalCache = new NavigationCache;
  }
  return globalCache;
}
function setNavigationCache(cache) {
  globalCache = cache;
}

class SkeletonCache {
  cache = new Map;
  maxSize;
  defaultTtl;
  constructor(options = {}) {
    this.maxSize = options.maxSize ?? 500;
    this.defaultTtl = options.defaultTtl ?? 30 * 60 * 1000;
  }
  get(route) {
    const skeleton = this.cache.get(route);
    if (!skeleton)
      return null;
    if (skeleton.expiresAt && Date.now() > skeleton.expiresAt) {
      this.cache.delete(route);
      return null;
    }
    return skeleton;
  }
  set(skeleton, ttl) {
    if (!this.cache.has(skeleton.route) && this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest)
        this.cache.delete(oldest);
    }
    this.cache.set(skeleton.route, {
      ...skeleton,
      cachedAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : Date.now() + this.defaultTtl
    });
  }
  has(route) {
    const skeleton = this.cache.get(route);
    if (!skeleton)
      return false;
    if (skeleton.expiresAt && Date.now() > skeleton.expiresAt) {
      this.cache.delete(route);
      return false;
    }
    return true;
  }
  invalidate(route) {
    this.cache.delete(route);
  }
  clear() {
    this.cache.clear();
  }
  get size() {
    return this.cache.size;
  }
  export() {
    return Array.from(this.cache.values());
  }
  import(skeletons) {
    for (const skeleton of skeletons) {
      this.set(skeleton);
    }
  }
}
function getWithSkeleton(route, skeletonCache, sessionCache, contentFetcher) {
  const skeleton = skeletonCache.get(route);
  const content = (async () => {
    const sessionId = routeToSessionId(route);
    const cached = sessionCache.get(sessionId);
    if (cached)
      return cached;
    try {
      const session = await contentFetcher(route);
      sessionCache.set(session);
      return session;
    } catch {
      return null;
    }
  })();
  return { skeleton, content };
}
function routeToSessionId(route) {
  return route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
}
var globalSkeletonCache = null;
function getSkeletonCache() {
  if (!globalSkeletonCache) {
    globalSkeletonCache = new SkeletonCache;
  }
  return globalSkeletonCache;
}
function setSkeletonCache(cache) {
  globalSkeletonCache = cache;
}

// src/navigation.ts
class AeonNavigationEngine {
  router;
  cache;
  state;
  navigationListeners = new Set;
  presenceListeners = new Set;
  presenceCache = new Map;
  navigationHistory = new Map;
  pendingPrefetches = new Map;
  observer = null;
  sessionFetcher;
  presenceFetcher;
  constructor(options = {}) {
    this.router = options.router ?? new AeonRouter({ routesDir: "./pages" });
    this.cache = options.cache ?? getNavigationCache();
    this.sessionFetcher = options.sessionFetcher;
    this.presenceFetcher = options.presenceFetcher;
    this.state = {
      current: options.initialRoute ?? "/",
      previous: null,
      history: [options.initialRoute ?? "/"],
      isNavigating: false
    };
  }
  async navigate(href, options = {}) {
    const { transition = "fade", replace = false } = options;
    const match = this.router.match(href);
    if (!match) {
      throw new Error(`Route not found: ${href}`);
    }
    const previousRoute = this.state.current;
    this.state.isNavigating = true;
    this.notifyListeners();
    try {
      const session = await this.getSession(match.sessionId);
      if (transition !== "none" && typeof document !== "undefined" && "startViewTransition" in document) {
        await document.startViewTransition(() => {
          this.updateDOM(session, match);
        }).finished;
      } else {
        this.updateDOM(session, match);
      }
      this.state.previous = previousRoute;
      this.state.current = href;
      if (!replace) {
        this.state.history.push(href);
      } else {
        this.state.history[this.state.history.length - 1] = href;
      }
      if (typeof window !== "undefined") {
        if (replace) {
          window.history.replaceState({ route: href }, "", href);
        } else {
          window.history.pushState({ route: href }, "", href);
        }
      }
      this.recordNavigation(previousRoute, href);
      const predictions = this.predict(href);
      for (const prediction of predictions.slice(0, 3)) {
        if (prediction.probability > 0.3) {
          this.prefetch(prediction.route);
        }
      }
    } finally {
      this.state.isNavigating = false;
      this.notifyListeners();
    }
  }
  async prefetch(href, options = {}) {
    const { data = true, presence = false, priority = "normal" } = options;
    const match = this.router.match(href);
    if (!match)
      return;
    const cacheKey = `${match.sessionId}:${data}:${presence}`;
    if (this.pendingPrefetches.has(cacheKey)) {
      return;
    }
    const prefetchPromise = (async () => {
      const promises = [];
      if (data && this.sessionFetcher) {
        promises.push(this.cache.prefetch(match.sessionId, () => this.sessionFetcher(match.sessionId)));
      }
      if (presence && this.presenceFetcher) {
        promises.push(this.prefetchPresence(href));
      }
      await Promise.all(promises);
      return this.cache.get(match.sessionId);
    })();
    this.pendingPrefetches.set(cacheKey, prefetchPromise);
    try {
      await prefetchPromise;
    } finally {
      this.pendingPrefetches.delete(cacheKey);
    }
  }
  async prefetchPresence(route) {
    if (!this.presenceFetcher)
      return null;
    try {
      const presence = await this.presenceFetcher(route);
      this.presenceCache.set(route, presence);
      this.notifyPresenceListeners(route, presence);
      return presence;
    } catch {
      return null;
    }
  }
  isPreloaded(href) {
    const match = this.router.match(href);
    if (!match)
      return false;
    return this.cache.has(match.sessionId);
  }
  getPresence(route) {
    return this.presenceCache.get(route) ?? null;
  }
  observeLinks(container) {
    if (typeof IntersectionObserver === "undefined") {
      return () => {};
    }
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const link = entry.target;
          const href = link.getAttribute("href");
          if (href && href.startsWith("/")) {
            this.prefetch(href);
          }
        }
      }
    }, { rootMargin: "100px" });
    const links = container.querySelectorAll('a[href^="/"]');
    links.forEach((link) => this.observer.observe(link));
    return () => {
      this.observer?.disconnect();
      this.observer = null;
    };
  }
  predict(currentRoute) {
    const predictions = [];
    const fromHistory = this.navigationHistory.get(currentRoute);
    if (fromHistory) {
      const total = Array.from(fromHistory.values()).reduce((a, b) => a + b, 0);
      for (const [route, count] of fromHistory) {
        predictions.push({
          route,
          probability: count / total,
          reason: "history"
        });
      }
    }
    predictions.sort((a, b) => b.probability - a.probability);
    return predictions;
  }
  async back() {
    if (this.state.history.length <= 1)
      return;
    this.state.history.pop();
    const previousRoute = this.state.history[this.state.history.length - 1];
    await this.navigate(previousRoute, { replace: true });
  }
  getState() {
    return { ...this.state };
  }
  subscribe(listener) {
    this.navigationListeners.add(listener);
    return () => this.navigationListeners.delete(listener);
  }
  subscribePresence(listener) {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }
  async preloadAll(onProgress) {
    if (!this.sessionFetcher) {
      throw new Error("sessionFetcher required for preloadAll");
    }
    const routes = this.router.getRoutes();
    const manifest = routes.map((r) => ({
      sessionId: this.router.match(r.pattern)?.sessionId ?? r.pattern,
      route: r.pattern
    }));
    await this.cache.preloadAll(manifest, this.sessionFetcher, { onProgress });
  }
  getCacheStats() {
    return this.cache.getStats();
  }
  async getSession(sessionId) {
    const cached = this.cache.get(sessionId);
    if (cached)
      return cached;
    if (!this.sessionFetcher) {
      throw new Error("Session not cached and no fetcher provided");
    }
    const session = await this.sessionFetcher(sessionId);
    this.cache.set(session);
    return session;
  }
  updateDOM(session, match) {
    if (typeof document !== "undefined") {
      const event = new CustomEvent("aeon:navigate", {
        detail: { session, match }
      });
      document.dispatchEvent(event);
    }
  }
  recordNavigation(from, to) {
    if (!this.navigationHistory.has(from)) {
      this.navigationHistory.set(from, new Map);
    }
    const fromMap = this.navigationHistory.get(from);
    fromMap.set(to, (fromMap.get(to) ?? 0) + 1);
  }
  notifyListeners() {
    for (const listener of this.navigationListeners) {
      listener(this.getState());
    }
  }
  notifyPresenceListeners(route, presence) {
    for (const listener of this.presenceListeners) {
      listener(route, presence);
    }
  }
}
var globalNavigator = null;
function getNavigator() {
  if (!globalNavigator) {
    globalNavigator = new AeonNavigationEngine;
  }
  return globalNavigator;
}
function setNavigator(navigator2) {
  globalNavigator = navigator2;
}
if (typeof window !== "undefined") {
  window.addEventListener("popstate", (event) => {
    const navigator2 = getNavigator();
    const route = event.state?.route ?? window.location.pathname;
    navigator2.navigate(route, { replace: true });
  });
}
// src/skeleton-hydrate.ts
var state = {
  skeletonRoot: null,
  contentRoot: null,
  swapped: false
};
function initSkeleton() {
  state.skeletonRoot = document.getElementById("aeon-skeleton");
  state.contentRoot = document.getElementById("root");
  if (!state.skeletonRoot || !state.contentRoot) {
    return;
  }
  state.contentRoot.style.display = "none";
  state.skeletonRoot.style.display = "block";
}
function swapToContent(options = {}) {
  if (state.swapped || !state.skeletonRoot || !state.contentRoot) {
    options.onComplete?.();
    return;
  }
  const { fade = true, duration = 150, onComplete } = options;
  if (fade) {
    const transitionStyle = `opacity ${duration}ms ease-out`;
    state.skeletonRoot.style.transition = transitionStyle;
    state.contentRoot.style.transition = transitionStyle;
    state.contentRoot.style.opacity = "0";
    state.contentRoot.style.display = "block";
    state.contentRoot.offsetHeight;
    state.skeletonRoot.style.opacity = "0";
    state.contentRoot.style.opacity = "1";
    setTimeout(() => {
      state.skeletonRoot?.remove();
      onComplete?.();
    }, duration);
  } else {
    state.skeletonRoot.remove();
    state.contentRoot.style.display = "block";
    onComplete?.();
  }
  state.swapped = true;
}
function isSkeletonVisible() {
  return !state.swapped && state.skeletonRoot !== null;
}
function generateSkeletonInitScript() {
  return `<script>
(function(){
  var s=document.getElementById('aeon-skeleton'),r=document.getElementById('root');
  if(s&&r){r.style.display='none';s.style.display='block'}
  window.__AEON_SKELETON__={
    swap:function(o){
      if(this.done)return;
      o=o||{};
      var f=o.fade!==false,d=o.duration||150;
      if(f){
        s.style.transition=r.style.transition='opacity '+d+'ms ease-out';
        r.style.opacity='0';r.style.display='block';
        void r.offsetHeight;
        s.style.opacity='0';r.style.opacity='1';
        setTimeout(function(){s.remove();o.onComplete&&o.onComplete()},d);
      }else{
        s.remove();r.style.display='block';o.onComplete&&o.onComplete();
      }
      this.done=true
    },
    isVisible:function(){return!this.done&&!!s},
    done:false
  };
})();
</script>`;
}
function generateSkeletonPageStructure(options) {
  const {
    title,
    description,
    skeletonHtml,
    skeletonCss,
    contentHtml,
    contentCss,
    headExtra = "",
    bodyExtra = ""
  } = options;
  const descriptionMeta = description ? `
  <meta name="description" content="${escapeHtml(description)}">` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>${descriptionMeta}
  <style>
/* Skeleton CSS */
${skeletonCss}
/* Content CSS */
${contentCss}
  </style>
  ${generateSkeletonInitScript()}
  ${headExtra}
</head>
<body>
  <div id="aeon-skeleton" aria-hidden="true">${skeletonHtml}</div>
  <div id="root" style="display:none">${contentHtml}</div>
  <script>
    // Swap when DOM is ready
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',function(){
        window.__AEON_SKELETON__.swap({fade:true});
      });
    }else{
      window.__AEON_SKELETON__.swap({fade:true});
    }
  </script>
  ${bodyExtra}
</body>
</html>`;
}
function generateAsyncSwapScript() {
  return `<script>
(function(){
  // Wait for content to be ready (e.g., after React hydration)
  function checkReady(){
    var root=document.getElementById('root');
    if(root&&root.children.length>0){
      window.__AEON_SKELETON__&&window.__AEON_SKELETON__.swap({fade:true});
    }else{
      requestAnimationFrame(checkReady);
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',checkReady);
  }else{
    checkReady();
  }
})();
</script>`;
}
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
// src/predictor.ts
var DEFAULT_CONFIG = {
  historyWeight: 0.5,
  communityWeight: 0.3,
  timeWeight: 0.2,
  decayFactor: 0.95,
  minProbability: 0.1,
  maxPredictions: 5
};

class NavigationPredictor {
  config;
  history = [];
  transitionMatrix = new Map;
  communityPatterns = new Map;
  timePatterns = new Map;
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  record(record) {
    this.history.push(record);
    if (!this.transitionMatrix.has(record.from)) {
      this.transitionMatrix.set(record.from, new Map);
    }
    const fromMap = this.transitionMatrix.get(record.from);
    fromMap.set(record.to, (fromMap.get(record.to) ?? 0) + 1);
    const hour = new Date(record.timestamp).getHours();
    if (!this.timePatterns.has(record.to)) {
      this.timePatterns.set(record.to, new Map);
    }
    const hourMap = this.timePatterns.get(record.to);
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
    this.applyDecay();
  }
  predict(currentRoute) {
    const predictions = new Map;
    const historyPredictions = this.predictFromHistory(currentRoute);
    for (const pred of historyPredictions) {
      this.mergePrediction(predictions, pred, this.config.historyWeight);
    }
    const communityPredictions = this.predictFromCommunity(currentRoute);
    for (const pred of communityPredictions) {
      this.mergePrediction(predictions, pred, this.config.communityWeight);
    }
    const timePredictions = this.predictFromTime();
    for (const pred of timePredictions) {
      this.mergePrediction(predictions, pred, this.config.timeWeight);
    }
    return Array.from(predictions.values()).filter((p) => p.probability >= this.config.minProbability).sort((a, b) => b.probability - a.probability).slice(0, this.config.maxPredictions);
  }
  predictFromHistory(currentRoute) {
    const fromMap = this.transitionMatrix.get(currentRoute);
    if (!fromMap)
      return [];
    const total = Array.from(fromMap.values()).reduce((a, b) => a + b, 0);
    if (total === 0)
      return [];
    return Array.from(fromMap.entries()).map(([route, count]) => ({
      route,
      probability: count / total,
      reason: "history",
      confidence: Math.min(1, total / 10)
    }));
  }
  predictFromCommunity(currentRoute) {
    const pattern = this.communityPatterns.get(currentRoute);
    if (!pattern || pattern.nextRoutes.length === 0)
      return [];
    const total = pattern.nextRoutes.reduce((a, b) => a + b.count, 0);
    if (total === 0)
      return [];
    return pattern.nextRoutes.map(({ route, count }) => ({
      route,
      probability: count / total,
      reason: "community",
      confidence: Math.min(1, pattern.popularity / 100)
    }));
  }
  predictFromTime() {
    const currentHour = new Date().getHours();
    const predictions = [];
    let maxCount = 0;
    for (const [route, hourMap] of this.timePatterns) {
      const count = hourMap.get(currentHour) ?? 0;
      if (count > maxCount)
        maxCount = count;
    }
    if (maxCount === 0)
      return [];
    for (const [route, hourMap] of this.timePatterns) {
      const count = hourMap.get(currentHour) ?? 0;
      if (count > 0) {
        predictions.push({
          route,
          probability: count / maxCount,
          reason: "time",
          confidence: Math.min(1, count / 5)
        });
      }
    }
    return predictions;
  }
  mergePrediction(predictions, prediction, weight) {
    const existing = predictions.get(prediction.route);
    if (existing) {
      const totalWeight = (existing.confidence ?? 1) + (prediction.confidence ?? 1) * weight;
      existing.probability = (existing.probability * (existing.confidence ?? 1) + prediction.probability * (prediction.confidence ?? 1) * weight) / totalWeight;
      existing.confidence = Math.max(existing.confidence, prediction.confidence);
      if (prediction.confidence > (existing.confidence ?? 0)) {
        existing.reason = prediction.reason;
      }
    } else {
      predictions.set(prediction.route, {
        ...prediction,
        probability: prediction.probability * weight
      });
    }
  }
  applyDecay() {
    for (const [from, toMap] of this.transitionMatrix) {
      for (const [to, count] of toMap) {
        const decayed = count * this.config.decayFactor;
        if (decayed < 0.1) {
          toMap.delete(to);
        } else {
          toMap.set(to, decayed);
        }
      }
      if (toMap.size === 0) {
        this.transitionMatrix.delete(from);
      }
    }
    const maxHistory = 1000;
    if (this.history.length > maxHistory) {
      this.history = this.history.slice(-maxHistory);
    }
  }
  updateCommunityPatterns(patterns) {
    this.communityPatterns = patterns;
  }
  getTransitionMatrix() {
    return this.transitionMatrix;
  }
  importTransitionMatrix(matrix) {
    for (const [from, toMap] of matrix) {
      if (!this.transitionMatrix.has(from)) {
        this.transitionMatrix.set(from, new Map);
      }
      const existingMap = this.transitionMatrix.get(from);
      for (const [to, count] of toMap) {
        existingMap.set(to, (existingMap.get(to) ?? 0) + count);
      }
    }
  }
  getStats() {
    let transitionPairs = 0;
    for (const toMap of this.transitionMatrix.values()) {
      transitionPairs += toMap.size;
    }
    return {
      totalRecords: this.history.length,
      uniqueRoutes: this.transitionMatrix.size,
      transitionPairs,
      communityPatterns: this.communityPatterns.size
    };
  }
  clear() {
    this.history = [];
    this.transitionMatrix.clear();
    this.communityPatterns.clear();
    this.timePatterns.clear();
  }
  export() {
    return {
      history: this.history,
      transitionMatrix: Array.from(this.transitionMatrix.entries()).map(([from, toMap]) => [from, Array.from(toMap.entries())]),
      timePatterns: Array.from(this.timePatterns.entries()).map(([route, hourMap]) => [route, Array.from(hourMap.entries())])
    };
  }
  import(data) {
    if (data.history) {
      this.history = data.history;
    }
    if (data.transitionMatrix) {
      this.transitionMatrix = new Map(data.transitionMatrix.map(([from, toEntries]) => [
        from,
        new Map(toEntries)
      ]));
    }
    if (data.timePatterns) {
      this.timePatterns = new Map(data.timePatterns.map(([route, hourEntries]) => [
        route,
        new Map(hourEntries)
      ]));
    }
  }
}
var globalPredictor = null;
function getPredictor() {
  if (!globalPredictor) {
    globalPredictor = new NavigationPredictor;
  }
  return globalPredictor;
}
function setPredictor(predictor) {
  globalPredictor = predictor;
}
// src/speculation.ts
var DEFAULT_CONFIG2 = {
  maxCachedPages: 5,
  maxCacheSize: 5 * 1024 * 1024,
  staleTTL: 5 * 60 * 1000,
  minConfidence: 0.3,
  intersectionRootMargin: "200px",
  useSpeculationRules: true,
  prerenderOnHover: true,
  hoverDelay: 100,
  sessionBaseUrl: "/_aeon/session"
};

class SpeculativeRenderer {
  config;
  cache = new Map;
  currentCacheSize = 0;
  observer = null;
  hoverTimeouts = new Map;
  initialized = false;
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG2, ...config };
  }
  init() {
    if (this.initialized)
      return;
    if (typeof window === "undefined")
      return;
    this.initialized = true;
    this.setupIntersectionObserver();
    if (this.config.prerenderOnHover) {
      this.setupHoverListeners();
    }
    if (this.config.useSpeculationRules) {
      this.injectSpeculationRules();
    }
    this.setupNavigationInterception();
    this.startPredictivePrerendering();
    console.log("[aeon:speculation] Initialized");
  }
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    for (const timeout of this.hoverTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.hoverTimeouts.clear();
    this.cache.clear();
    this.currentCacheSize = 0;
    this.initialized = false;
    console.log("[aeon:speculation] Destroyed");
  }
  async prerender(route, confidence = 1) {
    const existing = this.cache.get(route);
    if (existing && !existing.stale && Date.now() - existing.prefetchedAt < this.config.staleTTL) {
      return true;
    }
    if (typeof window !== "undefined" && window.location.pathname === route) {
      return false;
    }
    try {
      console.log(`[aeon:speculation] Pre-rendering: ${route}`);
      const response = await fetch(`${route}?_aeon_prerender=1`, {
        headers: {
          "X-Aeon-Prerender": "1",
          Accept: "text/html"
        }
      });
      if (!response.ok) {
        console.warn(`[aeon:speculation] Failed to fetch: ${route}`, response.status);
        return false;
      }
      const html = await response.text();
      const size = html.length;
      this.evictIfNeeded(size);
      const page = {
        route,
        html,
        prefetchedAt: Date.now(),
        confidence,
        stale: false,
        size
      };
      this.cache.set(route, page);
      this.currentCacheSize += size;
      console.log(`[aeon:speculation] Cached: ${route} (${(size / 1024).toFixed(1)}KB)`);
      return true;
    } catch (err) {
      console.warn(`[aeon:speculation] Error pre-rendering: ${route}`, err);
      return false;
    }
  }
  async navigate(route) {
    const cached = this.cache.get(route);
    if (cached && !cached.stale && Date.now() - cached.prefetchedAt < this.config.staleTTL) {
      console.log(`[aeon:speculation] Instant nav to: ${route}`);
      document.open();
      document.write(cached.html);
      document.close();
      history.pushState({ aeonSpeculative: true }, "", route);
      this.reinitialize();
      return true;
    }
    return false;
  }
  invalidate(routes) {
    if (routes) {
      for (const route of routes) {
        const cached = this.cache.get(route);
        if (cached) {
          cached.stale = true;
        }
      }
    } else {
      for (const page of this.cache.values()) {
        page.stale = true;
      }
    }
  }
  getStats() {
    return {
      cachedPages: this.cache.size,
      cacheSize: this.currentCacheSize,
      cacheHitRate: 0
    };
  }
  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => this.onLinksVisible(entries), { rootMargin: this.config.intersectionRootMargin });
    this.observeLinks();
  }
  observeLinks() {
    if (!this.observer)
      return;
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      this.observer.observe(link);
    });
  }
  async onLinksVisible(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting)
        continue;
      const link = entry.target;
      const route = new URL(link.href, window.location.origin).pathname;
      this.observer?.unobserve(link);
      await this.prerender(route, 0.7);
    }
  }
  setupHoverListeners() {
    document.addEventListener("mouseenter", (e) => this.onLinkHover(e), true);
    document.addEventListener("mouseleave", (e) => this.onLinkLeave(e), true);
  }
  onLinkHover(e) {
    const link = e.target.closest('a[href^="/"]');
    if (!link)
      return;
    const route = new URL(link.href, window.location.origin).pathname;
    const timeout = setTimeout(() => {
      this.prerender(route, 0.9);
    }, this.config.hoverDelay);
    this.hoverTimeouts.set(route, timeout);
  }
  onLinkLeave(e) {
    const link = e.target.closest('a[href^="/"]');
    if (!link)
      return;
    const route = new URL(link.href, window.location.origin).pathname;
    const timeout = this.hoverTimeouts.get(route);
    if (timeout) {
      clearTimeout(timeout);
      this.hoverTimeouts.delete(route);
    }
  }
  injectSpeculationRules() {
    if (!(("supports" in HTMLScriptElement) && HTMLScriptElement.supports("speculationrules"))) {
      console.log("[aeon:speculation] Browser does not support Speculation Rules API");
      return;
    }
    const rules = {
      prerender: [
        {
          source: "document",
          where: {
            href_matches: "/*",
            not: {
              or: [
                { href_matches: "/api/*" },
                { href_matches: "/_aeon/*" },
                { selector_matches: "[data-aeon-no-prerender]" }
              ]
            }
          },
          eagerness: "moderate"
        }
      ]
    };
    const script = document.createElement("script");
    script.type = "speculationrules";
    script.textContent = JSON.stringify(rules);
    document.head.appendChild(script);
    console.log("[aeon:speculation] Speculation Rules injected");
  }
  setupNavigationInterception() {
    document.addEventListener("click", async (e) => {
      const link = e.target.closest('a[href^="/"]');
      if (!link)
        return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const route = new URL(link.href, window.location.origin).pathname;
      if (await this.navigate(route)) {
        e.preventDefault();
      }
    });
    window.addEventListener("popstate", (e) => {
      if (e.state?.aeonSpeculative) {
        const route = window.location.pathname;
        const cached = this.cache.get(route);
        if (cached && !cached.stale) {
          document.open();
          document.write(cached.html);
          document.close();
          this.reinitialize();
        }
      }
    });
  }
  async startPredictivePrerendering() {
    const predictor = getPredictor();
    const currentRoute = window.location.pathname;
    const predictions = predictor.predict(currentRoute);
    for (const prediction of predictions) {
      if (prediction.probability >= this.config.minConfidence) {
        this.prerender(prediction.route, prediction.probability);
      }
    }
  }
  reinitialize() {
    setTimeout(() => {
      this.observeLinks();
      this.startPredictivePrerendering();
    }, 0);
  }
  evictIfNeeded(incomingSize) {
    while ((this.cache.size >= this.config.maxCachedPages || this.currentCacheSize + incomingSize > this.config.maxCacheSize) && this.cache.size > 0) {
      let toEvict = null;
      let lowestScore = Infinity;
      for (const [route, page] of this.cache) {
        const age = Date.now() - page.prefetchedAt;
        const score = page.confidence / (1 + age / 60000);
        if (page.stale || score < lowestScore) {
          lowestScore = score;
          toEvict = route;
        }
      }
      if (toEvict) {
        const page = this.cache.get(toEvict);
        this.cache.delete(toEvict);
        this.currentCacheSize -= page.size;
        console.log(`[aeon:speculation] Evicted: ${toEvict}`);
      } else {
        break;
      }
    }
  }
}
var globalSpeculativeRenderer = null;
function getSpeculativeRenderer() {
  if (!globalSpeculativeRenderer) {
    globalSpeculativeRenderer = new SpeculativeRenderer;
  }
  return globalSpeculativeRenderer;
}
function setSpeculativeRenderer(renderer) {
  globalSpeculativeRenderer = renderer;
}
function initSpeculativeRendering(config) {
  const renderer = new SpeculativeRenderer(config);
  setSpeculativeRenderer(renderer);
  renderer.init();
  return renderer;
}
// src/storage.ts
class FileStorageAdapter {
  name = "file";
  pagesDir;
  dataDir;
  constructor(options) {
    this.pagesDir = options.pagesDir;
    this.dataDir = options.dataDir ?? ".aeon/data";
  }
  async init() {
    const fs = await import("fs/promises");
    await fs.mkdir(this.dataDir, { recursive: true });
  }
  async getRoute(path) {
    try {
      const fs = await import("fs/promises");
      const filePath = `${this.dataDir}/routes/${this.pathToKey(path)}.json`;
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  async getAllRoutes() {
    try {
      const fs = await import("fs/promises");
      const routesDir = `${this.dataDir}/routes`;
      const files = await fs.readdir(routesDir);
      const routes = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(`${routesDir}/${file}`, "utf-8");
          routes.push(JSON.parse(content));
        }
      }
      return routes;
    } catch {
      return [];
    }
  }
  async saveRoute(route) {
    const fs = await import("fs/promises");
    const routesDir = `${this.dataDir}/routes`;
    await fs.mkdir(routesDir, { recursive: true });
    const filePath = `${routesDir}/${this.pathToKey(route.pattern)}.json`;
    await fs.writeFile(filePath, JSON.stringify(route, null, 2));
  }
  async deleteRoute(path) {
    const fs = await import("fs/promises");
    const filePath = `${this.dataDir}/routes/${this.pathToKey(path)}.json`;
    await fs.unlink(filePath).catch(() => {});
  }
  async getSession(sessionId) {
    try {
      const fs = await import("fs/promises");
      const filePath = `${this.dataDir}/sessions/${sessionId}.json`;
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  async saveSession(session) {
    const fs = await import("fs/promises");
    const sessionsDir = `${this.dataDir}/sessions`;
    await fs.mkdir(sessionsDir, { recursive: true });
    const filePath = `${sessionsDir}/${this.pathToKey(session.route)}.json`;
    await fs.writeFile(filePath, JSON.stringify(session, null, 2));
  }
  async getTree(sessionId) {
    const session = await this.getSession(sessionId);
    return session?.tree ?? null;
  }
  async saveTree(sessionId, tree) {
    const session = await this.getSession(sessionId);
    if (session) {
      session.tree = tree;
      await this.saveSession(session);
    }
  }
  pathToKey(path) {
    return path.replace(/\//g, "_").replace(/^_/, "") || "index";
  }
}

class D1StorageAdapter {
  name = "d1";
  db;
  constructor(db) {
    this.db = db;
  }
  async init() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        path TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        session_id TEXT NOT NULL,
        component_id TEXT NOT NULL,
        layout TEXT,
        is_aeon INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        route TEXT NOT NULL,
        tree TEXT NOT NULL,
        data TEXT DEFAULT '{}',
        schema_version TEXT DEFAULT '1.0.0',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS presence (
        session_id TEXT,
        user_id TEXT,
        role TEXT DEFAULT 'user',
        cursor_x INTEGER,
        cursor_y INTEGER,
        editing TEXT,
        status TEXT DEFAULT 'online',
        last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_routes_pattern ON routes(pattern);
      CREATE INDEX IF NOT EXISTS idx_sessions_route ON sessions(route);
    `);
  }
  async getRoute(path) {
    const result = await this.db.prepare("SELECT * FROM routes WHERE path = ?").bind(path).first();
    if (!result)
      return null;
    return {
      pattern: result.pattern,
      sessionId: result.session_id,
      componentId: result.component_id,
      layout: result.layout,
      isAeon: Boolean(result.is_aeon)
    };
  }
  async getAllRoutes() {
    const results = await this.db.prepare("SELECT * FROM routes ORDER BY pattern").all();
    return results.results.map((row) => ({
      pattern: row.pattern,
      sessionId: row.session_id,
      componentId: row.component_id,
      layout: row.layout,
      isAeon: Boolean(row.is_aeon)
    }));
  }
  async saveRoute(route) {
    await this.db.prepare(`
        INSERT OR REPLACE INTO routes (path, pattern, session_id, component_id, layout, is_aeon, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(route.pattern, route.pattern, route.sessionId, route.componentId, route.layout ?? null, route.isAeon ? 1 : 0).run();
  }
  async deleteRoute(path) {
    await this.db.prepare("DELETE FROM routes WHERE path = ?").bind(path).run();
  }
  async getSession(sessionId) {
    const result = await this.db.prepare("SELECT * FROM sessions WHERE session_id = ?").bind(sessionId).first();
    if (!result)
      return null;
    const presenceResults = await this.db.prepare("SELECT * FROM presence WHERE session_id = ?").bind(sessionId).all();
    return {
      route: result.route,
      tree: JSON.parse(result.tree),
      data: JSON.parse(result.data),
      schema: { version: result.schema_version },
      presence: presenceResults.results.map((p) => ({
        userId: p.user_id,
        role: p.role,
        cursor: p.cursor_x !== null ? { x: p.cursor_x, y: p.cursor_y } : undefined,
        editing: p.editing,
        status: p.status,
        lastActivity: p.last_activity
      }))
    };
  }
  async saveSession(session) {
    await this.db.prepare(`
        INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(this.routeToSessionId(session.route), session.route, JSON.stringify(session.tree), JSON.stringify(session.data), session.schema.version).run();
  }
  async getTree(sessionId) {
    const result = await this.db.prepare("SELECT tree FROM sessions WHERE session_id = ?").bind(sessionId).first();
    if (!result)
      return null;
    return JSON.parse(result.tree);
  }
  async saveTree(sessionId, tree) {
    await this.db.prepare(`
        UPDATE sessions SET tree = ?, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `).bind(JSON.stringify(tree), sessionId).run();
  }
  routeToSessionId(route) {
    return route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  }
}

class DurableObjectStorageAdapter {
  name = "durable-object";
  namespace;
  routeCache = new Map;
  constructor(namespace) {
    this.namespace = namespace;
  }
  async init() {}
  async getRoute(path) {
    if (this.routeCache.has(path)) {
      return this.routeCache.get(path);
    }
    const routesId = this.namespace.idFromName("__routes__");
    const routesStub = this.namespace.get(routesId);
    const response = await routesStub.fetch(new Request("http://internal/route", {
      method: "POST",
      body: JSON.stringify({ action: "get", path }),
      headers: { "Content-Type": "application/json" }
    }));
    if (!response.ok)
      return null;
    const route = await response.json();
    if (route) {
      this.routeCache.set(path, route);
    }
    return route;
  }
  async getAllRoutes() {
    const routesId = this.namespace.idFromName("__routes__");
    const routesStub = this.namespace.get(routesId);
    const response = await routesStub.fetch(new Request("http://internal/routes", {
      method: "GET"
    }));
    if (!response.ok)
      return [];
    return response.json();
  }
  async saveRoute(route) {
    const routesId = this.namespace.idFromName("__routes__");
    const routesStub = this.namespace.get(routesId);
    await routesStub.fetch(new Request("http://internal/route", {
      method: "PUT",
      body: JSON.stringify(route),
      headers: { "Content-Type": "application/json" }
    }));
    this.routeCache.set(route.pattern, route);
  }
  async deleteRoute(path) {
    const routesId = this.namespace.idFromName("__routes__");
    const routesStub = this.namespace.get(routesId);
    await routesStub.fetch(new Request("http://internal/route", {
      method: "DELETE",
      body: JSON.stringify({ path }),
      headers: { "Content-Type": "application/json" }
    }));
    this.routeCache.delete(path);
  }
  async getSession(sessionId) {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);
    const response = await stub.fetch(new Request("http://internal/session", {
      method: "GET"
    }));
    if (!response.ok)
      return null;
    return response.json();
  }
  async saveSession(session) {
    const sessionId = this.routeToSessionId(session.route);
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);
    await stub.fetch(new Request("http://internal/session", {
      method: "PUT",
      body: JSON.stringify(session),
      headers: { "Content-Type": "application/json" }
    }));
  }
  async getTree(sessionId) {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);
    const response = await stub.fetch(new Request("http://internal/tree", {
      method: "GET"
    }));
    if (!response.ok)
      return null;
    return response.json();
  }
  async saveTree(sessionId, tree) {
    const doId = this.namespace.idFromName(sessionId);
    const stub = this.namespace.get(doId);
    await stub.fetch(new Request("http://internal/tree", {
      method: "PUT",
      body: JSON.stringify(tree),
      headers: { "Content-Type": "application/json" }
    }));
  }
  getSessionStub(sessionId) {
    const doId = this.namespace.idFromName(sessionId);
    return this.namespace.get(doId);
  }
  routeToSessionId(route) {
    return route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  }
}
var propagate = (promise) => {
  promise.catch(() => {});
};

class HybridStorageAdapter {
  name = "hybrid";
  do;
  d1;
  constructor(options) {
    this.do = new DurableObjectStorageAdapter(options.namespace);
    this.d1 = new D1StorageAdapter(options.db);
  }
  async init() {
    await Promise.all([this.do.init(), this.d1.init()]);
  }
  async getRoute(path) {
    const route = await this.do.getRoute(path);
    if (route)
      return route;
    return this.d1.getRoute(path);
  }
  async getAllRoutes() {
    return this.d1.getAllRoutes();
  }
  async saveRoute(route) {
    await this.do.saveRoute(route);
    propagate(this.d1.saveRoute(route));
  }
  async deleteRoute(path) {
    await this.do.deleteRoute(path);
    propagate(this.d1.deleteRoute(path));
  }
  async getSession(sessionId) {
    return this.do.getSession(sessionId);
  }
  async saveSession(session) {
    await this.do.saveSession(session);
    propagate(this.d1.saveSession(session));
  }
  async getTree(sessionId) {
    return this.do.getTree(sessionId);
  }
  async saveTree(sessionId, tree) {
    await this.do.saveTree(sessionId, tree);
    propagate(this.d1.saveTree(sessionId, tree));
  }
  async getHistoricalSession(sessionId) {
    return this.d1.getSession(sessionId);
  }
  getSessionStub(sessionId) {
    return this.do.getSessionStub(sessionId);
  }
}

class DashStorageAdapter {
  name = "dash";
  client;
  collections;
  subscriptions = [];
  constructor(client, options) {
    this.client = client;
    this.collections = {
      routes: options?.routesCollection ?? "aeon-routes",
      sessions: options?.sessionsCollection ?? "aeon-sessions",
      presence: options?.presenceCollection ?? "aeon-presence"
    };
  }
  async init() {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }
  async getRoute(path) {
    const route = await this.client.get(this.collections.routes, this.pathToId(path));
    return route;
  }
  async getAllRoutes() {
    const routes = await this.client.query(this.collections.routes, { orderBy: { field: "pattern", direction: "asc" } });
    return routes;
  }
  async saveRoute(route) {
    await this.client.set(this.collections.routes, this.pathToId(route.pattern), route);
  }
  async deleteRoute(path) {
    await this.client.delete(this.collections.routes, this.pathToId(path));
  }
  async getSession(sessionId) {
    const session = await this.client.get(this.collections.sessions, sessionId);
    if (!session)
      return null;
    const presence = await this.client.query(this.collections.presence, {
      where: [{ field: "sessionId", op: "==", value: sessionId }]
    });
    return {
      ...session,
      presence: presence.map((p) => ({
        userId: p.userId,
        role: p.role,
        cursor: p.cursor,
        editing: p.editing,
        status: p.status,
        lastActivity: p.lastActivity
      }))
    };
  }
  async saveSession(session) {
    const sessionId = this.routeToSessionId(session.route);
    const { presence: _, ...sessionData } = session;
    await this.client.set(this.collections.sessions, sessionId, sessionData);
  }
  async getTree(sessionId) {
    const session = await this.getSession(sessionId);
    return session?.tree ?? null;
  }
  async saveTree(sessionId, tree) {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.client.set(this.collections.sessions, sessionId, {
        ...session,
        tree
      });
    }
  }
  subscribeToRoutes(callback) {
    const sub = this.client.subscribe(this.collections.routes, undefined, callback);
    this.subscriptions.push(sub);
    return sub;
  }
  subscribeToSession(sessionId, callback) {
    const sub = this.client.subscribe(this.collections.sessions, { where: [{ field: "id", op: "==", value: sessionId }] }, callback);
    this.subscriptions.push(sub);
    return sub;
  }
  subscribeToPresence(sessionId, callback) {
    const sub = this.client.subscribe(this.collections.presence, { where: [{ field: "sessionId", op: "==", value: sessionId }] }, callback);
    this.subscriptions.push(sub);
    return sub;
  }
  async updatePresence(sessionId, userId, presence) {
    await this.client.set(this.collections.presence, `${sessionId}:${userId}`, {
      sessionId,
      userId,
      ...presence,
      lastActivity: new Date().toISOString()
    });
  }
  destroy() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
  }
  pathToId(path) {
    return path.replace(/\//g, "_").replace(/^_/, "") || "index";
  }
  routeToSessionId(route) {
    return route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
  }
}
function createStorageAdapter(config) {
  switch (config.type) {
    case "d1":
      if (!config.d1) {
        throw new Error("D1 database required for d1 storage adapter");
      }
      return new D1StorageAdapter(config.d1);
    case "durable-object":
      if (!config.durableObjectNamespace) {
        throw new Error("Durable Object namespace required for durable-object storage adapter");
      }
      return new DurableObjectStorageAdapter(config.durableObjectNamespace);
    case "hybrid":
      if (!config.durableObjectNamespace || !config.d1) {
        throw new Error("Both Durable Object namespace and D1 database required for hybrid storage adapter");
      }
      return new HybridStorageAdapter({
        namespace: config.durableObjectNamespace,
        db: config.d1
      });
    case "dash":
      if (!config.dash) {
        throw new Error("Dash client required for dash storage adapter");
      }
      return new DashStorageAdapter(config.dash, {
        routesCollection: config.dashCollections?.routes,
        sessionsCollection: config.dashCollections?.sessions,
        presenceCollection: config.dashCollections?.presence
      });
    case "custom":
      if (!config.custom) {
        throw new Error("Custom adapter required for custom storage");
      }
      return config.custom;
    case "file":
    default:
      return new FileStorageAdapter({
        pagesDir: config.pagesDir ?? "./pages",
        dataDir: config.dataDir ?? ".aeon/data"
      });
  }
}
// src/tree-compiler.ts
function compileTreeToTSX(tree, options) {
  const { route, useAeon = true, imports = {}, format = true } = options;
  const usedComponents = new Set;
  collectComponents(tree, usedComponents);
  const importLines = [];
  importLines.push("import type { FC } from 'react';");
  for (const component of usedComponents) {
    if (imports[component]) {
      importLines.push(`import { ${component} } from '${imports[component]}';`);
    } else if (!isHTMLElement(component)) {
      importLines.push(`import { ${component} } from '@/components/${component}';`);
    }
  }
  const componentName = routeToComponentName(route);
  const jsx = nodeToJSX(tree, 2);
  const lines = [];
  if (useAeon) {
    lines.push("'use aeon';");
    lines.push("");
  }
  lines.push("/**");
  lines.push(` * ${componentName}`);
  lines.push(` * Route: ${route}`);
  lines.push(" * ");
  lines.push(" * @generated by aeon-flux visual editor");
  lines.push(" */");
  lines.push("");
  lines.push(...importLines);
  lines.push("");
  lines.push(`const ${componentName}: FC = () => {`);
  lines.push("  return (");
  lines.push(jsx);
  lines.push("  );");
  lines.push("};");
  lines.push("");
  lines.push(`export default ${componentName};`);
  lines.push("");
  return lines.join(`
`);
}
function collectComponents(node, set) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectComponents(n, set));
    return;
  }
  if (node.type && !isHTMLElement(node.type)) {
    set.add(node.type);
  }
  if (node.children) {
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => {
        if (typeof child === "object") {
          collectComponents(child, set);
        }
      });
    }
  }
}
function nodeToJSX(node, indent = 0) {
  const spaces = "  ".repeat(indent);
  if (Array.isArray(node)) {
    if (node.length === 0)
      return `${spaces}{null}`;
    if (node.length === 1)
      return nodeToJSX(node[0], indent);
    return `${spaces}<>
${node.map((n) => nodeToJSX(n, indent + 1)).join(`
`)}
${spaces}</>`;
  }
  const { type, props = {}, children, text } = node;
  if (type === "text" || text) {
    const content = text || props.content || props.text || "";
    return `${spaces}${escapeJSX(String(content))}`;
  }
  const tagName = isHTMLElement(type) ? type.toLowerCase() : type;
  const propsStr = propsToString(props);
  if (!children || Array.isArray(children) && children.length === 0) {
    return `${spaces}<${tagName}${propsStr} />`;
  }
  const childrenJSX = Array.isArray(children) ? children.map((child) => {
    if (typeof child === "string") {
      return `${spaces}  ${escapeJSX(child)}`;
    }
    return nodeToJSX(child, indent + 1);
  }).join(`
`) : `${spaces}  ${escapeJSX(String(children))}`;
  return `${spaces}<${tagName}${propsStr}>
${childrenJSX}
${spaces}</${tagName}>`;
}
function propsToString(props) {
  const entries = Object.entries(props).filter(([key]) => !["children", "id", "text", "content"].includes(key));
  if (entries.length === 0)
    return "";
  const propsArr = entries.map(([key, value]) => {
    if (typeof value === "string") {
      return `${key}="${escapeAttr(value)}"`;
    }
    if (typeof value === "boolean") {
      return value ? key : `${key}={false}`;
    }
    if (typeof value === "number") {
      return `${key}={${value}}`;
    }
    if (value === null || value === undefined) {
      return null;
    }
    return `${key}={${JSON.stringify(value)}}`;
  }).filter(Boolean);
  return propsArr.length > 0 ? " " + propsArr.join(" ") : "";
}
function routeToComponentName(route) {
  if (route === "/" || route === "")
    return "IndexPage";
  const parts = route.replace(/^\/|\/$/g, "").split("/").map((part) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return "Dynamic" + capitalize(part.slice(1, -1));
    }
    return capitalize(part);
  });
  return parts.join("") + "Page";
}
function isHTMLElement(type) {
  const htmlElements = [
    "div",
    "span",
    "p",
    "a",
    "button",
    "input",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "nav",
    "header",
    "footer",
    "main",
    "section",
    "article",
    "aside",
    "img",
    "video",
    "audio",
    "canvas",
    "svg",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
    "label",
    "select",
    "option",
    "textarea",
    "strong",
    "em",
    "code",
    "pre",
    "blockquote"
  ];
  return htmlElements.includes(type.toLowerCase());
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function escapeJSX(str) {
  return str.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/durable-object.ts
class AeonPageSession {
  state;
  env;
  sessions = new Map;
  session = null;
  webhooks = [];
  constructor(state2, env) {
    this.state = state2;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      this.webhooks = await this.state.storage.get("webhooks") || [];
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }
    switch (url.pathname) {
      case "/":
      case "/session":
        return this.handleSessionRequest(request);
      case "/init":
        return this.handleInitRequest(request);
      case "/tree":
        return this.handleTreeRequest(request);
      case "/presence":
        return this.handlePresenceRequest(request);
      case "/webhook":
        return this.handleWebhookEndpoint(request);
      case "/webhooks":
        return this.handleWebhooksConfig(request);
      case "/version":
        return this.handleVersionRequest(request);
      case "/sync-queue":
        return this.handleSyncQueueRequest(request);
      case "/queue-status":
        return this.handleQueueStatusRequest(request);
      case "/resolve-conflict":
        return this.handleResolveConflictRequest(request);
      default:
        return new Response("Not found", { status: 404 });
    }
  }
  async handleWebSocket(request) {
    const pair = new WebSocketPair;
    const [client, server] = Object.values(pair);
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || crypto.randomUUID();
    const role = url.searchParams.get("role") || "user";
    server.accept();
    const presence = {
      userId,
      role,
      status: "online",
      lastActivity: new Date().toISOString()
    };
    this.sessions.set(server, presence);
    const session = await this.getSession();
    if (session) {
      server.send(JSON.stringify({
        type: "init",
        payload: {
          session,
          presence: Array.from(this.sessions.values())
        }
      }));
    }
    this.broadcast({
      type: "presence",
      payload: {
        action: "join",
        user: presence
      }
    }, server);
    server.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data);
        await this.handleMessage(server, message);
      } catch (err) {
        console.error("Failed to handle message:", err);
      }
    });
    server.addEventListener("close", () => {
      const user = this.sessions.get(server);
      this.sessions.delete(server);
      if (user) {
        this.broadcast({
          type: "presence",
          payload: {
            action: "leave",
            userId: user.userId
          }
        });
      }
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  async handleMessage(ws, message) {
    const user = this.sessions.get(ws);
    if (!user)
      return;
    user.lastActivity = new Date().toISOString();
    switch (message.type) {
      case "cursor": {
        const payload = message.payload;
        user.cursor = { x: payload.x, y: payload.y };
        this.broadcast({
          type: "cursor",
          payload: {
            userId: user.userId,
            cursor: user.cursor
          }
        }, ws);
        break;
      }
      case "edit": {
        const payload = message.payload;
        await this.applyEdit(payload, user.userId);
        this.broadcast({
          type: "edit",
          payload: {
            ...payload,
            userId: user.userId
          }
        }, ws);
        break;
      }
      case "presence": {
        const payload = message.payload;
        user.status = payload.status;
        user.editing = payload.editing;
        this.broadcast({
          type: "presence",
          payload: {
            action: "update",
            user
          }
        }, ws);
        break;
      }
      case "ping": {
        ws.send(JSON.stringify({ type: "pong", payload: { timestamp: Date.now() } }));
        break;
      }
      case "publish": {
        const session = await this.getSession();
        if (session) {
          const prNumber = await this.createTreePR(session);
          const autoMerged = this.env.GITHUB_AUTO_MERGE === "true";
          ws.send(JSON.stringify({ type: "publish", payload: { status: "created", route: session.route, prNumber, autoMerged } }));
          this.broadcast({ type: "publish", payload: { status: "created", userId: user.userId, route: session.route, prNumber, autoMerged } }, ws);
          await this.fireWebhook("session.published", session, prNumber, user.userId);
        }
        break;
      }
      case "merge": {
        const payload = message.payload;
        if (payload.prNumber) {
          const merged = await this.mergePR(payload.prNumber);
          ws.send(JSON.stringify({ type: "merge", payload: { status: merged ? "merged" : "failed", prNumber: payload.prNumber } }));
          if (merged) {
            this.broadcast({ type: "merge", payload: { status: "merged", userId: user.userId, prNumber: payload.prNumber } }, ws);
            const session = await this.getSession();
            if (session) {
              await this.fireWebhook("session.merged", session, payload.prNumber, user.userId);
            }
          }
        }
        break;
      }
    }
  }
  broadcast(message, exclude) {
    const data = JSON.stringify(message);
    for (const [ws] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
  async applyEdit(edit, userId) {
    const session = await this.getSession();
    if (!session)
      return;
    const parts = edit.path.split(".");
    let current = session.tree;
    for (let i = 0;i < parts.length - 1; i++) {
      const part = parts[i];
      if (typeof current === "object" && current !== null) {
        current = current[part];
      }
    }
    if (typeof current === "object" && current !== null) {
      const lastPart = parts[parts.length - 1];
      current[lastPart] = edit.value;
    }
    await this.saveSession(session, userId);
    if (this.env.DB) {
      this.state.waitUntil(this.propagateToD1(session));
    }
  }
  async propagateToD1(session) {
    if (!this.env.DB)
      return;
    try {
      await this.env.DB.prepare(`
          INSERT OR REPLACE INTO sessions (session_id, route, tree, data, schema_version, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(this.state.id.toString(), session.route, JSON.stringify(session.tree), JSON.stringify(session.data), session.schema.version).run();
    } catch (err) {
      console.error("Failed to propagate to D1:", err);
    }
  }
  async createTreePR(session) {
    if (!this.env.GITHUB_TOKEN || !this.env.GITHUB_REPO)
      return;
    const [owner, repo] = this.env.GITHUB_REPO.split("/");
    const branch = `tree/${session.route.replace(/\//g, "-") || "index"}-${Date.now()}`;
    const basePath = this.env.GITHUB_TREE_PATH || "pages";
    const routePath = session.route === "/" ? "/index" : session.route;
    const path = `${basePath}${routePath}/page.tsx`;
    const tsx = compileTreeToTSX(session.tree, {
      route: session.route,
      useAeon: true
    });
    const content = btoa(tsx);
    try {
      const headers = { Authorization: `token ${this.env.GITHUB_TOKEN}`, "User-Agent": "aeon-flux" };
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      const repoData = await repoRes.json();
      const baseBranch = this.env.GITHUB_BASE_BRANCH || repoData.default_branch;
      const devBranch = this.env.GITHUB_DEV_BRANCH || baseBranch;
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${devBranch}`, { headers });
      const refData = await refRes.json();
      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: refData.object.sha })
      });
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Update tree: ${session.route}`, content, branch })
      });
      const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `\uD83C\uDF33 Tree update: ${session.route}`,
          head: branch,
          base: baseBranch,
          body: `Automated PR from aeon-flux collaborative editing.

**Route:** \`${session.route}\`
**Session:** \`${this.state.id.toString()}\`
**From:** \`${devBranch}\` → \`${baseBranch}\``
        })
      });
      const prData = await prRes.json();
      if (this.env.GITHUB_AUTO_MERGE === "true" && prData.number) {
        await this.mergePR(prData.number);
      }
      return prData.number;
    } catch (err) {
      console.error("Failed to create PR:", err);
      return;
    }
  }
  async mergePR(prNumber) {
    if (!this.env.GITHUB_TOKEN || !this.env.GITHUB_REPO)
      return false;
    const [owner, repo] = this.env.GITHUB_REPO.split("/");
    const headers = { Authorization: `token ${this.env.GITHUB_TOKEN}`, "User-Agent": "aeon-flux" };
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          commit_title: `\uD83C\uDF33 Merge tree update #${prNumber}`,
          merge_method: "squash"
        })
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to merge PR:", err);
      return false;
    }
  }
  async handleWebhookEndpoint(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (this.env.GITHUB_WEBHOOK_SECRET) {
      const signature = request.headers.get("X-Hub-Signature-256");
      if (!signature) {
        return new Response("Missing signature", { status: 401 });
      }
      const body = await request.text();
      const isValid = await this.verifyGitHubSignature(body, signature);
      if (!isValid) {
        return new Response("Invalid signature", { status: 401 });
      }
      const payload2 = JSON.parse(body);
      return this.processGitHubWebhook(payload2, request.headers.get("X-GitHub-Event") || "push");
    }
    const payload = await request.json();
    return this.processGitHubWebhook(payload, request.headers.get("X-GitHub-Event") || "push");
  }
  async verifyGitHubSignature(body, signature) {
    if (!this.env.GITHUB_WEBHOOK_SECRET)
      return false;
    const encoder = new TextEncoder;
    const key = await crypto.subtle.importKey("raw", encoder.encode(this.env.GITHUB_WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computed = "sha256=" + Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return signature === computed;
  }
  async processGitHubWebhook(payload, event) {
    if (event !== "push") {
      return Response.json({ status: "ignored", event });
    }
    const treePath = this.env.GITHUB_TREE_PATH || "pages";
    const affectedFiles = [
      ...payload.commits?.flatMap((c) => c.modified || []) || [],
      ...payload.commits?.flatMap((c) => c.added || []) || []
    ];
    const relevantFiles = affectedFiles.filter((f) => f.startsWith(treePath));
    if (relevantFiles.length === 0) {
      return Response.json({ status: "ignored", reason: "no relevant files" });
    }
    const session = await this.getSession();
    if (session) {
      await this.fireWebhook("github.push", session, undefined, "github");
    }
    this.broadcast({
      type: "sync",
      payload: {
        action: "github-push",
        files: relevantFiles,
        timestamp: new Date().toISOString()
      }
    });
    return Response.json({ status: "processed", files: relevantFiles });
  }
  async handleWebhooksConfig(request) {
    switch (request.method) {
      case "GET": {
        const safeWebhooks = this.webhooks.map((w) => ({
          url: w.url,
          events: w.events,
          hasSecret: !!w.secret
        }));
        return Response.json(safeWebhooks);
      }
      case "POST": {
        const config = await request.json();
        if (!config.url || !config.events || config.events.length === 0) {
          return new Response("Invalid webhook config", { status: 400 });
        }
        this.webhooks.push(config);
        await this.state.storage.put("webhooks", this.webhooks);
        return Response.json({ status: "registered", url: config.url });
      }
      case "DELETE": {
        const { url } = await request.json();
        this.webhooks = this.webhooks.filter((w) => w.url !== url);
        await this.state.storage.put("webhooks", this.webhooks);
        return Response.json({ status: "removed", url });
      }
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
  async handleVersionRequest(request) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    const session = await this.getSession();
    if (!session) {
      return new Response("Not found", { status: 404 });
    }
    return Response.json({
      version: session.version || 0,
      updatedAt: session.updatedAt,
      updatedBy: session.updatedBy,
      schemaVersion: session.schema.version
    });
  }
  async fireWebhook(event, session, prNumber, triggeredBy) {
    const payload = {
      event,
      sessionId: this.state.id.toString(),
      route: session.route,
      version: session.version || 0,
      timestamp: new Date().toISOString(),
      prNumber,
      triggeredBy
    };
    const eventType = event.split(".")[1];
    const relevantWebhooks = this.webhooks.filter((w) => w.events.includes("all") || w.events.includes(eventType));
    const webhookPromises = relevantWebhooks.map(async (webhook) => {
      try {
        const headers = {
          "Content-Type": "application/json",
          "X-Aeon-Event": event,
          "X-Aeon-Session": this.state.id.toString()
        };
        if (webhook.secret) {
          const body = JSON.stringify(payload);
          const encoder = new TextEncoder;
          const key = await crypto.subtle.importKey("raw", encoder.encode(webhook.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
          headers["X-Aeon-Signature"] = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        }
        await fetch(webhook.url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error(`Failed to fire webhook to ${webhook.url}:`, err);
      }
    });
    if (this.env.SYNC_WEBHOOK_URL) {
      webhookPromises.push(fetch(this.env.SYNC_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aeon-Event": event,
          "X-Aeon-Session": this.state.id.toString()
        },
        body: JSON.stringify(payload)
      }).then(() => {}).catch((err) => console.error("Failed to fire sync webhook:", err)));
    }
    this.state.waitUntil(Promise.all(webhookPromises));
  }
  async handleSessionRequest(request) {
    switch (request.method) {
      case "GET": {
        const session = await this.getSession();
        if (!session) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(session);
      }
      case "PUT": {
        const session = await request.json();
        await this.saveSession(session);
        return new Response("OK", { status: 200 });
      }
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
  async handleInitRequest(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    try {
      const body = await request.json();
      const existing = await this.getSession();
      if (existing) {
        return Response.json({ status: "exists", session: existing });
      }
      const session = {
        route: body.route || "/",
        tree: body.tree || { type: "div", props: {}, children: [] },
        data: body.data || {},
        schema: body.schema || { version: "1.0.0" },
        version: 1,
        updatedAt: new Date().toISOString(),
        presence: []
      };
      await this.saveSession(session, "bootstrap", false);
      return Response.json({ status: "created", session });
    } catch (err) {
      console.error("Failed to initialize session:", err);
      return new Response(JSON.stringify({ error: "Failed to initialize session", message: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
  async handleTreeRequest(request) {
    switch (request.method) {
      case "GET": {
        const tree = await this.state.storage.get("tree");
        if (!tree) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(tree);
      }
      case "PUT": {
        const tree = await request.json();
        await this.state.storage.put("tree", tree);
        return new Response("OK", { status: 200 });
      }
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
  async handlePresenceRequest(_request) {
    return Response.json(Array.from(this.sessions.values()));
  }
  async getSession() {
    if (this.session)
      return this.session;
    const stored = await this.state.storage.get("session");
    if (stored) {
      this.session = stored;
    }
    return this.session;
  }
  async saveSession(session, triggeredBy, fireWebhooks = true) {
    session.version = (session.version || 0) + 1;
    session.updatedAt = new Date().toISOString();
    if (triggeredBy) {
      session.updatedBy = triggeredBy;
    }
    this.session = session;
    await this.state.storage.put("session", session);
    if (fireWebhooks) {
      await this.fireWebhook("session.updated", session, undefined, triggeredBy);
    }
  }
  async handleSyncQueueRequest(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    try {
      const batch = await request.json();
      const synced = [];
      const failed = [];
      const conflicts = [];
      for (const op of batch.operations) {
        try {
          const session = await this.getSession();
          if (session && (op.type === "session_update" || op.type === "tree_update")) {
            const currentVersion = session.version || 0;
            const opVersion = op.data?.version || 0;
            if (opVersion < currentVersion) {
              conflicts.push({
                operationId: op.operationId,
                remoteVersion: { version: currentVersion, updatedAt: session.updatedAt || "" },
                strategy: "remote-wins"
              });
              continue;
            }
          }
          if (op.type === "session_update") {
            const currentSession = await this.getSession();
            if (currentSession) {
              const newSession = { ...currentSession, ...op.data };
              await this.saveSession(newSession, "sync-queue", true);
            }
          } else if (op.type === "tree_update") {
            const tree = op.data;
            await this.state.storage.put("tree", tree);
          } else if (op.type === "data_update") {
            const session2 = await this.getSession();
            if (session2) {
              session2.data = { ...session2.data, ...op.data };
              await this.saveSession(session2, "sync-queue", true);
            }
          }
          synced.push(op.operationId);
        } catch (err) {
          failed.push({
            operationId: op.operationId,
            error: err instanceof Error ? err.message : "Unknown error",
            retryable: true
          });
        }
      }
      await this.state.storage.put(`sync:${batch.batchId}`, {
        batchId: batch.batchId,
        processedAt: Date.now(),
        synced: synced.length,
        failed: failed.length,
        conflicts: conflicts.length
      });
      return Response.json({
        success: failed.length === 0,
        synced,
        failed,
        conflicts,
        serverTimestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to process sync queue:", err);
      return new Response(JSON.stringify({ error: "Failed to process sync queue", message: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
  async handleQueueStatusRequest(request) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    try {
      const syncRecords = await this.state.storage.list({ prefix: "sync:" });
      const conflicts = await this.state.storage.list({ prefix: "conflict:" });
      const unresolvedConflicts = Array.from(conflicts.values()).filter((c) => !c.resolved);
      return Response.json({
        pendingOperations: 0,
        recentSyncs: Array.from(syncRecords.values()).slice(-10),
        unresolvedConflicts: unresolvedConflicts.length,
        conflicts: unresolvedConflicts
      });
    } catch (err) {
      console.error("Failed to get queue status:", err);
      return new Response(JSON.stringify({ error: "Failed to get queue status" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
  async handleResolveConflictRequest(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    try {
      const { conflictId, strategy, resolvedData, resolvedBy } = await request.json();
      const conflict = await this.state.storage.get(`conflict:${conflictId}`);
      if (!conflict) {
        return new Response(JSON.stringify({ error: "Conflict not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      let finalData;
      switch (strategy) {
        case "local-wins":
          finalData = conflict.localData;
          break;
        case "remote-wins":
          finalData = conflict.remoteData;
          break;
        case "merge":
          finalData = { ...conflict.remoteData, ...conflict.localData };
          break;
        case "manual":
          if (!resolvedData) {
            return new Response(JSON.stringify({ error: "resolvedData required for manual strategy" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }
          finalData = resolvedData;
          break;
      }
      const session = await this.getSession();
      if (session) {
        session.data = { ...session.data, ...finalData };
        await this.saveSession(session, resolvedBy || "conflict-resolution", true);
      }
      await this.state.storage.put(`conflict:${conflictId}`, {
        ...conflict,
        resolved: true,
        resolution: {
          strategy,
          resolvedData: finalData,
          resolvedAt: Date.now(),
          resolvedBy
        }
      });
      this.broadcast({
        type: "conflict-resolved",
        payload: {
          conflictId,
          strategy,
          resolvedData: finalData
        }
      });
      return Response.json({
        success: true,
        conflictId,
        strategy,
        resolvedData: finalData
      });
    } catch (err) {
      console.error("Failed to resolve conflict:", err);
      return new Response(JSON.stringify({ error: "Failed to resolve conflict", message: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}

class AeonRoutesRegistry {
  state;
  env;
  constructor(state2, env) {
    this.state = state2;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/route":
        return this.handleRouteRequest(request);
      case "/routes":
        return this.handleRoutesRequest(request);
      default:
        return new Response("Not found", { status: 404 });
    }
  }
  async handleRouteRequest(request) {
    switch (request.method) {
      case "POST": {
        const { path } = await request.json();
        const route = await this.state.storage.get(`route:${path}`);
        if (!route) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(route);
      }
      case "PUT": {
        const route = await request.json();
        await this.state.storage.put(`route:${route.pattern}`, route);
        return new Response("OK", { status: 200 });
      }
      case "DELETE": {
        const { path } = await request.json();
        await this.state.storage.delete(`route:${path}`);
        return new Response("OK", { status: 200 });
      }
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
  async handleRoutesRequest(request) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    const routes = await this.state.storage.list({ prefix: "route:" });
    return Response.json(Array.from(routes.values()));
  }
}
// src/api-routes.ts
class ApiRouter {
  routes = [];
  register(pattern, module) {
    const segments = this.parsePattern(pattern);
    this.routes.push({ pattern, segments, module });
  }
  registerAll(routes) {
    for (const [pattern, module] of Object.entries(routes)) {
      this.register(pattern, module);
    }
  }
  match(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const pathSegments = url.pathname.split("/").filter(Boolean);
    for (const route of this.routes) {
      const params = this.matchSegments(route.segments, pathSegments);
      if (params !== null) {
        const handler = this.getHandler(route.module, method);
        if (handler) {
          return { route, params, handler };
        }
      }
    }
    return null;
  }
  async handle(request, env, ctx) {
    const match = this.match(request);
    if (!match) {
      return null;
    }
    const url = new URL(request.url);
    const context = {
      request,
      env,
      params: match.params,
      url,
      ctx
    };
    try {
      return await match.handler(context);
    } catch (error) {
      console.error("API route error:", error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  parsePattern(pattern) {
    return pattern.split("/").filter(Boolean).map((segment) => {
      if (segment.startsWith("[...") && segment.endsWith("]")) {
        return {
          value: segment.slice(4, -1),
          isDynamic: true,
          isCatchAll: true
        };
      }
      if (segment.startsWith("[") && segment.endsWith("]")) {
        return {
          value: segment.slice(1, -1),
          isDynamic: true,
          isCatchAll: false
        };
      }
      return {
        value: segment,
        isDynamic: false,
        isCatchAll: false
      };
    });
  }
  matchSegments(routeSegments, pathSegments) {
    const params = {};
    let pathIndex = 0;
    for (let i = 0;i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      if (routeSegment.isCatchAll) {
        params[routeSegment.value] = pathSegments.slice(pathIndex).join("/");
        return params;
      }
      if (pathIndex >= pathSegments.length) {
        return null;
      }
      if (routeSegment.isDynamic) {
        params[routeSegment.value] = pathSegments[pathIndex];
        pathIndex++;
      } else {
        if (routeSegment.value !== pathSegments[pathIndex]) {
          return null;
        }
        pathIndex++;
      }
    }
    if (pathIndex !== pathSegments.length) {
      return null;
    }
    return params;
  }
  getHandler(module, method) {
    const handler = module[method];
    if (handler) {
      return handler;
    }
    if (module.default) {
      return module.default;
    }
    return null;
  }
  getRoutes() {
    return [...this.routes];
  }
}
function createApiRouter() {
  return new ApiRouter;
}
function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
}
function redirect(url, status = 302) {
  return new Response(null, {
    status,
    headers: { Location: url }
  });
}
function error(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function notFound(message = "Not found") {
  return error(message, 404);
}
function badRequest(message = "Bad request") {
  return error(message, 400);
}
function unauthorized(message = "Unauthorized") {
  return error(message, 401);
}
function forbidden(message = "Forbidden") {
  return error(message, 403);
}
function composeMiddleware(...middlewares) {
  return (handler) => {
    return async (context) => {
      let index = 0;
      const next = async () => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          return middleware(context, next);
        }
        return handler(context);
      };
      return next();
    };
  };
}
function cors(options) {
  const opts = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 86400,
    ...options
  };
  return async (context, next) => {
    const requestOrigin = context.request.headers.get("Origin") || "";
    let allowedOrigin = "*";
    if (typeof opts.origin === "string") {
      allowedOrigin = opts.origin;
    } else if (Array.isArray(opts.origin)) {
      if (opts.origin.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    } else if (typeof opts.origin === "function") {
      if (opts.origin(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    }
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": opts.methods.join(", "),
      "Access-Control-Allow-Headers": opts.headers.join(", ")
    };
    if (opts.credentials) {
      corsHeaders["Access-Control-Allow-Credentials"] = "true";
    }
    if (context.request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": String(opts.maxAge)
        }
      });
    }
    const response = await next();
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}
function requireAuth(validate) {
  return async (context, next) => {
    const authHeader = context.request.headers.get("Authorization");
    if (!authHeader) {
      return unauthorized("Missing Authorization header");
    }
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const isValid = await validate(token, context);
    if (!isValid) {
      return unauthorized("Invalid token");
    }
    return next();
  };
}
function rateLimit(options) {
  return async (context, next) => {
    const kv = options.kvKey ? context.env[options.kvKey] : context.env.CACHE;
    if (!kv || typeof kv.get !== "function") {
      return next();
    }
    const kvNamespace = kv;
    const clientKey = options.keyGenerator ? options.keyGenerator(context) : context.request.headers.get("CF-Connecting-IP") || "unknown";
    const rateLimitKey = `ratelimit:${clientKey}`;
    const current = await kvNamespace.get(rateLimitKey);
    const count = current ? parseInt(current, 10) : 0;
    if (count >= options.limit) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(options.window)
        }
      });
    }
    await kvNamespace.put(rateLimitKey, String(count + 1), {
      expirationTtl: options.window
    });
    return next();
  };
}
// src/worker.ts
function createAeonWorker(options = {}) {
  const apiRouter = createApiRouter();
  if (options.apiRoutes) {
    apiRouter.registerAll(options.apiRoutes);
  }
  const corsConfig = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    credentials: false,
    ...options.cors
  };
  const getCorsHeaders = (requestOrigin) => {
    let allowedOrigin = "*";
    if (typeof corsConfig.origin === "string") {
      allowedOrigin = corsConfig.origin;
    } else if (Array.isArray(corsConfig.origin) && requestOrigin) {
      if (corsConfig.origin.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    }
    const headers = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": corsConfig.methods.join(", "),
      "Access-Control-Allow-Headers": corsConfig.headers.join(", ")
    };
    if (corsConfig.credentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }
    return headers;
  };
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const corsHeaders = getCorsHeaders(request.headers.get("Origin"));
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders,
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      try {
        if (options.onRequest) {
          const customResponse = await options.onRequest(request, env, ctx);
          if (customResponse) {
            return addCorsHeaders(customResponse, corsHeaders);
          }
        }
        if (url.pathname.startsWith("/api/")) {
          const response = await apiRouter.handle(request, env, ctx);
          if (response) {
            return addCorsHeaders(response, corsHeaders);
          }
        }
        if (url.pathname.startsWith("/session/")) {
          return handleSessionRequest(request, env, corsHeaders);
        }
        if (url.pathname.startsWith("/routes")) {
          return handleRoutesRequest(request, env, corsHeaders);
        }
        if (url.pathname === "/health") {
          return new Response(JSON.stringify({ status: "ok", env: env.ENVIRONMENT }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (options.notFound) {
          const notFoundResponse = await options.notFound(request, env);
          return addCorsHeaders(notFoundResponse, corsHeaders);
        }
        return new Response("Not found", { status: 404, headers: corsHeaders });
      } catch (error2) {
        console.error("Worker error:", error2);
        return new Response(JSON.stringify({
          error: "Internal server error",
          message: error2 instanceof Error ? error2.message : "Unknown error"
        }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
  };
}
function addCorsHeaders(response, corsHeaders) {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
var worker_default = createAeonWorker();
async function handleSessionRequest(request, env, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const sessionId = pathParts[1];
  if (!sessionId) {
    return new Response("Session ID required", { status: 400, headers: corsHeaders });
  }
  const id = env.PAGE_SESSIONS.idFromName(sessionId);
  const stub = env.PAGE_SESSIONS.get(id);
  const doUrl = new URL(request.url);
  doUrl.pathname = "/" + pathParts.slice(2).join("/") || "/session";
  const doRequest = new Request(doUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  const response = await stub.fetch(doRequest);
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
async function handleRoutesRequest(request, env, corsHeaders) {
  const id = env.ROUTES_REGISTRY.idFromName("__routes__");
  const stub = env.ROUTES_REGISTRY.get(id);
  const url = new URL(request.url);
  const doUrl = new URL(request.url);
  doUrl.pathname = url.pathname.replace("/routes", "") || "/routes";
  const doRequest = new Request(doUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  const response = await stub.fetch(doRequest);
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
// src/nextjs-adapter.ts
function adaptRequest(request, params) {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const nextRequest = request;
  Object.defineProperty(nextRequest, "nextUrl", {
    value: url,
    writable: false
  });
  Object.defineProperty(nextRequest, "cookies", {
    value: {
      get(name) {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
      getAll() {
        return Object.entries(cookies).map(([name, value]) => ({ name, value }));
      }
    },
    writable: false
  });
  const cfProps = request.cf;
  if (cfProps) {
    Object.defineProperty(nextRequest, "geo", {
      value: {
        city: cfProps.city,
        country: cfProps.country,
        region: cfProps.region
      },
      writable: false
    });
    Object.defineProperty(nextRequest, "ip", {
      value: request.headers.get("CF-Connecting-IP") || undefined,
      writable: false
    });
  }
  return nextRequest;
}
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader)
    return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name) {
      cookies[name] = valueParts.join("=");
    }
  });
  return cookies;
}
function adaptHandler(handler) {
  return async (ctx) => {
    const nextRequest = adaptRequest(ctx.request, ctx.params);
    const nextParams = {};
    for (const [key, value] of Object.entries(ctx.params)) {
      if (value.includes("/")) {
        nextParams[key] = value.split("/");
      } else {
        nextParams[key] = value;
      }
    }
    try {
      const response = await handler(nextRequest, { params: nextParams });
      return response;
    } catch (error2) {
      console.error("Next.js route handler error:", error2);
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: error2 instanceof Error ? error2.message : "Unknown error"
      }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  };
}
function adaptRouteModule(module) {
  const adapted = {};
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
  for (const method of methods) {
    const handler = module[method];
    if (handler) {
      adapted[method] = adaptHandler(handler);
    }
  }
  return adapted;
}
function json2(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
}
function redirect2(url, status = 307) {
  return new Response(null, {
    status,
    headers: { Location: url.toString() }
  });
}
function rewrite(url) {
  return new Response(null, {
    status: 307,
    headers: { Location: url.toString() }
  });
}
function next() {
  return new Response(null, {
    status: 200,
    headers: { "x-middleware-next": "1" }
  });
}
var NextResponse = {
  json: json2,
  redirect: redirect2,
  rewrite,
  next
};
// src/offline/encryption.ts
var ENCRYPTION_VERSION = 1;
var NONCE_LENGTH = 12;
var TAG_LENGTH = 16;

class OfflineOperationEncryption {
  keyCache = new Map;
  async deriveKeyFromUCAN(userId, signingKeyBytes, context) {
    const cacheKey = `${userId}:${context}`;
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }
    const baseKey = await crypto.subtle.importKey("raw", signingKeyBytes.buffer, "HKDF", false, ["deriveKey"]);
    const info = new TextEncoder().encode(`aeon-offline-operation:${context}`);
    const salt = new TextEncoder().encode("aeon-pages-v1");
    const encryptionKey = await crypto.subtle.deriveKey({
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info
    }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const material = {
      key: encryptionKey,
      context,
      userId
    };
    this.keyCache.set(cacheKey, material);
    return material;
  }
  async deriveKeyFromSession(sessionId, context) {
    const cacheKey = `session:${sessionId}:${context}`;
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }
    const sessionBytes = new TextEncoder().encode(sessionId);
    const baseKey = await crypto.subtle.importKey("raw", sessionBytes, "HKDF", false, ["deriveKey"]);
    const info = new TextEncoder().encode(`aeon-session-operation:${context}`);
    const salt = new TextEncoder().encode("aeon-pages-session-v1");
    const encryptionKey = await crypto.subtle.deriveKey({
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info
    }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const material = {
      key: encryptionKey,
      context,
      userId: sessionId
    };
    this.keyCache.set(cacheKey, material);
    return material;
  }
  async encryptOperation(operation, keyMaterial) {
    const operationJson = JSON.stringify({
      type: operation.type,
      sessionId: operation.sessionId,
      data: operation.data,
      priority: operation.priority,
      createdAt: operation.createdAt,
      encryptionVersion: operation.encryptionVersion
    });
    const plaintext = new TextEncoder().encode(operationJson);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    const ciphertext = await crypto.subtle.encrypt({
      name: "AES-GCM",
      iv: nonce,
      tagLength: TAG_LENGTH * 8
    }, keyMaterial.key, plaintext);
    const ciphertextBytes = new Uint8Array(ciphertext);
    const serialized = new Uint8Array(1 + NONCE_LENGTH + ciphertextBytes.length);
    serialized[0] = ENCRYPTION_VERSION;
    serialized.set(nonce, 1);
    serialized.set(ciphertextBytes, 1 + NONCE_LENGTH);
    return serialized;
  }
  async decryptOperation(encryptedData, keyMaterial) {
    const version = encryptedData[0];
    if (version !== ENCRYPTION_VERSION) {
      throw new Error(`Unsupported encryption version: ${version}`);
    }
    const nonce = encryptedData.slice(1, 1 + NONCE_LENGTH);
    const ciphertext = encryptedData.slice(1 + NONCE_LENGTH);
    const plaintext = await crypto.subtle.decrypt({
      name: "AES-GCM",
      iv: nonce,
      tagLength: TAG_LENGTH * 8
    }, keyMaterial.key, ciphertext);
    const operationJson = new TextDecoder().decode(plaintext);
    const parsed = JSON.parse(operationJson);
    return {
      type: parsed.type,
      sessionId: parsed.sessionId,
      data: parsed.data,
      priority: parsed.priority || "normal",
      createdAt: parsed.createdAt || Date.now(),
      encryptionVersion: parsed.encryptionVersion || ENCRYPTION_VERSION
    };
  }
  async encryptSyncBatch(operations, keyMaterial) {
    const batchJson = JSON.stringify({
      operations,
      timestamp: Date.now(),
      userId: keyMaterial.userId
    });
    const plaintext = new TextEncoder().encode(batchJson);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    const ciphertext = await crypto.subtle.encrypt({
      name: "AES-GCM",
      iv: nonce,
      tagLength: TAG_LENGTH * 8
    }, keyMaterial.key, plaintext);
    return {
      version: ENCRYPTION_VERSION,
      nonce,
      ciphertext: new Uint8Array(ciphertext)
    };
  }
  async decryptSyncBatch(encrypted, keyMaterial) {
    if (encrypted.version !== ENCRYPTION_VERSION) {
      throw new Error(`Unsupported encryption version: ${encrypted.version}`);
    }
    const plaintext = await crypto.subtle.decrypt({
      name: "AES-GCM",
      iv: encrypted.nonce.buffer,
      tagLength: TAG_LENGTH * 8
    }, keyMaterial.key, encrypted.ciphertext.buffer);
    const batchJson = new TextDecoder().decode(plaintext);
    const parsed = JSON.parse(batchJson);
    return parsed.operations;
  }
  clearKeyCache() {
    this.keyCache.clear();
  }
  removeKeyFromCache(userId, context) {
    this.keyCache.delete(`${userId}:${context}`);
    this.keyCache.delete(`session:${userId}:${context}`);
  }
}
var _instance = null;
function getOperationEncryption() {
  if (!_instance) {
    _instance = new OfflineOperationEncryption;
  }
  return _instance;
}
function resetOperationEncryption() {
  if (_instance) {
    _instance.clearKeyCache();
  }
  _instance = null;
}
function generateOperationId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint8Array(8));
  const randomStr = Array.from(random).map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 9);
  return `op_${timestamp}_${randomStr}`;
}
function estimateEncryptedSize(operation) {
  const json3 = JSON.stringify(operation);
  return json3.length + 1 + NONCE_LENGTH + TAG_LENGTH + 16;
}
// src/offline/encrypted-queue.ts
var DEFAULT_CONFIG3 = {
  maxLocalCapacity: 50 * 1024 * 1024,
  compactionThreshold: 0.8,
  d1SyncInterval: 5 * 60 * 1000,
  syncedCleanupAge: 60 * 60 * 1000,
  encryption: {
    enabled: false,
    keyDerivation: "session"
  }
};

class OfflineQueueEventEmitter {
  handlers = new Map;
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set);
    }
    this.handlers.get(event).add(handler);
  }
  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
  }
  emit(event, data) {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }
}

class EncryptedOfflineQueue extends OfflineQueueEventEmitter {
  config;
  operations = new Map;
  isInitialized = false;
  cleanupTimer = null;
  currentBytes = 0;
  encryption;
  keyMaterial = null;
  storage = null;
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG3, ...config };
    this.encryption = getOperationEncryption();
  }
  async initialize(options) {
    if (this.isInitialized)
      return;
    this.storage = options?.storage ?? null;
    this.keyMaterial = options?.keyMaterial ?? null;
    if (this.storage) {
      await this.loadFromStorage();
    }
    this.startCleanupTimer();
    this.isInitialized = true;
    this.emit("initialized");
  }
  setKeyMaterial(keyMaterial) {
    this.keyMaterial = keyMaterial;
  }
  async queueOperation(operation) {
    if (!this.isInitialized) {
      throw new Error("Queue not initialized");
    }
    const operationId = generateOperationId();
    let encryptedData;
    let size;
    if (this.config.encryption.enabled && this.keyMaterial) {
      encryptedData = await this.encryption.encryptOperation(operation, this.keyMaterial);
      size = encryptedData.byteLength;
    } else {
      size = estimateEncryptedSize(operation);
    }
    if (this.currentBytes + size > this.config.maxLocalCapacity) {
      await this.compactQueue();
      if (this.currentBytes + size > this.config.maxLocalCapacity) {
        const error2 = "Queue capacity exceeded";
        this.emit("queue:error", { operationId, error: error2 });
        throw new Error(error2);
      }
    }
    const fullOperation = {
      id: operationId,
      type: operation.type,
      sessionId: operation.sessionId,
      status: "pending",
      data: operation.data,
      priority: operation.priority || "normal",
      encryptedData,
      encryptionVersion: 1,
      bytesSize: size,
      createdAt: operation.createdAt || Date.now(),
      failedCount: 0,
      retryCount: 0,
      maxRetries: 5
    };
    this.operations.set(operationId, fullOperation);
    this.currentBytes += size;
    this.emit("operation:queued", {
      operationId,
      sessionId: operation.sessionId,
      size
    });
    return operationId;
  }
  getPendingOperations(sessionId, limit = 100) {
    if (!this.isInitialized) {
      throw new Error("Queue not initialized");
    }
    const pending = [];
    Array.from(this.operations.values()).forEach((op) => {
      if (op.status !== "pending")
        return;
      if (sessionId && op.sessionId !== sessionId)
        return;
      pending.push(op);
    });
    pending.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0)
        return priorityDiff;
      return a.createdAt - b.createdAt;
    });
    return pending.slice(0, limit);
  }
  async getDecryptedOperation(operationId) {
    const op = this.operations.get(operationId);
    if (!op)
      return null;
    if (op.encryptedData && this.keyMaterial) {
      return this.encryption.decryptOperation(op.encryptedData, this.keyMaterial);
    }
    return {
      type: op.type,
      sessionId: op.sessionId,
      data: op.data,
      priority: op.priority,
      createdAt: op.createdAt
    };
  }
  markSyncing(operationId) {
    if (!this.isInitialized) {
      throw new Error("Queue not initialized");
    }
    const op = this.operations.get(operationId);
    if (op) {
      op.status = "syncing";
      this.emit("operation:syncing", { operationId });
    }
  }
  markSynced(operationId) {
    if (!this.isInitialized) {
      throw new Error("Queue not initialized");
    }
    const op = this.operations.get(operationId);
    if (op) {
      op.status = "synced";
      op.syncedAt = Date.now();
      op.failedCount = 0;
      this.emit("operation:synced", { operationId });
    }
  }
  markFailed(operationId, error2) {
    if (!this.isInitialized) {
      throw new Error("Queue not initialized");
    }
    const op = this.operations.get(operationId);
    if (!op)
      return;
    op.failedCount += 1;
    op.lastError = error2;
    op.retryCount += 1;
    if (op.failedCount >= op.maxRetries) {
      op.status = "failed";
      this.emit("operation:failed_max_retries", { operationId, error: error2 });
    } else {
      op.status = "pending";
      this.emit("operation:retry", { operationId, attempt: op.failedCount });
    }
  }
  removeOperation(operationId) {
    const op = this.operations.get(operationId);
    if (op) {
      this.currentBytes -= op.bytesSize;
      this.operations.delete(operationId);
      return true;
    }
    return false;
  }
  getStats() {
    if (!this.isInitialized) {
      return {
        total: 0,
        pending: 0,
        syncing: 0,
        synced: 0,
        failed: 0,
        totalBytes: 0,
        compactionNeeded: false
      };
    }
    let pending = 0;
    let syncing = 0;
    let synced = 0;
    let failed = 0;
    Array.from(this.operations.values()).forEach((op) => {
      switch (op.status) {
        case "pending":
          pending++;
          break;
        case "syncing":
          syncing++;
          break;
        case "synced":
          synced++;
          break;
        case "failed":
          failed++;
          break;
      }
    });
    const compactionNeeded = this.currentBytes / this.config.maxLocalCapacity > this.config.compactionThreshold;
    return {
      total: this.operations.size,
      pending,
      syncing,
      synced,
      failed,
      totalBytes: this.currentBytes,
      compactionNeeded
    };
  }
  clear() {
    this.operations.clear();
    this.currentBytes = 0;
  }
  async compactQueue() {
    const cutoff = Date.now() - this.config.syncedCleanupAge;
    const toRemove = [];
    Array.from(this.operations.entries()).forEach(([id, op]) => {
      if (op.status === "synced" && op.syncedAt && op.syncedAt < cutoff) {
        toRemove.push(id);
      }
    });
    for (const id of toRemove) {
      this.removeOperation(id);
    }
    if (toRemove.length > 0) {
      this.emit("queue:compacted");
    }
  }
  async loadFromStorage() {}
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(async () => {
      const stats = this.getStats();
      if (stats.compactionNeeded) {
        await this.compactQueue();
      }
    }, 60000);
  }
  shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.isInitialized = false;
    this.emit("shutdown");
  }
}
var _queueInstance = null;
function getOfflineQueue() {
  if (!_queueInstance) {
    _queueInstance = new EncryptedOfflineQueue;
  }
  return _queueInstance;
}
function createOfflineQueue(config) {
  return new EncryptedOfflineQueue(config);
}
function resetOfflineQueue() {
  if (_queueInstance) {
    _queueInstance.shutdown();
  }
  _queueInstance = null;
}
// src/sync/conflict-resolver.ts
class EventEmitter {
  handlers = new Map;
  on(event, handler) {
    const key = event;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set);
    }
    this.handlers.get(key).add(handler);
  }
  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
  }
  emit(event, data) {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }
}
var DEFAULT_CONFIG4 = {
  defaultStrategy: "last-modified",
  enableAutoMerge: true,
  enableLocalWins: true,
  maxConflictCacheSize: 1000,
  conflictTimeoutMs: 30000,
  mergeThreshold: 70
};

class ConflictResolver extends EventEmitter {
  conflicts = new Map;
  conflictsByEntity = new Map;
  config;
  resolutionTimings = [];
  stats = {
    totalConflicts: 0,
    resolvedConflicts: 0,
    unresolvedConflicts: 0,
    conflictsByType: {
      update_update: 0,
      delete_update: 0,
      update_delete: 0,
      concurrent: 0
    },
    resolutionsByStrategy: {
      "local-wins": 0,
      "remote-wins": 0,
      merge: 0,
      manual: 0,
      "last-modified": 0
    },
    averageResolutionTimeMs: 0
  };
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG4, ...config };
  }
  detectConflict(localOp, remoteOp) {
    if (localOp.sessionId !== remoteOp.sessionId) {
      return null;
    }
    const isLocalDelete = localOp.type.includes("delete");
    const isRemoteDelete = remoteOp.type.includes("delete");
    if (isLocalDelete && isRemoteDelete) {
      return null;
    }
    let conflictType;
    if (isLocalDelete && !isRemoteDelete) {
      conflictType = "delete_update";
    } else if (!isLocalDelete && isRemoteDelete) {
      conflictType = "update_delete";
    } else if (!isLocalDelete && !isRemoteDelete) {
      conflictType = "update_update";
    } else {
      conflictType = "concurrent";
    }
    const severity = this.calculateSeverity(conflictType, localOp, remoteOp);
    const conflictingFields = this.findConflictingFields(localOp.data, remoteOp.data);
    const conflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      operationId: localOp.id,
      sessionId: localOp.sessionId,
      localData: localOp.data,
      remoteData: remoteOp.data,
      type: conflictType,
      severity,
      detectedAt: Date.now()
    };
    this.conflicts.set(conflict.id, conflict);
    const entityKey = `${localOp.sessionId}`;
    if (!this.conflictsByEntity.has(entityKey)) {
      this.conflictsByEntity.set(entityKey, []);
    }
    this.conflictsByEntity.get(entityKey).push(conflict.id);
    this.stats.totalConflicts++;
    if (conflictType) {
      this.stats.conflictsByType[conflictType]++;
    }
    this.stats.unresolvedConflicts++;
    this.emit("conflict:detected", conflict);
    if (this.shouldAutoResolve(conflict)) {
      this.resolveConflict(conflict.id, this.config.defaultStrategy);
    }
    return conflict;
  }
  calculateSeverity(conflictType, localOp, remoteOp) {
    if (conflictType === "delete_update" || conflictType === "update_delete") {
      return "high";
    }
    if (conflictType === "update_update") {
      const similarity = this.calculateDataSimilarity(localOp.data, remoteOp.data);
      if (similarity < 30) {
        return "high";
      } else if (similarity < 60) {
        return "medium";
      }
    }
    return "low";
  }
  calculateDataSimilarity(data1, data2) {
    if (data1 === data2)
      return 100;
    if (!data1 || !data2)
      return 0;
    try {
      const str1 = JSON.stringify(data1);
      const str2 = JSON.stringify(data2);
      const commonChars = Array.from(str1).filter((char) => str2.includes(char)).length;
      return Math.round(commonChars / Math.max(str1.length, str2.length) * 100);
    } catch {
      return 0;
    }
  }
  findConflictingFields(data1, data2) {
    const conflicts = [];
    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);
    Array.from(allKeys).forEach((key) => {
      const val1 = data1[key];
      const val2 = data2[key];
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        conflicts.push(key);
      }
    });
    return conflicts;
  }
  shouldAutoResolve(conflict) {
    if (conflict.severity === "low") {
      return true;
    }
    if (conflict.type === "update_update") {
      const similarity = this.calculateDataSimilarity(conflict.localData, conflict.remoteData);
      return similarity > this.config.mergeThreshold;
    }
    return false;
  }
  resolveConflict(conflictId, strategy) {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return null;
    }
    const startTime = Date.now();
    const selectedStrategy = strategy || this.config.defaultStrategy;
    let resolvedData;
    let winner;
    switch (selectedStrategy) {
      case "local-wins":
        resolvedData = conflict.localData;
        winner = "local";
        break;
      case "remote-wins":
        resolvedData = conflict.remoteData;
        winner = "remote";
        break;
      case "last-modified":
        resolvedData = conflict.localData;
        winner = "local";
        break;
      case "merge":
        if (this.config.enableAutoMerge && conflict.type === "update_update") {
          resolvedData = this.attemptMerge(conflict.localData, conflict.remoteData);
          winner = "merged";
        } else {
          resolvedData = conflict.localData;
          winner = "local";
        }
        break;
      case "manual":
        return null;
      default:
        resolvedData = conflict.localData;
        winner = "local";
    }
    const resolution = {
      strategy: selectedStrategy,
      resolvedData,
      resolvedAt: Date.now()
    };
    conflict.resolution = resolution;
    this.stats.resolvedConflicts++;
    this.stats.unresolvedConflicts--;
    this.stats.resolutionsByStrategy[selectedStrategy]++;
    const resolutionTime = Date.now() - startTime;
    this.resolutionTimings.push(resolutionTime);
    if (this.resolutionTimings.length > 100) {
      this.resolutionTimings.shift();
    }
    this.stats.averageResolutionTimeMs = this.resolutionTimings.reduce((a, b) => a + b, 0) / this.resolutionTimings.length;
    this.emit("conflict:resolved", { conflict, strategy: selectedStrategy });
    return resolution;
  }
  attemptMerge(data1, data2) {
    const merged = { ...data1 };
    for (const key of Object.keys(data2)) {
      if (!(key in merged)) {
        merged[key] = data2[key];
      } else if (typeof merged[key] === "object" && merged[key] !== null && typeof data2[key] === "object" && data2[key] !== null) {
        merged[key] = this.attemptMerge(merged[key], data2[key]);
      }
    }
    return merged;
  }
  getConflict(conflictId) {
    return this.conflicts.get(conflictId);
  }
  getUnresolvedConflicts() {
    return Array.from(this.conflicts.values()).filter((c) => !c.resolution);
  }
  getConflictsForSession(sessionId) {
    const conflictIds = this.conflictsByEntity.get(sessionId) || [];
    return conflictIds.map((id) => this.conflicts.get(id)).filter((c) => c !== undefined);
  }
  getHighSeverityConflicts() {
    return Array.from(this.conflicts.values()).filter((c) => !c.resolution && c.severity === "high");
  }
  getStats() {
    return { ...this.stats };
  }
  configure(config) {
    this.config = { ...this.config, ...config };
    this.emit("config:updated", this.config);
  }
  getConfig() {
    return { ...this.config };
  }
  clear() {
    this.conflicts.clear();
    this.conflictsByEntity.clear();
  }
  reset() {
    this.clear();
    this.resolutionTimings = [];
    this.stats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      unresolvedConflicts: 0,
      conflictsByType: {
        update_update: 0,
        delete_update: 0,
        update_delete: 0,
        concurrent: 0
      },
      resolutionsByStrategy: {
        "local-wins": 0,
        "remote-wins": 0,
        merge: 0,
        manual: 0,
        "last-modified": 0
      },
      averageResolutionTimeMs: 0
    };
  }
}
var _instance2 = null;
function getConflictResolver() {
  if (!_instance2) {
    _instance2 = new ConflictResolver;
  }
  return _instance2;
}
function createConflictResolver(config) {
  return new ConflictResolver(config);
}
function resetConflictResolver() {
  if (_instance2) {
    _instance2.reset();
  }
  _instance2 = null;
}
// src/sync/coordinator.ts
class EventEmitter2 {
  handlers = new Map;
  on(event, handler) {
    const key = event;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set);
    }
    this.handlers.get(key).add(handler);
  }
  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
  }
  emit(event, data) {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }
}
var DEFAULT_CONFIG5 = {
  maxBatchSize: 100,
  maxBatchBytes: 5 * 1024 * 1024,
  batchTimeoutMs: 5000,
  maxRetries: 5,
  retryDelayMs: 1000,
  enableCompression: true,
  enableDeltaSync: true,
  adaptiveBatching: true
};

class SyncCoordinator extends EventEmitter2 {
  networkState = "unknown";
  bandwidthProfile = {
    speedKbps: 1024,
    latencyMs: 50,
    timestamp: Date.now(),
    reliability: 1,
    effectiveType: "unknown"
  };
  batches = new Map;
  progress = new Map;
  currentSyncBatchId = null;
  config;
  syncTimings = [];
  stats = {
    totalSyncsAttempted: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalOperationsSynced: 0,
    averageSyncDurationMs: 0,
    networkStateHistory: [],
    bandwidthHistory: []
  };
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG5, ...config };
    if (typeof navigator !== "undefined") {
      this.initNetworkDetection();
    }
  }
  initNetworkDetection() {
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      this.setNetworkState(navigator.onLine ? "online" : "offline");
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.setNetworkState("online"));
      window.addEventListener("offline", () => this.setNetworkState("offline"));
    }
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = navigator.connection;
      if (conn) {
        this.updateBandwidthFromConnection(conn);
        conn.addEventListener?.("change", () => this.updateBandwidthFromConnection(conn));
      }
    }
  }
  updateBandwidthFromConnection(conn) {
    const effectiveType = conn.effectiveType;
    let speedKbps = 1024;
    let latencyMs = 50;
    switch (effectiveType) {
      case "slow-2g":
        speedKbps = 50;
        latencyMs = 2000;
        break;
      case "2g":
        speedKbps = 150;
        latencyMs = 1000;
        break;
      case "3g":
        speedKbps = 750;
        latencyMs = 400;
        break;
      case "4g":
        speedKbps = 5000;
        latencyMs = 50;
        break;
    }
    if (conn.downlink) {
      speedKbps = conn.downlink * 1024;
    }
    if (conn.rtt) {
      latencyMs = conn.rtt;
    }
    this.updateBandwidthProfile({
      speedKbps,
      latencyMs,
      effectiveType,
      reliability: effectiveType === "4g" ? 0.95 : effectiveType === "3g" ? 0.85 : 0.7
    });
    if (effectiveType === "slow-2g" || effectiveType === "2g") {
      this.setNetworkState("poor");
    }
  }
  setNetworkState(state2) {
    const previousState = this.networkState;
    if (previousState === state2)
      return;
    this.networkState = state2;
    const event = {
      previousState,
      newState: state2,
      bandwidth: this.bandwidthProfile,
      timestamp: Date.now()
    };
    this.stats.networkStateHistory.push({ state: state2, timestamp: Date.now() });
    if (this.stats.networkStateHistory.length > 100) {
      this.stats.networkStateHistory.shift();
    }
    this.emit("network:changed", event);
    if (previousState !== "online" && state2 === "online") {
      this.emit("network:online");
    } else if (previousState === "online" && state2 !== "online") {
      this.emit("network:offline");
    }
  }
  getNetworkState() {
    return this.networkState;
  }
  updateBandwidthProfile(profile) {
    this.bandwidthProfile = {
      ...this.bandwidthProfile,
      ...profile,
      timestamp: Date.now()
    };
    this.stats.bandwidthHistory.push(this.bandwidthProfile);
    if (this.stats.bandwidthHistory.length > 50) {
      this.stats.bandwidthHistory.shift();
    }
    if (this.config.adaptiveBatching) {
      this.adaptBatchSizes();
    }
    this.emit("bandwidth:updated", this.bandwidthProfile);
  }
  getBandwidthProfile() {
    return { ...this.bandwidthProfile };
  }
  createSyncBatch(operations) {
    const batchOps = operations.slice(0, this.config.maxBatchSize);
    let totalSize = 0;
    const sizedOps = [];
    for (const op of batchOps) {
      const opSize = op.bytesSize || JSON.stringify(op).length;
      if (totalSize + opSize > this.config.maxBatchBytes) {
        break;
      }
      totalSize += opSize;
      sizedOps.push(op);
    }
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const highestPriority = sizedOps.reduce((highest, op) => priorityOrder[op.priority] < priorityOrder[highest] ? op.priority : highest, "low");
    const batch = {
      batchId: `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      operations: sizedOps,
      totalSize,
      createdAt: Date.now(),
      priority: highestPriority,
      compressed: this.config.enableCompression
    };
    this.batches.set(batch.batchId, batch);
    this.emit("batch:created", batch);
    return batch;
  }
  startSyncBatch(batchId) {
    const batch = this.batches.get(batchId);
    if (!batch)
      return;
    this.currentSyncBatchId = batchId;
    this.stats.totalSyncsAttempted++;
    this.progress.set(batchId, {
      batchId,
      totalOperations: batch.operations.length,
      syncedOperations: 0,
      bytesSynced: 0,
      totalBytes: batch.totalSize
    });
    this.emit("batch:started", { batchId });
  }
  updateProgress(batchId, syncedOperations, bytesSynced) {
    const batch = this.batches.get(batchId);
    if (!batch)
      return;
    const progress = {
      batchId,
      totalOperations: batch.operations.length,
      syncedOperations,
      bytesSynced,
      totalBytes: batch.totalSize,
      estimatedTimeRemaining: this.estimateSyncTime(batch.totalSize - bytesSynced)
    };
    this.progress.set(batchId, progress);
    this.emit("batch:progress", progress);
  }
  completeSyncBatch(batchId, result) {
    const batch = this.batches.get(batchId);
    if (!batch)
      return;
    if (result.success) {
      this.stats.successfulSyncs++;
      this.stats.totalOperationsSynced += result.synced.length;
      this.stats.lastSyncTime = Date.now();
    } else {
      this.stats.failedSyncs++;
    }
    this.currentSyncBatchId = null;
    this.emit("batch:completed", { batch, result });
  }
  failSyncBatch(batchId, error2, retryable = true) {
    const batch = this.batches.get(batchId);
    if (!batch)
      return;
    const attemptCount = batch.attemptCount || 0;
    if (retryable && attemptCount < this.config.maxRetries) {
      batch.attemptCount = attemptCount + 1;
      this.emit("batch:retry", { batch, attempt: attemptCount + 1 });
    } else {
      this.stats.failedSyncs++;
      this.emit("batch:failed", { batch, error: error2 });
    }
    this.currentSyncBatchId = null;
  }
  getBatch(batchId) {
    return this.batches.get(batchId);
  }
  getPendingBatches() {
    return Array.from(this.batches.values());
  }
  getCurrentProgress() {
    if (this.currentSyncBatchId) {
      return this.progress.get(this.currentSyncBatchId);
    }
    return;
  }
  estimateSyncTime(bytes) {
    const secondsNeeded = bytes * 8 / (this.bandwidthProfile.speedKbps * 1024);
    return Math.round((secondsNeeded + this.bandwidthProfile.latencyMs / 1000) * 1000);
  }
  adaptBatchSizes() {
    const speed = this.bandwidthProfile.speedKbps;
    if (speed < 512) {
      this.config.maxBatchSize = Math.max(10, Math.floor(DEFAULT_CONFIG5.maxBatchSize / 4));
      this.config.maxBatchBytes = Math.max(512 * 1024, Math.floor(DEFAULT_CONFIG5.maxBatchBytes / 4));
    } else if (speed < 1024) {
      this.config.maxBatchSize = Math.max(25, Math.floor(DEFAULT_CONFIG5.maxBatchSize / 2));
      this.config.maxBatchBytes = Math.max(1024 * 1024, Math.floor(DEFAULT_CONFIG5.maxBatchBytes / 2));
    } else if (speed > 5000) {
      this.config.maxBatchSize = Math.min(500, DEFAULT_CONFIG5.maxBatchSize * 2);
      this.config.maxBatchBytes = Math.min(50 * 1024 * 1024, DEFAULT_CONFIG5.maxBatchBytes * 2);
    } else {
      this.config.maxBatchSize = DEFAULT_CONFIG5.maxBatchSize;
      this.config.maxBatchBytes = DEFAULT_CONFIG5.maxBatchBytes;
    }
  }
  getStats() {
    return { ...this.stats };
  }
  configure(config) {
    this.config = { ...this.config, ...config };
    this.emit("config:updated", this.config);
  }
  getConfig() {
    return { ...this.config };
  }
  clear() {
    this.batches.clear();
    this.progress.clear();
    this.currentSyncBatchId = null;
  }
  reset() {
    this.clear();
    this.networkState = "unknown";
    this.syncTimings = [];
    this.stats = {
      totalSyncsAttempted: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalOperationsSynced: 0,
      averageSyncDurationMs: 0,
      networkStateHistory: [],
      bandwidthHistory: []
    };
  }
}
var _instance3 = null;
function getSyncCoordinator() {
  if (!_instance3) {
    _instance3 = new SyncCoordinator;
  }
  return _instance3;
}
function createSyncCoordinator(config) {
  return new SyncCoordinator(config);
}
function resetSyncCoordinator() {
  if (_instance3) {
    _instance3.reset();
  }
  _instance3 = null;
}
// src/service-worker-push.ts
function handlePush(event, config = {}) {
  if (!event.data) {
    console.warn("[AeonSW] Push event received with no data");
    return;
  }
  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "Notification",
      body: event.data.text()
    };
  }
  const notificationOptions = {
    body: data.body,
    icon: data.icon || config.defaultIcon,
    badge: data.badge || config.defaultBadge,
    tag: data.tag || "aeon-notification",
    data: data.data,
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || config.defaultVibrate || [200, 100, 200],
    actions: data.actions
  };
  event.waitUntil(self.registration.showNotification(data.title, notificationOptions));
}
function handleNotificationClick(event, config = {}) {
  event.notification.close();
  const data = event.notification.data;
  let targetUrl = "/";
  if (event.action && data?.action) {
    targetUrl = data.action;
  } else if (data?.url) {
    targetUrl = data.url;
  } else if (config.onNotificationClick) {
    const customUrl = config.onNotificationClick(data);
    if (customUrl) {
      targetUrl = customUrl;
    }
  }
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ("focus" in client && client.url.includes(self.location.origin)) {
        return client.focus().then((focusedClient) => {
          if ("navigate" in focusedClient) {
            return focusedClient.navigate(targetUrl);
          }
        });
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  }));
}
function handleNotificationClose(event) {
  console.debug("[AeonSW] Notification closed:", event.notification.tag);
}
function handleSync(event, tag) {
  if (tag === "aeon-offline-sync") {
    event.waitUntil(syncOfflineQueue());
  }
}
async function syncOfflineQueue() {
  const clientList = await clients.matchAll({ type: "window" });
  for (const client of clientList) {
    client.postMessage({
      type: "SYNC_OFFLINE_QUEUE",
      timestamp: Date.now()
    });
  }
}
function handleMessage(event, handlers) {
  const message = event.data;
  if (!message || !message.type) {
    return;
  }
  const handler = handlers[message.type];
  if (handler) {
    const result = handler(message.payload);
    if (result instanceof Promise) {
      event.waitUntil(result.then((response) => {
        if (event.source && "postMessage" in event.source) {
          event.source.postMessage({
            type: `${message.type}_RESPONSE`,
            payload: response
          });
        }
      }));
    }
  }
}
function registerPushHandlers(sw, config = {}) {
  sw.addEventListener("push", (event) => {
    handlePush(event, config);
  });
  sw.addEventListener("notificationclick", (event) => {
    handleNotificationClick(event, config);
  });
  sw.addEventListener("notificationclose", (event) => {
    handleNotificationClose(event);
  });
}
function registerSyncHandlers(sw) {
  sw.addEventListener("sync", (event) => {
    const syncEvent = event;
    handleSync(syncEvent, syncEvent.tag);
  });
}
function registerMessageHandlers(sw, handlers) {
  sw.addEventListener("message", (event) => {
    handleMessage(event, handlers);
  });
}
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
function serializePushSubscription(subscription) {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: p256dh ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh)))) : "",
      auth: auth ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth)))) : ""
    }
  };
}

// src/index.ts
var VERSION = "1.0.0";
export {
  urlBase64ToUint8Array,
  unauthorized,
  swapToContent,
  setSpeculativeRenderer,
  setSkeletonCache,
  setPredictor,
  setNavigator,
  setNavigationCache,
  setContextCookies,
  serializePushSubscription,
  resetSyncCoordinator,
  resetOperationEncryption,
  resetOfflineQueue,
  resetConflictResolver,
  requireAuth,
  registerSyncHandlers,
  registerPushHandlers,
  registerMessageHandlers,
  redirect,
  rateLimit,
  notFound,
  json,
  isSkeletonVisible,
  initSpeculativeRendering,
  initSkeleton,
  handleSync,
  handlePush,
  handleNotificationClose,
  handleNotificationClick,
  handleMessage,
  getWithSkeleton,
  getSyncCoordinator,
  getSpeculativeRenderer,
  getSkeletonCache,
  getPredictor,
  getOperationEncryption,
  getOfflineQueue,
  getNavigator,
  getNavigationCache,
  getConflictResolver,
  generateSkeletonPageStructure,
  generateSkeletonInitScript,
  generateOperationId,
  generateAsyncSwapScript,
  forbidden,
  extractUserContext,
  estimateEncryptedSize,
  esiWithContext,
  esiVision,
  esiInfer,
  esiEmotion,
  esiEmbed,
  error,
  createSyncCoordinator,
  createStorageAdapter,
  createOfflineQueue,
  createContextMiddleware,
  createConflictResolver,
  createApiRouter,
  createAeonWorker,
  createAeonServer,
  cors,
  composeMiddleware,
  badRequest,
  addSpeculationHeaders,
  adaptRouteModule,
  adaptRequest,
  adaptHandler,
  VERSION,
  SyncCoordinator,
  SpeculativeRenderer,
  SkeletonCache,
  OfflineOperationEncryption,
  NextResponse,
  NavigationPredictor,
  NavigationCache,
  HybridStorageAdapter,
  HeuristicAdapter,
  FileStorageAdapter,
  EncryptedOfflineQueue,
  EdgeWorkersESIProcessor,
  DurableObjectStorageAdapter,
  DashStorageAdapter,
  DEFAULT_ROUTER_CONFIG,
  DEFAULT_ESI_CONFIG,
  D1StorageAdapter,
  ConflictResolver,
  ApiRouter,
  AeonRoutesRegistry,
  AeonRouter,
  AeonRouteRegistry,
  AeonPageSession,
  AeonNavigationEngine
};
