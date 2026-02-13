import {
  __esm,
  __export,
  __toCommonJS,
  init_path,
  join,
  relative
} from "./chunk-pgbgfrym.js";

// src/router/esi-cyrano.ts
function esiContext(context, options = {}) {
  const { emitExhaust = true, id } = options;
  return {
    id: id || `esi-context-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "custom",
      custom: {
        type: "context-drop",
        emitExhaust
      }
    },
    content: {
      type: "json",
      value: JSON.stringify(context)
    },
    contextAware: true,
    signals: ["emotion", "preferences", "history", "time", "device"]
  };
}
function esiCyrano(config, options = {}) {
  const {
    intent,
    tone = "warm",
    trigger = "always",
    fallback,
    suggestTool,
    suggestRoute,
    autoAcceptNavigation = false,
    priority = 1,
    maxTriggersPerSession,
    cooldownSeconds,
    speak = false,
    showCaption = true,
    requiredTier
  } = config;
  const systemPrompt = buildCyranoSystemPrompt(intent, tone);
  return {
    id: `esi-cyrano-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "llm",
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 150,
      fallback,
      custom: {
        type: "cyrano-whisper",
        intent,
        tone,
        trigger,
        suggestTool,
        suggestRoute,
        autoAcceptNavigation,
        priority,
        maxTriggersPerSession,
        cooldownSeconds,
        speak,
        showCaption
      },
      ...options
    },
    content: {
      type: "template",
      value: buildCyranoPrompt(intent, trigger),
      variables: {
        intent,
        tone,
        trigger
      }
    },
    contextAware: true,
    signals: ["emotion", "preferences", "history", "time"],
    requiredTier
  };
}
function buildCyranoSystemPrompt(intent, tone) {
  const toneGuide = {
    warm: "Be warm, caring, and approachable. Use gentle language.",
    calm: "Be calm, measured, and reassuring. Use a steady pace.",
    encouraging: "Be supportive and uplifting. Celebrate small wins.",
    playful: "Be light-hearted and fun. Use appropriate humor.",
    professional: "Be clear and direct. Maintain professionalism.",
    empathetic: "Show deep understanding. Validate feelings.",
    neutral: "Be balanced and objective. Provide information."
  };
  const intentGuide = {
    greeting: "Welcome the user. Make them feel at home.",
    "proactive-check-in": "Check in gently. Ask how they are doing.",
    "supportive-presence": "Simply acknowledge. Let them know you are here.",
    "gentle-nudge": "Suggest an action softly. No pressure.",
    "tool-suggestion": "Recommend a tool that might help.",
    "navigation-hint": "Suggest exploring another area.",
    intervention: "Step in supportively. Offer help.",
    celebration: "Celebrate their progress. Be genuinely happy for them.",
    reflection: "Invite them to reflect. Ask thoughtful questions.",
    guidance: "Offer helpful guidance. Be a trusted advisor.",
    farewell: "Wish them well. Leave the door open.",
    custom: "Respond appropriately to the context."
  };
  return `You are Cyrano, an ambient AI companion. ${toneGuide[tone]} ${intentGuide[intent]}

Keep responses brief (1-2 sentences). Be natural and conversational.
Never start with "I" - use "You" or the situation as the subject.
Never say "As an AI" or similar phrases.
Respond to the emotional context provided.`;
}
function buildCyranoPrompt(intent, trigger) {
  const prompts = {
    greeting: "Generate a warm greeting based on the time of day and user context.",
    "proactive-check-in": "Check in with the user based on their emotional state and behavior.",
    "supportive-presence": "Acknowledge the user's presence and current activity.",
    "gentle-nudge": "Gently suggest the user might benefit from a particular action.",
    "tool-suggestion": "Suggest a specific tool that could help with the user's current state.",
    "navigation-hint": "Suggest the user might want to explore a different area.",
    intervention: "Offer supportive intervention based on detected stress or difficulty.",
    celebration: "Celebrate the user's progress or achievement.",
    reflection: "Invite the user to reflect on their current experience.",
    guidance: "Offer helpful guidance for the user's current situation.",
    farewell: "Say goodbye warmly, acknowledging the session.",
    custom: "Respond appropriately to the context provided."
  };
  let prompt = prompts[intent] || prompts.custom;
  if (trigger !== "always" && trigger !== "never") {
    prompt += ` The trigger condition is: ${trigger}.`;
  }
  return prompt;
}
function esiHalo(config, options = {}) {
  const {
    observe,
    window: window2 = "session",
    action = "whisper-to-cyrano",
    sensitivity = 0.5,
    crisisLevel = false,
    parameters = {}
  } = config;
  return {
    id: `esi-halo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "custom",
      custom: {
        type: "halo-insight",
        observe,
        window: window2,
        action,
        sensitivity,
        crisisLevel,
        parameters
      },
      ...options
    },
    content: {
      type: "json",
      value: JSON.stringify({
        observation: observe,
        window: window2,
        action,
        sensitivity,
        crisisLevel
      })
    },
    contextAware: true,
    signals: ["emotion", "history", "time"]
  };
}
function evaluateTrigger(trigger, context, sessionContext) {
  if (trigger === "always")
    return true;
  if (trigger === "never")
    return false;
  const [type, condition] = trigger.split(":");
  switch (type) {
    case "dwell": {
      const match = condition?.match(/>(\d+)s/);
      if (!match)
        return false;
      const threshold = parseInt(match[1], 10) * 1000;
      const dwellTime = sessionContext?.behavior?.dwellTime || 0;
      return dwellTime > threshold;
    }
    case "scroll": {
      const match = condition?.match(/>(\d+\.?\d*)/);
      if (!match)
        return false;
      const threshold = parseFloat(match[1]);
      const scrollDepth = sessionContext?.behavior?.scrollDepth || 0;
      return scrollDepth > threshold;
    }
    case "emotion": {
      const targetEmotion = condition;
      return sessionContext?.emotion?.primary === targetEmotion || context.emotionState?.primary === targetEmotion;
    }
    case "behavior": {
      if (condition === "aimless") {
        return sessionContext?.behavior?.isAimlessClicking === true;
      }
      if (condition === "hesitation") {
        return sessionContext?.behavior?.hesitationDetected === true;
      }
      return false;
    }
    case "hrv": {
      const match = condition?.match(/<(\d+)/);
      if (!match)
        return false;
      const threshold = parseInt(match[1], 10);
      const hrv = sessionContext?.biometric?.hrv || 100;
      return hrv < threshold;
    }
    case "stress": {
      const match = condition?.match(/>(\d+)/);
      if (!match)
        return false;
      const threshold = parseInt(match[1], 10);
      const stress = sessionContext?.biometric?.stressScore || 0;
      return stress > threshold;
    }
    case "session": {
      if (condition === "start") {
        return context.isNewSession;
      }
      const idleMatch = condition?.match(/idle:(\d+)m/);
      if (idleMatch) {
        return false;
      }
      return false;
    }
    case "navigation": {
      const targetRoute = condition?.replace("to:", "");
      return sessionContext?.currentRoute === targetRoute;
    }
    case "time": {
      const hour = context.localHour;
      if (condition === "morning")
        return hour >= 6 && hour < 12;
      if (condition === "afternoon")
        return hour >= 12 && hour < 18;
      if (condition === "evening")
        return hour >= 18 && hour < 22;
      if (condition === "night")
        return hour >= 22 || hour < 6;
      return false;
    }
    default:
      return false;
  }
}
function createExhaustEntry(directive, result, type) {
  return {
    type,
    timestamp: Date.now(),
    content: {
      directiveId: directive.id,
      output: result.output,
      model: result.model,
      success: result.success,
      latencyMs: result.latencyMs
    },
    visible: type === "cyrano" || type === "user",
    source: directive.params.model
  };
}
function getToolSuggestions(context, sessionContext) {
  const suggestions = [];
  for (const [, config] of Object.entries(CYRANO_TOOL_SUGGESTIONS)) {
    for (const trigger of config.triggers) {
      if (evaluateTrigger(trigger, context, sessionContext)) {
        suggestions.push({
          tool: config.tool,
          reason: config.reason,
          priority: trigger.startsWith("stress") || trigger.startsWith("hrv") ? 2 : 1
        });
        break;
      }
    }
  }
  return suggestions.sort((a, b) => b.priority - a.priority);
}
var CYRANO_TOOL_SUGGESTIONS;
var init_esi_cyrano = __esm(() => {
  CYRANO_TOOL_SUGGESTIONS = {
    breathing: {
      triggers: ["stress:>70", "hrv:<40", "emotion:anxious"],
      tool: "breathing/4-7-8",
      reason: "You seem stressed - a breathing exercise might help"
    },
    grounding: {
      triggers: ["emotion:overwhelmed", "behavior:aimless"],
      tool: "grounding/5-4-3-2-1",
      reason: "A grounding exercise can help center you"
    },
    journaling: {
      triggers: ["dwell:>120s", "emotion:reflective"],
      tool: "journaling/freeform",
      reason: "Would you like to write about what's on your mind?"
    },
    insights: {
      triggers: ["navigation:to:/insights", "dwell:>60s"],
      tool: "insights/dashboard",
      reason: "Your recent patterns are ready to explore"
    }
  };
});

// src/router/esi.ts
function getCacheKey(directive, context) {
  const contextParts = directive.contextAware ? [context.tier, context.emotionState?.primary, context.localHour].join(":") : "";
  return directive.cacheKey || `esi:${directive.params.model}:${directive.content.value}:${contextParts}`;
}
function getCached(key) {
  const entry = esiCache.get(key);
  if (!entry)
    return null;
  if (Date.now() > entry.expiresAt) {
    esiCache.delete(key);
    return null;
  }
  return { ...entry.result, cached: true };
}
function setCache(key, result, ttl) {
  if (ttl <= 0)
    return;
  esiCache.set(key, {
    result,
    expiresAt: Date.now() + ttl * 1000
  });
}
function interpolatePrompt(content, context, signals = []) {
  let prompt = content.value;
  if (content.type === "template" && content.variables) {
    for (const [key, value] of Object.entries(content.variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
    }
  }
  if (signals.length > 0) {
    const contextParts = [];
    if (signals.includes("emotion") && context.emotionState) {
      contextParts.push(`User emotion: ${context.emotionState.primary} ` + `(valence: ${context.emotionState.valence.toFixed(2)}, ` + `arousal: ${context.emotionState.arousal.toFixed(2)})`);
    }
    if (signals.includes("preferences") && Object.keys(context.preferences).length > 0) {
      contextParts.push(`User preferences: ${JSON.stringify(context.preferences)}`);
    }
    if (signals.includes("history") && context.recentPages.length > 0) {
      contextParts.push(`Recent pages: ${context.recentPages.slice(-5).join(", ")}`);
    }
    if (signals.includes("time")) {
      contextParts.push(`Local time: ${context.localHour}:00, Timezone: ${context.timezone}`);
    }
    if (signals.includes("device")) {
      contextParts.push(`Device: ${context.viewport.width}x${context.viewport.height}, ` + `Connection: ${context.connection}`);
    }
    if (contextParts.length > 0) {
      prompt = `[Context]
${contextParts.join(`
`)}

[Task]
${prompt}`;
    }
  }
  return prompt;
}
function checkTierAccess(directive, context, config) {
  const tierLimits = config.tierLimits?.[context.tier];
  if (!tierLimits) {
    return { allowed: true };
  }
  if (!tierLimits.allowedModels.includes(directive.params.model)) {
    return {
      allowed: false,
      reason: `Model '${directive.params.model}' not available for ${context.tier} tier`
    };
  }
  if (directive.params.maxTokens && directive.params.maxTokens > tierLimits.maxTokens) {
    return {
      allowed: false,
      reason: `Token limit ${directive.params.maxTokens} exceeds ${context.tier} tier max of ${tierLimits.maxTokens}`
    };
  }
  return { allowed: true };
}

class EdgeWorkersESIProcessor {
  name = "edge-workers";
  config;
  warmupPromise;
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      endpoint: config.endpoint || process.env.ESI_ENDPOINT || "",
      timeout: config.timeout ?? 5000,
      defaultCacheTtl: config.defaultCacheTtl ?? 300,
      maxConcurrent: config.maxConcurrent ?? 5,
      warmupModels: config.warmupModels,
      tierLimits: config.tierLimits
    };
  }
  async warmup() {
    if (this.warmupPromise)
      return this.warmupPromise;
    this.warmupPromise = (async () => {
      if (!this.config.warmupModels?.length)
        return;
      await Promise.all(this.config.warmupModels.map((model) => fetch(`${this.config.endpoint}/api/warmup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model })
      }).catch(() => {})));
    })();
    return this.warmupPromise;
  }
  isModelAvailable(model) {
    return [
      "llm",
      "embed",
      "vision",
      "tts",
      "stt",
      "emotion",
      "classify",
      "custom"
    ].includes(model);
  }
  async process(directive, context) {
    const startTime = Date.now();
    const cacheKey = getCacheKey(directive, context);
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }
    const access = checkTierAccess(directive, context, this.config);
    if (!access.allowed) {
      return {
        id: directive.id,
        success: false,
        error: access.reason,
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model
      };
    }
    const prompt = directive.contextAware ? interpolatePrompt(directive.content, context, directive.signals) : directive.content.value;
    try {
      const result = await this.callEdgeWorkers(directive, prompt);
      const cacheTtl = directive.params.cacheTtl ?? this.config.defaultCacheTtl;
      setCache(cacheKey, result, cacheTtl);
      return {
        ...result,
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      if (directive.params.fallback) {
        return {
          id: directive.id,
          success: true,
          output: directive.params.fallback,
          latencyMs: Date.now() - startTime,
          cached: false,
          model: directive.params.model
        };
      }
      return {
        id: directive.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model
      };
    }
  }
  async processBatch(directives, context) {
    const semaphore = new Semaphore(this.config.maxConcurrent);
    return Promise.all(directives.map(async (directive) => {
      await semaphore.acquire();
      try {
        return await this.process(directive, context);
      } finally {
        semaphore.release();
      }
    }));
  }
  async stream(directive, context, onChunk) {
    const startTime = Date.now();
    const access = checkTierAccess(directive, context, this.config);
    if (!access.allowed) {
      return {
        id: directive.id,
        success: false,
        error: access.reason,
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model
      };
    }
    const prompt = directive.contextAware ? interpolatePrompt(directive.content, context, directive.signals) : directive.content.value;
    try {
      const response = await fetch(`${this.config.endpoint}/api/llm/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: prompt,
          model: directive.params.variant,
          options: {
            temperature: directive.params.temperature,
            max_tokens: directive.params.maxTokens,
            stop: directive.params.stop,
            top_p: directive.params.topP,
            system: directive.params.system
          }
        }),
        signal: AbortSignal.timeout(directive.params.timeout ?? this.config.timeout)
      });
      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }
      const decoder = new TextDecoder;
      let fullOutput = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        const chunk = decoder.decode(value);
        fullOutput += chunk;
        onChunk(chunk);
      }
      return {
        id: directive.id,
        success: true,
        output: fullOutput,
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.variant || directive.params.model
      };
    } catch (error) {
      if (directive.params.fallback) {
        onChunk(directive.params.fallback);
        return {
          id: directive.id,
          success: true,
          output: directive.params.fallback,
          latencyMs: Date.now() - startTime,
          cached: false,
          model: directive.params.model
        };
      }
      return {
        id: directive.id,
        success: false,
        error: error instanceof Error ? error.message : "Stream failed",
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model
      };
    }
  }
  async callEdgeWorkers(directive, prompt) {
    const endpoint = this.getEndpointForModel(directive.params.model);
    const response = await fetch(`${this.config.endpoint}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.buildRequestBody(directive, prompt)),
      signal: AbortSignal.timeout(directive.params.timeout ?? this.config.timeout)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ESI inference failed: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return this.parseResponse(directive, data);
  }
  getEndpointForModel(model) {
    switch (model) {
      case "llm":
        return "/api/llm/infer";
      case "embed":
        return "/api/embed";
      case "vision":
        return "/api/vision";
      case "tts":
        return "/api/tts";
      case "stt":
        return "/api/stt";
      case "emotion":
        return "/api/emotion";
      case "classify":
        return "/api/classify";
      case "custom":
        return "/api/custom";
      default:
        return "/api/llm/infer";
    }
  }
  buildRequestBody(directive, prompt) {
    const { params, content } = directive;
    const body = {
      input: content.type === "base64" ? content.value : prompt,
      model: params.variant
    };
    if (params.model === "llm") {
      body.options = {
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        stop: params.stop,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        system: params.system
      };
    }
    if (params.custom) {
      body.custom = params.custom;
    }
    return body;
  }
  parseResponse(directive, data) {
    const base = {
      id: directive.id,
      success: true,
      latencyMs: 0,
      cached: false,
      model: String(data.model || directive.params.model)
    };
    switch (directive.params.model) {
      case "embed":
        return { ...base, embedding: data.embedding };
      case "tts":
        return { ...base, audio: data.audio };
      default:
        return {
          ...base,
          output: String(data.output || data.text || data.result || ""),
          tokens: data.tokens
        };
    }
  }
}

