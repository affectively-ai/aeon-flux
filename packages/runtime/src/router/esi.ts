/**
 * Edge Side Inference (ESI) Processor
 *
 * Like Varnish ESI but for AI - brings inference to the edge at render time.
 * Components can embed AI directly in templates for dynamic, personalized content.
 */

import type {
  ESIConfig,
  ESIContent,
  ESIDirective,
  ESIModel,
  ESIParams,
  ESIProcessor,
  ESIResult,
  UserContext,
  UserTier,
  DEFAULT_ESI_CONFIG,
} from './types';

// ============================================================================
// Cache for ESI results
// ============================================================================

interface CacheEntry {
  result: ESIResult;
  expiresAt: number;
}

const esiCache = new Map<string, CacheEntry>();

function getCacheKey(directive: ESIDirective, context: UserContext): string {
  // Include context signals in cache key if context-aware
  const contextParts = directive.contextAware
    ? [
        context.tier,
        context.emotionState?.primary,
        context.localHour,
      ].join(':')
    : '';

  return directive.cacheKey ||
    `esi:${directive.params.model}:${directive.content.value}:${contextParts}`;
}

function getCached(key: string): ESIResult | null {
  const entry = esiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    esiCache.delete(key);
    return null;
  }
  return { ...entry.result, cached: true };
}

function setCache(key: string, result: ESIResult, ttl: number): void {
  if (ttl <= 0) return;
  esiCache.set(key, {
    result,
    expiresAt: Date.now() + ttl * 1000,
  });
}

// ============================================================================
// Context Interpolation
// ============================================================================

