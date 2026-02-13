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
  Fragment,
  type ReactNode,
  type FC,
  Children,
  isValidElement,
  type JSX,
} from 'react';
import type { ZodType, ZodTypeDef } from 'zod';
import type { ESIParams, ESIResult, UserContext } from './types';
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

  const promptText =
    prompt ||
    (typeof children === 'string' ? children : String(children || ''));
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
    [when, onEvaluate],
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
    [cases, onMatch],
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
      {matchedIndex !== null &&
        matchedIndex >= 0 &&
        cases[matchedIndex]?.content}
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
  const basePrompt =
    prompt ||
    (typeof children === 'string' ? children : String(children || ''));
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
    [debouncedUsers, onSuccess],
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

  const basePrompt =
    prompt ||
    (typeof children === 'string' ? children : String(children || ''));

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
          {render
            ? render(currentResult, iteration)
            : JSON.stringify(currentResult)}
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
    return (
      <span className={className}>{render(currentResult, iteration)}</span>
    );
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

  const basePrompt =
    prompt ||
    (typeof children === 'string' ? children : String(children || ''));

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
        const parsed = JSON.parse(
          extractJson(firstResult.output),
        ) as OptimizationWrapper<T>;
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
            const parsed = JSON.parse(
              extractJson(improvedResult.output),
            ) as OptimizationWrapper<T> & {
              improvementsMade?: string[];
            };
            const validated = schema.safeParse(parsed.result);

            if (validated.success) {
              const newQuality =
                parsed.selfAssessment?.quality || currentQuality;

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
  render?: (
    data: T,
    mode: 'collaborative' | 'optimized' | 'basic',
  ) => ReactNode;

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
// ESI.Show - Simple boolean visibility
// ============================================================================

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
export function ESIShow({
  condition,
  children,
  fallback = null,
  loading = null,
  cacheTtl,
  onEvaluate,
  className,
}: ESIShowProps): JSX.Element {
  const [show, setShow] = useState<boolean | null>(null);

  const boolSchema = {
    safeParse: (val: unknown) => {
      if (typeof val === 'boolean') return { success: true, data: val };
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        if (lower === 'true' || lower === 'yes' || lower === '1')
          return { success: true, data: true };
        if (lower === 'false' || lower === 'no' || lower === '0')
          return { success: true, data: false };
      }
      if (typeof val === 'object' && val !== null && 'result' in val) {
        return {
          success: true,
          data: Boolean((val as { result: unknown }).result),
        };
      }
      return { success: false, error: 'Not a boolean' };
    },
  } as ZodType<boolean, ZodTypeDef, unknown>;

  return (
    <span className={className}>
      <ESIStructured
        prompt={`Evaluate this condition and respond with only "true" or "false": ${condition}`}
        schema={boolSchema}
        cacheTtl={cacheTtl}
        loading={loading}
        onSuccess={(result) => {
          setShow(result);
          onEvaluate?.(result);
        }}
        render={() => null}
      />
      {show === true && children}
      {show === false && fallback}
    </span>
  );
}

// ============================================================================
// ESI.Hide - Inverse of Show
// ============================================================================

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
export function ESIHide({
  condition,
  children,
  loading = null,
  cacheTtl,
  className,
}: ESIHideProps): JSX.Element {
  return (
    <ESIShow
      condition={condition}
      fallback={children}
      loading={loading}
      cacheTtl={cacheTtl}
      className={className}
    >
      {null}
    </ESIShow>
  );
}

// ============================================================================
// ESI.When - Shorthand conditional (no else)
// ============================================================================

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
export function ESIWhen({
  condition,
  children,
  loading,
  cacheTtl,
  className,
}: ESIWhenProps): JSX.Element {
  return (
    <ESIShow
      condition={condition}
      loading={loading}
      cacheTtl={cacheTtl}
      className={className}
    >
      {children}
    </ESIShow>
  );
}