class Semaphore {
  permits;
  queue = [];
  constructor(permits) {
    this.permits = permits;
  }
  async acquire() {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }
  release() {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }
}
function esiInfer(prompt, options = {}) {
  return {
    id: `esi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "llm",
      ...options
    },
    content: {
      type: "text",
      value: prompt
    },
    contextAware: options.system?.includes("{context}")
  };
}
function esiEmbed(text) {
  return {
    id: `esi-embed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: { model: "embed" },
    content: { type: "text", value: text }
  };
}
function esiEmotion(text, contextAware = true) {
  return {
    id: `esi-emotion-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: { model: "emotion" },
    content: { type: "text", value: text },
    contextAware,
    signals: contextAware ? ["emotion", "history"] : undefined
  };
}
function esiVision(base64Image, prompt, options = {}) {
  return {
    id: `esi-vision-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "vision",
      system: prompt,
      ...options
    },
    content: { type: "base64", value: base64Image }
  };
}
function esiWithContext(prompt, signals = ["emotion", "preferences", "time"], options = {}) {
  return {
    id: `esi-ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "llm",
      ...options
    },
    content: { type: "text", value: prompt },
    contextAware: true,
    signals
  };
}
var esiCache;
var init_esi = __esm(() => {
  esiCache = new Map;
});

// src/router/esi-translate.ts
function generateTranslationCacheKey(text, sourceLanguage, targetLanguage, context) {
  const input = `${text}:${sourceLanguage}:${targetLanguage}:${context || ""}`;
  let hash = 0;
  for (let i = 0;i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `translate:${Math.abs(hash).toString(36)}`;
}
function getCachedTranslation(key) {
  const entry = translationCache.get(key);
  if (!entry)
    return null;
  if (Date.now() > entry.expiresAt) {
    translationCache.delete(key);
    return null;
  }
  return { ...entry.result, cached: true };
}
function setCachedTranslation(key, result, ttl) {
  if (ttl <= 0)
    return;
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey)
      translationCache.delete(firstKey);
  }
  translationCache.set(key, {
    result,
    expiresAt: Date.now() + ttl * 1000
  });
}
function clearTranslationCache() {
  translationCache.clear();
}
function esiTranslate(text, targetLanguage, options = {}) {
  const {
    sourceLanguage = "auto",
    context,
    cacheTtl = 86400,
    temperature = 0.1
  } = options;
  let prompt = text;
  if (context) {
    prompt = `[Context: ${context}]

${text}`;
  }
  const systemPrompt = sourceLanguage === "auto" ? `${TRANSLATION_SYSTEM_PROMPT}

Target language: ${targetLanguage}` : `${TRANSLATION_SYSTEM_PROMPT}

Source language: ${sourceLanguage}
Target language: ${targetLanguage}`;
  return {
    id: `esi-translate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: "llm",
      system: systemPrompt,
      temperature,
      maxTokens: Math.min(text.length * 3, 2000),
      cacheTtl
    },
    content: {
      type: "text",
      value: prompt
    },
    contextAware: false
  };
}
function readHeadTranslationConfig() {
  if (typeof document === "undefined")
    return {};
  const config = {};
  const langMeta = document.querySelector('meta[name="aeon-language"]');
  if (langMeta) {
    const content = langMeta.getAttribute("content");
    if (content)
      config.defaultLanguage = content;
  }
  const sourceLangMeta = document.querySelector('meta[name="aeon-language-source"]');
  if (sourceLangMeta) {}
  const endpointMeta = document.querySelector('meta[name="aeon-translation-endpoint"]');
  if (endpointMeta) {
    const content = endpointMeta.getAttribute("content");
    if (content)
      config.endpoint = content;
  }
  const jsonConfig = document.getElementById("aeon-translation-config");
  if (jsonConfig && jsonConfig.textContent) {
    try {
      const parsed = JSON.parse(jsonConfig.textContent);
      Object.assign(config, parsed);
    } catch {
      console.warn("[ESI Translate] Failed to parse translation config JSON");
    }
  }
  return config;
}
function normalizeLanguageCode(input) {
  const lower = input.toLowerCase().trim();
  if (lower.length === 2 && LANGUAGE_CODE_TO_NAME[lower]) {
    return lower;
  }
  if (LANGUAGE_NAME_TO_CODE[lower]) {
    return LANGUAGE_NAME_TO_CODE[lower];
  }
  return input;
}
function getLanguageName(code) {
  return LANGUAGE_CODE_TO_NAME[code] || code;
}
function getSupportedLanguages() {
  return Object.keys(LANGUAGE_CODE_TO_NAME);
}
function detectTargetLanguage(explicitLanguage, globalState) {
  if (explicitLanguage) {
    return normalizeLanguageCode(explicitLanguage);
  }
  if (globalState?.preferences?.language) {
    return normalizeLanguageCode(globalState.preferences.language);
  }
  if (typeof document !== "undefined") {
    const langMeta = document.querySelector('meta[name="aeon-language"]');
    if (langMeta) {
      const content = langMeta.getAttribute("content");
      if (content)
        return normalizeLanguageCode(content);
    }
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    const browserLang = navigator.language.split("-")[0];
    return normalizeLanguageCode(browserLang);
  }
  return "en";
}
async function translateWithAIGateway(text, targetLanguage, options = {}) {
  const {
    sourceLanguage = "auto",
    context,
    endpoint = process.env.AI_GATEWAY_URL || "https://ai-gateway.taylorbuley.workers.dev",
    timeout = 1e4
  } = options;
  const startTime = Date.now();
  const cacheKey = generateTranslationCacheKey(text, sourceLanguage, targetLanguage, context);
  const cached = getCachedTranslation(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(`${endpoint}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        sourceLanguage: sourceLanguage === "auto" ? undefined : sourceLanguage,
        targetLanguage: normalizeLanguageCode(targetLanguage),
        context
      }),
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const result = {
      original: text,
      translated: data.translatedText,
      sourceLanguage: data.detectedSourceLanguage || sourceLanguage,
      targetLanguage: normalizeLanguageCode(targetLanguage),
      confidence: data.confidence ?? 1,
      cached: false,
      latencyMs: Date.now() - startTime
    };
    setCachedTranslation(cacheKey, result, 86400);
    return result;
  } catch (error) {
    return {
      original: text,
      translated: text,
      sourceLanguage,
      targetLanguage: normalizeLanguageCode(targetLanguage),
      confidence: 0,
      cached: false,
      latencyMs: Date.now() - startTime
    };
  }
}
var translationCache, MAX_CACHE_SIZE = 1000, TRANSLATION_SYSTEM_PROMPT = `You are a professional translator. Translate the following text accurately while:
- Preserving the original meaning and tone
- Using culturally appropriate expressions in the target language
- Keeping proper nouns, technical terms, and brand names as appropriate
- Maintaining any formatting if present

Respond with ONLY the translated text, no explanations, markdown, or quotes.`, LANGUAGE_NAME_TO_CODE, LANGUAGE_CODE_TO_NAME;
var init_esi_translate = __esm(() => {
  translationCache = new Map;
  LANGUAGE_NAME_TO_CODE = {
    english: "en",
    spanish: "es",
    french: "fr",
    german: "de",
    italian: "it",
    portuguese: "pt",
    dutch: "nl",
    polish: "pl",
    russian: "ru",
    chinese: "zh",
    japanese: "ja",
    korean: "ko",
    arabic: "ar",
    hindi: "hi",
    bengali: "bn",
    vietnamese: "vi",
    thai: "th",
    turkish: "tr",
    indonesian: "id",
    malay: "ms",
    tagalog: "tl",
    filipino: "tl",
    swedish: "sv",
    danish: "da",
    norwegian: "no",
    finnish: "fi",
    czech: "cs",
    greek: "el",
    hebrew: "he",
    ukrainian: "uk",
    romanian: "ro",
    hungarian: "hu",
    catalan: "ca",
    armenian: "hy"
  };
  LANGUAGE_CODE_TO_NAME = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    nl: "Dutch",
    pl: "Polish",
    ru: "Russian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
    bn: "Bengali",
    vi: "Vietnamese",
    th: "Thai",
    tr: "Turkish",
    id: "Indonesian",
    ms: "Malay",
    tl: "Tagalog",
    sv: "Swedish",
    da: "Danish",
    no: "Norwegian",
    fi: "Finnish",
    cs: "Czech",
    el: "Greek",
    he: "Hebrew",
    uk: "Ukrainian",
    ro: "Romanian",
    hu: "Hungarian",
    ca: "Catalan",
    hy: "Armenian"
  };
});

// src/router/esi-control.ts
function generateSchemaPrompt(schema) {
  const schemaDescription = describeZodSchema(schema);
  return `

Respond with valid JSON matching this schema:
${schemaDescription}

Output ONLY the JSON, no markdown, no explanation.`;
}
function getSchemaDef(schema) {
  if (!schema || typeof schema !== "object" || !("_def" in schema)) {
    return null;
  }
  const def = schema._def;
  if (!def || typeof def !== "object") {
    return null;
  }
  return def;
}
function describeZodSchema(schema) {
  const def = getSchemaDef(schema);
  if (!def) {
    return "JSON value";
  }
  if (def.typeName === "ZodObject") {
    const rawShape = def.shape;
    const shape = typeof rawShape === "function" ? rawShape() : rawShape;
    if (!shape || typeof shape !== "object") {
      return "object";
    }
    const fields = Object.entries(shape).map(([key, fieldSchema]) => {
      const fieldDef = getSchemaDef(fieldSchema);
      return `  "${key}": ${fieldDef ? describeZodType(fieldDef) : "any"}`;
    });
    return `{
${fields.join(`,
`)}
}`;
  }
  return describeZodType(def);
}
function describeZodType(def) {
  const typeName = typeof def.typeName === "string" ? def.typeName : null;
  if (!typeName) {
    return "any";
  }
  switch (typeName) {
    case "ZodString":
      return "string";
    case "ZodNumber":
      return "number";
    case "ZodBoolean":
      return "boolean";
    case "ZodArray": {
      const innerType = def.type;
      if (!innerType || typeof innerType !== "object") {
        return "array";
      }
      const innerDef = getSchemaDef(innerType);
      return innerDef ? `array of ${describeZodType(innerDef)}` : "array";
    }
    case "ZodEnum": {
      const values = def.values;
      return `one of: ${values.map((v) => `"${v}"`).join(" | ")}`;
    }
    case "ZodLiteral":
      return JSON.stringify(def.value);
    case "ZodOptional": {
      const optionalType = def.innerType;
      if (!optionalType || typeof optionalType !== "object") {
        return "any (optional)";
      }
      const optionalDef = getSchemaDef(optionalType);
      return optionalDef ? `${describeZodType(optionalDef)} (optional)` : "any (optional)";
    }
    case "ZodNullable": {
      const nullableType = def.innerType;
      if (!nullableType || typeof nullableType !== "object") {
        return "any or null";
      }
      const nullableDef = getSchemaDef(nullableType);
      return nullableDef ? `${describeZodType(nullableDef)} or null` : "any or null";
    }
    case "ZodObject":
      return "object";
    default:
      return "any";
  }
}
function parseWithSchema(output, schema) {
  let jsonStr = output.trim();
  if (jsonStr.startsWith("```")) {
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      jsonStr = match[1].trim();
    }
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return {
          success: false,
          errors: [
            `Failed to parse JSON: ${e instanceof Error ? e.message : "Unknown error"}`
          ]
        };
      }
    } else {
      return {
        success: false,
        errors: [`No valid JSON found in output`]
      };
    }
  }
  const result = schema.safeParse(parsed);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
  };
}
function createControlProcessor(processESI) {
  return {
    async processWithSchema(prompt, schema, params, context) {
      const fullPrompt = prompt + generateSchemaPrompt(schema);
      const directive = {
        id: `esi-schema-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        params: {
          model: "llm",
          ...params
        },
        content: {
          type: "text",
          value: fullPrompt
        }
      };
      const result = await processESI(directive, context);
      if (!result.success || !result.output) {
        return {
          ...result,
          validationErrors: result.error ? [result.error] : ["No output"]
        };
      }
      const parseResult = parseWithSchema(result.output, schema);
      if (parseResult.success) {
        return {
          ...result,
          data: parseResult.data,
          rawOutput: result.output
        };
      }
      return {
        ...result,
        rawOutput: result.output,
        validationErrors: parseResult.errors
      };
    },
    async processIf(directive, context) {
      const schemaResult = await this.processWithSchema(directive.prompt, directive.schema, directive.params || {}, context);
      let conditionMet = false;
      if (schemaResult.data !== undefined) {
        try {
          conditionMet = directive.when(schemaResult.data, context);
        } catch (e) {
          conditionMet = false;
        }
      }
      return {
        id: directive.id,
        conditionMet,
        data: schemaResult.data,
        inferenceResult: schemaResult
      };
    },
    async processMatch(directive, context) {
      const schemaResult = await this.processWithSchema(directive.prompt, directive.schema, directive.params || {}, context);
      let matchedCase;
      if (schemaResult.data !== undefined) {
        for (const caseItem of directive.cases) {
          try {
            if (caseItem.match(schemaResult.data, context)) {
              matchedCase = caseItem.id;
              break;
            }
          } catch {}
        }
        if (!matchedCase && directive.defaultCase) {
          matchedCase = directive.defaultCase;
        }
      }
      return {
        id: directive.id,
        matchedCase,
        data: schemaResult.data,
        inferenceResult: schemaResult
      };
    }
  };
}
function esiIf(prompt, schema, when, options = {}) {
  return {
    id: `esi-if-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    prompt,
    schema,
    when,
    params: options
  };
}
function esiMatch(prompt, schema, cases, defaultCase, options = {}) {
  return {
    id: `esi-match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    prompt,
    schema,
    cases,
    defaultCase,
    params: options
  };
}
var init_esi_control = () => {};

// src/router/esi-control-react.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  Fragment,
  Children,
  isValidElement
} from "react";
import { jsxDEV, Fragment as Fragment2 } from "react/jsx-dev-runtime";
function usePresenceForESI() {
  const ctx = useContext(PresenceContext);
  return ctx || { users: [], localUser: null };
}
function ESIStructured({
  children,
  prompt,
  schema,
  render,
  fallback,
  loading = "...",
  retryOnFail = false,
  maxRetries = 2,
  temperature,
  maxTokens,
  cacheTtl,
  onSuccess,
  onValidationError,
  onError,
  className
}) {
  const { process: process2, enabled } = useESI();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const promptText = prompt || (typeof children === "string" ? children : String(children || ""));
  const fullPrompt = promptText + generateSchemaPrompt(schema);
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    async function runInference() {
      setIsLoading(true);
      const directive = {
        id: `esi-structured-${Date.now()}`,
        params: {
          model: "llm",
          temperature,
          maxTokens,
          cacheTtl
        },
        content: {
          type: "text",
          value: fullPrompt
        }
      };
      const inferenceResult = await process2(directive);
      if (!inferenceResult.success || !inferenceResult.output) {
        setResult({
          ...inferenceResult,
          validationErrors: [inferenceResult.error || "No output"]
        });
        onError?.(inferenceResult.error || "Inference failed");
        setIsLoading(false);
        return;
      }
      const parseResult = parseWithSchema(inferenceResult.output, schema);
      if (parseResult.success) {
        const schemaResult = {
          ...inferenceResult,
          data: parseResult.data,
          rawOutput: inferenceResult.output
        };
        setResult(schemaResult);
        onSuccess?.(parseResult.data);
      } else {
        if (retryOnFail && retryCount < maxRetries) {
          setRetryCount((c) => c + 1);
        } else {
          const schemaResult = {
            ...inferenceResult,
            rawOutput: inferenceResult.output,
            validationErrors: parseResult.errors
          };
          setResult(schemaResult);
          onValidationError?.(parseResult.errors, inferenceResult.output);
        }
      }
      setIsLoading(false);
    }
    runInference();
  }, [fullPrompt, enabled, retryCount]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (!result?.data) {
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render) {
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: render(result.data, {
        cached: result.cached,
        latencyMs: result.latencyMs
      })
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: JSON.stringify(result.data)
  }, undefined, false, undefined, this);
}
function ESIIf({
  children,
  prompt,
  schema,
  when,
  then: thenContent,
  else: elseContent,
  loading = null,
  temperature,
  cacheTtl,
  onEvaluate,
  className
}) {
  const [conditionMet, setConditionMet] = useState(null);
  const [data, setData] = useState(null);
  const handleSuccess = useCallback((result) => {
    setData(result);
    try {
      const met = when(result, {});
      setConditionMet(met);
      onEvaluate?.(result, met);
    } catch {
      setConditionMet(false);
    }
  }, [when, onEvaluate]);
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: [
      /* @__PURE__ */ jsxDEV(ESIStructured, {
        prompt,
        schema,
        temperature,
        cacheTtl,
        loading,
        onSuccess: handleSuccess,
        render: () => null,
        children
      }, undefined, false, undefined, this),
      conditionMet === true && thenContent,
      conditionMet === false && elseContent
    ]
  }, undefined, true, undefined, this);
}
function ESICase({ children }) {
  return /* @__PURE__ */ jsxDEV(Fragment2, {
    children
  }, undefined, false, undefined, this);
}
function ESIDefault({ children }) {
  return /* @__PURE__ */ jsxDEV(Fragment2, {
    children
  }, undefined, false, undefined, this);
}
function ESIMatch({
  children,
  prompt,
  schema,
  loading = null,
  temperature,
  cacheTtl,
  onMatch,
  className
}) {
  const [matchedIndex, setMatchedIndex] = useState(null);
  const [data, setData] = useState(null);
  const { cases, defaultCase, promptFromChildren } = useMemo(() => {
    const cases2 = [];
    let defaultCase2 = null;
    let promptFromChildren2 = "";
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) {
        if (typeof child === "string") {
          promptFromChildren2 += child;
        }
        return;
      }
      if (child.type === ESICase) {
        const props = child.props;
        cases2.push({
          match: props.match,
          content: props.children
        });
      } else if (child.type === ESIDefault) {
        defaultCase2 = child.props.children;
      }
    });
    return { cases: cases2, defaultCase: defaultCase2, promptFromChildren: promptFromChildren2 };
  }, [children]);
  const handleSuccess = useCallback((result) => {
    setData(result);
    for (let i = 0;i < cases.length; i++) {
      try {
        if (cases[i].match(result, {})) {
          setMatchedIndex(i);
          onMatch?.(result, i);
          return;
        }
      } catch {}
    }
    setMatchedIndex(-1);
    onMatch?.(result, -1);
  }, [cases, onMatch]);
  const finalPrompt = prompt || promptFromChildren;
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: [
      /* @__PURE__ */ jsxDEV(ESIStructured, {
        prompt: finalPrompt,
        schema,
        temperature,
        cacheTtl,
        loading,
        onSuccess: handleSuccess,
        render: () => null
      }, undefined, false, undefined, this),
      matchedIndex !== null && matchedIndex >= 0 && cases[matchedIndex]?.content,
      matchedIndex === -1 && defaultCase
    ]
  }, undefined, true, undefined, this);
}
function defaultDescribeUsers(users) {
  if (users.length === 0)
    return "No other users are viewing this content.";
  if (users.length === 1)
    return `1 user is viewing: ${describeUser(users[0])}`;
  const roles = [...new Set(users.map((u) => u.role).filter(Boolean))];
  const roleStr = roles.length > 0 ? ` with roles: ${roles.join(", ")}` : "";
  return `${users.length} users are viewing${roleStr}:
${users.map(describeUser).join(`
`)}`;
}
function describeUser(user) {
  const parts = [user.name || user.userId];
  if (user.role)
    parts.push(`(${user.role})`);
  if (user.status)
    parts.push(`[${user.status}]`);
  return `- ${parts.join(" ")}`;
}
function ESICollaborative({
  children,
  prompt,
  schema,
  render,
  fallback,
  loading = "...",
  describeUsers = defaultDescribeUsers,
  reactToPresenceChange = true,
  presenceDebounce = 2000,
  temperature,
  maxTokens,
  cacheTtl,
  onSuccess,
  className
}) {
  const presence = usePresenceForESI();
  const [debouncedUsers, setDebouncedUsers] = useState(presence.users);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!reactToPresenceChange)
      return;
    const timer = setTimeout(() => {
      setDebouncedUsers(presence.users);
    }, presenceDebounce);
    return () => clearTimeout(timer);
  }, [presence.users, reactToPresenceChange, presenceDebounce]);
  const basePrompt = prompt || (typeof children === "string" ? children : String(children || ""));
  const presenceDescription = describeUsers(debouncedUsers);
  const collaborativePrompt = `[Audience Context]
${presenceDescription}

[Task]
${basePrompt}

Consider ALL viewers when generating your response. The content should be relevant and appropriate for everyone currently viewing.`;
  const handleSuccess = useCallback((data) => {
    setResult(data);
    onSuccess?.(data, debouncedUsers);
  }, [debouncedUsers, onSuccess]);
  return /* @__PURE__ */ jsxDEV(ESIStructured, {
    prompt: collaborativePrompt,
    schema,
    temperature,
    maxTokens,
    cacheTtl,
    loading,
    fallback,
    onSuccess: handleSuccess,
    className,
    render: (data, meta) => {
      if (render) {
        return render(data, debouncedUsers);
      }
      return JSON.stringify(data);
    }
  }, undefined, false, undefined, this);
}
function ESIReflect({
  children,
  prompt,
  schema,
  until,
  maxIterations = 3,
  render,
  showProgress = false,
  fallback,
  loading = "...",
  onIteration,
  onComplete,
  className
}) {
  const { process: process2, enabled } = useESI();
  const [currentResult, setCurrentResult] = useState(null);
  const [iteration, setIteration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const basePrompt = prompt || (typeof children === "string" ? children : String(children || ""));
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    async function runReflection() {
      setIsLoading(true);
      let currentIteration = 0;
      let lastResult = null;
      let previousAttempts = [];
      while (currentIteration < maxIterations) {
        let reflectionPrompt = basePrompt;
        if (currentIteration > 0 && lastResult) {
          reflectionPrompt = `[Previous Attempt ${currentIteration}]
${JSON.stringify(lastResult)}

[Reflection]
The previous attempt did not meet the quality threshold. Please improve upon it.

[Original Task]
${basePrompt}`;
        }
        const fullPrompt = reflectionPrompt + generateSchemaPrompt(schema);
        const directive = {
          id: `esi-reflect-${Date.now()}-${currentIteration}`,
          params: { model: "llm" },
          content: { type: "text", value: fullPrompt }
        };
        const result = await process2(directive);
        if (!result.success || !result.output) {
          break;
        }
        const parseResult = parseWithSchema(result.output, schema);
        if (!parseResult.success) {
          currentIteration++;
          continue;
        }
        lastResult = parseResult.data;
        setCurrentResult(parseResult.data);
        setIteration(currentIteration + 1);
        onIteration?.(parseResult.data, currentIteration + 1);
        if (until(parseResult.data, currentIteration + 1)) {
          setIsComplete(true);
          onComplete?.(parseResult.data, currentIteration + 1);
          break;
        }
        previousAttempts.push(result.output);
        currentIteration++;
      }
      if (!isComplete && lastResult) {
        setIsComplete(true);
        onComplete?.(lastResult, currentIteration);
      }
      setIsLoading(false);
    }
    runReflection();
  }, [basePrompt, enabled, maxIterations]);
  if (isLoading) {
    if (showProgress && currentResult) {
      return /* @__PURE__ */ jsxDEV("span", {
        className,
        children: [
          render ? render(currentResult, iteration) : JSON.stringify(currentResult),
          /* @__PURE__ */ jsxDEV("span", {
            children: [
              " (refining... iteration ",
              iteration,
              ")"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (!currentResult) {
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render) {
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: render(currentResult, iteration)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: JSON.stringify(currentResult)
  }, undefined, false, undefined, this);
}
function ESIOptimize({
  children,
  prompt,
  schema,
  criteria = ["clarity", "relevance", "completeness", "conciseness"],
  targetQuality = 0.85,
  maxRounds = 3,
  onlyWhenAlone = true,
  render,
  fallback,
  loading = "...",
  onImprove,
  onOptimized,
  className
}) {
  const { process: process2, enabled } = useESI();
  const presence = usePresenceForESI();
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState({
    rounds: 0,
    quality: 0,
    improvements: [],
    wasOptimized: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const basePrompt = prompt || (typeof children === "string" ? children : String(children || ""));
  const shouldOptimize = !onlyWhenAlone || presence.users.length <= 1;
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    async function runOptimization() {
      setIsLoading(true);
      const criteriaList = criteria.join(", ");
      const firstPassPrompt = `${basePrompt}

After generating your response, assess its quality on these criteria: ${criteriaList}

${generateSchemaPrompt(schema)}

Additionally, include a self-assessment in this format:
{
  "result": <your response matching the schema above>,
  "selfAssessment": {
    "quality": <0-1 score>,
    "strengths": [<list of strengths>],
    "weaknesses": [<list of weaknesses>],
    "improvementSuggestions": [<specific improvements>]
  }
}`;
      let currentResult = null;
      let currentQuality = 0;
      let round = 0;
      let improvements = [];
      let lastWeaknesses = [];
      const firstResult = await process2({
        id: `esi-optimize-${Date.now()}-0`,
        params: { model: "llm" },
        content: { type: "text", value: firstPassPrompt }
      });
      if (!firstResult.success || !firstResult.output) {
        setIsLoading(false);
        return;
      }
      try {
        const parsed = JSON.parse(extractJson(firstResult.output));
        const validated = schema.safeParse(parsed.result);
        if (validated.success) {
          currentResult = validated.data;
          currentQuality = parsed.selfAssessment?.quality || 0.5;
          lastWeaknesses = parsed.selfAssessment?.weaknesses || [];
          round = 1;
          setResult(currentResult);
          setMeta({
            rounds: 1,
            quality: currentQuality,
            improvements: [],
            wasOptimized: false
          });
          onImprove?.(currentResult, 1, currentQuality);
        }
      } catch {
        const parseResult = parseWithSchema(firstResult.output, schema);
        if (parseResult.success) {
          currentResult = parseResult.data;
          currentQuality = 0.6;
          round = 1;
          setResult(currentResult);
        } else {
          setIsLoading(false);
          return;
        }
      }
      if (shouldOptimize && currentQuality < targetQuality) {
        while (round < maxRounds && currentQuality < targetQuality) {
          const optimizePrompt = `You previously generated this response:
${JSON.stringify(currentResult)}

Quality score: ${currentQuality.toFixed(2)}
Weaknesses identified: ${lastWeaknesses.join(", ") || "none specified"}

Please improve the response, focusing on: ${criteriaList}
Address the weaknesses and aim for a quality score above ${targetQuality}.

${generateSchemaPrompt(schema)}

Include your improved self-assessment:
{
  "result": <improved response>,
  "selfAssessment": {
    "quality": <0-1 score>,
    "strengths": [...],
    "weaknesses": [...],
    "improvementSuggestions": [...]
  },
  "improvementsMade": [<what you improved>]
}`;
          const improvedResult = await process2({
            id: `esi-optimize-${Date.now()}-${round}`,
            params: { model: "llm" },
            content: { type: "text", value: optimizePrompt }
          });
          if (!improvedResult.success || !improvedResult.output) {
            break;
          }
          try {
            const parsed = JSON.parse(extractJson(improvedResult.output));
            const validated = schema.safeParse(parsed.result);
            if (validated.success) {
              const newQuality = parsed.selfAssessment?.quality || currentQuality;
              if (newQuality > currentQuality) {
                currentResult = validated.data;
                currentQuality = newQuality;
                lastWeaknesses = parsed.selfAssessment?.weaknesses || [];
                if (parsed.improvementsMade) {
                  improvements.push(...parsed.improvementsMade);
                }
                setResult(currentResult);
                setMeta({
                  rounds: round + 1,
                  quality: currentQuality,
                  improvements,
                  wasOptimized: true
                });
                onImprove?.(currentResult, round + 1, currentQuality);
              }
            }
          } catch {}
          round++;
        }
      }
      if (currentResult) {
        setMeta((prev) => ({
          ...prev,
          rounds: round,
          quality: currentQuality,
          wasOptimized: round > 1
        }));
        onOptimized?.(currentResult, round, currentQuality);
      }
      setIsLoading(false);
    }
    runOptimization();
  }, [basePrompt, enabled, shouldOptimize, targetQuality, maxRounds]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (!result) {
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render) {
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: render(result, meta)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: JSON.stringify(result)
  }, undefined, false, undefined, this);
}
function extractJson(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match)
      cleaned = match[1].trim();
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch)
    return jsonMatch[0];
  return cleaned;
}
function ESIAuto({
  children,
  prompt,
  schema,
  render,
  collaborativeThreshold = 2,
  optimizeSettings,
  fallback,
  loading,
  className
}) {
  const presence = usePresenceForESI();
  const userCount = presence.users.length;
  const mode = userCount >= collaborativeThreshold ? "collaborative" : userCount === 1 ? "optimized" : "basic";
  if (mode === "collaborative") {
    return /* @__PURE__ */ jsxDEV(ESICollaborative, {
      prompt,
      schema,
      fallback,
      loading,
      className,
      render: render ? (data) => render(data, "collaborative") : undefined,
      children
    }, undefined, false, undefined, this);
  }
  if (mode === "optimized") {
    return /* @__PURE__ */ jsxDEV(ESIOptimize, {
      prompt,
      schema,
      criteria: optimizeSettings?.criteria,
      targetQuality: optimizeSettings?.targetQuality,
      maxRounds: optimizeSettings?.maxRounds,
      fallback,
      loading,
      className,
      render: render ? (data) => render(data, "optimized") : undefined,
      children
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV(ESIStructured, {
    prompt,
    schema,
    fallback,
    loading,
    className,
    render: render ? (data) => render(data, "basic") : undefined,
    children
  }, undefined, false, undefined, this);
}
function ESIShow({
  condition,
  children,
  fallback = null,
  loading = null,
  cacheTtl,
  onEvaluate,
  className
}) {
  const [show, setShow] = useState(null);
  const boolSchema = {
    safeParse: (val) => {
      if (typeof val === "boolean")
        return { success: true, data: val };
      if (typeof val === "string") {
        const lower = val.toLowerCase().trim();
        if (lower === "true" || lower === "yes" || lower === "1")
          return { success: true, data: true };
        if (lower === "false" || lower === "no" || lower === "0")
          return { success: true, data: false };
      }
      if (typeof val === "object" && val !== null && "result" in val) {
        return {
          success: true,
          data: Boolean(val.result)
        };
      }
      return { success: false, error: "Not a boolean" };
    }
  };
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: [
      /* @__PURE__ */ jsxDEV(ESIStructured, {
        prompt: `Evaluate this condition and respond with only "true" or "false": ${condition}`,
        schema: boolSchema,
        cacheTtl,
        loading,
        onSuccess: (result) => {
          setShow(result);
          onEvaluate?.(result);
        },
        render: () => null
      }, undefined, false, undefined, this),
      show === true && children,
      show === false && fallback
    ]
  }, undefined, true, undefined, this);
}
function ESIHide({
  condition,
  children,
  loading = null,
  cacheTtl,
  className
}) {
  return /* @__PURE__ */ jsxDEV(ESIShow, {
    condition,
    fallback: children,
    loading,
    cacheTtl,
    className,
    children: null
  }, undefined, false, undefined, this);
}
function ESIWhen({
  condition,
  children,
  loading,
  cacheTtl,
  className
}) {
  return /* @__PURE__ */ jsxDEV(ESIShow, {
    condition,
    loading,
    cacheTtl,
    className,
    children
  }, undefined, false, undefined, this);
}
function ESIUnless({
  condition,
  children,
  loading,
  cacheTtl,
  className
}) {
  return /* @__PURE__ */ jsxDEV(ESIHide, {
    condition,
    loading,
    cacheTtl,
    className,
    children
  }, undefined, false, undefined, this);
}
function ESITierGate({
  minTier,
  children,
  fallback = null,
  className
}) {
  const [hasAccess, setHasAccess] = useState(null);
  useEffect(() => {
    const state = typeof window !== "undefined" && window.__AEON_ESI_STATE__ || {};
    if (state.isAdmin === true || state.userTier === "admin") {
      setHasAccess(true);
      return;
    }
    const userTier = state.userTier || "free";
    const userLevel = TIER_LEVELS[userTier] ?? 0;
    const requiredLevel = TIER_LEVELS[minTier] ?? 0;
    setHasAccess(userLevel >= requiredLevel);
  }, [minTier]);
  if (hasAccess === null)
    return /* @__PURE__ */ jsxDEV("span", {
      className
    }, undefined, false, undefined, this);
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: hasAccess ? children : fallback
  }, undefined, false, undefined, this);
}
function ESIEmotionGate({
  allow,
  block,
  valenceRange,
  arousalRange,
  children,
  fallback = null,
  className
}) {
  const [hasAccess, setHasAccess] = useState(null);
  useEffect(() => {
    const state = typeof window !== "undefined" && window.__AEON_ESI_STATE__ || {};
    const emotion = state.emotionState || {};
    let access = true;
    if (allow && allow.length > 0 && emotion.primary) {
      access = access && allow.includes(emotion.primary);
    }
    if (block && block.length > 0 && emotion.primary) {
      access = access && !block.includes(emotion.primary);
    }
    if (valenceRange && emotion.valence !== undefined) {
      access = access && emotion.valence >= valenceRange[0] && emotion.valence <= valenceRange[1];
    }
    if (arousalRange && emotion.arousal !== undefined) {
      access = access && emotion.arousal >= arousalRange[0] && emotion.arousal <= arousalRange[1];
    }
    setHasAccess(access);
  }, [allow, block, valenceRange, arousalRange]);
  if (hasAccess === null)
    return /* @__PURE__ */ jsxDEV("span", {
      className
    }, undefined, false, undefined, this);
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: hasAccess ? children : fallback
  }, undefined, false, undefined, this);
}
function ESITimeGate({
  after,
  before,
  days,
  children,
  fallback = null,
  className
}) {
  const [inRange, setInRange] = useState(null);
  useEffect(() => {
    const now = new Date;
    const hour = now.getHours();
    const day = now.getDay();
    let access = true;
    if (after !== undefined)
      access = access && hour >= after;
    if (before !== undefined)
      access = access && hour < before;
    if (days && days.length > 0)
      access = access && days.includes(day);
    setInRange(access);
  }, [after, before, days]);
  if (inRange === null)
    return /* @__PURE__ */ jsxDEV("span", {
      className
    }, undefined, false, undefined, this);
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: inRange ? children : fallback
  }, undefined, false, undefined, this);
}
function ESIABTest({
  name,
  variants,
  selectionPrompt,
  random = false,
  onSelect,
  loading = null,
  className
}) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const variantKeys = Object.keys(variants);
  useEffect(() => {
    if (random || !selectionPrompt) {
      const selected = variantKeys[Math.floor(Math.random() * variantKeys.length)];
      setSelectedVariant(selected);
      onSelect?.(selected);
    }
  }, [random, selectionPrompt]);
  if (random || !selectionPrompt) {
    if (!selectedVariant)
      return /* @__PURE__ */ jsxDEV("span", {
        className,
        children: loading
      }, undefined, false, undefined, this);
    return /* @__PURE__ */ jsxDEV("span", {
      className,
      children: variants[selectedVariant]
    }, undefined, false, undefined, this);
  }
  const variantSchema = {
    safeParse: (val) => {
      const str = String(val).trim();
      if (variantKeys.includes(str))
        return { success: true, data: str };
      for (const key of variantKeys) {
        if (str.toLowerCase().includes(key.toLowerCase())) {
          return { success: true, data: key };
        }
      }
      return { success: false, error: "Invalid variant" };
    }
  };
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children: [
      /* @__PURE__ */ jsxDEV(ESIStructured, {
        prompt: `${selectionPrompt}

Available variants: ${variantKeys.join(", ")}

Respond with only the variant name.`,
        schema: variantSchema,
        loading,
        onSuccess: (selected) => {
          setSelectedVariant(selected);
          onSelect?.(selected);
        },
        render: () => null
      }, undefined, false, undefined, this),
      selectedVariant && variants[selectedVariant]
    ]
  }, undefined, true, undefined, this);
}
function ESIForEach({
  prompt,
  itemSchema,
  render,
  maxItems = 10,
  empty = null,
  loading = "...",
  as: Wrapper = "div",
  className
}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const arraySchema = {
    safeParse: (val) => {
      try {
        let arr;
        if (Array.isArray(val)) {
          arr = val;
        } else if (typeof val === "string") {
          arr = JSON.parse(val);
        } else if (typeof val === "object" && val !== null && "items" in val) {
          arr = val.items;
        } else {
          return { success: false, error: "Not an array" };
        }
        const validItems = [];
        for (const item of arr.slice(0, maxItems)) {
          const result = itemSchema.safeParse(item);
          if (result.success) {
            validItems.push(result.data);
          }
        }
        return { success: true, data: validItems };
      } catch {
        return { success: false, error: "Parse error" };
      }
    }
  };
  return /* @__PURE__ */ jsxDEV(ESIStructured, {
    prompt: `${prompt}

Respond with a JSON array of items (max ${maxItems}).`,
    schema: arraySchema,
    loading,
    fallback: empty,
    className,
    onSuccess: (result) => {
      setItems(result);
      setIsLoading(false);
    },
    render: (data) => {
      if (data.length === 0)
        return /* @__PURE__ */ jsxDEV(Fragment2, {
          children: empty
        }, undefined, false, undefined, this);
      return /* @__PURE__ */ jsxDEV(Wrapper, {
        className,
        children: data.map((item, i) => /* @__PURE__ */ jsxDEV(Fragment, {
          children: render(item, i)
        }, `esi-item:${i}`, false, undefined, this))
      }, undefined, false, undefined, this);
    }
  }, undefined, false, undefined, this);
}
function ESIFirst({
  context,
  children,
  fallback = null,
  loading = null,
  className
}) {
  return /* @__PURE__ */ jsxDEV("span", {
    className,
    children
  }, undefined, false, undefined, this);
}
function ESIClamp({
  prompt,
  min,
  max,
  render,
  defaultValue,
  loading = "...",
  className
}) {
  const numSchema = {
    safeParse: (val) => {
      let num;
      if (typeof val === "number") {
        num = val;
      } else if (typeof val === "string") {
        num = parseFloat(val);
      } else if (typeof val === "object" && val !== null && "value" in val) {
        num = Number(val.value);
      } else {
        return { success: false, error: "Not a number" };
      }
      if (isNaN(num))
        return { success: false, error: "NaN" };
      return { success: true, data: Math.max(min, Math.min(max, num)) };
    }
  };
  return /* @__PURE__ */ jsxDEV(ESIStructured, {
    prompt: `${prompt}

Respond with a number between ${min} and ${max}.`,
    schema: numSchema,
    loading,
    fallback: defaultValue !== undefined ? render(defaultValue) : null,
    className,
    render: (value) => render(value)
  }, undefined, false, undefined, this);
}
function ESISelect({
  prompt,
  options,
  render,
  defaultOption,
  loading = "...",
  onSelect,
  className
}) {
  const optionSchema = {
    safeParse: (val) => {
      const str = String(val).trim().toLowerCase();
      const match = options.find((o) => o.toLowerCase() === str);
      if (match)
        return { success: true, data: match };
      const partial = options.find((o) => str.includes(o.toLowerCase()) || o.toLowerCase().includes(str));
      if (partial)
        return { success: true, data: partial };
      return { success: false, error: "No match" };
    }
  };
  return /* @__PURE__ */ jsxDEV(ESIStructured, {
    prompt: `${prompt}

Options: ${options.join(", ")}

Respond with only one of the options.`,
    schema: optionSchema,
    loading,
    fallback: defaultOption ? render(defaultOption) : null,
    className,
    onSuccess: onSelect,
    render: (selected) => render(selected)
  }, undefined, false, undefined, this);
}
function ESIScore({
  prompt,
  render,
  thresholds = DEFAULT_THRESHOLDS,
  loading = "...",
  className
}) {
  return /* @__PURE__ */ jsxDEV(ESIClamp, {
    prompt,
    min: 0,
    max: 1,
    loading,
    className,
    render: (score) => {
      const label = thresholds.find((t) => score <= t.value)?.label || "unknown";
      return render(score, label);
    }
  }, undefined, false, undefined, this);
}
var PresenceContext, TIER_LEVELS, DEFAULT_THRESHOLDS, ESIControl;
var init_esi_control_react = __esm(() => {
  init_esi_control();
  init_esi_react();
  PresenceContext = createContext(null);
  TIER_LEVELS = { free: 0, starter: 1, pro: 2, enterprise: 3, admin: 999 };
  DEFAULT_THRESHOLDS = [
    { value: 0.2, label: "very low" },
    { value: 0.4, label: "low" },
    { value: 0.6, label: "moderate" },
    { value: 0.8, label: "high" },
    { value: 1, label: "very high" }
  ];
  ESIControl = {
    Structured: ESIStructured,
    If: ESIIf,
    Show: ESIShow,
    Hide: ESIHide,
    When: ESIWhen,
    Unless: ESIUnless,
    Match: ESIMatch,
    Case: ESICase,
    Default: ESIDefault,
    First: ESIFirst,
    TierGate: ESITierGate,
    EmotionGate: ESIEmotionGate,
    TimeGate: ESITimeGate,
    ForEach: ESIForEach,
    Select: ESISelect,
    ABTest: ESIABTest,
    Clamp: ESIClamp,
    Score: ESIScore,
    Collaborative: ESICollaborative,
    Reflect: ESIReflect,
    Optimize: ESIOptimize,
    Auto: ESIAuto
  };
});

// src/router/esi-format-react.tsx
import {
  Children as Children2,
  cloneElement,
  isValidElement as isValidElement2,
  useState as useState2,
  useEffect as useEffect2,
  useMemo as useMemo2,
  useCallback as useCallback2
} from "react";
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function wrapChildren(children, onOutput) {
  return Children2.map(children, (child) => {
    if (!isValidElement2(child)) {
      if (typeof child === "string") {
        onOutput(child);
      }
      return null;
    }
    const childProps = child.props;
    const originalRender = childProps.render;
    const originalOnComplete = childProps.onComplete;
    const newProps = {
      ...childProps,
      render: (result) => {
        const text = typeof result === "string" ? result : typeof result === "object" && result !== null && ("output" in result) ? String(result.output) : JSON.stringify(result);
        onOutput(text);
        return originalRender ? originalRender(result) : null;
      },
      onComplete: (result) => {
        if (result && typeof result === "object" && "output" in result) {
          onOutput(String(result.output));
        }
        originalOnComplete?.(result);
      }
    };
    return cloneElement(child, newProps);
  });
}
function parseMarkdown(text, options = {}) {
  const { gfm = true, allowHtml = false, linkTarget = "_blank" } = options;
  let html = text;
  if (!allowHtml) {
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : "";
    return `<pre><code${langClass}>${code.trim()}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  if (gfm) {
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  }
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="${linkTarget}" rel="noopener noreferrer">$1</a>`);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^(---|\*\*\*|___)$/gm, "<hr />");
  html = html.replace(/^[\*\-\+]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
  if (gfm) {
    html = html.replace(/<li>\[ \]\s*(.+)<\/li>/g, '<li><input type="checkbox" disabled /> $1</li>');
    html = html.replace(/<li>\[x\]\s*(.+)<\/li>/gi, '<li><input type="checkbox" disabled checked /> $1</li>');
  }
  if (gfm) {
    const tableRegex = /^\|(.+)\|$/gm;
    const rows = html.match(tableRegex);
    if (rows && rows.length >= 2) {
      const separatorIdx = rows.findIndex((row) => /^\|[\s\-:|]+\|$/.test(row));
      if (separatorIdx === 1) {
        const headerRow = rows[0];
        const dataRows = rows.slice(2);
        const headerCells = headerRow.split("|").filter((c) => c.trim());
        const headerHtml = `<thead><tr>${headerCells.map((c) => `<th>${c.trim()}</th>`).join("")}</tr></thead>`;
        const bodyHtml = dataRows.map((row) => {
          const cells = row.split("|").filter((c) => c.trim());
          return `<tr>${cells.map((c) => `<td>${c.trim()}</td>`).join("")}</tr>`;
        }).join("");
        const tableHtml = `<table>${headerHtml}<tbody>${bodyHtml}</tbody></table>`;
        const tableMarkdown = rows.slice(0, separatorIdx + 1 + dataRows.length).join(`
`);
        html = html.replace(tableMarkdown, tableHtml);
      }
    }
  }
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, "<p>$1</p>");
  html = html.replace(/<p>(<(?:h[1-6]|ul|ol|li|blockquote|pre|table|hr)[^>]*>)/g, "$1");
  html = html.replace(/(<\/(?:h[1-6]|ul|ol|li|blockquote|pre|table|hr)>)<\/p>/g, "$1");
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br />");
  return html;
}
function parseLatex(text, options = {}) {
  const { mode = "auto", displayMode = false } = options;
  const isBlock = mode === "block" || mode === "auto" && (text.includes("\\[") || text.includes("$$"));
  let html = text;
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, '<div class="math-block">$1</div>');
  html = html.replace(/\\\[([\s\S]+?)\\\]/g, '<div class="math-block">$1</div>');
  html = html.replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>');
  html = html.replace(/\\\((.+?)\\\)/g, '<span class="math-inline">$1</span>');
  const symbols = {
    "\\alpha": "α",
    "\\beta": "β",
    "\\gamma": "γ",
    "\\delta": "δ",
    "\\epsilon": "ε",
    "\\zeta": "ζ",
    "\\eta": "η",
    "\\theta": "θ",
    "\\iota": "ι",
    "\\kappa": "κ",
    "\\lambda": "λ",
    "\\mu": "μ",
    "\\nu": "ν",
    "\\xi": "ξ",
    "\\pi": "π",
    "\\rho": "ρ",
    "\\sigma": "σ",
    "\\tau": "τ",
    "\\upsilon": "υ",
    "\\phi": "φ",
    "\\chi": "χ",
    "\\psi": "ψ",
    "\\omega": "ω",
    "\\Gamma": "Γ",
    "\\Delta": "Δ",
    "\\Theta": "Θ",
    "\\Lambda": "Λ",
    "\\Xi": "Ξ",
    "\\Pi": "Π",
    "\\Sigma": "Σ",
    "\\Phi": "Φ",
    "\\Psi": "Ψ",
    "\\Omega": "Ω",
    "\\infty": "∞",
    "\\pm": "±",
    "\\mp": "∓",
    "\\times": "×",
    "\\div": "÷",
    "\\cdot": "·",
    "\\leq": "≤",
    "\\geq": "≥",
    "\\neq": "≠",
    "\\approx": "≈",
    "\\equiv": "≡",
    "\\subset": "⊂",
    "\\supset": "⊃",
    "\\in": "∈",
    "\\notin": "∉",
    "\\cup": "∪",
    "\\cap": "∩",
    "\\emptyset": "∅",
    "\\forall": "∀",
    "\\exists": "∃",
    "\\nabla": "∇",
    "\\partial": "∂",
    "\\sum": "∑",
    "\\prod": "∏",
    "\\int": "∫",
    "\\oint": "∮",
    "\\sqrt": "√",
    "\\therefore": "∴",
    "\\because": "∵",
    "\\angle": "∠",
    "\\perp": "⊥",
    "\\parallel": "∥",
    "\\rightarrow": "→",
    "\\leftarrow": "←",
    "\\Rightarrow": "⇒",
    "\\Leftarrow": "⇐",
    "\\leftrightarrow": "↔",
    "\\Leftrightarrow": "⇔"
  };
  for (const [latex, symbol] of Object.entries(symbols)) {
    html = html.replace(new RegExp(latex.replace(/\\/g, "\\\\"), "g"), symbol);
  }
  html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>');
  html = html.replace(/\^{([^}]+)}/g, "<sup>$1</sup>");
  html = html.replace(/\^(\w)/g, "<sup>$1</sup>");
  html = html.replace(/_{([^}]+)}/g, "<sub>$1</sub>");
  html = html.replace(/_(\w)/g, "<sub>$1</sub>");
  html = html.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");
  html = html.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  html = html.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");
  html = html.replace(/\\text\{([^}]+)\}/g, "$1");
  html = html.replace(/\\[a-zA-Z]+/g, "");
  if (displayMode || isBlock) {
    html = `<div class="math-display">${html}</div>`;
  }
  return html;
}
function formatJson(text, options = {}) {
  const { indent = 2, syntaxHighlight = true } = options;
  try {
    const parsed = JSON.parse(text);
    const formatted = JSON.stringify(parsed, null, indent);
    if (!syntaxHighlight) {
      return `<pre><code>${escapeHtml(formatted)}</code></pre>`;
    }
    let highlighted = escapeHtml(formatted);
    highlighted = highlighted.replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="json-key">$1</span>:');
    highlighted = highlighted.replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>');
    highlighted = highlighted.replace(/:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g, ': <span class="json-number">$1</span>');
    highlighted = highlighted.replace(/:\s*(true|false|null)/g, ': <span class="json-$1">$1</span>');
    return `<pre class="json-highlight"><code>${highlighted}</code></pre>`;
  } catch {
    return `<pre><code>${escapeHtml(text)}</code></pre>`;
  }
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function formatCode(text, options = {}) {
  const {
    language,
    lineNumbers = false,
    startLine = 1,
    highlightLines = []
  } = options;
  const lines = text.split(`
`);
  const langClass = language ? ` language-${language}` : "";
  if (!lineNumbers) {
    return `<pre><code class="code-block${langClass}">${escapeHtml(text)}</code></pre>`;
  }
  const lineHtml = lines.map((line, i) => {
    const lineNum = startLine + i;
    const isHighlighted = highlightLines.includes(lineNum);
    const highlightClass = isHighlighted ? " highlighted" : "";
    return `<span class="line${highlightClass}"><span class="line-number">${lineNum}</span><span class="line-content">${escapeHtml(line)}</span></span>`;
  }).join(`
`);
  return `<pre class="code-with-lines${langClass}"><code>${lineHtml}</code></pre>`;
}
function generateStructuredHtml(text, topics, entities, format, schemaType, emotion) {
  const keywords = topics.flatMap((t) => t.keywords || [t.label]).join(", ");
  switch (format) {
    case "jsonld": {
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": schemaType,
        name: topics[0]?.label || "Content",
        keywords,
        about: topics.map((t) => ({
          "@type": t.schemaType || "Thing",
          name: t.label
        })),
        mentions: entities.map((e) => ({
          "@type": e.schemaType || entityTypeToSchema(e.type),
          name: e.text
        }))
      };
      if (emotion) {
        jsonLd["emotionalTone"] = {
          "@type": "PropertyValue",
          name: "emotionalTone",
          value: emotion.primary,
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "valence",
              value: emotion.valence
            },
            {
              "@type": "PropertyValue",
              name: "arousal",
              value: emotion.arousal
            },
            {
              "@type": "PropertyValue",
              name: "confidence",
              value: emotion.confidence
            }
          ]
        };
      }
      return `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
<div class="esi-semantic-content">${escapeHtml(text)}</div>`;
    }
    case "rdfa": {
      const topicSpans = topics.map((t) => `<span property="about" typeof="${t.schemaType || "Thing"}"><span property="name">${escapeHtml(t.label)}</span></span>`).join(" ");
      const emotionSpan = emotion ? `<span property="emotionalTone" content="${escapeHtml(emotion.primary)}" data-valence="${emotion.valence}" data-arousal="${emotion.arousal}"></span>` : "";
      return `<div vocab="https://schema.org/" typeof="${schemaType}">
  <meta property="keywords" content="${escapeHtml(keywords)}" />
  ${emotionSpan}
  <div property="articleBody">${escapeHtml(text)}</div>
  <div class="esi-semantic-about">${topicSpans}</div>
</div>`;
    }
    case "microdata":
    default: {
      const topicSpans = topics.map((t) => `<span itemprop="about" itemscope itemtype="https://schema.org/${t.schemaType || "Thing"}">
          <span itemprop="name">${escapeHtml(t.label)}</span>
        </span>`).join(`
`);
      const entitySpans = entities.map((e) => `<span itemprop="mentions" itemscope itemtype="https://schema.org/${entityTypeToSchema(e.type)}">
          <span itemprop="name">${escapeHtml(e.text)}</span>
        </span>`).join(`
`);
      const emotionMeta = emotion ? `<meta itemprop="emotionalTone" content="${escapeHtml(emotion.primary)}" data-valence="${emotion.valence}" data-arousal="${emotion.arousal}" data-confidence="${emotion.confidence}" />` : "";
      return `<div itemscope itemtype="https://schema.org/${schemaType}">
  <meta itemprop="keywords" content="${escapeHtml(keywords)}" />
  ${emotionMeta}
  <div itemprop="articleBody">${escapeHtml(text)}</div>
  <div class="esi-semantic-about">${topicSpans}</div>
  <div class="esi-semantic-mentions">${entitySpans}</div>
</div>`;
    }
  }
}
function entityTypeToSchema(type) {
  const map = {
    person: "Person",
    place: "Place",
    organization: "Organization",
    date: "Thing",
    money: "Thing",
    product: "Product",
    event: "Event",
    other: "Thing"
  };
  return map[type] || "Thing";
}
var useESIContext = null, ESIMarkdown = ({
  children,
  className,
  as: Wrapper = "div",
  fallback,
  gfm = true,
  syntaxHighlight = false,
  allowHtml = false,
  linkTarget = "_blank"
}) => {
  const [output, setOutput] = useState2(null);
  const [isLoading, setIsLoading] = useState2(true);
  if (typeof children === "string") {
    const html2 = parseMarkdown(children, { gfm, allowHtml, linkTarget });
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      dangerouslySetInnerHTML: { __html: html2 }
    }, undefined, false, undefined, this);
  }
  const wrappedChildren = useMemo2(() => {
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: wrappedChildren
    }, undefined, false, undefined, this);
  }
  if (!output) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  const html = parseMarkdown(output, { gfm, allowHtml, linkTarget });
  return /* @__PURE__ */ jsxDEV2(Wrapper, {
    className: `esi-markdown ${className || ""}`,
    dangerouslySetInnerHTML: { __html: html }
  }, undefined, false, undefined, this);
}, ESILatex = ({
  children,
  className,
  as: Wrapper = "div",
  fallback,
  mode = "auto",
  displayMode = false
}) => {
  const [output, setOutput] = useState2(null);
  const [isLoading, setIsLoading] = useState2(true);
  if (typeof children === "string") {
    const html2 = parseLatex(children, { mode, displayMode });
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className: `esi-latex ${className || ""}`,
      dangerouslySetInnerHTML: { __html: html2 }
    }, undefined, false, undefined, this);
  }
  const wrappedChildren = useMemo2(() => {
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: wrappedChildren
    }, undefined, false, undefined, this);
  }
  if (!output) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  const html = parseLatex(output, { mode, displayMode });
  return /* @__PURE__ */ jsxDEV2(Wrapper, {
    className: `esi-latex ${className || ""}`,
    dangerouslySetInnerHTML: { __html: html }
  }, undefined, false, undefined, this);
}, ESIJson = ({
  children,
  className,
  as: Wrapper = "div",
  fallback,
  indent = 2,
  syntaxHighlight = true,
  theme = "auto",
  copyable = false
}) => {
  const [output, setOutput] = useState2(null);
  const [isLoading, setIsLoading] = useState2(true);
  const [copied, setCopied] = useState2(false);
  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  if (typeof children === "string") {
    const html2 = formatJson(children, { indent, syntaxHighlight, theme });
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className: `esi-json ${className || ""}`,
      children: [
        copyable && /* @__PURE__ */ jsxDEV2("button", {
          className: "esi-json-copy",
          onClick: handleCopy,
          "aria-label": "Copy JSON",
          children: copied ? "✓" : "⎘"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("div", {
          dangerouslySetInnerHTML: { __html: html2 }
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const wrappedChildren = useMemo2(() => {
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: wrappedChildren
    }, undefined, false, undefined, this);
  }
  if (!output) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  const html = formatJson(output, { indent, syntaxHighlight, theme });
  return /* @__PURE__ */ jsxDEV2(Wrapper, {
    className: `esi-json ${className || ""}`,
    children: [
      copyable && /* @__PURE__ */ jsxDEV2("button", {
        className: "esi-json-copy",
        onClick: handleCopy,
        "aria-label": "Copy JSON",
        children: copied ? "✓" : "⎘"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        dangerouslySetInnerHTML: { __html: html }
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}, ESIPlaintext = ({
  children,
  className,
  as: Wrapper = "div",
  fallback,
  preserveWhitespace = true,
  wordWrap = true,
  maxWidth
}) => {
  const [output, setOutput] = useState2(null);
  const [isLoading, setIsLoading] = useState2(true);
  const style = useMemo2(() => ({
    whiteSpace: preserveWhitespace ? "pre-wrap" : "normal",
    wordWrap: wordWrap ? "break-word" : "normal",
    maxWidth: maxWidth ? `${maxWidth}ch` : undefined,
    fontFamily: "monospace"
  }), [preserveWhitespace, wordWrap, maxWidth]);
  if (typeof children === "string") {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className: `esi-plaintext ${className || ""}`,
      style,
      children
    }, undefined, false, undefined, this);
  }
  const wrappedChildren = useMemo2(() => {
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: wrappedChildren
    }, undefined, false, undefined, this);
  }
  if (!output) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV2(Wrapper, {
    className: `esi-plaintext ${className || ""}`,
    style,
    children: output
  }, undefined, false, undefined, this);
}, ESICode = ({
  children,
  className,
  as: Wrapper = "div",
  fallback,
  language,
  autoDetect = false,
  generateFrom,
  model = "codestral",
  lineNumbers = false,
  startLine = 1,
  highlightLines = [],
  copyable = false,
  temperature = 0.2,
  onLanguageDetect,
  onGenerate
}) => {
  const [output, setOutput] = useState2(null);
  const [detectedLang, setDetectedLang] = useState2(language);
  const [isLoading, setIsLoading] = useState2(true);
  const [isGenerating, setIsGenerating] = useState2(false);
  const [copied, setCopied] = useState2(false);
  const handleCopy = useCallback2(() => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);
  const extractCode = useCallback2((text) => {
    const match = text.match(/```(\w*)\n?([\s\S]*?)```/);
    if (match) {
      return { code: match[2].trim(), lang: match[1] || undefined };
    }
    return { code: text };
  }, []);
  useEffect2(() => {
    if (!generateFrom || !useESIContext)
      return;
    setIsGenerating(true);
    setIsLoading(true);
    const generateCode = async () => {
      try {
        const esi = useESIContext();
        const langHint = language ? ` in ${language}` : "";
        const prompt = `Generate clean, production-ready code${langHint} for the following requirement. Output ONLY the code, no explanations:

${generateFrom}`;
        const result = await esi.process({
          id: `esi-code-gen-${Date.now()}`,
          params: {
            model: "llm",
            variant: model,
            temperature,
            system: `You are an expert programmer. Generate clean, well-documented code. Output ONLY code wrapped in a markdown code block with the language specified. No explanations before or after.`
          },
          content: {
            type: "text",
            value: prompt
          }
        });
        if (result.success && result.output) {
          const { code: code2, lang: lang2 } = extractCode(result.output);
          setOutput(code2);
          const finalLang2 = language || lang2;
          setDetectedLang(finalLang2);
          onGenerate?.(code2, finalLang2 || "text");
        }
      } catch (err) {
        console.error("Code generation failed:", err);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    };
    generateCode();
  }, [generateFrom, model, language, temperature, extractCode, onGenerate]);
  useEffect2(() => {
    if (!autoDetect || !output || detectedLang || !useESIContext)
      return;
    const detectLanguage = async () => {
      try {
        const esi = useESIContext();
        const result = await esi.process({
          id: `esi-lang-detect-${Date.now()}`,
          params: {
            model: "llm",
            variant: model,
            temperature: 0,
            maxTokens: 20,
            system: "You are a code language detector. Respond with ONLY the programming language name, nothing else."
          },
          content: {
            type: "text",
            value: `What programming language is this code written in?

${output.slice(0, 500)}`
          }
        });
        if (result.success && result.output) {
          const lang2 = result.output.trim().toLowerCase();
          setDetectedLang(lang2);
          onLanguageDetect?.(lang2);
        }
      } catch (err) {
        console.error("Language detection failed:", err);
      }
    };
    detectLanguage();
  }, [autoDetect, output, detectedLang, model, onLanguageDetect]);
  if (typeof children === "string" && !generateFrom) {
    const { code: code2, lang: lang2 } = extractCode(children);
    const finalLang2 = language || lang2 || detectedLang;
    const html2 = formatCode(code2, {
      language: finalLang2,
      lineNumbers,
      startLine,
      highlightLines
    });
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className: `esi-code ${className || ""}`,
      children: [
        copyable && /* @__PURE__ */ jsxDEV2("button", {
          className: "esi-code-copy",
          onClick: handleCopy,
          "aria-label": "Copy code",
          children: copied ? "✓" : "⎘"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("div", {
          dangerouslySetInnerHTML: { __html: html2 }
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (generateFrom && isGenerating) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className: `esi-code esi-code-generating ${className || ""}`,
      children: /* @__PURE__ */ jsxDEV2("div", {
        className: "esi-code-loading",
        children: "Generating code..."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
  }
  const wrappedChildren = useMemo2(() => {
    if (generateFrom)
      return null;
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children, generateFrom]);
  if (isLoading && !generateFrom) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: wrappedChildren
    }, undefined, false, undefined, this);
  }
  if (!output) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  const { code, lang } = extractCode(output);
  const finalLang = language || lang || detectedLang;
  const html = formatCode(code, {
    language: finalLang,
    lineNumbers,
    startLine,
    highlightLines
  });
  return /* @__PURE__ */ jsxDEV2(Wrapper, {
    className: `esi-code ${className || ""}`,
    children: [
      copyable && /* @__PURE__ */ jsxDEV2("button", {
        className: "esi-code-copy",
        onClick: handleCopy,
        "aria-label": "Copy code",
        children: copied ? "✓" : "⎘"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        dangerouslySetInnerHTML: { __html: html }
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}, ESISemantic = ({
  children,
  text,
  className,
  as: Wrapper = "div",
  fallback,
  format = "microdata",
  includeEmbeddings = false,
  maxTopics = 5,
  minConfidence = 0.5,
  schemaType = "Thing",
  extractEntities = false,
  extractEmotion = false,
  vocabulary,
  onExtract
}) => {
  const [output, setOutput] = useState2(null);
  const [topics, setTopics] = useState2([]);
  const [entities, setEntities] = useState2([]);
  const [emotion, setEmotion] = useState2();
  const [isLoading, setIsLoading] = useState2(true);
  const [structuredHtml, setStructuredHtml] = useState2("");
  const inputText = text || (typeof children === "string" ? children : null);
  useEffect2(() => {
    if (!inputText && !output)
      return;
    if (!useESIContext) {
      setIsLoading(false);
      return;
    }
    const extractSemantics = async () => {
      try {
        const esi = useESIContext();
        const textToAnalyze = inputText || output || "";
        const vocabHint = vocabulary?.length ? `Focus on these topics: ${vocabulary.join(", ")}` : "";
        const entityHint = extractEntities ? "Also extract named entities (people, places, organizations, dates)." : "";
        const prompt = `Analyze this text and extract semantic topics and metadata.
${vocabHint}
${entityHint}

Return JSON in this exact format:
{
  "topics": [
    { "label": "topic name", "confidence": 0.95, "keywords": ["kw1", "kw2"], "schemaType": "Article" }
  ],
  "entities": [
    { "text": "entity text", "type": "person|place|organization|date|money|product|event|other" }
  ],
  "suggestedSchema": "Article|BlogPosting|etc"
}

Text to analyze:
${textToAnalyze.slice(0, 2000)}`;
        const result = await esi.process({
          id: `esi-semantic-${Date.now()}`,
          params: {
            model: "llm",
            temperature: 0.1,
            maxTokens: 1000,
            system: "You are a semantic analysis expert. Extract topics, entities, and suggest Schema.org types. Always respond with valid JSON."
          },
          content: {
            type: "text",
            value: prompt
          }
        });
        if (result.success && result.output) {
          try {
            const jsonMatch = result.output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const extractedTopics = (parsed.topics || []).filter((t) => t.confidence >= minConfidence).slice(0, maxTopics);
              const extractedEntities = parsed.entities || [];
              setTopics(extractedTopics);
              if (extractEntities) {
                try {
                  const entityResult = await esi.process({
                    id: `esi-semantic-entities-${Date.now()}`,
                    params: { model: "classify" },
                    content: {
                      type: "text",
                      value: textToAnalyze.slice(0, 2000)
                    }
                  });
                  if (entityResult.success && entityResult.output) {
                    try {
                      const entityParsed = JSON.parse(entityResult.output);
                      if (Array.isArray(entityParsed)) {
                        extractedEntities.push(...entityParsed);
                      }
                    } catch {}
                  }
                } catch {}
              }
              setEntities(extractedEntities);
              let extractedEmotion;
              if (extractEmotion) {
                try {
                  const emotionResult = await esi.process({
                    id: `esi-semantic-emotion-${Date.now()}`,
                    params: { model: "emotion" },
                    content: {
                      type: "text",
                      value: textToAnalyze.slice(0, 1000)
                    }
                  });
                  if (emotionResult.success && emotionResult.output) {
                    try {
                      extractedEmotion = JSON.parse(emotionResult.output);
                      setEmotion(extractedEmotion);
                    } catch {
                      const match = emotionResult.output.match(/(\w+)/);
                      if (match) {
                        extractedEmotion = {
                          primary: match[1],
                          valence: 0,
                          arousal: 0.5,
                          confidence: 0.8
                        };
                        setEmotion(extractedEmotion);
                      }
                    }
                  }
                } catch {}
              }
              onExtract?.({
                topics: extractedTopics,
                entities: extractedEntities,
                emotion: extractedEmotion
              });
              const html = generateStructuredHtml(textToAnalyze, extractedTopics, extractedEntities, format, parsed.suggestedSchema || schemaType, extractedEmotion);
              setStructuredHtml(html);
            }
          } catch (parseErr) {
            console.error("Failed to parse semantic extraction:", parseErr);
          }
        }
        if (includeEmbeddings) {
          const embedResult = await esi.process({
            id: `esi-semantic-embed-${Date.now()}`,
            params: { model: "embed" },
            content: { type: "text", value: textToAnalyze.slice(0, 1000) }
          });
          const embeddingResult = embedResult;
          if (embeddingResult.success && embeddingResult.embedding) {
            const embedding = embeddingResult.embedding;
            setTopics((prev) => prev.map((t, i) => i === 0 ? { ...t, embedding } : t));
          }
        }
      } catch (err) {
        console.error("Semantic extraction failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    extractSemantics();
  }, [
    inputText,
    output,
    maxTopics,
    minConfidence,
    schemaType,
    extractEntities,
    vocabulary,
    format,
    includeEmbeddings,
    onExtract
  ]);
  const wrappedChildren = useMemo2(() => {
    if (inputText)
      return null;
    return wrapChildren(children, (text2) => {
      setOutput(text2);
    });
  }, [children, inputText]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className: `esi-semantic esi-semantic-loading ${className || ""}`,
      children: [
        wrappedChildren,
        !wrappedChildren && /* @__PURE__ */ jsxDEV2("span", {
          children: "Analyzing..."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (!structuredHtml && !topics.length) {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (format === "tags") {
    return /* @__PURE__ */ jsxDEV2(Wrapper, {
      className: `esi-semantic esi-semantic-tags ${className || ""}`,
      children: [
        emotion && /* @__PURE__ */ jsxDEV2("div", {
          className: `esi-semantic-emotion esi-semantic-emotion-${emotion.primary}`,
          "data-valence": emotion.valence,
          "data-arousal": emotion.arousal,
          children: [
            /* @__PURE__ */ jsxDEV2("span", {
              className: "esi-semantic-emotion-label",
              children: emotion.primary
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV2("span", {
              className: "esi-semantic-emotion-confidence",
              children: [
                (emotion.confidence * 100).toFixed(0),
                "%"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV2("div", {
          className: "esi-semantic-topics",
          children: topics.map((topic, i) => /* @__PURE__ */ jsxDEV2("span", {
            className: "esi-semantic-tag",
            "data-confidence": topic.confidence.toFixed(2),
            "data-schema": topic.schemaType,
            children: topic.label
          }, i, false, undefined, this))
        }, undefined, false, undefined, this),
        entities.length > 0 && /* @__PURE__ */ jsxDEV2("div", {
          className: "esi-semantic-entities",
          children: entities.map((entity, i) => /* @__PURE__ */ jsxDEV2("span", {
            className: `esi-semantic-entity esi-semantic-entity-${entity.type}`,
            "data-type": entity.type,
            children: entity.text
          }, i, false, undefined, this))
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV2(Wrapper, {
    className: `esi-semantic ${className || ""}`,
    dangerouslySetInnerHTML: { __html: structuredHtml }
  }, undefined, false, undefined, this);
};
var init_esi_format_react = __esm(() => {
  try {
    const esiReact = (init_esi_react(), __toCommonJS(exports_esi_react));
    useESIContext = esiReact.useESI;
  } catch {}
});

// src/router/esi-translate-react.tsx
import {
  createContext as createContext3,
  useContext as useContext3,
  useEffect as useEffect3,
  useState as useState3,
  useCallback as useCallback3,
  useMemo as useMemo3
} from "react";
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function useTranslation() {
  const ctx = useContext3(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return ctx;
}
function useTranslationOptional() {
  return useContext3(TranslationContext);
}
var TranslationContext, TranslationProvider = ({
  children,
  defaultLanguage,
  endpoint: propEndpoint,
  cacheTtl: propCacheTtl = 86400,
  fallbackLanguage = "en"
}) => {
  const headConfig = useMemo3(() => readHeadTranslationConfig(), []);
  const globalState = useGlobalESIState();
  const initialLanguage = useMemo3(() => normalizeLanguageCode(defaultLanguage || headConfig.defaultLanguage || globalState.preferences?.language || fallbackLanguage), [
    defaultLanguage,
    headConfig.defaultLanguage,
    globalState.preferences?.language,
    fallbackLanguage
  ]);
  const [language, setLanguageState] = useState3(initialLanguage);
  const [isTranslating, setIsTranslating] = useState3(false);
  const endpoint = propEndpoint || headConfig.endpoint || "https://ai-gateway.taylorbuley.workers.dev";
  const cacheTtl = propCacheTtl || headConfig.cacheTtl || 86400;
  const esiContext2 = useESI();
  const setLanguage = useCallback3((lang) => {
    setLanguageState(normalizeLanguageCode(lang));
  }, []);
  const translate = useCallback3(async (text, options = {}) => {
    const targetLang = normalizeLanguageCode(options.targetLanguage || language);
    const sourceLang = options.sourceLanguage || "auto";
    const cacheKey = generateTranslationCacheKey(text, sourceLang, targetLang, options.context);
    const cached = getCachedTranslation(cacheKey);
    if (cached) {
      return cached;
    }
    setIsTranslating(true);
    try {
      const directive = esiTranslate(text, targetLang, {
        sourceLanguage: sourceLang,
        context: options.context,
        cacheTtl
      });
      const esiResult = await esiContext2.process(directive);
      const result = {
        original: text,
        translated: esiResult.success ? esiResult.output || text : text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        confidence: esiResult.success ? 0.95 : 0,
        cached: esiResult.cached,
        latencyMs: esiResult.latencyMs
      };
      if (esiResult.success) {
        setCachedTranslation(cacheKey, result, cacheTtl);
      }
      return result;
    } catch (error) {
      return {
        original: text,
        translated: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        confidence: 0,
        cached: false,
        latencyMs: 0
      };
    } finally {
      setIsTranslating(false);
    }
  }, [language, cacheTtl, esiContext2]);
  const contextValue = useMemo3(() => ({
    language,
    setLanguage,
    translate,
    isTranslating,
    supportedLanguages: getSupportedLanguages(),
    endpoint,
    cacheTtl
  }), [language, setLanguage, translate, isTranslating, endpoint, cacheTtl]);
  return /* @__PURE__ */ jsxDEV3(TranslationContext.Provider, {
    value: contextValue,
    children
  }, undefined, false, undefined, this);
}, ESITranslate = ({
  children,
  text,
  targetLanguage: propTargetLanguage,
  sourceLanguage = "auto",
  context,
  fallback,
  loading = "...",
  cacheTtl = 86400,
  stream = false,
  render,
  className,
  as: Component = "span",
  onComplete,
  onError
}) => {
  const { process: process2, processWithStream, enabled } = useESI();
  const globalState = useGlobalESIState();
  const translationContext = useTranslationOptional();
  const [output, setOutput] = useState3("");
  const [isLoading, setIsLoading] = useState3(true);
  const [error, setError] = useState3(null);
  const [result, setResult] = useState3(null);
  const textToTranslate = useMemo3(() => text || (typeof children === "string" ? children : String(children || "")), [text, children]);
  const targetLanguage = useMemo3(() => normalizeLanguageCode(propTargetLanguage || translationContext?.language || detectTargetLanguage(undefined, globalState)), [propTargetLanguage, translationContext?.language, globalState]);
  const shouldTranslate = useMemo3(() => {
    if (!textToTranslate)
      return false;
    if (targetLanguage === "en" && sourceLanguage === "auto")
      return false;
    if (sourceLanguage === targetLanguage)
      return false;
    return true;
  }, [textToTranslate, targetLanguage, sourceLanguage]);
  useEffect3(() => {
    if (!enabled || !shouldTranslate) {
      setOutput(textToTranslate);
      setIsLoading(false);
      return;
    }
    const cacheKey = generateTranslationCacheKey(textToTranslate, sourceLanguage, targetLanguage, context);
    const cached = getCachedTranslation(cacheKey);
    if (cached) {
      setOutput(cached.translated);
      setResult(cached);
      setIsLoading(false);
      onComplete?.(cached);
      return;
    }
    const directive = esiTranslate(textToTranslate, targetLanguage, {
      sourceLanguage,
      context,
      cacheTtl
    });
    const processTranslation = async () => {
      try {
        let esiResult;
        if (stream && processWithStream) {
          setOutput("");
          esiResult = await processWithStream(directive, (chunk) => {
            setOutput((prev) => prev + chunk);
          });
        } else {
          esiResult = await process2(directive);
        }
        setIsLoading(false);
        if (esiResult.success && esiResult.output) {
          const translatedText = esiResult.output.trim();
          setOutput(translatedText);
          const translationResult = {
            original: textToTranslate,
            translated: translatedText,
            sourceLanguage,
            targetLanguage,
            confidence: 0.95,
            cached: esiResult.cached,
            latencyMs: esiResult.latencyMs
          };
          setResult(translationResult);
          setCachedTranslation(cacheKey, translationResult, cacheTtl);
          onComplete?.(translationResult);
        } else {
          setError(esiResult.error || "Translation failed");
          setOutput(textToTranslate);
          onError?.(esiResult.error || "Translation failed");
        }
      } catch (err) {
        setIsLoading(false);
        setOutput(textToTranslate);
        const errorMsg = err instanceof Error ? err.message : "Translation failed";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };
    processTranslation();
  }, [
    textToTranslate,
    targetLanguage,
    sourceLanguage,
    context,
    cacheTtl,
    enabled,
    shouldTranslate,
    stream,
    process2,
    processWithStream,
    onComplete,
    onError
  ]);
  if (isLoading && !stream) {
    return /* @__PURE__ */ jsxDEV3(Component, {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (error && fallback) {
    return /* @__PURE__ */ jsxDEV3(Component, {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render && result) {
    return /* @__PURE__ */ jsxDEV3(Component, {
      className,
      children: render(result)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV3(Component, {
    className,
    children: output || (isLoading ? loading : "")
  }, undefined, false, undefined, this);
};
var init_esi_translate_react = __esm(() => {
  init_esi_translate();
  init_esi_react();
  TranslationContext = createContext3(null);
});

// src/router.ts
var {readdir} = (() => ({}));

class AeonRouter {
  routes = [];
  routesDir;
  componentsDir;
  constructor(options) {
    this.routesDir = options.routesDir;
    this.componentsDir = options.componentsDir;
  }
  async scan() {
    this.routes = [];
    await this.scanDirectory(this.routesDir, "");
    this.sortRoutes();
  }
  async reload() {
    await this.scan();
  }
  match(path) {
    const pathSegments = path.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
    for (const parsed of this.routes) {
      const params = this.matchSegments(parsed.segments, pathSegments);
      if (params !== null) {
        const sessionId = this.resolveSessionId(parsed.definition.sessionId, params);
        return {
          route: parsed.definition,
          params,
          sessionId,
          componentId: parsed.definition.componentId,
          isAeon: parsed.definition.isAeon
        };
      }
    }
    return null;
  }
  hasRoute(path) {
    return this.match(path) !== null;
  }
  getRoutes() {
    return this.routes.map((r) => r.definition);
  }
  addRoute(definition) {
    const segments = this.parsePattern(definition.pattern);
    this.routes.push({ pattern: definition.pattern, segments, definition });
    this.sortRoutes();
  }
  async scanDirectory(dir, prefix) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          const isRouteGroup = entry.name.startsWith("(") && entry.name.endsWith(")");
          const newPrefix = isRouteGroup ? prefix : `${prefix}/${entry.name}`;
          await this.scanDirectory(fullPath, newPrefix);
        } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
          const route = await this.createRouteFromFile(fullPath, prefix);
          if (route) {
            this.routes.push(route);
          }
        }
      }
    } catch (error) {
      console.error(`[aeon] Error scanning directory ${dir}:`, error);
    }
  }
  async createRouteFromFile(filePath, prefix) {
    try {
      const file = Bun.file(filePath);
      const content = await file.text();
      const isAeon = content.includes("'use aeon'") || content.includes('"use aeon"');
      const pattern = prefix || "/";
      const segments = this.parsePattern(pattern);
      const sessionId = this.generateSessionId(pattern);
      const componentId = relative(this.routesDir, filePath).replace(/\.(tsx?|jsx?)$/, "").replace(/\//g, "-").replace(/page$/, "").replace(/-$/, "") || "index";
      const definition = {
        pattern,
        sessionId,
        componentId,
        isAeon
      };
      return { pattern, segments, definition };
    } catch (error) {
      console.error(`[aeon] Error reading file ${filePath}:`, error);
      return null;
    }
  }
  parsePattern(pattern) {
    return pattern.replace(/^\/|\/$/g, "").split("/").filter(Boolean).filter((s) => !(s.startsWith("(") && s.endsWith(")"))).map((s) => {
      if (s.startsWith("[[...") && s.endsWith("]]")) {
        return { type: "optionalCatchAll", name: s.slice(5, -2) };
      }
      if (s.startsWith("[...") && s.endsWith("]")) {
        return { type: "catchAll", name: s.slice(4, -1) };
      }
      if (s.startsWith("[") && s.endsWith("]")) {
        return { type: "dynamic", name: s.slice(1, -1) };
      }
      return { type: "static", value: s };
    });
  }
  matchSegments(routeSegments, pathSegments) {
    const params = {};
    let pathIdx = 0;
    for (const segment of routeSegments) {
      switch (segment.type) {
        case "static":
          if (pathIdx >= pathSegments.length || pathSegments[pathIdx] !== segment.value) {
            return null;
          }
          pathIdx++;
          break;
        case "dynamic":
          if (pathIdx >= pathSegments.length) {
            return null;
          }
          params[segment.name] = pathSegments[pathIdx];
          pathIdx++;
          break;
        case "catchAll":
          if (pathIdx >= pathSegments.length) {
            return null;
          }
          params[segment.name] = pathSegments.slice(pathIdx).join("/");
          pathIdx = pathSegments.length;
          break;
        case "optionalCatchAll":
          if (pathIdx < pathSegments.length) {
            params[segment.name] = pathSegments.slice(pathIdx).join("/");
            pathIdx = pathSegments.length;
          }
          break;
      }
    }
    return pathIdx === pathSegments.length ? params : null;
  }
  generateSessionId(pattern) {
    return pattern.replace(/^\/|\/$/g, "").replace(/\[\.\.\.(\w+)\]/g, "$$$1").replace(/\[\[\.\.\.(\w+)\]\]/g, "$$$1").replace(/\[(\w+)\]/g, "$$$1").replace(/\//g, "-") || "index";
  }
  resolveSessionId(template, params) {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`$${key}`, value);
    }
    return result;
  }
  sortRoutes() {
    this.routes.sort((a, b) => {
      const scoreA = this.routeSpecificity(a.segments);
      const scoreB = this.routeSpecificity(b.segments);
      return scoreB - scoreA;
    });
  }
  routeSpecificity(segments) {
    let score = 0;
    for (let i = 0;i < segments.length; i++) {
      const positionWeight = 1000 - i;
      const segment = segments[i];
      switch (segment.type) {
        case "static":
          score += positionWeight * 10;
          break;
        case "dynamic":
          score += positionWeight * 5;
          break;
        case "catchAll":
          score += 1;
          break;
        case "optionalCatchAll":
          score += 0;
          break;
      }
    }
    return score;
  }
}
var init_router = __esm(() => {
  init_path();
});

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
function getSkeletonCache() {
  if (!globalSkeletonCache) {
    globalSkeletonCache = new SkeletonCache;
  }
  return globalSkeletonCache;
}
function setSkeletonCache(cache) {
  globalSkeletonCache = cache;
}
var globalCache = null, globalSkeletonCache = null;
var init_cache = () => {};

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
function getNavigator() {
  if (!globalNavigator) {
    globalNavigator = new AeonNavigationEngine;
  }
  return globalNavigator;
}
function setNavigator(navigator2) {
  globalNavigator = navigator2;
}
var globalNavigator = null;
var init_navigation = __esm(() => {
  init_router();
  init_cache();
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", (event) => {
      const navigator2 = getNavigator();
      const route = event.state?.route ?? window.location.pathname;
      navigator2.navigate(route, { replace: true });
    });
  }
});

// src/router/esi-react.tsx
var exports_esi_react = {};
__export(exports_esi_react, {
  useNavigation: () => useNavigation,
  useMeetsTierRequirement: () => useMeetsTierRequirement,
  useIsAdmin: () => useIsAdmin,
  useGlobalESIState: () => useGlobalESIState,
  useESITier: () => useESITier,
  useESIPreferences: () => useESIPreferences,
  useESIInfer: () => useESIInfer,
  useESIFeature: () => useESIFeature,
  useESIEmotionState: () => useESIEmotionState,
  useESI: () => useESI,
  updateGlobalESIState: () => updateGlobalESIState,
  default: () => esi_react_default,
  ESIVision: () => ESIVision,
  ESIProvider: () => ESIProvider,
  ESIInfer: () => ESIInfer,
  ESIEmotion: () => ESIEmotion,
  ESIEmbed: () => ESIEmbed,
  ESI: () => ESI
});
import {
  createContext as createContext4,
  useContext as useContext4,
  useEffect as useEffect4,
  useState as useState4,
  useCallback as useCallback4
} from "react";
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
function useESI() {
  const ctx = useContext4(ESIContext);
  if (!ctx) {
    throw new Error("useESI must be used within an ESIProvider");
  }
  return ctx;
}
function useESIInfer(options = {}) {
  const { process: process2, processWithStream, enabled } = useESI();
  const [result, setResult] = useState4(null);
  const [isLoading, setIsLoading] = useState4(false);
  const [error, setError] = useState4(null);
  const run = useCallback4(async (prompt) => {
    if (!enabled) {
      setError("ESI is disabled");
      return null;
    }
    setIsLoading(true);
    setError(null);
    const directive = options.contextAware ? esiWithContext(prompt, options.signals, {
      model: options.model,
      variant: options.variant,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      system: options.system,
      cacheTtl: options.cacheTtl
    }) : esiInfer(prompt, {
      model: options.model,
      variant: options.variant,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      system: options.system,
      cacheTtl: options.cacheTtl
    });
    try {
      let inferenceResult;
      if (options.stream) {
        let output = "";
        inferenceResult = await processWithStream(directive, (chunk) => {
          output += chunk;
          setResult((prev) => ({
            ...prev,
            output
          }));
        });
      } else {
        inferenceResult = await process2(directive);
      }
      setResult(inferenceResult);
      setIsLoading(false);
      if (!inferenceResult.success) {
        setError(inferenceResult.error || "Inference failed");
      }
      options.onComplete?.(inferenceResult);
      return inferenceResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      setIsLoading(false);
      options.onError?.(errorMsg);
      return null;
    }
  }, [process2, processWithStream, enabled, options]);
  const reset = useCallback4(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);
  return { run, result, isLoading, error, reset };
}
function useGlobalESIState() {
  const [state, setState] = useState4(() => {
    if (typeof window !== "undefined" && window.__AEON_ESI_STATE__) {
      return window.__AEON_ESI_STATE__;
    }
    return DEFAULT_ESI_STATE;
  });
  useEffect4(() => {
    if (typeof window !== "undefined" && window.__AEON_ESI_STATE__?.subscribe) {
      const unsubscribe = window.__AEON_ESI_STATE__.subscribe((newState) => {
        setState(newState);
      });
      return unsubscribe;
    }
    return () => {};
  }, []);
  return state;
}
function useESIFeature(feature) {
  const { features, isAdmin, userTier } = useGlobalESIState();
  if (isAdmin === true || userTier === "admin") {
    return true;
  }
  return features[feature] ?? false;
}
function useIsAdmin() {
  const { isAdmin, userTier } = useGlobalESIState();
  return isAdmin === true || userTier === "admin";
}
function useESITier() {
  const { userTier } = useGlobalESIState();
  return userTier;
}
function useMeetsTierRequirement(requiredTier) {
  const { userTier, isAdmin } = useGlobalESIState();
  if (isAdmin === true || userTier === "admin") {
    return true;
  }
  const userLevel = TIER_ORDER[userTier] ?? 0;
  const requiredLevel = TIER_ORDER[requiredTier] ?? 0;
  return userLevel >= requiredLevel;
}
function useESIEmotionState() {
  const { emotionState } = useGlobalESIState();
  return emotionState;
}
function useESIPreferences() {
  const { preferences } = useGlobalESIState();
  return preferences;
}
function updateGlobalESIState(partial) {
  if (typeof window !== "undefined" && window.__AEON_ESI_STATE__?.update) {
    window.__AEON_ESI_STATE__.update(partial);
  } else if (typeof window !== "undefined" && window.__AEON_ESI_STATE__) {
    Object.assign(window.__AEON_ESI_STATE__, partial);
  }
}
function useNavigation() {
  const aeonNavigator = typeof window !== "undefined" ? getNavigator() : null;
  const push = useCallback4((url) => {
    if (aeonNavigator) {
      aeonNavigator.navigate(url);
    } else if (typeof window !== "undefined") {
      window.location.href = url;
    }
  }, [aeonNavigator]);
  const replace = useCallback4((url) => {
    if (aeonNavigator) {
      aeonNavigator.navigate(url, { replace: true });
    } else if (typeof window !== "undefined") {
      window.location.replace(url);
    }
  }, [aeonNavigator]);
  const back = useCallback4(() => {
    if (aeonNavigator) {
      aeonNavigator.back();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  }, [aeonNavigator]);
  const prefetch = useCallback4((url) => {
    if (aeonNavigator) {
      aeonNavigator.prefetch(url);
    }
  }, [aeonNavigator]);
  return { push, replace, back, prefetch };
}
var ESIContext, ESIProvider = ({
  children,
  config,
  userContext,
  processor: customProcessor
}) => {
  const [processor] = useState4(() => customProcessor || new EdgeWorkersESIProcessor(config));
  useEffect4(() => {
    processor.warmup?.();
  }, [processor]);
  const process2 = useCallback4(async (directive) => {
    if (!userContext) {
      return {
        id: directive.id,
        success: false,
        error: "No user context available",
        latencyMs: 0,
        cached: false,
        model: directive.params.model
      };
    }
    return processor.process(directive, userContext);
  }, [processor, userContext]);
  const processWithStream = useCallback4(async (directive, onChunk) => {
    if (!userContext) {
      return {
        id: directive.id,
        success: false,
        error: "No user context available",
        latencyMs: 0,
        cached: false,
        model: directive.params.model
      };
    }
    if (!processor.stream) {
      return processor.process(directive, userContext);
    }
    return processor.stream(directive, userContext, onChunk);
  }, [processor, userContext]);
  return /* @__PURE__ */ jsxDEV4(ESIContext.Provider, {
    value: {
      processor,
      userContext: userContext || null,
      enabled: config?.enabled ?? true,
      process: process2,
      processWithStream
    },
    children
  }, undefined, false, undefined, this);
}, ESIInfer = ({
  children,
  prompt,
  model = "llm",
  variant,
  temperature,
  maxTokens,
  system,
  stream = false,
  fallback,
  loading = "...",
  contextAware = false,
  signals,
  cacheTtl,
  render,
  className,
  onComplete,
  onError
}) => {
  const { process: process2, processWithStream, enabled } = useESI();
  const [output, setOutput] = useState4("");
  const [isLoading, setIsLoading] = useState4(true);
  const [error, setError] = useState4(null);
  const promptText = prompt || (typeof children === "string" ? children : String(children || ""));
  useEffect4(() => {
    const fetchData = async () => {
      if (!enabled) {
        setOutput(typeof fallback === "string" ? fallback : "");
        setIsLoading(false);
        return;
      }
      const directive = contextAware ? esiWithContext(promptText, signals, {
        model,
        variant,
        temperature,
        maxTokens,
        system,
        cacheTtl,
        fallback: typeof fallback === "string" ? fallback : undefined
      }) : esiInfer(promptText, {
        model,
        variant,
        temperature,
        maxTokens,
        system,
        cacheTtl,
        fallback: typeof fallback === "string" ? fallback : undefined
      });
      if (stream) {
        setOutput("");
        await processWithStream(directive, (chunk) => {
          setOutput((prev) => prev + chunk);
        }).then((result) => {
          setIsLoading(false);
          if (!result.success) {
            setError(result.error || "Inference failed");
            onError?.(result.error || "Inference failed");
          }
          onComplete?.(result);
        });
      } else {
        await process2(directive).then((result) => {
          setIsLoading(false);
          if (result.success && result.output) {
            setOutput(result.output);
          } else {
            setError(result.error || "Inference failed");
            onError?.(result.error || "Inference failed");
          }
          onComplete?.(result);
        });
      }
    };
    fetchData();
    return () => {};
  }, [
    promptText,
    model,
    variant,
    temperature,
    maxTokens,
    system,
    contextAware,
    stream,
    enabled,
    fallback,
    processWithStream,
    process2,
    onComplete,
    onError
  ]);
  if (isLoading && !stream) {
    return /* @__PURE__ */ jsxDEV4("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (error && fallback) {
    return /* @__PURE__ */ jsxDEV4("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  if (render) {
    return /* @__PURE__ */ jsxDEV4("span", {
      className,
      children: render({
        id: "",
        success: !error,
        output,
        error: error || undefined,
        latencyMs: 0,
        cached: false,
        model
      })
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV4("span", {
    className,
    children: output || (isLoading ? loading : "")
  }, undefined, false, undefined, this);
}, ESIEmbed = ({
  children,
  onComplete,
  onError
}) => {
  const { process: process2, enabled } = useESI();
  const text = typeof children === "string" ? children : String(children || "");
  useEffect4(() => {
    if (!enabled)
      return;
    const directive = esiEmbed(text);
    process2(directive).then((result) => {
      if (result.success && result.embedding) {
        onComplete?.(result.embedding);
      } else {
        onError?.(result.error || "Embedding failed");
      }
    });
  }, [text, enabled]);
  return null;
}, ESIEmotion = ({
  children,
  contextAware = true,
  onComplete,
  onError
}) => {
  const { process: process2, enabled } = useESI();
  const text = typeof children === "string" ? children : String(children || "");
  useEffect4(() => {
    if (!enabled)
      return;
    const directive = esiEmotion(text, contextAware);
    process2(directive).then((result) => {
      if (result.success && result.output) {
        try {
          const parsed = JSON.parse(result.output);
          onComplete?.(parsed);
        } catch {
          onComplete?.({ emotion: result.output, confidence: 1 });
        }
      } else {
        onError?.(result.error || "Emotion detection failed");
      }
    });
  }, [text, contextAware, enabled]);
  return null;
}, ESIVision = ({
  src,
  prompt,
  fallback,
  loading = "...",
  className,
  onComplete,
  onError
}) => {
  const { process: process2, enabled } = useESI();
  const [output, setOutput] = useState4("");
  const [isLoading, setIsLoading] = useState4(true);
  const [error, setError] = useState4(null);
  useEffect4(() => {
    if (!enabled) {
      setOutput(typeof fallback === "string" ? fallback : "");
      setIsLoading(false);
      return;
    }
    const directive = esiVision(src, prompt);
    process2(directive).then((result) => {
      setIsLoading(false);
      if (result.success && result.output) {
        setOutput(result.output);
      } else {
        setError(result.error || "Vision analysis failed");
        onError?.(result.error || "Vision analysis failed");
      }
      onComplete?.(result);
    });
  }, [src, prompt, enabled]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV4("span", {
      className,
      children: loading
    }, undefined, false, undefined, this);
  }
  if (error && fallback) {
    return /* @__PURE__ */ jsxDEV4("span", {
      className,
      children: fallback
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV4("span", {
    className,
    children: output
  }, undefined, false, undefined, this);
}, DEFAULT_ESI_STATE, TIER_ORDER, ESI, esi_react_default;
var init_esi_react = __esm(() => {
  init_esi();
  init_esi_control_react();
  init_esi_format_react();
  init_esi_translate_react();
  init_navigation();
  ESIContext = createContext4(null);
  DEFAULT_ESI_STATE = {
    userTier: "free",
    emotionState: null,
    preferences: {
      theme: "auto",
      reducedMotion: false
    },
    localHour: new Date().getHours(),
    timezone: "UTC",
    features: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: false,
      customThemes: false,
      voiceSynthesis: false,
      imageAnalysis: false
    },
    isNewSession: true,
    recentPages: [],
    viewport: { width: 1920, height: 1080 },
    connection: "4g"
  };
  TIER_ORDER = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3,
    admin: 999
  };
  ESI = {
    Provider: ESIProvider,
    Infer: ESIInfer,
    Embed: ESIEmbed,
    Emotion: ESIEmotion,
    Vision: ESIVision,
    Translate: ESITranslate,
    TranslationProvider,
    Structured: ESIStructured,
    If: ESIIf,
    Show: ESIShow,
    Hide: ESIHide,
    When: ESIWhen,
    Unless: ESIUnless,
    Match: ESIMatch,
    Case: ESICase,
    Default: ESIDefault,
    First: ESIFirst,
    TierGate: ESITierGate,
    EmotionGate: ESIEmotionGate,
    TimeGate: ESITimeGate,
    ForEach: ESIForEach,
    Select: ESISelect,
    ABTest: ESIABTest,
    Clamp: ESIClamp,
    Score: ESIScore,
    Collaborative: ESICollaborative,
    Reflect: ESIReflect,
    Optimize: ESIOptimize,
    Auto: ESIAuto,
    Markdown: ESIMarkdown,
    Latex: ESILatex,
    Json: ESIJson,
    Plaintext: ESIPlaintext,
    Code: ESICode,
    Semantic: ESISemantic
  };
  esi_react_default = ESI;
});

// src/router/types.ts
var DEFAULT_ROUTER_CONFIG = {
  adapter: "heuristic",
  speculation: {
    enabled: true,
    depth: 2,
    prerenderTop: 1,
    maxPrefetch: 5
  },
  personalization: {
    featureGating: true,
    emotionTheming: true,
    componentOrdering: true,
    densityAdaptation: true
  }
};
var DEFAULT_ESI_CONFIG = {
  enabled: false,
  endpoint: process.env.ESI_ENDPOINT || "",
  timeout: 5000,
  defaultCacheTtl: 300,
  maxConcurrent: 5,
  warmupModels: ["llm"],
  tierLimits: {
    free: {
      maxInferencesPerRequest: 2,
      allowedModels: ["llm", "embed"],
      maxTokens: 500
    },
    starter: {
      maxInferencesPerRequest: 5,
      allowedModels: ["llm", "embed", "classify"],
      maxTokens: 1000
    },
    pro: {
      maxInferencesPerRequest: 20,
      allowedModels: ["llm", "embed", "classify", "vision", "tts"],
      maxTokens: 4000
    },
    enterprise: {
      maxInferencesPerRequest: 100,
      allowedModels: [
        "llm",
        "embed",
        "classify",
        "vision",
        "tts",
        "stt",
        "custom"
      ],
      maxTokens: 32000
    },
    admin: {
      maxInferencesPerRequest: 999999,
      allowedModels: [
        "llm",
        "embed",
        "classify",
        "vision",
        "tts",
        "stt",
        "emotion",
        "custom"
      ],
      maxTokens: 999999
    }
  }
};

// src/router/index.ts
init_esi();
init_esi_translate();
init_esi_react();
init_esi_translate_react();

// src/router/esi-translate-observer.ts
init_esi_translate();
import { useEffect as useEffect5, useRef } from "react";

class TranslationObserver {
  observer = null;
  config;
  translationQueue = [];
  isProcessing = false;
  debounceTimer = null;
  translatedElements = new WeakSet;
  constructor(config = {}) {
    this.config = {
      root: config.root ?? null,
      translateAttribute: config.translateAttribute ?? "data-translate",
      batchSize: config.batchSize ?? 10,
      debounceMs: config.debounceMs ?? 100,
      endpoint: config.endpoint ?? "https://ai-gateway.taylorbuley.workers.dev",
      defaultTargetLanguage: config.defaultTargetLanguage ?? "en",
      cacheTtl: config.cacheTtl ?? 86400,
      onTranslate: config.onTranslate,
      onError: config.onError
    };
  }
  observe() {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
      console.warn("[TranslationObserver] MutationObserver not available");
      return;
    }
    const root = this.config.root ?? document.body;
    if (!root) {
      console.warn("[TranslationObserver] Root element not found");
      return;
    }
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });
    this.observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [this.config.translateAttribute, "data-target-lang"]
    });
    this.translateAll();
  }
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
  async translateAll() {
    const root = this.config.root ?? document.body;
    if (!root)
      return;
    const elements = root.querySelectorAll(`[${this.config.translateAttribute}]`);
    Array.from(elements).forEach((element) => {
      if (!this.translatedElements.has(element)) {
        this.queueElement(element);
      }
    });
    await this.processQueue();
  }
  async translateElement(element) {
    const originalText = element.textContent?.trim();
    if (!originalText)
      return null;
    const targetLanguage = this.getTargetLanguage(element);
    const sourceLanguage = this.getSourceLanguage(element);
    const context = element.getAttribute("data-translate-context") ?? undefined;
    try {
      const result = await translateWithAIGateway(originalText, targetLanguage, {
        sourceLanguage,
        context,
        endpoint: this.config.endpoint
      });
      if (result.translated !== originalText) {
        element.textContent = result.translated;
        element.setAttribute("data-translated", "true");
        element.setAttribute("data-original-text", originalText);
      }
      this.translatedElements.add(element);
      this.config.onTranslate?.(element, result);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Translation failed";
      this.config.onError?.(element, errorMsg);
      return null;
    }
  }
  handleMutations(mutations) {
    let hasNewElements = false;
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        Array.from(mutation.addedNodes).forEach((node) => {
          if (node instanceof Element) {
            if (node.hasAttribute(this.config.translateAttribute)) {
              if (!this.translatedElements.has(node)) {
                this.queueElement(node);
                hasNewElements = true;
              }
            }
            const descendants = node.querySelectorAll(`[${this.config.translateAttribute}]`);
            Array.from(descendants).forEach((descendant) => {
              if (!this.translatedElements.has(descendant)) {
                this.queueElement(descendant);
                hasNewElements = true;
              }
            });
          }
        });
      } else if (mutation.type === "attributes") {
        if (mutation.target instanceof Element) {
          if (mutation.target.hasAttribute(this.config.translateAttribute)) {
            if (!this.translatedElements.has(mutation.target)) {
              this.queueElement(mutation.target);
              hasNewElements = true;
            }
          }
        }
      }
    }
    if (hasNewElements) {
      this.debouncedProcessQueue();
    }
  }
  queueElement(element) {
    const originalText = element.textContent?.trim();
    if (!originalText)
      return;
    if (this.translationQueue.some((item) => item.element === element)) {
      return;
    }
    const targetLanguage = this.getTargetLanguage(element);
    const sourceLanguage = this.getSourceLanguage(element);
    const context = element.getAttribute("data-translate-context") ?? undefined;
    this.translationQueue.push({
      element,
      originalText,
      targetLanguage,
      sourceLanguage,
      context
    });
  }
  debouncedProcessQueue() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, this.config.debounceMs);
  }
  async processQueue() {
    if (this.isProcessing || this.translationQueue.length === 0) {
      return;
    }
    this.isProcessing = true;
    try {
      while (this.translationQueue.length > 0) {
        const batch = this.translationQueue.splice(0, this.config.batchSize);
        await Promise.all(batch.map(async (item) => {
          try {
            const result = await translateWithAIGateway(item.originalText, item.targetLanguage, {
              sourceLanguage: item.sourceLanguage,
              context: item.context,
              endpoint: this.config.endpoint
            });
            if (result.translated !== item.originalText) {
              item.element.textContent = result.translated;
              item.element.setAttribute("data-translated", "true");
              item.element.setAttribute("data-original-text", item.originalText);
            }
            this.translatedElements.add(item.element);
            this.config.onTranslate?.(item.element, result);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Translation failed";
            this.config.onError?.(item.element, errorMsg);
          }
        }));
      }
    } finally {
      this.isProcessing = false;
    }
  }
  getTargetLanguage(element) {
    const explicit = element.getAttribute("data-target-lang");
    if (explicit)
      return normalizeLanguageCode(explicit);
    return detectTargetLanguage(undefined, undefined);
  }
  getSourceLanguage(element) {
    const explicit = element.getAttribute("data-source-lang");
    if (explicit)
      return normalizeLanguageCode(explicit);
    return "auto";
  }
}
function useTranslationObserver(config) {
  const observerRef = useRef(null);
  useEffect5(() => {
    observerRef.current = new TranslationObserver(config);
    observerRef.current.observe();
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
  return observerRef;
}
function initTranslationObserver(config) {
  const observer = new TranslationObserver(config);
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        observer.observe();
      });
    } else {
      observer.observe();
    }
  }
  return observer;
}
// src/router/heuristic-adapter.ts
var DEFAULT_CONFIG = {
  tierFeatures: {
    free: {},
    starter: {},
    pro: {},
    enterprise: {},
    admin: {}
  },
  defaultAccent: "#336699",
  signals: {},
  defaultPaths: ["/"],
  maxSpeculationPaths: 5
};
function defaultDeriveTheme(context) {
  if (context.preferences.theme) {
    return context.preferences.theme;
  }
  const hour = context.localHour;
  const isNight = hour >= 20 || hour < 6;
  const isEvening = hour >= 18 && hour < 20;
  if (isNight) {
    return "dark";
  }
  if (isEvening) {
    return "auto";
  }
  return "light";
}
function determineDensity(context) {
  if (context.preferences.density) {
    return context.preferences.density;
  }
  const { width, height } = context.viewport;
  if (width < 768) {
    return "compact";
  }
  if (width >= 1440 && height >= 900) {
    return "comfortable";
  }
  return "normal";
}
function buildTransitionMatrix(history) {
  const matrix = {};
  for (let i = 0;i < history.length - 1; i++) {
    const from = history[i];
    const to = history[i + 1];
    if (!matrix[from]) {
      matrix[from] = {};
    }
    matrix[from][to] = (matrix[from][to] || 0) + 1;
  }
  for (const from of Object.keys(matrix)) {
    const total = Object.values(matrix[from]).reduce((a, b) => a + b, 0);
    for (const to of Object.keys(matrix[from])) {
      matrix[from][to] /= total;
    }
  }
  return matrix;
}
function defaultPredictNavigation(currentPath, context, defaultPaths, topN) {
  const history = context.recentPages;
  if (history.length >= 3) {
    const matrix = buildTransitionMatrix(history);
    const transitions = matrix[currentPath];
    if (transitions) {
      const sorted = Object.entries(transitions).sort(([, a], [, b]) => b - a).slice(0, topN).map(([path]) => path);
      if (sorted.length > 0) {
        return sorted;
      }
    }
  }
  return defaultPaths.filter((p) => p !== currentPath).slice(0, topN);
}
function defaultScoreRelevance(node, context) {
  let score = 50;
  if (node.requiredTier) {
    const tierOrder = ["free", "starter", "pro", "enterprise"];
    const requiredIndex = tierOrder.indexOf(node.requiredTier);
    const userIndex = tierOrder.indexOf(context.tier);
    if (userIndex < requiredIndex) {
      return 0;
    }
    score += 10;
  }
  if (node.relevanceSignals) {
    for (const signal of node.relevanceSignals) {
      if (signal.startsWith("recentPage:")) {
        const page = signal.slice("recentPage:".length);
        if (context.recentPages.includes(page)) {
          score += 20;
        }
      }
      if (signal.startsWith("timeOfDay:")) {
        const timeRange = signal.slice("timeOfDay:".length);
        const hour = context.localHour;
        if (timeRange === "morning" && hour >= 5 && hour < 12)
          score += 15;
        if (timeRange === "afternoon" && hour >= 12 && hour < 17)
          score += 15;
        if (timeRange === "evening" && hour >= 17 && hour < 21)
          score += 15;
        if (timeRange === "night" && (hour >= 21 || hour < 5))
          score += 15;
      }
      if (signal.startsWith("preference:")) {
        const pref = signal.slice("preference:".length);
        if (context.preferences[pref]) {
          score += 20;
        }
      }
      if (signal.startsWith("tier:")) {
        const requiredTier = signal.slice("tier:".length);
        const tierOrder = ["free", "starter", "pro", "enterprise"];
        if (tierOrder.indexOf(context.tier) >= tierOrder.indexOf(requiredTier)) {
          score += 15;
        }
      }
    }
  }
  if (node.defaultHidden) {
    score -= 30;
  }
  return Math.max(0, Math.min(100, score));
}
function orderComponentsByRelevance(tree, context, scoreRelevance) {
  const scored = [];
  tree.nodes.forEach((node, id) => {
    scored.push({
      id,
      score: scoreRelevance(node, context)
    });
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.id);
}
function findHiddenComponents(tree, context, scoreRelevance) {
  const hidden = [];
  tree.nodes.forEach((node, id) => {
    const score = scoreRelevance(node, context);
    if (score === 0) {
      hidden.push(id);
    }
  });
  return hidden;
}
function computeSkeletonHints(route, context, tree) {
  let layout = "custom";
  if (route === "/" || route.includes("dashboard")) {
    layout = "dashboard";
  } else if (route.includes("chat") || route.includes("message")) {
    layout = "chat";
  } else if (route.includes("setting") || route.includes("config")) {
    layout = "settings";
  } else if (route.includes("tool")) {
    layout = "tools";
  }
  const baseHeight = context.viewport.height;
  const contentMultiplier = tree.nodes.size > 10 ? 1.5 : 1;
  const estimatedHeight = Math.round(baseHeight * contentMultiplier);
  const sections = tree.getChildren(tree.rootId).map((child, i) => ({
    id: child.id,
    height: Math.round(estimatedHeight / (tree.nodes.size || 1)),
    priority: i + 1
  }));
  return {
    layout,
    estimatedHeight,
    sections
  };
}
function getPrefetchDepth(context) {
  switch (context.connection) {
    case "fast":
    case "4g":
      return { prefetch: 5, prerender: 1 };
    case "3g":
      return { prefetch: 3, prerender: 0 };
    case "2g":
      return { prefetch: 1, prerender: 0 };
    case "slow-2g":
      return { prefetch: 0, prerender: 0 };
    default:
      return { prefetch: 3, prerender: 0 };
  }
}

class HeuristicAdapter {
  name = "heuristic";
  config;
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      tierFeatures: config.tierFeatures ?? DEFAULT_CONFIG.tierFeatures,
      signals: config.signals ?? DEFAULT_CONFIG.signals
    };
  }
  async route(path, context, tree) {
    const startTime = Date.now();
    const sessionId = this.generateSessionId(path, context);
    const featureFlags = { ...this.config.tierFeatures[context.tier] };
    const theme = this.config.signals.deriveTheme ? this.config.signals.deriveTheme(context) : defaultDeriveTheme(context);
    const accent = this.config.signals.deriveAccent ? this.config.signals.deriveAccent(context) : this.config.defaultAccent;
    const density = determineDensity(context);
    const scoreRelevance = this.config.signals.scoreRelevance ?? defaultScoreRelevance;
    const componentOrder = orderComponentsByRelevance(tree, context, scoreRelevance);
    const hiddenComponents = findHiddenComponents(tree, context, scoreRelevance);
    const predictions = this.config.signals.predictNavigation ? this.config.signals.predictNavigation(path, context) : defaultPredictNavigation(path, context, this.config.defaultPaths, this.config.maxSpeculationPaths);
    const { prefetch: prefetchDepth, prerender: prerenderCount } = getPrefetchDepth(context);
    const prefetch = predictions.slice(0, prefetchDepth);
    const prerender = predictions.slice(0, prerenderCount);
    const skeleton = computeSkeletonHints(path, context, tree);
    return {
      route: path,
      sessionId,
      componentOrder,
      hiddenComponents,
      featureFlags,
      theme,
      accent,
      density,
      prefetch,
      prerender,
      skeleton,
      routedAt: startTime,
      routerName: this.name,
      confidence: 0.85
    };
  }
  async speculate(currentPath, context) {
    return this.config.signals.predictNavigation ? this.config.signals.predictNavigation(currentPath, context) : defaultPredictNavigation(currentPath, context, this.config.defaultPaths, this.config.maxSpeculationPaths);
  }
  personalizeTree(tree, decision) {
    const cloned = tree.clone();
    if (decision.hiddenComponents) {
      for (const id of decision.hiddenComponents) {
        const node = cloned.getNode(id);
        if (node) {
          node.defaultHidden = true;
        }
      }
    }
    return cloned;
  }
  emotionToAccent(emotionState) {
    if (this.config.signals.deriveAccent) {
      return this.config.signals.deriveAccent({
        emotionState,
        tier: "free",
        recentPages: [],
        dwellTimes: new Map,
        clickPatterns: [],
        preferences: {},
        viewport: { width: 0, height: 0 },
        connection: "fast",
        reducedMotion: false,
        localHour: 12,
        timezone: "UTC",
        isNewSession: true
      });
    }
    return this.config.defaultAccent;
  }
  generateSessionId(path, context) {
    const base = path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "index";
    const userId = context.userId || "anon";
    const sessionPrefix = context.sessionId || Date.now().toString(36);
    return `${base}-${userId.slice(0, 8)}-${sessionPrefix.slice(0, 8)}`;
  }
}
// src/router/context-extractor.ts
function parseCookies(cookieHeader) {
  if (!cookieHeader)
    return {};
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}
function parseJSON(value, fallback) {
  if (!value)
    return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
function extractViewport(request) {
  const headers = request.headers;
  const viewportWidth = headers.get("sec-ch-viewport-width");
  const viewportHeight = headers.get("sec-ch-viewport-height");
  const dpr = headers.get("sec-ch-dpr");
  if (viewportWidth && viewportHeight) {
    return {
      width: parseInt(viewportWidth, 10),
      height: parseInt(viewportHeight, 10),
      devicePixelRatio: dpr ? parseFloat(dpr) : undefined
    };
  }
  const xViewport = headers.get("x-viewport");
  if (xViewport) {
    const [width, height, devicePixelRatio] = xViewport.split(",").map(Number);
    return { width: width || 1920, height: height || 1080, devicePixelRatio };
  }
  return { width: 1920, height: 1080 };
}
function extractConnection(request) {
  const headers = request.headers;
  const downlink = headers.get("downlink");
  const rtt = headers.get("rtt");
  const ect = headers.get("ect");
  if (ect) {
    switch (ect) {
      case "4g":
        return "fast";
      case "3g":
        return "3g";
      case "2g":
        return "2g";
      case "slow-2g":
        return "slow-2g";
    }
  }
  if (downlink) {
    const mbps = parseFloat(downlink);
    if (mbps >= 10)
      return "fast";
    if (mbps >= 2)
      return "4g";
    if (mbps >= 0.5)
      return "3g";
    if (mbps >= 0.1)
      return "2g";
    return "slow-2g";
  }
  if (rtt) {
    const ms = parseInt(rtt, 10);
    if (ms < 50)
      return "fast";
    if (ms < 100)
      return "4g";
    if (ms < 300)
      return "3g";
    if (ms < 700)
      return "2g";
    return "slow-2g";
  }
  return "4g";
}
function extractReducedMotion(request) {
  const prefersReducedMotion = request.headers.get("sec-ch-prefers-reduced-motion");
  return prefersReducedMotion === "reduce";
}
function extractTimeContext(request) {
  const headers = request.headers;
  const xTimezone = headers.get("x-timezone");
  const xLocalHour = headers.get("x-local-hour");
  const cfTimezone = request.cf?.timezone;
  const timezone = xTimezone || cfTimezone || "UTC";
  const localHour = xLocalHour ? parseInt(xLocalHour, 10) : new Date().getUTCHours();
  return { timezone, localHour };
}
function extractIdentity(cookies, request) {
  const userId = cookies["user_id"] || request.headers.get("x-user-id") || undefined;
  const tierCookie = cookies["user_tier"];
  const tierHeader = request.headers.get("x-user-tier");
  const tier = tierCookie || tierHeader || "free";
  const authToken = cookies["auth_token"] || request.headers.get("authorization")?.replace("Bearer ", "") || undefined;
  return { userId, tier, authToken };
}
function extractNavigationHistory(cookies) {
  const recentPages = parseJSON(cookies["recent_pages"], []);
  const dwellTimesObj = parseJSON(cookies["dwell_times"], {});
  const clickPatterns = parseJSON(cookies["click_patterns"], []);
  return {
    recentPages,
    dwellTimes: new Map(Object.entries(dwellTimesObj)),
    clickPatterns
  };
}
function extractEmotionState(cookies, request) {
  const xEmotion = request.headers.get("x-emotion-state");
  if (xEmotion) {
    return parseJSON(xEmotion, undefined);
  }
  const emotionCookie = cookies["emotion_state"];
  if (emotionCookie) {
    return parseJSON(emotionCookie, undefined);
  }
  return;
}
function extractPreferences(cookies) {
  return parseJSON(cookies["user_preferences"], {});
}
function extractSessionInfo(cookies) {
  const sessionId = cookies["session_id"];
  const sessionStarted = cookies["session_started"];
  return {
    sessionId,
    isNewSession: !sessionId,
    sessionStartedAt: sessionStarted ? new Date(sessionStarted) : undefined
  };
}
async function extractUserContext(request, options = {}) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const viewport = extractViewport(request);
  const connection = extractConnection(request);
  const reducedMotion = extractReducedMotion(request);
  const { timezone, localHour } = extractTimeContext(request);
  const {
    userId,
    tier: initialTier,
    authToken
  } = extractIdentity(cookies, request);
  const { recentPages, dwellTimes, clickPatterns } = extractNavigationHistory(cookies);
  const preferences = extractPreferences(cookies);
  const { sessionId, isNewSession, sessionStartedAt } = extractSessionInfo(cookies);
  let tier = initialTier;
  if (options.resolveUserTier && userId) {
    try {
      tier = await options.resolveUserTier(userId);
    } catch {}
  }
  let isAdmin = false;
  if (authToken && options.verifyAdminCapability) {
    try {
      isAdmin = await options.verifyAdminCapability(authToken);
    } catch {
      isAdmin = false;
    }
  }
  let emotionState = extractEmotionState(cookies, request);
  if (!emotionState && options.detectEmotion) {
    try {
      emotionState = await options.detectEmotion(request);
    } catch {}
  }
  let context = {
    userId,
    tier,
    isAdmin,
    recentPages,
    dwellTimes,
    clickPatterns,
    emotionState,
    preferences,
    viewport,
    connection,
    reducedMotion,
    localHour,
    timezone,
    sessionId,
    isNewSession,
    sessionStartedAt
  };
  if (options.enrich) {
    context = await options.enrich(context, request);
  }
  return context;
}
function createContextMiddleware(options = {}) {
  return async (request) => {
    return extractUserContext(request, options);
  };
}
function setContextCookies(response, context, currentPath) {
  const headers = new Headers(response.headers);
  const recentPages = [...context.recentPages.slice(-9), currentPath];
  headers.append("Set-Cookie", `recent_pages=${encodeURIComponent(JSON.stringify(recentPages))}; Path=/; Max-Age=604800; SameSite=Lax`);
  if (context.isNewSession) {
    const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; Max-Age=86400; SameSite=Lax`);
    headers.append("Set-Cookie", `session_started=${new Date().toISOString()}; Path=/; Max-Age=86400; SameSite=Lax`);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
function addSpeculationHeaders(response, prefetch, prerender) {
  const headers = new Headers(response.headers);
  if (prefetch.length > 0) {
    const linkHeader = prefetch.map((path) => `<${path}>; rel=prefetch`).join(", ");
    headers.append("Link", linkHeader);
  }
  if (prerender.length > 0) {
    headers.set("X-Prerender-Hints", prerender.join(","));
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
function serializeToESIState(context) {
  const tierFeatures = {
    free: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: false,
      customThemes: false,
      voiceSynthesis: false,
      imageAnalysis: false
    },
    starter: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: false,
      imageAnalysis: false
    },
    pro: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true
    },
    enterprise: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true
    },
    admin: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true
    }
  };
  const features = context.isAdmin ? tierFeatures.admin : tierFeatures[context.tier] || tierFeatures.free;
  return {
    userTier: context.tier,
    isAdmin: context.isAdmin,
    emotionState: context.emotionState ? {
      primary: context.emotionState.primary,
      valence: context.emotionState.valence,
      arousal: context.emotionState.arousal,
      confidence: context.emotionState.confidence
    } : undefined,
    preferences: {
      theme: context.preferences.theme,
      reducedMotion: context.reducedMotion,
      language: context.preferences.language
    },
    sessionId: context.sessionId,
    localHour: context.localHour,
    timezone: context.timezone,
    features,
    userId: context.userId,
    isNewSession: context.isNewSession,
    recentPages: context.recentPages.slice(-10),
    viewport: {
      width: context.viewport.width,
      height: context.viewport.height
    },
    connection: context.connection
  };
}
function generateESIStateScript(esiState) {
  const stateJson = JSON.stringify(esiState);
  return `<script>window.__AEON_ESI_STATE__=${stateJson};</script>`;
}
function generateESIStateScriptFromContext(context) {
  const esiState = serializeToESIState(context);
  return generateESIStateScript(esiState);
}
// src/router/speculation.ts
function supportsSpeculationRules() {
  if (typeof document === "undefined")
    return false;
  return "supports" in HTMLScriptElement && HTMLScriptElement.supports?.("speculationrules");
}
function supportsLinkPrefetch() {
  if (typeof document === "undefined")
    return false;
  const link = document.createElement("link");
  return link.relList?.supports?.("prefetch") ?? false;
}
function addSpeculationRules(prefetch, prerender) {
  if (!supportsSpeculationRules())
    return null;
  const rules = {};
  if (prefetch.length > 0) {
    rules.prefetch = [{ urls: prefetch }];
  }
  if (prerender.length > 0) {
    rules.prerender = [{ urls: prerender }];
  }
  if (Object.keys(rules).length === 0)
    return null;
  const script = document.createElement("script");
  script.type = "speculationrules";
  script.textContent = JSON.stringify(rules);
  document.head.appendChild(script);
  return script;
}
function removeSpeculationRules(script) {
  script.remove();
}
function linkPrefetch(path) {
  if (!supportsLinkPrefetch())
    return null;
  const existing = document.querySelector(`link[rel="prefetch"][href="${path}"]`);
  if (existing)
    return existing;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = path;
  document.head.appendChild(link);
  return link;
}
function removePrefetch(link) {
  link.remove();
}

