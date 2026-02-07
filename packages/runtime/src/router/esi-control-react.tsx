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

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type FC,
  Children,
  isValidElement,
  type JSX,
} from 'react';
import type { ZodType, ZodTypeDef } from 'zod';
import type {
  ESIParams,
  ESIResult,
  UserContext,
} from './types';
import type { PresenceUser } from './types';
import {
  parseWithSchema,
  generateSchemaPrompt,
  type ESICondition,
  type ESISchemaResult,
} from './esi-control';
import { useESI } from './esi-react';

// ============================================================================
// Presence Context (from aeon-flux)
// ============================================================================

interface PresenceContextValue {
  users: PresenceUser[];
  localUser: PresenceUser | null;
}

// This would normally come from aeon-flux, but we define it here for ESI
const PresenceContext = createContext<PresenceContextValue | null>(null);

function usePresenceForESI(): PresenceContextValue {
  const ctx = useContext(PresenceContext);
  return ctx || { users: [], localUser: null };
}

// ============================================================================
// ESI.Structured - Zod-validated inference
// ============================================================================

export interface ESIStructuredProps<T> {
  /** The prompt - can be children or explicit prop */
  children?: ReactNode;
  prompt?: string;

  /** Zod schema for output validation */
  schema: ZodType<T, ZodTypeDef, unknown>;

  /** Render function for validated data */
  render?: (data: T, meta: { cached: boolean; latencyMs: number }) => ReactNode;

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

export function ESIStructured<T>({
  children,
  prompt,
  schema,
  render,
  fallback,
  loading = '...',
  retryOnFail = false,
  maxRetries = 2,
  temperature,
  maxTokens,
  cacheTtl,
  onSuccess,
  onValidationError,
  onError,
  className,
}: ESIStructuredProps<T>): JSX.Element {
  const { process, enabled } = useESI();
  const [result, setResult] = useState<ESISchemaResult<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const promptText = prompt || (typeof children === 'string' ? children : String(children || ''));
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
          model: 'llm' as const,
          temperature,
          maxTokens,
          cacheTtl,
        },
        content: {
          type: 'text' as const,
          value: fullPrompt,
        },
      };

      const inferenceResult = await process(directive);

      if (!inferenceResult.success || !inferenceResult.output) {
        setResult({
          ...inferenceResult,
          validationErrors: [inferenceResult.error || 'No output'],
        });
        onError?.(inferenceResult.error || 'Inference failed');
        setIsLoading(false);
        return;
      }

      const parseResult = parseWithSchema(inferenceResult.output, schema);

      if (parseResult.success) {
        const schemaResult: ESISchemaResult<T> = {
          ...inferenceResult,
          data: parseResult.data,
          rawOutput: inferenceResult.output,
        };
        setResult(schemaResult);
        onSuccess?.(parseResult.data);
      } else {
        // Validation failed
        if (retryOnFail && retryCount < maxRetries) {
          setRetryCount((c) => c + 1);
          // Re-run will be triggered by retryCount change
        } else {
          const schemaResult: ESISchemaResult<T> = {
            ...inferenceResult,
            rawOutput: inferenceResult.output,
            validationErrors: parseResult.errors,
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
    return <span className={className}>{loading}</span>;
  }

  if (!result?.data) {
    return <span className={className}>{fallback}</span>;
  }

  if (render) {
    return (
      <span className={className}>
        {render(result.data, {
          cached: result.cached,
          latencyMs: result.latencyMs,
        })}
      </span>
    );
  }

  // Default: JSON stringify the result
  return <span className={className}>{JSON.stringify(result.data)}</span>;
}

// ============================================================================
// ESI.If - Conditional rendering
// ============================================================================

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

export function ESIIf<T>({
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
  className,
}: ESIIfProps<T>): JSX.Element | null {
  const [conditionMet, setConditionMet] = useState<boolean | null>(null);
  const [data, setData] = useState<T | null>(null);

  const handleSuccess = useCallback(
    (result: T) => {
      setData(result);
      try {
        // Note: we need the context here, but for simplicity we pass a minimal context
        // In real usage, this would come from ESIProvider
        const met = when(result, {} as UserContext);
        setConditionMet(met);
        onEvaluate?.(result, met);
      } catch {
        setConditionMet(false);
      }
    },
    [when, onEvaluate]
  );

  return (
    <span className={className}>
      <ESIStructured
        prompt={prompt}
        schema={schema}
        temperature={temperature}
        cacheTtl={cacheTtl}
        loading={loading}
        onSuccess={handleSuccess}
        render={() => null}
      >
        {children}
      </ESIStructured>
      {conditionMet === true && thenContent}
      {conditionMet === false && elseContent}
    </span>
  );
}

// ============================================================================
// ESI.Match / ESI.Case / ESI.Default - Pattern matching
// ============================================================================

export interface ESICaseProps<T> {
  /** Match condition */
  match: ESICondition<T>;
  /** Content to render if matched */
  children: ReactNode;
}

export function ESICase<T>({ children }: ESICaseProps<T>): JSX.Element {
  return <>{children}</>;
}

export interface ESIDefaultProps {
  children: ReactNode;
}

export function ESIDefault({ children }: ESIDefaultProps): JSX.Element {
  return <>{children}</>;
}

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

export function ESIMatch<T>({
  children,
  prompt,
  schema,
  loading = null,
  temperature,
  cacheTtl,
  onMatch,
  className,
}: ESIMatchProps<T>): JSX.Element | null {
  const [matchedIndex, setMatchedIndex] = useState<number | null>(null);
  const [data, setData] = useState<T | null>(null);

  // Extract cases and default from children
  const { cases, defaultCase, promptFromChildren } = useMemo(() => {
    const cases: Array<{ match: ESICondition<T>; content: ReactNode }> = [];
    let defaultCase: ReactNode = null;
    let promptFromChildren = '';

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) {
        if (typeof child === 'string') {
          promptFromChildren += child;
        }
        return;
      }

      // Check if it's an ESI.Case
      if (child.type === ESICase) {
        const props = child.props as ESICaseProps<T>;
        cases.push({
          match: props.match,
          content: props.children,
        });
      }
      // Check if it's an ESI.Default
      else if (child.type === ESIDefault) {
        defaultCase = (child.props as ESIDefaultProps).children;
      }
    });

    return { cases, defaultCase, promptFromChildren };
  }, [children]);

  const handleSuccess = useCallback(
    (result: T) => {
      setData(result);

      // Find first matching case
      for (let i = 0; i < cases.length; i++) {
        try {
          if (cases[i].match(result, {} as UserContext)) {
            setMatchedIndex(i);
            onMatch?.(result, i);
            return;
          }
        } catch {
          // Continue to next case
        }
      }

      // No match - use default
      setMatchedIndex(-1);
      onMatch?.(result, -1);
    },
    [cases, onMatch]
  );

  const finalPrompt = prompt || promptFromChildren;

  return (
    <span className={className}>
      <ESIStructured
        prompt={finalPrompt}
        schema={schema}
        temperature={temperature}
        cacheTtl={cacheTtl}
        loading={loading}
        onSuccess={handleSuccess}
        render={() => null}
      />
      {matchedIndex !== null && matchedIndex >= 0 && cases[matchedIndex]?.content}
      {matchedIndex === -1 && defaultCase}
    </span>
  );
}

