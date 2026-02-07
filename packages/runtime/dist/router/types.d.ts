/**
 * Router Types for Aeon Flux
 *
 * Defines the core types for the personalized routing system.
 */
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
    related?: Array<{
        emotion: string;
        intensity: number;
    }>;
}
export interface Viewport {
    width: number;
    height: number;
    devicePixelRatio?: number;
}
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'fast';
export type UserTier = 'free' | 'starter' | 'pro' | 'enterprise';
export interface UserContext {
    userId?: string;
    tier: UserTier;
    recentPages: string[];
    dwellTimes: Map<string, number>;
    clickPatterns: string[];
    emotionState?: EmotionState;
    preferences: Record<string, unknown>;
    viewport: Viewport;
    connection: ConnectionType;
    reducedMotion: boolean;
    localHour: number;
    timezone: string;
    sessionId?: string;
    isNewSession: boolean;
    sessionStartedAt?: Date;
}
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
    route: string;
    sessionId: string;
    componentOrder?: string[];
    hiddenComponents?: string[];
    featureFlags?: Record<string, boolean>;
    theme?: ThemeMode;
    accent?: string;
    density?: LayoutDensity;
    prefetch?: string[];
    prerender?: string[];
    skeleton?: SkeletonHints;
    routedAt: number;
    routerName: string;
    confidence: number;
}
export interface ComponentNode {
    id: string;
    type: string;
    props?: Record<string, unknown>;
    children?: string[];
    requiredTier?: UserTier;
    relevanceSignals?: string[];
    defaultHidden?: boolean;
}
export interface ComponentTree {
    rootId: string;
    nodes: Map<string, ComponentNode>;
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
export interface RouterAdapter {
    /** Adapter name for logging/debugging */
    name: string;
    /**
     * Route a request with user context
     * Returns personalized routing decision
     */
    route(path: string, context: UserContext, tree: ComponentTree): Promise<RouteDecision>;
    /**
     * Speculate likely next paths for prefetching
     * Returns ordered list of probable next routes
     */
    speculate(currentPath: string, context: UserContext): Promise<string[]>;
    /**
     * Apply personalization to component tree
     * Returns modified tree based on route decision
     */
    personalizeTree(tree: ComponentTree, decision: RouteDecision): ComponentTree;
    /**
     * Compute accent color from emotion state
     */
    emotionToAccent?(emotionState: EmotionState): string;
}
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
export declare const DEFAULT_ROUTER_CONFIG: RouterConfig;
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
export type ESIModel = 'llm' | 'embed' | 'vision' | 'tts' | 'stt' | 'emotion' | 'classify' | 'custom';
export type ESIContentType = 'text' | 'base64' | 'json' | 'template';
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
    /** Cache key for this directive (auto-generated if not provided) */
    cacheKey?: string;
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
    process(directive: ESIDirective, context: UserContext): Promise<ESIResult>;
    /** Process multiple directives (batch optimization) */
    processBatch(directives: ESIDirective[], context: UserContext): Promise<ESIResult[]>;
    /** Stream inference result */
    stream?(directive: ESIDirective, context: UserContext, onChunk: (chunk: string) => void): Promise<ESIResult>;
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
export declare const DEFAULT_ESI_CONFIG: ESIConfig;
export interface RouterConfigWithESI extends RouterConfig {
    esi?: ESIConfig;
}
/** Presence info for a user/agent */
export interface PresenceUser {
    /** User or agent ID */
    userId: string;
    /** User or agent role */
    role: 'user' | 'assistant' | 'monitor' | 'admin';
    /** Cursor position */
    cursor?: {
        x: number;
        y: number;
    };
    /** Currently editing element path */
    editingPath?: string;
    /** User display name */
    name?: string;
    /** Avatar URL or initials */
    avatar?: string;
    /** Last active timestamp */
    lastActive?: Date;
    /** Is this a real-time presence (vs cached) */
    isLive?: boolean;
    /** User status (online, idle, etc.) */
    status?: 'online' | 'idle' | 'away' | 'busy' | 'offline';
}