// ============================================================================
// ESI.Unless - Inverse of When
// ============================================================================

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
export function ESIUnless({
  condition,
  children,
  loading,
  cacheTtl,
  className,
}: ESIUnlessProps): JSX.Element {
  return (
    <ESIHide
      condition={condition}
      loading={loading}
      cacheTtl={cacheTtl}
      className={className}
    >
      {children}
    </ESIHide>
  );
}

// ============================================================================
// ESI.TierGate - Gate by user tier
// ============================================================================

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

const TIER_LEVELS = { free: 0, starter: 1, pro: 2, enterprise: 3, admin: 999 };

/**
 * Gate content by user tier
 * Admins bypass ALL tier restrictions
 * @example
 * <ESI.TierGate minTier="pro" fallback={<UpgradePrompt />}>
 *   <AdvancedFeature />
 * </ESI.TierGate>
 */
export function ESITierGate({
  minTier,
  children,
  fallback = null,
  className,
}: ESITierGateProps): JSX.Element {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Check global ESI state for tier
    const state =
      (typeof window !== 'undefined' &&
        (
          window as unknown as {
            __AEON_ESI_STATE__?: { userTier?: string; isAdmin?: boolean };
          }
        ).__AEON_ESI_STATE__) ||
      {};

    // Admins bypass ALL tier restrictions
    if (state.isAdmin === true || state.userTier === 'admin') {
      setHasAccess(true);
      return;
    }

    const userTier = (state.userTier || 'free') as keyof typeof TIER_LEVELS;
    const userLevel = TIER_LEVELS[userTier] ?? 0;
    const requiredLevel = TIER_LEVELS[minTier] ?? 0;
    setHasAccess(userLevel >= requiredLevel);
  }, [minTier]);

  if (hasAccess === null) return <span className={className} />;
  return <span className={className}>{hasAccess ? children : fallback}</span>;
}

// ============================================================================
// ESI.EmotionGate - Gate by emotion state
// ============================================================================

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
export function ESIEmotionGate({
  allow,
  block,
  valenceRange,
  arousalRange,
  children,
  fallback = null,
  className,
}: ESIEmotionGateProps): JSX.Element {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const state =
      (typeof window !== 'undefined' &&
        (
          window as unknown as {
            __AEON_ESI_STATE__?: {
              emotionState?: {
                primary?: string;
                valence?: number;
                arousal?: number;
              };
            };
          }
        ).__AEON_ESI_STATE__) ||
      {};
    const emotion = state.emotionState || {};

    let access = true;

    // Check allowed emotions
    if (allow && allow.length > 0 && emotion.primary) {
      access = access && allow.includes(emotion.primary);
    }

    // Check blocked emotions
    if (block && block.length > 0 && emotion.primary) {
      access = access && !block.includes(emotion.primary);
    }

    // Check valence range
    if (valenceRange && emotion.valence !== undefined) {
      access =
        access &&
        emotion.valence >= valenceRange[0] &&
        emotion.valence <= valenceRange[1];
    }

    // Check arousal range
    if (arousalRange && emotion.arousal !== undefined) {
      access =
        access &&
        emotion.arousal >= arousalRange[0] &&
        emotion.arousal <= arousalRange[1];
    }

    setHasAccess(access);
  }, [allow, block, valenceRange, arousalRange]);

  if (hasAccess === null) return <span className={className} />;
  return <span className={className}>{hasAccess ? children : fallback}</span>;
}

// ============================================================================
// ESI.TimeGate - Gate by time of day
// ============================================================================

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
export function ESITimeGate({
  after,
  before,
  days,
  children,
  fallback = null,
  className,
}: ESITimeGateProps): JSX.Element {
  const [inRange, setInRange] = useState<boolean | null>(null);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    let access = true;

    if (after !== undefined) access = access && hour >= after;
    if (before !== undefined) access = access && hour < before;
    if (days && days.length > 0) access = access && days.includes(day);

    setInRange(access);
  }, [after, before, days]);

  if (inRange === null) return <span className={className} />;
  return <span className={className}>{inRange ? children : fallback}</span>;
}

// ============================================================================
// ESI.ABTest - A/B testing with AI
// ============================================================================