// ============================================================================
// ESI.Collaborative - Presence-aware ESI
// ============================================================================

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

/**
 * Default user description for prompts
 */
function defaultDescribeUsers(users: PresenceUser[]): string {
  if (users.length === 0) return 'No other users are viewing this content.';
  if (users.length === 1) return `1 user is viewing: ${describeUser(users[0])}`;

  const roles = [...new Set(users.map((u) => u.role).filter(Boolean))];
  const roleStr = roles.length > 0 ? ` with roles: ${roles.join(', ')}` : '';

  return `${users.length} users are viewing${roleStr}:\n${users.map(describeUser).join('\n')}`;
}

function describeUser(user: PresenceUser): string {
  const parts = [user.name || user.userId];
  if (user.role) parts.push(`(${user.role})`);
  if (user.status) parts.push(`[${user.status}]`);
  return `- ${parts.join(' ')}`;
}

export function ESICollaborative<T>({
  children,
  prompt,
  schema,
  render,
  fallback,
  loading = '...',
  describeUsers = defaultDescribeUsers,
  reactToPresenceChange = true,
  presenceDebounce = 2000,
  temperature,
  maxTokens,
  cacheTtl,
  onSuccess,
  className,
}: ESICollaborativeProps<T>): JSX.Element {
  const presence = usePresenceForESI();
  const [debouncedUsers, setDebouncedUsers] = useState(presence.users);
  const [result, setResult] = useState<T | null>(null);

  // Debounce presence changes
  useEffect(() => {
    if (!reactToPresenceChange) return;

    const timer = setTimeout(() => {
      setDebouncedUsers(presence.users);
    }, presenceDebounce);

    return () => clearTimeout(timer);
  }, [presence.users, reactToPresenceChange, presenceDebounce]);

  // Build presence-aware prompt
  const basePrompt = prompt || (typeof children === 'string' ? children : String(children || ''));
  const presenceDescription = describeUsers(debouncedUsers);

  const collaborativePrompt = `[Audience Context]
${presenceDescription}

[Task]
${basePrompt}

Consider ALL viewers when generating your response. The content should be relevant and appropriate for everyone currently viewing.`;

  const handleSuccess = useCallback(
    (data: T) => {
      setResult(data);
      onSuccess?.(data, debouncedUsers);
    },
    [debouncedUsers, onSuccess]
  );

  return (
    <ESIStructured
      prompt={collaborativePrompt}
      schema={schema}
      temperature={temperature}
      maxTokens={maxTokens}
      cacheTtl={cacheTtl}
      loading={loading}
      fallback={fallback}
      onSuccess={handleSuccess}
      className={className}
      render={(data, meta) => {
        if (render) {
          return render(data, debouncedUsers);
        }
        return JSON.stringify(data);
      }}
    />
  );
}

