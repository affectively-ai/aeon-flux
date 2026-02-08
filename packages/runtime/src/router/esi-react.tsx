/**
 * ESI React Components
 *
 * Bring AI to templates with declarative components.
 *
 * @example
 * ```tsx
 * import { ESI } from '@affectively/aeon-flux/esi';
 *
 * function PersonalizedGreeting() {
 *   return (
 *     <ESI.Infer
 *       model="llm"
 *       contextAware
 *       signals={['emotion', 'time']}
 *     >
 *       Generate a warm greeting for the user
 *     </ESI.Infer>
 *   );
 * }
 *
 * function EmotionAwareContent({ content }) {
 *   return (
 *     <ESI.Infer
 *       model="llm"
 *       temperature={0.7}
 *       fallback="Here's today's content..."
 *     >
 *       {`Adapt this content to be emotionally supportive: ${content}`}
 *     </ESI.Infer>
 *   );
 * }
 * ```
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
  type FC,
} from 'react';
import type {
  ESIConfig,
  ESIDirective,
  ESIModel,
  ESIParams,
  ESIProcessor,
  ESIResult,
  UserContext,
} from './types';
import { EdgeWorkersESIProcessor, esiInfer, esiEmbed, esiEmotion, esiVision, esiWithContext } from './esi';

// Import control components for ESI namespace extension
import {
  ESIStructured,
  ESIIf,
  ESIShow,
  ESIHide,
  ESIWhen,
  ESIUnless,
  ESIMatch,
  ESICase,
  ESIDefault,
  ESIFirst,
  ESITierGate,
  ESIEmotionGate,
  ESITimeGate,
  ESIForEach,
  ESISelect,
  ESIABTest,
  ESIClamp,
  ESIScore,
  ESICollaborative,
  ESIReflect,
  ESIOptimize,
  ESIAuto,
} from './esi-control-react';

// Import format components for ESI namespace extension
import {
  ESIMarkdown,
  ESILatex,
  ESIJson,
  ESIPlaintext,
  ESICode,
} from './esi-format-react';

// ============================================================================
// ESI Context
// ============================================================================

interface ESIContextValue {
  processor: ESIProcessor;
  userContext: UserContext | null;
  enabled: boolean;
  process: (directive: ESIDirective) => Promise<ESIResult>;
  processWithStream: (
    directive: ESIDirective,
    onChunk: (chunk: string) => void
  ) => Promise<ESIResult>;
}

const ESIContext = createContext<ESIContextValue | null>(null);

export interface ESIProviderProps {
  children: ReactNode;
  config?: Partial<ESIConfig>;
  userContext?: UserContext;
  processor?: ESIProcessor;
}

/**
 * ESI Provider - enables ESI components in the tree
 */
export const ESIProvider: FC<ESIProviderProps> = ({
  children,
  config,
  userContext,
  processor: customProcessor,
}) => {
  const [processor] = useState(
    () => customProcessor || new EdgeWorkersESIProcessor(config)
  );

  useEffect(() => {
    processor.warmup?.();
  }, [processor]);

  const process = useCallback(
    async (directive: ESIDirective) => {
      if (!userContext) {
        return {
          id: directive.id,
          success: false,
          error: 'No user context available',
          latencyMs: 0,
          cached: false,
          model: directive.params.model,
        };
      }
      return processor.process(directive, userContext);
    },
    [processor, userContext]
  );

  const processWithStream = useCallback(
    async (directive: ESIDirective, onChunk: (chunk: string) => void) => {
      if (!userContext) {
        return {
          id: directive.id,
          success: false,
          error: 'No user context available',
          latencyMs: 0,
          cached: false,
          model: directive.params.model,
        };
      }
      if (!processor.stream) {
        return processor.process(directive, userContext);
      }
      return processor.stream(directive, userContext, onChunk);
    },
    [processor, userContext]
  );

  return (
    <ESIContext.Provider
      value={{
        processor,
        userContext: userContext || null,
        enabled: config?.enabled ?? true,
        process,
        processWithStream,
      }}
    >
      {children}
    </ESIContext.Provider>
  );
};