export interface ESIABTestProps {
  /** Test name for tracking */
  name: string;
  /** Variants to test */
  variants: { [key: string]: ReactNode };
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
export function ESIABTest({
  name,
  variants,
  selectionPrompt,
  random = false,
  onSelect,
  loading = null,
  className,
}: ESIABTestProps): JSX.Element {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const variantKeys = Object.keys(variants);

  useEffect(() => {
    if (random || !selectionPrompt) {
      // Random selection
      const selected =
        variantKeys[Math.floor(Math.random() * variantKeys.length)];
      setSelectedVariant(selected);
      onSelect?.(selected);
    }
  }, [random, selectionPrompt]);

  if (random || !selectionPrompt) {
    if (!selectedVariant) return <span className={className}>{loading}</span>;
    return <span className={className}>{variants[selectedVariant]}</span>;
  }

  // AI-based selection
  const variantSchema = {
    safeParse: (val: unknown) => {
      const str = String(val).trim();
      if (variantKeys.includes(str)) return { success: true, data: str };
      // Try to find a match
      for (const key of variantKeys) {
        if (str.toLowerCase().includes(key.toLowerCase())) {
          return { success: true, data: key };
        }
      }
      return { success: false, error: 'Invalid variant' };
    },
  } as ZodType<string, ZodTypeDef, unknown>;

  return (
    <span className={className}>
      <ESIStructured
        prompt={`${selectionPrompt}\n\nAvailable variants: ${variantKeys.join(', ')}\n\nRespond with only the variant name.`}
        schema={variantSchema}
        loading={loading}
        onSuccess={(selected) => {
          setSelectedVariant(selected);
          onSelect?.(selected);
        }}
        render={() => null}
      />
      {selectedVariant && variants[selectedVariant]}
    </span>
  );
}

// ============================================================================
// ESI.ForEach - Iterate over AI-generated list
// ============================================================================

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
export function ESIForEach<T>({
  prompt,
  itemSchema,
  render,
  maxItems = 10,
  empty = null,
  loading = '...',
  as: Wrapper = 'div',
  className,
}: ESIForEachProps<T>): JSX.Element {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create array schema
  const arraySchema = {
    safeParse: (val: unknown) => {
      try {
        let arr: unknown[];
        if (Array.isArray(val)) {
          arr = val;
        } else if (typeof val === 'string') {
          arr = JSON.parse(val);
        } else if (typeof val === 'object' && val !== null && 'items' in val) {
          arr = (val as { items: unknown[] }).items;
        } else {
          return { success: false, error: 'Not an array' };
        }

        const validItems: T[] = [];
        for (const item of arr.slice(0, maxItems)) {
          const result = itemSchema.safeParse(item);
          if (result.success) {
            validItems.push(result.data);
          }
        }
        return { success: true, data: validItems };
      } catch {
        return { success: false, error: 'Parse error' };
      }
    },
  } as ZodType<T[], ZodTypeDef, unknown>;

  return (
    <ESIStructured
      prompt={`${prompt}\n\nRespond with a JSON array of items (max ${maxItems}).`}
      schema={arraySchema}
      loading={loading}
      fallback={empty}
      className={className}
      onSuccess={(result) => {
        setItems(result);
        setIsLoading(false);
      }}
      render={(data) => {
        if (data.length === 0) return <>{empty}</>;
        return (
          <Wrapper className={className}>
            {data.map((item, i) => (
              <Fragment key={`esi-item:${i}`}>{render(item, i)}</Fragment>
            ))}
          </Wrapper>
        );
      }}
    />
  );
}

// ============================================================================
// ESI.First - Render first child where condition is true
// ============================================================================

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
export function ESIFirst({
  context,
  children,
  fallback = null,
  loading = null,
  className,
}: ESIFirstProps): JSX.Element {
  // This is a placeholder - full implementation would evaluate conditions in order
  // For now, render children wrapped with priority logic
  return (
    <span className={className}>
      {children}
      {/* If no ESI.When matched, show fallback */}
    </span>
  );
}

// ============================================================================
// ESI.Clamp - Constrain value within range
// ============================================================================

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
export function ESIClamp({
  prompt,
  min,
  max,
  render,
  defaultValue,
  loading = '...',
  className,
}: ESIClampProps): JSX.Element {
  const numSchema = {
    safeParse: (val: unknown) => {
      let num: number;
      if (typeof val === 'number') {
        num = val;
      } else if (typeof val === 'string') {
        num = parseFloat(val);
      } else if (typeof val === 'object' && val !== null && 'value' in val) {
        num = Number((val as { value: unknown }).value);
      } else {
        return { success: false, error: 'Not a number' };
      }
      if (isNaN(num)) return { success: false, error: 'NaN' };
      return { success: true, data: Math.max(min, Math.min(max, num)) };
    },
  } as ZodType<number, ZodTypeDef, unknown>;

  return (
    <ESIStructured
      prompt={`${prompt}\n\nRespond with a number between ${min} and ${max}.`}
      schema={numSchema}
      loading={loading}
      fallback={defaultValue !== undefined ? render(defaultValue) : null}
      className={className}
      render={(value) => render(value)}
    />
  );
}

// ============================================================================
// ESI.Select - Choose from predefined options
// ============================================================================

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
export function ESISelect<T extends string>({
  prompt,
  options,
  render,
  defaultOption,
  loading = '...',
  onSelect,
  className,
}: ESISelectProps<T>): JSX.Element {
  const optionSchema = {
    safeParse: (val: unknown) => {
      const str = String(val).trim().toLowerCase();
      const match = options.find((o) => o.toLowerCase() === str);
      if (match) return { success: true, data: match as T };
      // Partial match
      const partial = options.find(
        (o) => str.includes(o.toLowerCase()) || o.toLowerCase().includes(str),
      );
      if (partial) return { success: true, data: partial as T };
      return { success: false, error: 'No match' };
    },
  } as ZodType<T, ZodTypeDef, unknown>;

  return (
    <ESIStructured
      prompt={`${prompt}\n\nOptions: ${options.join(', ')}\n\nRespond with only one of the options.`}
      schema={optionSchema}
      loading={loading}
      fallback={defaultOption ? render(defaultOption) : null}
      className={className}
      onSuccess={onSelect}
      render={(selected) => render(selected)}
    />
  );
}

// ============================================================================
// ESI.Score - Generate a normalized score
// ============================================================================

export interface ESIScoreProps {
  /** What to score */
  prompt: string;
  /** Render function */
  render: (score: number, label: string) => ReactNode;
  /** Score thresholds and labels */
  thresholds?: { value: number; label: string }[];
  /** Loading state */
  loading?: ReactNode;
  /** Class name */
  className?: string;
}

const DEFAULT_THRESHOLDS = [
  { value: 0.2, label: 'very low' },
  { value: 0.4, label: 'low' },
  { value: 0.6, label: 'moderate' },
  { value: 0.8, label: 'high' },
  { value: 1.0, label: 'very high' },
];

/**
 * Generate a normalized 0-1 score with label
 * @example
 * <ESI.Score
 *   prompt="Rate the user's engagement level"
 *   render={(score, label) => <EngagementMeter value={score} label={label} />}
 * />
 */
export function ESIScore({
  prompt,
  render,
  thresholds = DEFAULT_THRESHOLDS,
  loading = '...',
  className,
}: ESIScoreProps): JSX.Element {
  return (
    <ESIClamp
      prompt={prompt}
      min={0}
      max={1}
      loading={loading}
      className={className}
      render={(score) => {
        const label =
          thresholds.find((t) => score <= t.value)?.label || 'unknown';
        return render(score, label);
      }}
    />
  );
}

// ============================================================================
// ESI Namespace Export (Extended)
// ============================================================================

export const ESIControl = {
  // Core
  Structured: ESIStructured,

  // Conditionals
  If: ESIIf,
  Show: ESIShow,
  Hide: ESIHide,
  When: ESIWhen,
  Unless: ESIUnless,

  // Pattern Matching
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
};

export default ESIControl;