// ============================================================================
// ESI.Reflect - Self-improving inference
// ============================================================================

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

export function ESIReflect<T>({
  children,
  prompt,
  schema,
  until,
  maxIterations = 3,
  render,
  showProgress = false,
  fallback,
  loading = '...',
  onIteration,
  onComplete,
  className,
}: ESIReflectProps<T>): JSX.Element {
  const { process, enabled } = useESI();
  const [currentResult, setCurrentResult] = useState<T | null>(null);
  const [iteration, setIteration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const basePrompt = prompt || (typeof children === 'string' ? children : String(children || ''));

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    async function runReflection() {
      setIsLoading(true);
      let currentIteration = 0;
      let lastResult: T | null = null;
      let previousAttempts: string[] = [];

      while (currentIteration < maxIterations) {
        // Build prompt with reflection context
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
          params: { model: 'llm' as const },
          content: { type: 'text' as const, value: fullPrompt },
        };

        const result = await process(directive);

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

        // Check if we're done
        if (until(parseResult.data, currentIteration + 1)) {
          setIsComplete(true);
          onComplete?.(parseResult.data, currentIteration + 1);
          break;
        }

        previousAttempts.push(result.output);
        currentIteration++;
      }

      // Max iterations reached
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
      return (
        <span className={className}>
          {render ? render(currentResult, iteration) : JSON.stringify(currentResult)}
          <span> (refining... iteration {iteration})</span>
        </span>
      );
    }
    return <span className={className}>{loading}</span>;
  }

  if (!currentResult) {
    return <span className={className}>{fallback}</span>;
  }

  if (render) {
    return <span className={className}>{render(currentResult, iteration)}</span>;
  }

  return <span className={className}>{JSON.stringify(currentResult)}</span>;
}

// ============================================================================
// ESI.Optimize - Self-optimization when alone
// ============================================================================

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

/**
 * Self-optimization schema - added to user's schema
 */
interface OptimizationWrapper<T> {
  result: T;
  selfAssessment: {
    quality: number;
    strengths: string[];
    weaknesses: string[];
    improvementSuggestions: string[];
  };
}