class SpeculationManager {
  options;
  state;
  observers = new Map;
  hoverTimers = new Map;
  speculationScript = null;
  prefetchLinks = new Map;
  constructor(options = {}) {
    this.options = {
      maxPrefetch: options.maxPrefetch ?? 5,
      maxPrerender: options.maxPrerender ?? 1,
      hoverDelay: options.hoverDelay ?? 100,
      prefetchOnVisible: options.prefetchOnVisible ?? true,
      visibilityThreshold: options.visibilityThreshold ?? 0.1,
      cacheDuration: options.cacheDuration ?? 5 * 60 * 1000,
      onSpeculate: options.onSpeculate ?? (() => {})
    };
    this.state = {
      prefetched: new Set,
      prerendered: new Set,
      pending: new Set
    };
  }
  initFromHints(prefetch = [], prerender = []) {
    const newPrefetch = prefetch.filter((p) => !this.state.prefetched.has(p) && !this.state.prerendered.has(p)).slice(0, this.options.maxPrefetch);
    const newPrerender = prerender.filter((p) => !this.state.prerendered.has(p)).slice(0, this.options.maxPrerender);
    if (supportsSpeculationRules()) {
      this.speculationScript = addSpeculationRules(newPrefetch, newPrerender);
      newPrefetch.forEach((p) => {
        this.state.prefetched.add(p);
        this.options.onSpeculate(p, "prefetch");
      });
      newPrerender.forEach((p) => {
        this.state.prerendered.add(p);
        this.options.onSpeculate(p, "prerender");
      });
    } else {
      newPrefetch.forEach((path) => {
        const link = linkPrefetch(path);
        if (link) {
          this.prefetchLinks.set(path, link);
          this.state.prefetched.add(path);
          this.options.onSpeculate(path, "prefetch");
        }
      });
    }
  }
  prefetch(path) {
    if (this.state.prefetched.has(path) || this.state.prerendered.has(path)) {
      return false;
    }
    if (this.state.prefetched.size >= this.options.maxPrefetch) {
      return false;
    }
    if (supportsSpeculationRules()) {
      const allPrefetch = [...this.state.prefetched, path];
      const allPrerender = [...this.state.prerendered];
      if (this.speculationScript) {
        removeSpeculationRules(this.speculationScript);
      }
      this.speculationScript = addSpeculationRules(allPrefetch, allPrerender);
    } else {
      const link = linkPrefetch(path);
      if (link) {
        this.prefetchLinks.set(path, link);
      }
    }
    this.state.prefetched.add(path);
    this.options.onSpeculate(path, "prefetch");
    return true;
  }
  watchHover(element) {
    const path = new URL(element.href, window.location.href).pathname;
    const handleMouseEnter = () => {
      if (this.state.prefetched.has(path) || this.state.pending.has(path)) {
        return;
      }
      this.state.pending.add(path);
      const timer = setTimeout(() => {
        this.prefetch(path);
        this.state.pending.delete(path);
      }, this.options.hoverDelay);
      this.hoverTimers.set(element, timer);
    };
    const handleMouseLeave = () => {
      const timer = this.hoverTimers.get(element);
      if (timer) {
        clearTimeout(timer);
        this.hoverTimers.delete(element);
      }
      this.state.pending.delete(path);
    };
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      handleMouseLeave();
    };
  }
  watchVisible(element) {
    if (!this.options.prefetchOnVisible) {
      return () => {};
    }
    const path = new URL(element.href, window.location.href).pathname;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.prefetch(path);
          observer.disconnect();
          this.observers.delete(element);
        }
      });
    }, { threshold: this.options.visibilityThreshold });
    observer.observe(element);
    this.observers.set(element, observer);
    return () => {
      observer.disconnect();
      this.observers.delete(element);
    };
  }
  watchAllLinks() {
    const links = document.querySelectorAll('a[href^="/"]');
    const cleanups = [];
    links.forEach((link) => {
      if (link instanceof HTMLAnchorElement) {
        cleanups.push(this.watchHover(link));
        cleanups.push(this.watchVisible(link));
      }
    });
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }
  clear() {
    if (this.speculationScript) {
      removeSpeculationRules(this.speculationScript);
      this.speculationScript = null;
    }
    this.prefetchLinks.forEach((link) => removePrefetch(link));
    this.prefetchLinks.clear();
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.hoverTimers.forEach((timer) => clearTimeout(timer));
    this.hoverTimers.clear();
    this.state.prefetched.clear();
    this.state.prerendered.clear();
    this.state.pending.clear();
  }
  getState() {
    return {
      prefetched: new Set(this.state.prefetched),
      prerendered: new Set(this.state.prerendered),
      pending: new Set(this.state.pending)
    };
  }
}
function createSpeculationHook(useState5, useEffect6, useRef2) {
  return function useSpeculation(options = {}) {
    const managerRef = useRef2(null);
    const [state, setState] = useState5({
      prefetched: new Set,
      prerendered: new Set,
      pending: new Set
    });
    useEffect6(() => {
      managerRef.current = new SpeculationManager({
        ...options,
        onSpeculate: (path, type) => {
          options.onSpeculate?.(path, type);
          setState(managerRef.current.getState());
        }
      });
      const cleanup = managerRef.current.watchAllLinks();
      return () => {
        cleanup();
        managerRef.current?.clear();
      };
    }, []);
    return {
      state,
      prefetch: (path) => managerRef.current?.prefetch(path),
      initFromHints: (prefetch, prerender) => managerRef.current?.initFromHints(prefetch, prerender),
      clear: () => managerRef.current?.clear()
    };
  };
}
function autoInitSpeculation() {
  if (typeof window === "undefined")
    return null;
  const hints = window.__AEON_SPECULATION__;
  const manager = new SpeculationManager;
  if (hints) {
    manager.initFromHints(hints.prefetch || [], hints.prerender || []);
  }
  manager.watchAllLinks();
  return manager;
}