/**
 * Hook to access ESI context
 */
export function useESI() {
  const ctx = useContext(ESIContext);
  if (!ctx) {
    throw new Error('useESI must be used within an ESIProvider');
  }
  return ctx;
}

// ============================================================================
// ESI Components
// ============================================================================

export interface ESIInferProps {
  /** The prompt - can be children or explicit prop */
  children?: ReactNode;
  prompt?: string;

  /** Model to use */
  model?: ESIModel;

  /** Model variant */
  variant?: string;

  /** Temperature for generation */
  temperature?: number;

  /** Maximum tokens */
  maxTokens?: number;

  /** System prompt */
  system?: string;

  /** Enable streaming */
  stream?: boolean;

  /** Fallback content if inference fails */
  fallback?: ReactNode;

  /** Loading content */
  loading?: ReactNode;

  /** Inject user context */
  contextAware?: boolean;

  /** Context signals to include */
  signals?: Array<'emotion' | 'preferences' | 'history' | 'time' | 'device'>;

  /** Cache TTL in seconds */
  cacheTtl?: number;

  /** Custom render function */
  render?: (result: ESIResult) => ReactNode;

  /** Class name for wrapper */
  className?: string;

  /** Callback when inference completes */
  onComplete?: (result: ESIResult) => void;

  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * ESI Inference Component
 *
 * @example
 * ```tsx
 * <ESI.Infer model="llm" temperature={0.7}>
 *   Write a haiku about React
 * </ESI.Infer>
 * ```
 */
export const ESIInfer: FC<ESIInferProps> = ({
  children,
  prompt,
  model = 'llm',
  variant,
  temperature,
  maxTokens,
  system,
  stream = false,
  fallback,
  loading = '...',
  contextAware = false,
  signals,
  cacheTtl,
  render,
  className,
  onComplete,
  onError,
}) => {
  const { process, processWithStream, enabled } = useESI();
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const promptText = prompt || (typeof children === 'string' ? children : String(children || ''));

  useEffect(() => {
    if (!enabled) {
      setOutput(typeof fallback === 'string' ? fallback : '');
      setIsLoading(false);
      return;
    }

    const directive: ESIDirective = contextAware
      ? esiWithContext(promptText, signals, {
          model,
          variant,
          temperature,
          maxTokens,
          system,
          cacheTtl,
          fallback: typeof fallback === 'string' ? fallback : undefined,
        })
      : esiInfer(promptText, {
          model,
          variant,
          temperature,
          maxTokens,
          system,
          cacheTtl,
          fallback: typeof fallback === 'string' ? fallback : undefined,
        });

    if (stream) {
      setOutput('');
      processWithStream(directive, (chunk) => {
        setOutput((prev) => prev + chunk);
      }).then((result) => {
        setIsLoading(false);
        if (!result.success) {
          setError(result.error || 'Inference failed');
          onError?.(result.error || 'Inference failed');
        }
        onComplete?.(result);
      });
    } else {
      process(directive).then((result) => {
        setIsLoading(false);
        if (result.success && result.output) {
          setOutput(result.output);
        } else {
          setError(result.error || 'Inference failed');
          onError?.(result.error || 'Inference failed');
        }
        onComplete?.(result);
      });
    }
  }, [promptText, model, variant, temperature, maxTokens, system, contextAware, stream, enabled]);

  if (isLoading && !stream) {
    return <span className={className}>{loading}</span>;
  }

  if (error && fallback) {
    return <span className={className}>{fallback}</span>;
  }

  if (render) {
    return (
      <span className={className}>
        {render({
          id: '',
          success: !error,
          output,
          error: error || undefined,
          latencyMs: 0,
          cached: false,
          model,
        })}
      </span>
    );
  }

  return <span className={className}>{output || (isLoading ? loading : '')}</span>;
};

export interface ESIEmbedProps {
  children: ReactNode;
  onComplete?: (embedding: number[]) => void;
  onError?: (error: string) => void;
}

/**
 * ESI Embed Component - generates embeddings
 *
 * @example
 * ```tsx
 * <ESI.Embed onComplete={(embedding) => console.log(embedding)}>
 *   Text to embed
 * </ESI.Embed>
 * ```
 */
export const ESIEmbed: FC<ESIEmbedProps> = ({ children, onComplete, onError }) => {
  const { process, enabled } = useESI();
  const text = typeof children === 'string' ? children : String(children || '');

  useEffect(() => {
    if (!enabled) return;

    const directive = esiEmbed(text);
    process(directive).then((result) => {
      if (result.success && result.embedding) {
        onComplete?.(result.embedding);
      } else {
        onError?.(result.error || 'Embedding failed');
      }
    });
  }, [text, enabled]);

  // Embed component is invisible - just triggers the embedding
  return null;
};

export interface ESIEmotionProps {
  children: ReactNode;
  contextAware?: boolean;
  onComplete?: (result: { emotion: string; confidence: number }) => void;
  onError?: (error: string) => void;
}

/**
 * ESI Emotion Component - detects emotion from text
 *
 * @example
 * ```tsx
 * <ESI.Emotion onComplete={({ emotion }) => setMood(emotion)}>
 *   {userInput}
 * </ESI.Emotion>
 * ```
 */
export const ESIEmotion: FC<ESIEmotionProps> = ({
  children,
  contextAware = true,
  onComplete,
  onError,
}) => {
  const { process, enabled } = useESI();
  const text = typeof children === 'string' ? children : String(children || '');

  useEffect(() => {
    if (!enabled) return;

    const directive = esiEmotion(text, contextAware);
    process(directive).then((result) => {
      if (result.success && result.output) {
        try {
          const parsed = JSON.parse(result.output);
          onComplete?.(parsed);
        } catch {
          onComplete?.({ emotion: result.output, confidence: 1 });
        }
      } else {
        onError?.(result.error || 'Emotion detection failed');
      }
    });
  }, [text, contextAware, enabled]);

  return null;
};

export interface ESIVisionProps {
  src: string; // base64 image
  prompt: string;
  fallback?: ReactNode;
  loading?: ReactNode;
  className?: string;
  onComplete?: (result: ESIResult) => void;
  onError?: (error: string) => void;
}

/**
 * ESI Vision Component - analyzes images
 *
 * @example
 * ```tsx
 * <ESI.Vision
 *   src={base64Image}
 *   prompt="Describe what you see"
 *   fallback="Unable to analyze image"
 * />
 * ```
 */
export const ESIVision: FC<ESIVisionProps> = ({
  src,
  prompt,
  fallback,
  loading = '...',
  className,
  onComplete,
  onError,
}) => {
  const { process, enabled } = useESI();
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setOutput(typeof fallback === 'string' ? fallback : '');
      setIsLoading(false);
      return;
    }

