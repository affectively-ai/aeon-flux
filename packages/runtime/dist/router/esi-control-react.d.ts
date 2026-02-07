/**
 * ESI Control Components (React)
 *
 * Control flow, Zod validation, and Presence-aware collaborative ESI.
 *
 * @example
 * ```tsx
 * // Conditional rendering based on inference
 * <ESI.If
 *   prompt="Should we show a discount?"
 *   schema={z.object({ show: z.boolean(), reason: z.string() })}
 *   when={(r) => r.show}
 * >
 *   <DiscountBanner />
 * </ESI.If>
 *
 * // Presence-aware collaborative content
 * <ESI.Collaborative
 *   schema={z.object({ summary: z.string(), highlights: z.array(z.string()) })}
 * >
 *   Summarize this for {presence.length} viewers with roles: {roles}
 * </ESI.Collaborative>
 *
 * // Structured output with Zod
 * <ESI.Structured
 *   schema={z.object({
 *     sentiment: z.enum(['positive', 'negative', 'neutral']),
 *     topics: z.array(z.string()),
 *   })}
 * >
 *   Analyze: {text}
 * </ESI.Structured>
 * ```
 */
import { type ReactNode, type JSX } from 'react';
import type { ZodType, ZodTypeDef } from 'zod';
import type { PresenceUser } from './types';
import { type ESICondition } from './esi-control';
export interface ESIStructuredProps<T> {
    /** The prompt - can be children or explicit prop */
    children?: ReactNode;
    prompt?: string;
    /** Zod schema for output validation */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Render function for validated data */
    render?: (data: T, meta: {
        cached: boolean;
        latencyMs: number;
    }) => ReactNode;
    /** Fallback if validation fails */
    fallback?: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** Retry on validation failure */
    retryOnFail?: boolean;
    /** Max retries */
    maxRetries?: number;
    /** Additional inference params */
    temperature?: number;
    maxTokens?: number;
    cacheTtl?: number;
    /** Callbacks */
    onSuccess?: (data: T) => void;
    onValidationError?: (errors: string[], rawOutput: string) => void;
    onError?: (error: string) => void;
    /** Class name */
    className?: string;
}
export declare function ESIStructured<T>({ children, prompt, schema, render, fallback, loading, retryOnFail, maxRetries, temperature, maxTokens, cacheTtl, onSuccess, onValidationError, onError, className, }: ESIStructuredProps<T>): JSX.Element;
export interface ESIIfProps<T> {
    /** The prompt to evaluate */
    children?: ReactNode;
    prompt?: string;
    /** Zod schema for the condition evaluation */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Condition function - if true, render `then` */
    when: ESICondition<T>;
    /** Content to render if condition is true */
    then: ReactNode;
    /** Content to render if condition is false */
    else?: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** Additional params */
    temperature?: number;
    cacheTtl?: number;
    /** Callbacks */
    onEvaluate?: (result: T, conditionMet: boolean) => void;
    /** Class name */
    className?: string;
}
export declare function ESIIf<T>({ children, prompt, schema, when, then: thenContent, else: elseContent, loading, temperature, cacheTtl, onEvaluate, className, }: ESIIfProps<T>): JSX.Element | null;
export interface ESICaseProps<T> {
    /** Match condition */
    match: ESICondition<T>;
    /** Content to render if matched */
    children: ReactNode;
}
export declare function ESICase<T>({ children }: ESICaseProps<T>): JSX.Element;
export interface ESIDefaultProps {
    children: ReactNode;
}
export declare function ESIDefault({ children }: ESIDefaultProps): JSX.Element;
export interface ESIMatchProps<T> {
    /** The prompt to evaluate */
    children: ReactNode;
    prompt?: string;
    /** Zod schema */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Loading state */
    loading?: ReactNode;
    /** Additional params */
    temperature?: number;
    cacheTtl?: number;
    /** Callback */
    onMatch?: (data: T, matchedIndex: number) => void;
    /** Class name */
    className?: string;
}
export declare function ESIMatch<T>({ children, prompt, schema, loading, temperature, cacheTtl, onMatch, className, }: ESIMatchProps<T>): JSX.Element | null;
export interface ESICollaborativeProps<T> {
    /** Base prompt - presence info will be injected */
    children?: ReactNode;
    prompt?: string;
    /** Zod schema for output */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Custom render function */
    render?: (data: T, presence: PresenceUser[]) => ReactNode;
    /** Fallback content */
    fallback?: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** How to describe users in the prompt */
    describeUsers?: (users: PresenceUser[]) => string;
    /** Re-infer when presence changes */
    reactToPresenceChange?: boolean;
    /** Debounce time for presence changes (ms) */
    presenceDebounce?: number;
    /** Additional params */
    temperature?: number;
    maxTokens?: number;
    cacheTtl?: number;
    /** Callbacks */
    onSuccess?: (data: T, presence: PresenceUser[]) => void;
    /** Class name */
    className?: string;
}
export declare function ESICollaborative<T>({ children, prompt, schema, render, fallback, loading, describeUsers, reactToPresenceChange, presenceDebounce, temperature, maxTokens, cacheTtl, onSuccess, className, }: ESICollaborativeProps<T>): JSX.Element;
export interface ESIReflectProps<T> {
    /** The prompt */
    children?: ReactNode;
    prompt?: string;
    /** Schema must include a quality/confidence field */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Continue until this condition is met */
    until: (result: T, iteration: number) => boolean;
    /** Max iterations */
    maxIterations?: number;
    /** Custom render */
    render?: (data: T, iterations: number) => ReactNode;
    /** Show intermediate results */
    showProgress?: boolean;
    /** Fallback */
    fallback?: ReactNode;
    /** Loading */
    loading?: ReactNode;
    /** Callbacks */
    onIteration?: (data: T, iteration: number) => void;
    onComplete?: (data: T, totalIterations: number) => void;
    /** Class name */
    className?: string;
}
export declare function ESIReflect<T>({ children, prompt, schema, until, maxIterations, render, showProgress, fallback, loading, onIteration, onComplete, className, }: ESIReflectProps<T>): JSX.Element;
export interface ESIOptimizeProps<T> {
    /** The prompt */
    children?: ReactNode;
    prompt?: string;
    /** Schema for output */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Quality criteria to optimize for */
    criteria?: string[];
    /** Target quality score (0-1) */
    targetQuality?: number;
    /** Max optimization rounds */
    maxRounds?: number;
    /** Only optimize when user is alone (no other presence) */
    onlyWhenAlone?: boolean;
    /** Custom render */
    render?: (data: T, meta: OptimizeMeta) => ReactNode;
    /** Fallback */
    fallback?: ReactNode;
    /** Loading */
    loading?: ReactNode;
    /** Callbacks */
    onImprove?: (data: T, round: number, quality: number) => void;
    onOptimized?: (data: T, totalRounds: number, finalQuality: number) => void;
    /** Class name */
    className?: string;
}
export interface OptimizeMeta {
    rounds: number;
    quality: number;
    improvements: string[];
    wasOptimized: boolean;
}
export declare function ESIOptimize<T>({ children, prompt, schema, criteria, targetQuality, maxRounds, onlyWhenAlone, render, fallback, loading, onImprove, onOptimized, className, }: ESIOptimizeProps<T>): JSX.Element;
export interface ESIAutoProps<T> {
    /** The prompt */
    children?: ReactNode;
    prompt?: string;
    /** Schema for output */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Custom render */
    render?: (data: T, mode: 'collaborative' | 'optimized' | 'basic') => ReactNode;
    /** Minimum users for collaborative mode */
    collaborativeThreshold?: number;
    /** Optimization settings */
    optimizeSettings?: {
        criteria?: string[];
        targetQuality?: number;
        maxRounds?: number;
    };
    /** Fallback */
    fallback?: ReactNode;
    /** Loading */
    loading?: ReactNode;
    /** Class name */
    className?: string;
}
/**
 * ESI.Auto - Automatically selects the best mode:
 * - Multiple users → Collaborative (presence-aware)
 * - Single user → Optimize (self-improving)
 * - Quick mode → Basic (fast, single pass)
 */