// src/router/index.ts
init_esi_control();
init_esi_control_react();
init_esi_cyrano();

// src/router/merkle-capability.ts
function parseResource(resource) {
  if (resource === "*") {
    return { type: "wildcard", value: "*" };
  }
  const colonIndex = resource.indexOf(":");
  if (colonIndex === -1) {
    return { type: "merkle", value: resource };
  }
  const prefix = resource.slice(0, colonIndex);
  const value = resource.slice(colonIndex + 1);
  switch (prefix) {
    case "merkle":
      return { type: "merkle", value };
    case "tree":
      return { type: "tree", value };
    case "path":
      return { type: "path", value };
    default:
      return { type: "merkle", value: resource };
  }
}
function formatResource(type, value) {
  if (type === "wildcard")
    return "*";
  return `${type}:${value}`;
}
function actionPermits(capabilityAction, requestedAction) {
  if (capabilityAction === "aeon:*" || capabilityAction === "aeon:node:*") {
    return true;
  }
  if (capabilityAction === "aeon:admin") {
    return true;
  }
  if (requestedAction === "read") {
    return capabilityAction === "aeon:read" || capabilityAction === "aeon:write" || capabilityAction === "aeon:node:read" || capabilityAction === "aeon:node:write";
  }
  if (requestedAction === "write") {
    return capabilityAction === "aeon:write" || capabilityAction === "aeon:node:write";
  }
  return false;
}
function pathMatches(pattern, path) {
  if (pattern === path)
    return true;
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return path.startsWith(prefix);
  }
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return path.startsWith(prefix);
  }
  return false;
}
function capabilityGrantsAccess(capability, request, action) {
  if (!actionPermits(capability.can, action)) {
    return false;
  }
  const resource = parseResource(capability.with);
  switch (resource.type) {
    case "wildcard":
      return true;
    case "merkle":
      return resource.value === request.merkleHash;
    case "tree":
      if (resource.value === request.merkleHash) {
        return true;
      }
      if (request.ancestorHashes) {
        return request.ancestorHashes.includes(resource.value);
      }
      return false;
    case "path":
      if (request.routePath) {
        return pathMatches(resource.value, request.routePath);
      }
      return false;
    default:
      return false;
  }
}
function createNodeCapabilityVerifier(token, options) {
  let cachedCapabilities = null;
  let cacheTime = 0;
  const ttl = options.cacheTtlMs ?? 5 * 60 * 1000;
  return async (request, action) => {
    if (options.verifyToken) {
      const isValid = await options.verifyToken(token);
      if (!isValid) {
        return false;
      }
    }
    const now = Date.now();
    if (!cachedCapabilities || now - cacheTime > ttl) {
      if (options.cache?.has(token)) {
        cachedCapabilities = options.cache.get(token);
      } else {
        cachedCapabilities = await options.extractCapabilities(token);
        options.cache?.set(token, cachedCapabilities);
      }
      cacheTime = now;
    }
    for (const capability of cachedCapabilities) {
      if (capabilityGrantsAccess(capability, request, action)) {
        return true;
      }
    }
    return false;
  };
}
function createNodeReadCapability(merkleHash) {
  return {
    can: "aeon:node:read",
    with: formatResource("merkle", merkleHash)
  };
}
function createNodeWriteCapability(merkleHash) {
  return {
    can: "aeon:node:write",
    with: formatResource("merkle", merkleHash)
  };
}
function createTreeCapability(merkleHash, action = "aeon:node:*") {
  return {
    can: action,
    with: formatResource("tree", merkleHash)
  };
}
function createPathCapability(routePath, action = "aeon:node:*") {
  return {
    can: action,
    with: formatResource("path", routePath)
  };
}
function createWildcardNodeCapability(action = "aeon:node:*") {
  return {
    can: action,
    with: "*"
  };
}
function checkNodeAccess(capabilities, request, action) {
  for (const capability of capabilities) {
    if (capabilityGrantsAccess(capability, request, action)) {
      return true;
    }
  }
  return false;
}
function filterAccessibleNodes(nodes, capabilities, action, routePath) {
  return nodes.filter((node) => {
    const request = {
      merkleHash: node.merkleHash,
      treePath: node.treePath,
      routePath
    };
    return checkNodeAccess(capabilities, request, action);
  });
}
function getMostSpecificCapability(capabilities, request) {
  let mostSpecific = null;
  let specificity = -1;
  for (const capability of capabilities) {
    const resource = parseResource(capability.with);
    let capSpecificity = 0;
    switch (resource.type) {
      case "merkle":
        if (resource.value === request.merkleHash) {
          capSpecificity = 4;
        }
        break;
      case "tree":
        if (resource.value === request.merkleHash) {
          capSpecificity = 3;
        } else if (request.ancestorHashes?.includes(resource.value)) {
          capSpecificity = 2;
        }
        break;
      case "path":
        if (request.routePath && pathMatches(resource.value, request.routePath)) {
          capSpecificity = 1;
        }
        break;
      case "wildcard":
        capSpecificity = 0;
        break;
    }
    if (capSpecificity > specificity) {
      specificity = capSpecificity;
      mostSpecific = capability;
    }
  }
  return mostSpecific;
}
export { AeonRouter, init_router, DEFAULT_ROUTER_CONFIG, DEFAULT_ESI_CONFIG, esiContext, esiCyrano, esiHalo, evaluateTrigger, createExhaustEntry, CYRANO_TOOL_SUGGESTIONS, getToolSuggestions, EdgeWorkersESIProcessor, esiInfer, esiEmbed, esiEmotion, esiVision, esiWithContext, generateTranslationCacheKey, getCachedTranslation, setCachedTranslation, clearTranslationCache, esiTranslate, readHeadTranslationConfig, normalizeLanguageCode, getLanguageName, getSupportedLanguages, detectTargetLanguage, translateWithAIGateway, generateSchemaPrompt, parseWithSchema, createControlProcessor, esiIf, esiMatch, ESIStructured, ESIIf, ESICase, ESIDefault, ESIMatch, ESICollaborative, ESIReflect, ESIOptimize, ESIAuto, ESIShow, ESIHide, ESIWhen, ESIUnless, ESITierGate, ESIEmotionGate, ESITimeGate, ESIABTest, ESIForEach, ESIFirst, ESIClamp, ESISelect, ESIScore, ESIControl, TranslationContext, TranslationProvider, useTranslation, useTranslationOptional, ESITranslate, NavigationCache, getNavigationCache, setNavigationCache, SkeletonCache, getWithSkeleton, getSkeletonCache, setSkeletonCache, init_cache, AeonNavigationEngine, getNavigator, setNavigator, init_navigation, ESIProvider, useESI, ESIInfer, ESIEmbed, ESIEmotion, ESIVision, useESIInfer, useGlobalESIState, useESIFeature, useESITier, useESIEmotionState, useESIPreferences, updateGlobalESIState, useNavigation, ESI, TranslationObserver, useTranslationObserver, initTranslationObserver, HeuristicAdapter, extractUserContext, createContextMiddleware, setContextCookies, addSpeculationHeaders, serializeToESIState, generateESIStateScript, generateESIStateScriptFromContext, supportsSpeculationRules, supportsLinkPrefetch, SpeculationManager, createSpeculationHook, autoInitSpeculation, parseResource, formatResource, capabilityGrantsAccess, createNodeCapabilityVerifier, createNodeReadCapability, createNodeWriteCapability, createTreeCapability, createPathCapability, createWildcardNodeCapability, checkNodeAccess, filterAccessibleNodes, getMostSpecificCapability };