    const directive = esiVision(src, prompt);
    process(directive).then((result) => {
      setIsLoading(false);
      if (result.success && result.output) {
        setOutput(result.output);
      } else {
        setError(result.error || 'Vision analysis failed');
        onError?.(result.error || 'Vision analysis failed');
      }
      onComplete?.(result);
    });
  }, [src, prompt, enabled]);

  if (isLoading) {
    return <span className={className}>{loading}</span>;
  }

  if (error && fallback) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{output}</span>;
};

// ============================================================================
// Hook for programmatic ESI
// ============================================================================

export interface UseESIInferOptions extends Omit<ESIInferProps, 'children' | 'loading' | 'fallback' | 'render' | 'className'> {
  autoRun?: boolean;
}

/**
 * Hook for programmatic ESI inference
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { run, result, isLoading, error } = useESIInfer({
 *     model: 'llm',
 *     contextAware: true,
 *   });
 *
 *   return (
 *     <button onClick={() => run('Generate a greeting')}>
 *       {isLoading ? 'Generating...' : result?.output || 'Click to generate'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useESIInfer(options: UseESIInferOptions = {}) {
  const { process, processWithStream, enabled } = useESI();
  const [result, setResult] = useState<ESIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (prompt: string) => {
      if (!enabled) {
        setError('ESI is disabled');
        return null;
      }

      setIsLoading(true);
      setError(null);

      const directive: ESIDirective = options.contextAware
        ? esiWithContext(prompt, options.signals, {
            model: options.model,
            variant: options.variant,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            system: options.system,
            cacheTtl: options.cacheTtl,
          })
        : esiInfer(prompt, {
            model: options.model,
            variant: options.variant,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            system: options.system,
            cacheTtl: options.cacheTtl,
          });

      try {
        let inferenceResult: ESIResult;

        if (options.stream) {
          let output = '';
          inferenceResult = await processWithStream(directive, (chunk) => {
            output += chunk;
            setResult((prev) => ({
              ...prev!,
              output,
            }));
          });
        } else {
          inferenceResult = await process(directive);
        }

        setResult(inferenceResult);
        setIsLoading(false);

        if (!inferenceResult.success) {
          setError(inferenceResult.error || 'Inference failed');
        }

        options.onComplete?.(inferenceResult);
        return inferenceResult;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setIsLoading(false);
        options.onError?.(errorMsg);
        return null;
      }
    },
    [process, processWithStream, enabled, options]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { run, result, isLoading, error, reset };
}

// ============================================================================
// Global ESI State Hook (consumes window.__AEON_ESI_STATE__)
// ============================================================================

/**
 * Global ESI State type (matches ESIState from context-extractor)
 */