function interpolatePrompt(
  content: ESIContent,
  context: UserContext,
  signals: string[] = []
): string {
  let prompt = content.value;

  // Replace template variables
  if (content.type === 'template' && content.variables) {
    for (const [key, value] of Object.entries(content.variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }
  }

  // Inject context if signals specified
  if (signals.length > 0) {
    const contextParts: string[] = [];

    if (signals.includes('emotion') && context.emotionState) {
      contextParts.push(
        `User emotion: ${context.emotionState.primary} ` +
        `(valence: ${context.emotionState.valence.toFixed(2)}, ` +
        `arousal: ${context.emotionState.arousal.toFixed(2)})`
      );
    }

    if (signals.includes('preferences') && Object.keys(context.preferences).length > 0) {
      contextParts.push(`User preferences: ${JSON.stringify(context.preferences)}`);
    }

    if (signals.includes('history') && context.recentPages.length > 0) {
      contextParts.push(`Recent pages: ${context.recentPages.slice(-5).join(', ')}`);
    }

    if (signals.includes('time')) {
      contextParts.push(
        `Local time: ${context.localHour}:00, Timezone: ${context.timezone}`
      );
    }

    if (signals.includes('device')) {
      contextParts.push(
        `Device: ${context.viewport.width}x${context.viewport.height}, ` +
        `Connection: ${context.connection}`
      );
    }

    if (contextParts.length > 0) {
      prompt = `[Context]\n${contextParts.join('\n')}\n\n[Task]\n${prompt}`;
    }
  }

  return prompt;
}

// ============================================================================
// Tier Enforcement
// ============================================================================

function checkTierAccess(
  directive: ESIDirective,
  context: UserContext,
  config: ESIConfig
): { allowed: boolean; reason?: string } {
  const tierLimits = config.tierLimits?.[context.tier];
  if (!tierLimits) {
    return { allowed: true };
  }

  // Check if model is allowed
  if (!tierLimits.allowedModels.includes(directive.params.model)) {
    return {
      allowed: false,
      reason: `Model '${directive.params.model}' not available for ${context.tier} tier`,
    };
  }

  // Check token limit
  if (directive.params.maxTokens && directive.params.maxTokens > tierLimits.maxTokens) {
    return {
      allowed: false,
      reason: `Token limit ${directive.params.maxTokens} exceeds ${context.tier} tier max of ${tierLimits.maxTokens}`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// Edge Workers ESI Processor
// ============================================================================

export class EdgeWorkersESIProcessor implements ESIProcessor {
  name = 'edge-workers';
  private config: ESIConfig;
  private warmupPromise?: Promise<void>;

  constructor(config: Partial<ESIConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      endpoint: config.endpoint || process.env.ESI_ENDPOINT || '',
      timeout: config.timeout ?? 5000,
      defaultCacheTtl: config.defaultCacheTtl ?? 300,
      maxConcurrent: config.maxConcurrent ?? 5,
      warmupModels: config.warmupModels,
      tierLimits: config.tierLimits,
    };
  }

  async warmup(): Promise<void> {
    if (this.warmupPromise) return this.warmupPromise;

    this.warmupPromise = (async () => {
      if (!this.config.warmupModels?.length) return;

      // Ping the endpoint to warm up models
      await Promise.all(
        this.config.warmupModels.map(model =>
          fetch(`${this.config.endpoint}/api/warmup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model }),
          }).catch(() => {}) // Ignore warmup failures
        )
      );
    })();

    return this.warmupPromise;
  }

  isModelAvailable(model: ESIModel): boolean {
    // All models available through edge-workers
    return ['llm', 'embed', 'vision', 'tts', 'stt', 'emotion', 'classify', 'custom'].includes(model);
  }

  async process(
    directive: ESIDirective,
    context: UserContext
  ): Promise<ESIResult> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = getCacheKey(directive, context);
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }

    // Check tier access
    const access = checkTierAccess(directive, context, this.config);
    if (!access.allowed) {
      return {
        id: directive.id,
        success: false,
        error: access.reason,
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model,
      };
    }

    // Interpolate prompt with context
    const prompt = directive.contextAware
      ? interpolatePrompt(directive.content, context, directive.signals)
      : directive.content.value;

    try {
      const result = await this.callEdgeWorkers(directive, prompt);

      // Cache successful results
      const cacheTtl = directive.params.cacheTtl ?? this.config.defaultCacheTtl;
      setCache(cacheKey, result, cacheTtl);

      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      // Return fallback if provided
      if (directive.params.fallback) {
        return {
          id: directive.id,
          success: true,
          output: directive.params.fallback,
          latencyMs: Date.now() - startTime,
          cached: false,
          model: directive.params.model,
        };
      }

      return {
        id: directive.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model,
      };
    }
  }

  async processBatch(
    directives: ESIDirective[],
    context: UserContext
  ): Promise<ESIResult[]> {
    // Process with controlled concurrency
    const semaphore = new Semaphore(this.config.maxConcurrent);

    return Promise.all(
      directives.map(async (directive) => {
        await semaphore.acquire();
        try {
          return await this.process(directive, context);
        } finally {
          semaphore.release();
        }
      })
    );
  }

  async stream(
    directive: ESIDirective,
    context: UserContext,
    onChunk: (chunk: string) => void
  ): Promise<ESIResult> {
    const startTime = Date.now();

    // Check tier access
    const access = checkTierAccess(directive, context, this.config);
    if (!access.allowed) {
      return {
        id: directive.id,
        success: false,
        error: access.reason,
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model,
      };
    }

    const prompt = directive.contextAware
      ? interpolatePrompt(directive.content, context, directive.signals)
      : directive.content.value;

    try {
      const response = await fetch(`${this.config.endpoint}/api/llm/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: prompt,
          model: directive.params.variant,
          options: {
            temperature: directive.params.temperature,
            max_tokens: directive.params.maxTokens,
            stop: directive.params.stop,
            top_p: directive.params.topP,
            system: directive.params.system,
          },
        }),
        signal: AbortSignal.timeout(directive.params.timeout ?? this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullOutput = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
        model: directive.params.variant || directive.params.model,
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
          model: directive.params.model,
        };
      }

      return {
        id: directive.id,
        success: false,
        error: error instanceof Error ? error.message : 'Stream failed',
        latencyMs: Date.now() - startTime,
        cached: false,
        model: directive.params.model,
      };
    }
  }

  private async callEdgeWorkers(
    directive: ESIDirective,
    prompt: string
  ): Promise<ESIResult> {
    const endpoint = this.getEndpointForModel(directive.params.model);

    const response = await fetch(`${this.config.endpoint}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildRequestBody(directive, prompt)),
      signal: AbortSignal.timeout(directive.params.timeout ?? this.config.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ESI inference failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(directive, data);
  }

  private getEndpointForModel(model: ESIModel): string {
    switch (model) {
      case 'llm': return '/api/llm/infer';
      case 'embed': return '/api/embed';
      case 'vision': return '/api/vision';
      case 'tts': return '/api/tts';
      case 'stt': return '/api/stt';
      case 'emotion': return '/api/emotion';
      case 'classify': return '/api/classify';
      case 'custom': return '/api/custom';
      default: return '/api/llm/infer';
    }
  }

  private buildRequestBody(directive: ESIDirective, prompt: string): Record<string, unknown> {
    const { params, content } = directive;

    const body: Record<string, unknown> = {
      input: content.type === 'base64' ? content.value : prompt,
      model: params.variant,
    };

    if (params.model === 'llm') {
      body.options = {
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        stop: params.stop,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        system: params.system,
      };
    }

    if (params.custom) {
      body.custom = params.custom;
    }

    return body;
  }

  private parseResponse(directive: ESIDirective, data: Record<string, unknown>): ESIResult {
    const base: ESIResult = {
      id: directive.id,
      success: true,
      latencyMs: 0,
      cached: false,
      model: String(data.model || directive.params.model),
    };

    switch (directive.params.model) {
      case 'embed':
        return { ...base, embedding: data.embedding as number[] };
      case 'tts':
        return { ...base, audio: data.audio as ArrayBuffer };
      default:
        return {
          ...base,
          output: String(data.output || data.text || data.result || ''),
          tokens: data.tokens as ESIResult['tokens'],
        };
    }
  }
}

// ============================================================================
// Simple Semaphore for concurrency control
// ============================================================================

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }
}

// ============================================================================
// ESI Helper Functions
// ============================================================================

/**
 * Create an ESI directive for LLM inference
 */
export function esiInfer(
  prompt: string,
  options: Partial<ESIParams> = {}
): ESIDirective {
  return {
    id: `esi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: 'llm',
      ...options,
    },
    content: {
      type: 'text',
      value: prompt,
    },
    contextAware: options.system?.includes('{context}'),
  };
}

/**
 * Create an ESI directive for embeddings
 */
export function esiEmbed(text: string): ESIDirective {
  return {
    id: `esi-embed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: { model: 'embed' },
    content: { type: 'text', value: text },
  };
}

/**
 * Create an ESI directive for emotion detection
 */
export function esiEmotion(text: string, contextAware = true): ESIDirective {
  return {
    id: `esi-emotion-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: { model: 'emotion' },
    content: { type: 'text', value: text },
    contextAware,
    signals: contextAware ? ['emotion', 'history'] : undefined,
  };
}

/**
 * Create an ESI directive for vision (image analysis)
 */
export function esiVision(
  base64Image: string,
  prompt: string,
  options: Partial<ESIParams> = {}
): ESIDirective {
  return {
    id: `esi-vision-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: 'vision',
      system: prompt,
      ...options,
    },
    content: { type: 'base64', value: base64Image },
  };
}

/**
 * Create a context-aware ESI directive
 * Automatically injects user context into the prompt
 */
export function esiWithContext(
  prompt: string,
  signals: ESIDirective['signals'] = ['emotion', 'preferences', 'time'],
  options: Partial<ESIParams> = {}
): ESIDirective {
  return {
    id: `esi-ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: 'llm',
      ...options,
    },
    content: { type: 'text', value: prompt },
    contextAware: true,
    signals,
  };
}

// ============================================================================
// Cyrano Whisper Channel (Re-exports)
// ============================================================================

export {
  esiContext,
  esiCyrano,
  esiHalo,
  evaluateTrigger,
  createExhaustEntry,
  getToolSuggestions,
} from './esi-cyrano';

export type {
  SessionContext,
  EmotionContext,
  BehaviorContext,
  EnvironmentContext,
  BiometricContext,
  CyranoWhisperConfig,
  CyranoIntent,
  CyranoTone,
  CyranoTrigger,
  HaloInsightConfig,
  HaloObservation,
  HaloAction,
  ChatExhaustType,
  ChatExhaustEntry,
  ESIWhisperResult,
} from './esi-cyrano';

// ============================================================================
// Exports
// ============================================================================

export { ESIConfig, ESIDirective, ESIResult, ESIProcessor, ESIModel };
