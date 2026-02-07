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
export declare const ESIControl: {
    Structured: typeof ESIStructured;
    If: typeof ESIIf;
    Match: typeof ESIMatch;
    Case: typeof ESICase;
    Default: typeof ESIDefault;
    Collaborative: typeof ESICollaborative;
    Reflect: typeof ESIReflect;
    Optimize: typeof ESIOptimize;
    Auto: typeof ESIAuto;
};
export default ESIControl;