export interface GlobalESIState {
  userTier: 'free' | 'starter' | 'pro' | 'enterprise';
  emotionState?: {
    primary: string;
    valence: number;
    arousal: number;
    confidence?: number;
  } | null;
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    reducedMotion: boolean;
    language?: string;
  };
  sessionId?: string;
  localHour: number;
  timezone: string;
  features: {
    aiInference: boolean;
    emotionTracking: boolean;
    collaboration: boolean;
    advancedInsights: boolean;
    customThemes: boolean;
    voiceSynthesis: boolean;
    imageAnalysis: boolean;
  };
  userId?: string;
  isNewSession: boolean;
  recentPages: string[];
  viewport: {
    width: number;
    height: number;
  };
  connection: string;
  // Runtime methods added by prerender script
  update?: (partial: Partial<GlobalESIState>) => void;
  subscribe?: (listener: (state: GlobalESIState) => void) => () => void;
}

declare global {
  interface Window {
    __AEON_ESI_STATE__?: GlobalESIState;
  }
}

/**
 * Default ESI state for SSR or when global state is not available
 */
const DEFAULT_ESI_STATE: GlobalESIState = {
  userTier: 'free',
  emotionState: null,
  preferences: {
    theme: 'auto',
    reducedMotion: false,
  },
  localHour: new Date().getHours(),
  timezone: 'UTC',
  features: {
    aiInference: true,
    emotionTracking: true,
    collaboration: false,
    advancedInsights: false,
    customThemes: false,
    voiceSynthesis: false,
    imageAnalysis: false,
  },
  isNewSession: true,
  recentPages: [],
  viewport: { width: 1920, height: 1080 },
  connection: '4g',
};

/**
 * Hook to consume global ESI state from window.__AEON_ESI_STATE__
 *
 * This state is injected in the <head> at pre-render time and hydrated
 * with actual user context at runtime. Components can use this to
 * access tier, emotion state, preferences, etc. before full React hydration.
 *
 * @example
 * ```tsx
 * function TierGatedFeature() {
 *   const { userTier, features } = useGlobalESIState();
 *
 *   if (!features.advancedInsights) {
 *     return <UpgradePrompt />;
 *   }
 *
 *   return <AdvancedInsightsPanel />;
 * }
 * ```
 */