export declare function ESIAuto<T>({ children, prompt, schema, render, collaborativeThreshold, optimizeSettings, fallback, loading, className, }: ESIAutoProps<T>): JSX.Element;
export interface ESIShowProps {
    /** Condition to evaluate - AI will return true/false */
    condition: string;
    /** Content to show if condition is true */
    children: ReactNode;
    /** Content to show if condition is false */
    fallback?: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** Cache TTL */
    cacheTtl?: number;
    /** Callback */
    onEvaluate?: (result: boolean) => void;
    /** Class name */
    className?: string;
}
/**
 * Simple boolean show/hide based on AI evaluation
 * @example
 * <ESI.Show condition="User seems frustrated based on their message history">
 *   <CalmingMessage />
 * </ESI.Show>
 */
export declare function ESIShow({ condition, children, fallback, loading, cacheTtl, onEvaluate, className, }: ESIShowProps): JSX.Element;
export interface ESIHideProps {
    /** Condition to evaluate - content hidden if true */
    condition: string;
    /** Content to show if condition is false */
    children: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** Cache TTL */
    cacheTtl?: number;
    /** Class name */
    className?: string;
}
/**
 * Hide content based on AI evaluation
 * @example
 * <ESI.Hide condition="User is a minor">
 *   <AdultContent />
 * </ESI.Hide>
 */
