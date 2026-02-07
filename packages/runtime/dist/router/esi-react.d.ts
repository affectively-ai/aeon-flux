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
import { type ReactNode, type FC } from 'react';
import type { ESIConfig, ESIDirective, ESIModel, ESIProcessor, ESIResult, UserContext } from './types';
interface ESIContextValue {
    processor: ESIProcessor;
    userContext: UserContext | null;
    enabled: boolean;
    process: (directive: ESIDirective) => Promise<ESIResult>;
    processWithStream: (directive: ESIDirective, onChunk: (chunk: string) => void) => Promise<ESIResult>;
}
export interface ESIProviderProps {
    children: ReactNode;
    config?: Partial<ESIConfig>;
    userContext?: UserContext;
    processor?: ESIProcessor;
}
/**
 * ESI Provider - enables ESI components in the tree
 */
export declare const ESIProvider: FC<ESIProviderProps>;
/**
 * Hook to access ESI context
 */
export declare function useESI(): ESIContextValue;
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
export declare const ESIInfer: FC<ESIInferProps>;
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
export declare const ESIEmbed: FC<ESIEmbedProps>;
export interface ESIEmotionProps {
    children: ReactNode;
    contextAware?: boolean;
    onComplete?: (result: {
        emotion: string;
        confidence: number;
    }) => void;
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
export declare const ESIEmotion: FC<ESIEmotionProps>;
export interface ESIVisionProps {
    src: string;
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
export declare const ESIVision: FC<ESIVisionProps>;
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
export declare function useESIInfer(options?: UseESIInferOptions): {
    run: (prompt: string) => Promise<ESIResult | null>;
    result: ESIResult | null;
    isLoading: boolean;
    error: string | null;
    reset: () => void;
};
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
    update?: (partial: Partial<GlobalESIState>) => void;
    subscribe?: (listener: (state: GlobalESIState) => void) => () => void;
}
declare global {
    interface Window {
        __AEON_ESI_STATE__?: GlobalESIState;
    }
}
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
export declare function useGlobalESIState(): GlobalESIState;
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
export declare function useESIFeature(feature: keyof GlobalESIState['features']): boolean;
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
export declare function useESITier(): GlobalESIState['userTier'];
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
export declare function useESIEmotionState(): GlobalESIState['emotionState'];
/**
 * Hook to get user preferences
 */
export declare function useESIPreferences(): GlobalESIState['preferences'];
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
export declare function updateGlobalESIState(partial: Partial<GlobalESIState>): void;
export declare const ESI: {
    Provider: FC<ESIProviderProps>;
    Infer: FC<ESIInferProps>;
    Embed: FC<ESIEmbedProps>;
    Emotion: FC<ESIEmotionProps>;
    Vision: FC<ESIVisionProps>;
};
export default ESI;