export function useGlobalESIState(): GlobalESIState {
  const [state, setState] = useState<GlobalESIState>(() => {
    if (typeof window !== 'undefined' && window.__AEON_ESI_STATE__) {
      return window.__AEON_ESI_STATE__;
    }
    return DEFAULT_ESI_STATE;
  });

  useEffect(() => {
    // Subscribe to state updates if available
    if (typeof window !== 'undefined' && window.__AEON_ESI_STATE__?.subscribe) {
      const unsubscribe = window.__AEON_ESI_STATE__.subscribe((newState) => {
        setState(newState);
      });
      return unsubscribe;
    }
  }, []);

  return state;
}

/**
 * Hook to check if user has a specific feature enabled based on tier
 *
 * @example
 * ```tsx
 * function VoiceButton() {
 *   const hasVoice = useESIFeature('voiceSynthesis');
 *
 *   return hasVoice ? <VoiceControl /> : <UpgradeToProBanner />;
 * }
 * ```
 */
export function useESIFeature(feature: keyof GlobalESIState['features']): boolean {
  const { features } = useGlobalESIState();
  return features[feature] ?? false;
}

/**
 * Hook to get user tier
 *
 * @example
 * ```tsx
 * function PricingBanner() {
 *   const tier = useESITier();
 *
 *   if (tier === 'pro' || tier === 'enterprise') {
 *     return null; // Already on paid tier
 *   }
 *
 *   return <UpgradeBanner currentTier={tier} />;
 * }
 * ```
 */
export function useESITier(): GlobalESIState['userTier'] {
  const { userTier } = useGlobalESIState();
  return userTier;
}

/**
 * Hook to get current emotion state
 *
 * @example
 * ```tsx
 * function EmotionAwareUI() {
 *   const emotion = useESIEmotion();
 *
 *   if (emotion?.valence < -0.3) {
 *     return <SupportiveContent />;
 *   }
 *
 *   return <RegularContent />;
 * }
 * ```
 */
export function useESIEmotionState(): GlobalESIState['emotionState'] {
  const { emotionState } = useGlobalESIState();
  return emotionState;
}

/**
 * Hook to get user preferences
 */
export function useESIPreferences(): GlobalESIState['preferences'] {
  const { preferences } = useGlobalESIState();
  return preferences;
}

/**
 * Update global ESI state at runtime (e.g., after fetching user context)
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   fetchUserContext().then((ctx) => {
 *     updateGlobalESIState({
 *       userTier: ctx.tier,
 *       userId: ctx.id,
 *       emotionState: ctx.emotion,
 *     });
 *   });
 * }, []);
 * ```
 */
export function updateGlobalESIState(partial: Partial<GlobalESIState>): void {
  if (typeof window !== 'undefined' && window.__AEON_ESI_STATE__?.update) {
    window.__AEON_ESI_STATE__.update(partial);
  } else if (typeof window !== 'undefined' && window.__AEON_ESI_STATE__) {
    Object.assign(window.__AEON_ESI_STATE__, partial);
  }
}

// ============================================================================
// ESI Namespace Export
// ============================================================================

export const ESI = {
  // Basic components
  Provider: ESIProvider,
  Infer: ESIInfer,
  Embed: ESIEmbed,
  Emotion: ESIEmotion,
  Vision: ESIVision,
  // Control flow components (from esi-control-react)
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
  // Gates
  TierGate: ESITierGate,
  EmotionGate: ESIEmotionGate,
  TimeGate: ESITimeGate,
  // Iteration & Selection
  ForEach: ESIForEach,
  Select: ESISelect,
  ABTest: ESIABTest,
  // Numeric
  Clamp: ESIClamp,
  Score: ESIScore,
  // Advanced
  Collaborative: ESICollaborative,
  Reflect: ESIReflect,
  Optimize: ESIOptimize,
  Auto: ESIAuto,
  // Format transformations (from esi-format-react)
  Markdown: ESIMarkdown,
  Latex: ESILatex,
  Json: ESIJson,
  Plaintext: ESIPlaintext,
  Code: ESICode,
};

export default ESI;
