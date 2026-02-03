/**
 * Router Types for Aeon Flux
 *
 * Defines the core types for the personalized routing system.
 */

// ============================================================================
// User Context
// ============================================================================

export interface EmotionState {
  /** Primary detected emotion */
  primary: string;
  /** Valence: negative (-1) to positive (1) */
  valence: number;
  /** Arousal: calm (0) to excited (1) */
  arousal: number;
  /** Confidence in detection (0-1) */
  confidence: number;
  /** Related emotions with intensity */
  related?: Array<{ emotion: string; intensity: number }>;
}

export interface Viewport {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'fast';
export type UserTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface UserContext {
  // Identity
  userId?: string;
  tier: UserTier;

  // Behavioral signals
  recentPages: string[];
  dwellTimes: Map<string, number>;
  clickPatterns: string[];

  // Emotional/cognitive state (from edge-workers)
  emotionState?: EmotionState;

  // Explicit preferences
  preferences: Record<string, unknown>;

  // Device context
  viewport: Viewport;
  connection: ConnectionType;
  reducedMotion: boolean;

  // Time context
  localHour: number;
  timezone: string;

  // Session info
  sessionId?: string;
  isNewSession: boolean;
  sessionStartedAt?: Date;
}

// ============================================================================
// Route Decision
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'auto';
export type LayoutDensity = 'compact' | 'normal' | 'comfortable';
export type LayoutType = 'dashboard' | 'chat' | 'settings' | 'tools' | 'marketing' | 'custom';

export interface SkeletonHints {
  layout: LayoutType;
  estimatedHeight: number;
  sections?: Array<{
    id: string;
    height: number;
    priority: number;
  }>;
}

export interface RouteDecision {
  // Primary route
  route: string;
  sessionId: string;

  // Personalization
  componentOrder?: string[];
  hiddenComponents?: string[];
  featureFlags?: Record<string, boolean>;

  // Theming
  theme?: ThemeMode;
  accent?: string;
  density?: LayoutDensity;

  // Speculation hints
  prefetch?: string[];
  prerender?: string[];

  // Skeleton hints
  skeleton?: SkeletonHints;

  // Metadata
  routedAt: number;
  routerName: string;
  confidence: number;
}

// ============================================================================
// Component Tree (simplified for routing)
// ============================================================================

export interface ComponentNode {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
  // Personalization metadata
  requiredTier?: UserTier;
  relevanceSignals?: string[];
  defaultHidden?: boolean;
}

export interface ComponentTree {
  rootId: string;
  nodes: Map<string, ComponentNode>;

  // Methods
  getNode(id: string): ComponentNode | undefined;
  getChildren(id: string): ComponentNode[];
  getSchema(): ComponentTreeSchema;
  clone(): ComponentTree;
}

export interface ComponentTreeSchema {
  rootId: string;
  nodeCount: number;
  nodeTypes: string[];
  depth: number;
}

// ============================================================================
// Router Adapter Interface
// ============================================================================

export interface RouterAdapter {
  /** Adapter name for logging/debugging */
  name: string;

  /**
   * Route a request with user context
   * Returns personalized routing decision
   */
  route(
    path: string,
    context: UserContext,
    tree: ComponentTree
  ): Promise<RouteDecision>;

  /**
   * Speculate likely next paths for prefetching
   * Returns ordered list of probable next routes
   */
  speculate(
    currentPath: string,
    context: UserContext
  ): Promise<string[]>;

  /**
   * Apply personalization to component tree
   * Returns modified tree based on route decision
   */
  personalizeTree(
    tree: ComponentTree,
    decision: RouteDecision
  ): ComponentTree;

  /**
   * Compute accent color from emotion state
   */
  emotionToAccent?(emotionState: EmotionState): string;
}

// ============================================================================
// Router Configuration
// ============================================================================

export interface AIRouterConfig {
  endpoint: string;
  timeout: number;
  fallbackToHeuristic: boolean;
}

export interface SpeculationConfig {
  enabled: boolean;
  depth: number;
  prerenderTop: number;
  maxPrefetch: number;
}

export interface PersonalizationConfig {
  featureGating: boolean;
  emotionTheming: boolean;
  componentOrdering: boolean;
  densityAdaptation: boolean;
}

export interface RouterConfig {
  adapter: 'heuristic' | 'ai' | 'hybrid' | RouterAdapter;
  ai?: AIRouterConfig;
  speculation?: SpeculationConfig;
  personalization?: PersonalizationConfig;
}

export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  adapter: 'heuristic',
  speculation: {
    enabled: true,
    depth: 2,
    prerenderTop: 1,
    maxPrefetch: 5,
  },
  personalization: {
    featureGating: true,
    emotionTheming: true,
    componentOrdering: true,
    densityAdaptation: true,
  },
};

// ============================================================================
// Edge Side Inference (ESI)
// ============================================================================

/**
 * ESI - Edge Side Inference
 *
 * Like Varnish's ESI (Edge Side Includes) but for AI inference.
 * Components can invoke edge inference at render time, embedding AI
 * directly in templates.
 *
 * Example usage in templates:
 * ```tsx
 * <ESI.Infer model="llm" prompt="Greet the user warmly" />
 * <ESI.Infer model="llm">Summarize: {content}</ESI.Infer>
 * <ESI.Embed>Some text to embed</ESI.Embed>
 * <ESI.Emotion>How is the user feeling?</ESI.Emotion>
 * ```
 */

