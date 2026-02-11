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

import type { ZodType, ZodTypeDef, z } from 'zod';
import type { ESIDirective, ESIParams, ESIResult, UserContext } from './types';

// ============================================================================
// Schema Types
// ============================================================================

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

// ============================================================================
// Control Flow Types
// ============================================================================

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

// ============================================================================
// Schema Validation
// ============================================================================

/**
 * Generate a JSON schema prompt suffix for structured output
 */
export function generateSchemaPrompt<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
): string {
  // Extract schema description for the prompt
  // This helps the LLM understand the expected output format
  const schemaDescription = describeZodSchema(schema);

  return `

Respond with valid JSON matching this schema:
${schemaDescription}

Output ONLY the JSON, no markdown, no explanation.`;
}

function getSchemaDef(schema: unknown): Record<string, unknown> | null {
  if (!schema || typeof schema !== 'object' || !('_def' in schema)) {
    return null;
  }

  const def = (schema as { _def?: unknown })._def;
  if (!def || typeof def !== 'object') {
    return null;
  }

  return def as Record<string, unknown>;
}

/**
 * Describe a Zod schema in a way the LLM can understand
 */
function describeZodSchema<T>(schema: ZodType<T, ZodTypeDef, unknown>): string {
  const def = getSchemaDef(schema);
  if (!def) {
    return 'JSON value';
  }

  if (def.typeName === 'ZodObject') {
    const rawShape = def.shape as
      | Record<string, ZodType<unknown, ZodTypeDef, unknown>>
      | (() => Record<string, ZodType<unknown, ZodTypeDef, unknown>>);
    const shape = typeof rawShape === 'function' ? rawShape() : rawShape;
    if (!shape || typeof shape !== 'object') {
      return 'object';
    }

    const fields = Object.entries(shape).map(([key, fieldSchema]) => {
      const fieldDef = getSchemaDef(fieldSchema);
      return `  "${key}": ${fieldDef ? describeZodType(fieldDef) : 'any'}`;
    });
    return `{\n${fields.join(',\n')}\n}`;
  }

  return describeZodType(def);
}

/**
 * Describe a Zod type
 */
function describeZodType(def: Record<string, unknown>): string {
  const typeName =
    typeof def.typeName === 'string' ? (def.typeName as string) : null;
  if (!typeName) {
    return 'any';
  }

  switch (typeName) {
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodArray': {
      const innerType = def.type as ZodType<unknown, ZodTypeDef, unknown>;
      if (!innerType || typeof innerType !== 'object') {
        return 'array';
      }
      const innerDef = getSchemaDef(innerType);
      return innerDef ? `array of ${describeZodType(innerDef)}` : 'array';
    }
    case 'ZodEnum': {
      const values = def.values as string[];
      return `one of: ${values.map((v) => `"${v}"`).join(' | ')}`;
    }
    case 'ZodLiteral':
      return JSON.stringify(def.value);
    case 'ZodOptional': {
      const optionalType = def.innerType as ZodType<
        unknown,
        ZodTypeDef,
        unknown
      >;
      if (!optionalType || typeof optionalType !== 'object') {
        return 'any (optional)';
      }
      const optionalDef = getSchemaDef(optionalType);
      return optionalDef
        ? `${describeZodType(optionalDef)} (optional)`
        : 'any (optional)';
    }
    case 'ZodNullable': {
      const nullableType = def.innerType as ZodType<
        unknown,
        ZodTypeDef,
        unknown
      >;
      if (!nullableType || typeof nullableType !== 'object') {
        return 'any or null';
      }
      const nullableDef = getSchemaDef(nullableType);
      return nullableDef
        ? `${describeZodType(nullableDef)} or null`
        : 'any or null';
    }
    case 'ZodObject':
      return 'object';
    default:
      return 'any';
  }
}

/**
 * Parse and validate LLM output against a Zod schema
 */