export declare function ESIHide({ condition, children, loading, cacheTtl, className, }: ESIHideProps): JSX.Element;
export interface ESIWhenProps {
    /** Condition description */
    condition: string;
    /** Content to render when true */
    children: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** Cache TTL */
    cacheTtl?: number;
    /** Class name */
    className?: string;
}
/**
 * Render content only when condition is met
 * @example
 * <ESI.When condition="It's the user's birthday">
 *   <BirthdayBanner />
 * </ESI.When>
 */
export declare function ESIWhen({ condition, children, loading, cacheTtl, className }: ESIWhenProps): JSX.Element;
export interface ESIUnlessProps {
    /** Condition description - renders if false */
    condition: string;
    /** Content to render when condition is false */
    children: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** Cache TTL */
    cacheTtl?: number;
    /** Class name */
    className?: string;
}
/**
 * Render content unless condition is met
 * @example
 * <ESI.Unless condition="User has completed onboarding">
 *   <OnboardingPrompt />
 * </ESI.Unless>
 */
export declare function ESIUnless({ condition, children, loading, cacheTtl, className }: ESIUnlessProps): JSX.Element;
export interface ESITierGateProps {
    /** Minimum tier required */
    minTier: 'free' | 'starter' | 'pro' | 'enterprise';
    /** Content for users who meet tier requirement */
    children: ReactNode;
    /** Content for users below tier (upgrade prompt) */
    fallback?: ReactNode;
    /** Class name */
    className?: string;
}
/**
 * Gate content by user tier
 * @example
 * <ESI.TierGate minTier="pro" fallback={<UpgradePrompt />}>
 *   <AdvancedFeature />
 * </ESI.TierGate>
 */
export declare function ESITierGate({ minTier, children, fallback, className }: ESITierGateProps): JSX.Element;
export interface ESIEmotionGateProps {
    /** Emotion(s) that allow access */
    allow?: string[];
    /** Emotion(s) that block access */
    block?: string[];
    /** Valence range [min, max] (-1 to 1) */
    valenceRange?: [number, number];
    /** Arousal range [min, max] (0 to 1) */
    arousalRange?: [number, number];
    /** Content to show when conditions met */
    children: ReactNode;
    /** Content when conditions not met */
    fallback?: ReactNode;
    /** Class name */
    className?: string;
}
/**
 * Gate content by emotion state
 * @example
 * <ESI.EmotionGate allow={['calm', 'focused']} fallback={<TakeABreakPrompt />}>
 *   <ComplexTask />
 * </ESI.EmotionGate>
 */
export declare function ESIEmotionGate({ allow, block, valenceRange, arousalRange, children, fallback, className, }: ESIEmotionGateProps): JSX.Element;
export interface ESITimeGateProps {
    /** Start hour (0-23) */
    after?: number;
    /** End hour (0-23) */
    before?: number;
    /** Days of week (0=Sunday, 6=Saturday) */
    days?: number[];
    /** Content to show when in time range */
    children: ReactNode;
    /** Content when outside time range */
    fallback?: ReactNode;
    /** Class name */
    className?: string;
}
/**
 * Gate content by time of day
 * @example
 * <ESI.TimeGate after={9} before={17} days={[1,2,3,4,5]}>
 *   <BusinessHoursContent />
 * </ESI.TimeGate>
 */
export declare function ESITimeGate({ after, before, days, children, fallback, className, }: ESITimeGateProps): JSX.Element;
export interface ESIABTestProps {
    /** Test name for tracking */
    name: string;
    /** Variants to test */
    variants: {
        [key: string]: ReactNode;
    };
    /** Prompt to select variant (AI decides) */
    selectionPrompt?: string;
    /** Use random selection instead of AI */
    random?: boolean;
    /** Callback when variant selected */
    onSelect?: (variant: string) => void;
    /** Loading state */
    loading?: ReactNode;
    /** Class name */
    className?: string;
}
/**
 * A/B testing with AI-based or random selection
 * @example
 * <ESI.ABTest
 *   name="checkout-button"
 *   variants={{
 *     control: <Button>Buy Now</Button>,
 *     variant_a: <Button color="green">Purchase</Button>,
 *     variant_b: <Button size="large">Get It Now</Button>
 *   }}
 *   selectionPrompt="Pick the variant most likely to convert based on user emotion"
 * />
 */