export type ESIModel =
  | 'llm'           // Text generation
  | 'embed'         // Embeddings
  | 'vision'        // Image analysis
  | 'tts'           // Text-to-speech
  | 'stt'           // Speech-to-text
  | 'emotion'       // Emotion detection
  | 'classify'      // Classification
  | 'custom';       // Custom model

export type ESIContentType =
  | 'text'          // Plain text prompt
  | 'base64'        // Base64 encoded (images, audio)
  | 'json'          // Structured data
  | 'template';     // Template with interpolation

export interface ESIParams {
  /** Model to use for inference */
  model: ESIModel;

  /** Specific model variant (e.g., 'gpt-4', 'mistral-7b') */
  variant?: string;

  /** Temperature for generation (0-2) */
  temperature?: number;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Stop sequences */
  stop?: string[];

  /** Top-p sampling */
  topP?: number;

  /** Frequency penalty */
  frequencyPenalty?: number;

  /** Presence penalty */
  presencePenalty?: number;

  /** System prompt for context */
  system?: string;

  /** Enable streaming response */
  stream?: boolean;

  /** Cache duration in seconds (0 = no cache) */
  cacheTtl?: number;

  /** Cache key (auto-generated if not provided) */
  cacheKey?: string;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Fallback content if inference fails */
  fallback?: string;

  /** Custom parameters for the model */
  custom?: Record<string, unknown>;
}

export interface ESIContent {
  /** Content type */
  type: ESIContentType;

  /** The actual content (prompt, base64 data, etc.) */
  value: string;

  /** Template variables for interpolation */
  variables?: Record<string, unknown>;
}

export interface ESIDirective {
  /** Unique ID for this ESI directive */
  id: string;

  /** Inference parameters */
  params: ESIParams;

  /** Content to process */
  content: ESIContent;

  /** Required user tier (for feature gating) */
  requiredTier?: UserTier;

  /** Context-aware: inject UserContext into prompt */
  contextAware?: boolean;

  /** Personalization signals to include */
  signals?: Array<'emotion' | 'preferences' | 'history' | 'time' | 'device'>;
}

export interface ESIResult {
  /** Directive ID */
  id: string;

  /** Success status */
  success: boolean;

  /** Generated output */
  output?: string;

  /** For embeddings */
  embedding?: number[];

  /** For audio (TTS) */
  audio?: ArrayBuffer;

  /** Error message if failed */
  error?: string;

  /** Inference latency in ms */
  latencyMs: number;

  /** Was result from cache */
  cached: boolean;

  /** Model used */
  model: string;

  /** Tokens used (if applicable) */
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface ESIProcessor {
  /** Processor name */
  name: string;

  /** Process a single ESI directive */
  process(
    directive: ESIDirective,
    context: UserContext
  ): Promise<ESIResult>;

  /** Process multiple directives (batch optimization) */
  processBatch(
    directives: ESIDirective[],
    context: UserContext
  ): Promise<ESIResult[]>;

  /** Stream inference result */
  stream?(
    directive: ESIDirective,
    context: UserContext,
    onChunk: (chunk: string) => void
  ): Promise<ESIResult>;

  /** Warm up the processor (pre-load models, etc.) */
  warmup?(): Promise<void>;

  /** Check if a model is available */
  isModelAvailable(model: ESIModel): boolean;
}

export interface ESIConfig {
  /** Enable ESI processing */
  enabled: boolean;

  /** Edge inference endpoint */
  endpoint: string;

  /** Default timeout for inference */
  timeout: number;

  /** Default cache TTL */
  defaultCacheTtl: number;

  /** Maximum concurrent inferences */
  maxConcurrent: number;

  /** Models to pre-warm */
  warmupModels?: ESIModel[];

  /** Custom processor (plugin architecture) */
  processor?: ESIProcessor;

  /** Feature gating by tier */
  tierLimits?: Record<UserTier, {
    maxInferencesPerRequest: number;
    allowedModels: ESIModel[];
    maxTokens: number;
  }>;
}

export const DEFAULT_ESI_CONFIG: ESIConfig = {
  enabled: false, // Optional plugin - disabled by default
  endpoint: process.env.ESI_ENDPOINT || '', // Must be configured by app
  timeout: 5000,
  defaultCacheTtl: 300, // 5 minutes
  maxConcurrent: 5,
  warmupModels: ['llm'],
  // Default tier limits - override in your app config
  tierLimits: {
    free: {
      maxInferencesPerRequest: 2,
      allowedModels: ['llm', 'embed'],
      maxTokens: 500,
    },
    starter: {
      maxInferencesPerRequest: 5,
      allowedModels: ['llm', 'embed', 'classify'],
      maxTokens: 1000,
    },
    pro: {
      maxInferencesPerRequest: 20,
      allowedModels: ['llm', 'embed', 'classify', 'vision', 'tts'],
      maxTokens: 4000,
    },
    enterprise: {
      maxInferencesPerRequest: 100,
      allowedModels: ['llm', 'embed', 'classify', 'vision', 'tts', 'stt', 'custom'],
      maxTokens: 32000,
    },
  },
};

// Extended router config with ESI
export interface RouterConfigWithESI extends RouterConfig {
  esi?: ESIConfig;
}