export function parseWithSchema<T>(
  output: string,
  schema: ZodType<T, ZodTypeDef, unknown>,
): { success: true; data: T } | { success: false; errors: string[] } {
  // Try to extract JSON from the output
  let jsonStr = output.trim();

  // Handle markdown code blocks
  if (jsonStr.startsWith('```')) {
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      jsonStr = match[1].trim();
    }
  }

  // Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    // Try to find JSON object in the output
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return {
          success: false,
          errors: [
            `Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
          ],
        };
      }
    } else {
      return {
        success: false,
        errors: [`No valid JSON found in output`],
      };
    }
  }

  // Validate against schema
  const result = schema.safeParse(parsed);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}

// ============================================================================
// Control Flow Processor
// ============================================================================

export interface ESIControlProcessor {
  /**
   * Process an ESI.If directive
   */
  processIf<T>(
    directive: ESIIfDirective<T>,
    context: UserContext,
  ): Promise<ESIControlResult<T>>;

  /**
   * Process an ESI.Match directive
   */
  processMatch<T>(
    directive: ESIMatchDirective<T>,
    context: UserContext,
  ): Promise<ESIControlResult<T>>;

  /**
   * Process an ESI directive with schema validation
   */
  processWithSchema<T>(
    prompt: string,
    schema: ZodType<T, ZodTypeDef, unknown>,
    params: Partial<ESIParams>,
    context: UserContext,
  ): Promise<ESISchemaResult<T>>;
}

/**
 * Create a control processor that wraps an ESI processor
 */
export function createControlProcessor(
  processESI: (
    directive: ESIDirective,
    context: UserContext,
  ) => Promise<ESIResult>,
): ESIControlProcessor {
  return {
    async processWithSchema<T>(
      prompt: string,
      schema: ZodType<T, ZodTypeDef, unknown>,
      params: Partial<ESIParams>,
      context: UserContext,
    ): Promise<ESISchemaResult<T>> {
      // Add schema prompt
      const fullPrompt = prompt + generateSchemaPrompt(schema);

      const directive: ESIDirective = {
        id: `esi-schema-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        params: {
          model: 'llm',
          ...params,
        },
        content: {
          type: 'text',
          value: fullPrompt,
        },
      };

      const result = await processESI(directive, context);

      if (!result.success || !result.output) {
        return {
          ...result,
          validationErrors: result.error ? [result.error] : ['No output'],
        };
      }

      const parseResult = parseWithSchema(result.output, schema);

      if (parseResult.success) {
        return {
          ...result,
          data: parseResult.data,
          rawOutput: result.output,
        };
      }

      // Retry logic could go here
      return {
        ...result,
        rawOutput: result.output,
        validationErrors: parseResult.errors,
      };
    },

    async processIf<T>(
      directive: ESIIfDirective<T>,
      context: UserContext,
    ): Promise<ESIControlResult<T>> {
      const schemaResult = await this.processWithSchema(
        directive.prompt,
        directive.schema,
        directive.params || {},
        context,
      );

      let conditionMet = false;

      if (schemaResult.data !== undefined) {
        try {
          conditionMet = directive.when(schemaResult.data, context);
        } catch (e) {
          // Condition evaluation failed
          conditionMet = false;
        }
      }

      return {
        id: directive.id,
        conditionMet,
        data: schemaResult.data,
        inferenceResult: schemaResult,
      };
    },

    async processMatch<T>(
      directive: ESIMatchDirective<T>,
      context: UserContext,
    ): Promise<ESIControlResult<T>> {
      const schemaResult = await this.processWithSchema(
        directive.prompt,
        directive.schema,
        directive.params || {},
        context,
      );

      let matchedCase: string | undefined;

      if (schemaResult.data !== undefined) {
        for (const caseItem of directive.cases) {
          try {
            if (caseItem.match(schemaResult.data, context)) {
              matchedCase = caseItem.id;
              break;
            }
          } catch {
            // Continue to next case
          }
        }

        // Use default if no match
        if (!matchedCase && directive.defaultCase) {
          matchedCase = directive.defaultCase;
        }
      }

      return {
        id: directive.id,
        matchedCase,
        data: schemaResult.data,
        inferenceResult: schemaResult,
      };
    },
  };
}

// ============================================================================
// Directive Builders
// ============================================================================

/**
 * Create an ESI.If directive
 */
export function esiIf<T>(
  prompt: string,
  schema: ZodType<T, ZodTypeDef, unknown>,
  when: ESICondition<T>,
  options: Partial<ESIParams> = {},
): ESIIfDirective<T> {
  return {
    id: `esi-if-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    prompt,
    schema,
    when,
    params: options,
  };
}

/**
 * Create an ESI.Match directive
 */
export function esiMatch<T>(
  prompt: string,
  schema: ZodType<T, ZodTypeDef, unknown>,
  cases: Array<{ match: ESICondition<T>; id: string }>,
  defaultCase?: string,
  options: Partial<ESIParams> = {},
): ESIMatchDirective<T> {
  return {
    id: `esi-match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    prompt,
    schema,
    cases,
    defaultCase,
    params: options,
  };
}