export declare function ESIABTest({ name, variants, selectionPrompt, random, onSelect, loading, className, }: ESIABTestProps): JSX.Element;
export interface ESIForEachProps<T> {
    /** Prompt to generate the list */
    prompt: string;
    /** Zod schema for each item */
    itemSchema: ZodType<T, ZodTypeDef, unknown>;
    /** Render function for each item */
    render: (item: T, index: number) => ReactNode;
    /** Max items to generate */
    maxItems?: number;
    /** Empty state */
    empty?: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** Wrapper element */
    as?: 'div' | 'ul' | 'ol' | 'span';
    /** Class name */
    className?: string;
}
/**
 * Generate and render a list of items
 * @example
 * <ESI.ForEach
 *   prompt="Generate 5 personalized activity suggestions"
 *   itemSchema={z.object({ title: z.string(), description: z.string() })}
 *   render={(item, i) => <ActivityCard key={i} {...item} />}
 * />
 */
export declare function ESIForEach<T>({ prompt, itemSchema, render, maxItems, empty, loading, as: Wrapper, className, }: ESIForEachProps<T>): JSX.Element;
export interface ESIFirstProps {
    /** Prompt with context for evaluation */
    context?: string;
    /** Children should be ESI.When components */
    children: ReactNode;
    /** Fallback if no condition matches */
    fallback?: ReactNode;
    /** Loading state */
    loading?: ReactNode;
    /** Class name */
    className?: string;
}
/**
 * Render the first child whose condition evaluates to true
 * @example
 * <ESI.First fallback={<DefaultContent />}>
 *   <ESI.When condition="User is angry"><CalmingContent /></ESI.When>
 *   <ESI.When condition="User is confused"><HelpContent /></ESI.When>
 *   <ESI.When condition="User is happy"><CelebrateContent /></ESI.When>
 * </ESI.First>
 */
export declare function ESIFirst({ context, children, fallback, loading, className, }: ESIFirstProps): JSX.Element;
export interface ESIClampProps {
    /** Prompt to generate a number */
    prompt: string;
    /** Minimum value */
    min: number;
    /** Maximum value */
    max: number;
    /** Render function */
    render: (value: number) => ReactNode;
    /** Default value if generation fails */
    defaultValue?: number;
    /** Loading state */
    loading?: ReactNode;
    /** Class name */
    className?: string;
}
/**
 * Generate a clamped numeric value
 * @example
 * <ESI.Clamp
 *   prompt="Rate the urgency of this message from 1-10"
 *   min={1}
 *   max={10}
 *   render={(urgency) => <UrgencyBadge level={urgency} />}
 * />
 */
export declare function ESIClamp({ prompt, min, max, render, defaultValue, loading, className, }: ESIClampProps): JSX.Element;
export interface ESISelectProps<T extends string> {
    /** Prompt for selection */
    prompt: string;
    /** Available options */
    options: T[];
    /** Render function for selected option */
    render: (selected: T) => ReactNode;
    /** Default if selection fails */
    defaultOption?: T;
    /** Loading state */
    loading?: ReactNode;
    /** Callback */
    onSelect?: (selected: T) => void;
    /** Class name */
    className?: string;
}
/**
 * Select from predefined options
 * @example
 * <ESI.Select
 *   prompt="What tone should we use for this user?"
 *   options={['formal', 'casual', 'playful', 'empathetic']}
 *   render={(tone) => <Message tone={tone} />}
 * />
 */
export declare function ESISelect<T extends string>({ prompt, options, render, defaultOption, loading, onSelect, className, }: ESISelectProps<T>): JSX.Element;
export interface ESIScoreProps {
    /** What to score */
    prompt: string;
    /** Render function */
    render: (score: number, label: string) => ReactNode;
    /** Score thresholds and labels */
    thresholds?: {
        value: number;
        label: string;
    }[];
    /** Loading state */
    loading?: ReactNode;
    /** Class name */
    className?: string;
}
/**
 * Generate a normalized 0-1 score with label
 * @example
 * <ESI.Score
 *   prompt="Rate the user's engagement level"
 *   render={(score, label) => <EngagementMeter value={score} label={label} />}
 * />
 */
export declare function ESIScore({ prompt, render, thresholds, loading, className, }: ESIScoreProps): JSX.Element;
export declare const ESIControl: {
    Structured: typeof ESIStructured;
    If: typeof ESIIf;
    Show: typeof ESIShow;
    Hide: typeof ESIHide;
    When: typeof ESIWhen;
    Unless: typeof ESIUnless;
    Match: typeof ESIMatch;
    Case: typeof ESICase;
    Default: typeof ESIDefault;
    First: typeof ESIFirst;
    TierGate: typeof ESITierGate;
    EmotionGate: typeof ESIEmotionGate;
    TimeGate: typeof ESITimeGate;
    ForEach: typeof ESIForEach;
    Select: typeof ESISelect;
    ABTest: typeof ESIABTest;
    Clamp: typeof ESIClamp;
    Score: typeof ESIScore;
    Collaborative: typeof ESICollaborative;
    Reflect: typeof ESIReflect;
    Optimize: typeof ESIOptimize;
    Auto: typeof ESIAuto;
};
export default ESIControl;