export function ESIOptimize<T>({
  children,
  prompt,
  schema,
  criteria = ['clarity', 'relevance', 'completeness', 'conciseness'],
  targetQuality = 0.85,
  maxRounds = 3,
  onlyWhenAlone = true,
  render,
  fallback,
  loading = '...',
  onImprove,
  onOptimized,
  className,
}: ESIOptimizeProps<T>): JSX.Element {
  const { process, enabled } = useESI();
  const presence = usePresenceForESI();
  const [result, setResult] = useState<T | null>(null);
  const [meta, setMeta] = useState<OptimizeMeta>({
    rounds: 0,
    quality: 0,
    improvements: [],
    wasOptimized: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const basePrompt = prompt || (typeof children === 'string' ? children : String(children || ''));

  // Check if we should optimize
  const shouldOptimize = !onlyWhenAlone || presence.users.length <= 1;

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    async function runOptimization() {
      setIsLoading(true);

      const criteriaList = criteria.join(', ');

      // First pass - generate with self-assessment
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

      let currentResult: T | null = null;
      let currentQuality = 0;
      let round = 0;
      let improvements: string[] = [];
      let lastWeaknesses: string[] = [];

      // Initial generation
      const firstResult = await process({
        id: `esi-optimize-${Date.now()}-0`,
        params: { model: 'llm' as const },
        content: { type: 'text' as const, value: firstPassPrompt },
      });

      if (!firstResult.success || !firstResult.output) {
        setIsLoading(false);
        return;
      }

      // Try to parse the wrapped result
      try {
        const parsed = JSON.parse(extractJson(firstResult.output)) as OptimizationWrapper<T>;
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
            wasOptimized: false,
          });
          onImprove?.(currentResult, 1, currentQuality);
        }
      } catch {
        // Fallback: try to parse just the schema
        const parseResult = parseWithSchema(firstResult.output, schema);
        if (parseResult.success) {
          currentResult = parseResult.data;
          currentQuality = 0.6; // Assume moderate quality
          round = 1;
          setResult(currentResult);
        } else {
          setIsLoading(false);
          return;
        }
      }

      // Optimization loop
      if (shouldOptimize && currentQuality < targetQuality) {
        while (round < maxRounds && currentQuality < targetQuality) {
          const optimizePrompt = `You previously generated this response:
${JSON.stringify(currentResult)}

Quality score: ${currentQuality.toFixed(2)}
Weaknesses identified: ${lastWeaknesses.join(', ') || 'none specified'}

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

          const improvedResult = await process({
            id: `esi-optimize-${Date.now()}-${round}`,
            params: { model: 'llm' as const },
            content: { type: 'text' as const, value: optimizePrompt },
          });

          if (!improvedResult.success || !improvedResult.output) {
            break;
          }

          try {
            const parsed = JSON.parse(extractJson(improvedResult.output)) as OptimizationWrapper<T> & {
              improvementsMade?: string[];
            };
            const validated = schema.safeParse(parsed.result);

            if (validated.success) {
              const newQuality = parsed.selfAssessment?.quality || currentQuality;

              // Only accept if quality improved
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
                  wasOptimized: true,
                });
                onImprove?.(currentResult, round + 1, currentQuality);
              }
            }
          } catch {
            // Parsing failed, keep current result
          }

          round++;
        }
      }

      // Final state
      if (currentResult) {
        setMeta((prev) => ({
          ...prev,
          rounds: round,
          quality: currentQuality,
          wasOptimized: round > 1,
        }));
        onOptimized?.(currentResult, round, currentQuality);
      }

      setIsLoading(false);
    }

    runOptimization();
  }, [basePrompt, enabled, shouldOptimize, targetQuality, maxRounds]);

  if (isLoading) {
    return <span className={className}>{loading}</span>;
  }

  if (!result) {
    return <span className={className}>{fallback}</span>;
  }

  if (render) {
    return <span className={className}>{render(result, meta)}</span>;
  }

  return <span className={className}>{JSON.stringify(result)}</span>;
}

/**
 * Extract JSON from a string that might have markdown or other formatting
 */
function extractJson(str: string): string {
  let cleaned = str.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) cleaned = match[1].trim();
  }

  // Find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return cleaned;
}

// ============================================================================
// ESI.Auto - Automatic mode selection
// ============================================================================

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
export function ESIAuto<T>({
  children,
  prompt,
  schema,
  render,
  collaborativeThreshold = 2,
  optimizeSettings,
  fallback,
  loading,
  className,
}: ESIAutoProps<T>): JSX.Element {
  const presence = usePresenceForESI();
  const userCount = presence.users.length;

  // Determine mode
  const mode: 'collaborative' | 'optimized' | 'basic' =
    userCount >= collaborativeThreshold
      ? 'collaborative'
      : userCount === 1
        ? 'optimized'
        : 'basic';

  if (mode === 'collaborative') {
    return (
      <ESICollaborative
        prompt={prompt}
        schema={schema}
        fallback={fallback}
        loading={loading}
        className={className}
        render={render ? (data) => render(data, 'collaborative') : undefined}
      >
        {children}
      </ESICollaborative>
    );
  }

  if (mode === 'optimized') {
    return (
      <ESIOptimize
        prompt={prompt}
        schema={schema}
        criteria={optimizeSettings?.criteria}
        targetQuality={optimizeSettings?.targetQuality}
        maxRounds={optimizeSettings?.maxRounds}
        fallback={fallback}
        loading={loading}
        className={className}
        render={render ? (data) => render(data, 'optimized') : undefined}
      >
        {children}
      </ESIOptimize>
    );
  }

  // Basic mode
  return (
    <ESIStructured
      prompt={prompt}
      schema={schema}
      fallback={fallback}
      loading={loading}
      className={className}
      render={render ? (data) => render(data, 'basic') : undefined}
    >
      {children}
    </ESIStructured>
  );
}

// ============================================================================
// ESI Namespace Export (Extended)
// ============================================================================

export const ESIControl = {
  Structured: ESIStructured,
  If: ESIIf,
  Match: ESIMatch,
  Case: ESICase,
  Default: ESIDefault,
  Collaborative: ESICollaborative,
  Reflect: ESIReflect,
  Optimize: ESIOptimize,
  Auto: ESIAuto,
};

export default ESIControl;
