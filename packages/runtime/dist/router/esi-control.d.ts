/**
 * ESI Control Language
 *
 * Adds conditional display and structured output validation to ESI.
 * Uses Zod for schema validation to ensure trusted, typed results.
 *
 * @example
 * ```tsx
 * // Conditional display based on inference
 * <ESI.If
 *   prompt="Is this user likely to churn?"
 *   schema={z.object({ likelihood: z.number(), reason: z.string() })}
 *   when={(result) => result.likelihood > 0.7}
 * >
 *   <RetentionOffer />
 * </ESI.If>
 *
 * // Structured output with Zod
 * <ESI.Infer
 *   schema={z.object({
 *     sentiment: z.enum(['positive', 'negative', 'neutral']),
 *     confidence: z.number(),
 *     topics: z.array(z.string()),
 *   })}
 * >
 *   Analyze this text: {userInput}
 * </ESI.Infer>
 *
 * // Switch/match on inference result
 * <ESI.Match
 *   prompt="Classify user intent"
 *   schema={z.object({ intent: z.enum(['browse', 'buy', 'support', 'leave']) })}
 * >
 *   <ESI.Case match={(r) => r.intent === 'buy'}><CheckoutCTA /></ESI.Case>
 *   <ESI.Case match={(r) => r.intent === 'support'}><HelpWidget /></ESI.Case>
 *   <ESI.Default><BrowsePrompt /></ESI.Default>
 * </ESI.Match>
 * ```
 */
import type { ZodType, ZodTypeDef } from 'zod';
import type { ESIDirective, ESIParams, ESIResult, UserContext } from './types';
/**
 * ESI with Zod schema for validated, typed output
 */
export interface ESISchemaParams<T> extends Omit<ESIParams, 'model'> {
    /** Zod schema for output validation */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Model defaults to 'llm' for structured output */
    model?: 'llm';
    /** Retry on validation failure */
    retryOnValidationError?: boolean;
    /** Max retries */
    maxRetries?: number;
}
export interface ESISchemaResult<T> extends Omit<ESIResult, 'output'> {
    /** Validated, typed output */
    data?: T;
    /** Raw output before validation */
    rawOutput?: string;
    /** Validation errors if any */
    validationErrors?: string[];
}
/**
 * Condition function type
 */
export type ESICondition<T> = (result: T, context: UserContext) => boolean;
/**
 * ESI.If directive - conditional rendering based on inference
 */
export interface ESIIfDirective<T> {
    /** Unique ID */
    id: string;
    /** Prompt to evaluate */
    prompt: string;
    /** Schema for structured output */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Condition to check */
    when: ESICondition<T>;
    /** Inference params */
    params?: Partial<ESIParams>;
    /** Cache the condition result */
    cacheCondition?: boolean;
}
/**
 * ESI.Match directive - switch/case based on inference
 */
export interface ESIMatchDirective<T> {
    /** Unique ID */
    id: string;
    /** Prompt to evaluate */
    prompt: string;
    /** Schema for structured output */
    schema: ZodType<T, ZodTypeDef, unknown>;
    /** Cases to match */
    cases: Array<{
        match: ESICondition<T>;
        id: string;
    }>;
    /** Default case ID if no match */
    defaultCase?: string;
    /** Inference params */
    params?: Partial<ESIParams>;
}
/**
 * Result of control flow evaluation
 */
export interface ESIControlResult<T> {
    /** The directive ID */
    id: string;
    /** Whether condition was met (for If) */
    conditionMet?: boolean;
    /** Matched case ID (for Match) */
    matchedCase?: string;
    /** The validated data */
    data?: T;
    /** Inference result */
    inferenceResult: ESISchemaResult<T>;
}
/**
 * Generate a JSON schema prompt suffix for structured output
 */
export declare function generateSchemaPrompt<T>(schema: ZodType<T, ZodTypeDef, unknown>): string;
/**
 * Parse and validate LLM output against a Zod schema
 */
export declare function parseWithSchema<T>(output: string, schema: ZodType<T, ZodTypeDef, unknown>): {
    success: true;
    data: T;
} | {
    success: false;
    errors: string[];
};
export interface ESIControlProcessor {
    /**
     * Process an ESI.If directive
     */
    processIf<T>(directive: ESIIfDirective<T>, context: UserContext): Promise<ESIControlResult<T>>;
    /**
     * Process an ESI.Match directive
     */
    processMatch<T>(directive: ESIMatchDirective<T>, context: UserContext): Promise<ESIControlResult<T>>;
    /**
     * Process an ESI directive with schema validation
     */
    processWithSchema<T>(prompt: string, schema: ZodType<T, ZodTypeDef, unknown>, params: Partial<ESIParams>, context: UserContext): Promise<ESISchemaResult<T>>;
}
/**
 * Create a control processor that wraps an ESI processor
 */
export declare function createControlProcessor(processESI: (directive: ESIDirective, context: UserContext) => Promise<ESIResult>): ESIControlProcessor;
/**
 * Create an ESI.If directive
 */
export declare function esiIf<T>(prompt: string, schema: ZodType<T, ZodTypeDef, unknown>, when: ESICondition<T>, options?: Partial<ESIParams>): ESIIfDirective<T>;
/**
 * Create an ESI.Match directive
 */
export declare function esiMatch<T>(prompt: string, schema: ZodType<T, ZodTypeDef, unknown>, cases: Array<{
    match: ESICondition<T>;
    id: string;
}>, defaultCase?: string, options?: Partial<ESIParams>): ESIMatchDirective<T>;
