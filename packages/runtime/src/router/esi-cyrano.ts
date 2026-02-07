/**
 * ESI Cyrano Whisper Channel
 *
 * Bidirectional ESI directives for ambient Cyrano intelligence:
 * - esi:context - Site drops context INTO the stream (page → Cyrano)
 * - esi:cyrano - Cyrano whispers back (Cyrano → page)
 * - esi:halo - Halo meta-insight (Halo → page adaptation)
 *
 * These directives create "chat exhaust" - every interaction becomes
 * part of the ongoing conversation between user and Cyrano.
 */

import type { ESIDirective, ESIResult, UserContext, UserTier, ESIParams } from './types';

// ============================================================================
// Whisper Channel Types
// ============================================================================

/**
 * Emotional state for context dropping
 */
export interface EmotionContext {
  /** Primary detected emotion */
  primary?: string;
  /** Valence: negative (-1) to positive (1) */
  valence?: number;
  /** Arousal: calm (0) to excited (1) */
  arousal?: number;
  /** Dominance: submissive (0) to dominant (1) */
  dominance?: number;
  /** Detection source (facial, vocal, behavioral, combined) */
  source?: 'facial' | 'vocal' | 'behavioral' | 'combined';
  /** Confidence in detection (0-1) */
  confidence?: number;
}

/**
 * Behavioral signals for context dropping
 */
export interface BehaviorContext {
  /** Recent pages visited */
  recentPages?: string[];
  /** Scroll depth on current page (0-1) */
  scrollDepth?: number;
  /** Dwell time on current page (ms) */
  dwellTime?: number;
  /** Whether aimless clicking detected */
  isAimlessClicking?: boolean;
  /** Whether hesitation detected */
  hesitationDetected?: boolean;
  /** Inferred search intent */
  searchingFor?: string;
  /** Interaction velocity (clicks per minute) */
  interactionVelocity?: number;
}

/**
 * Environmental context
 */
export interface EnvironmentContext {
  /** Weather conditions */
  weather?: {
    temp?: number;
    condition?: string;
    humidity?: number;
  };
  /** UV index */
  uv?: number;
  /** Pollen count */
  pollen?: number;
  /** Air quality index */
  aqi?: number;
  /** Location (city/region) */
  location?: string;
  /** Local hour (0-23) */
  localHour?: number;
  /** Is daylight? */
  isDaylight?: boolean;
}

/**
 * Biometric signals
 */
export interface BiometricContext {
  /** Heart rate (BPM) */
  heartRate?: number;
  /** Heart rate variability (ms) */
  hrv?: number;
  /** Stress score (0-100) */
  stressScore?: number;
  /** Energy level (0-100) */
  energyLevel?: number;
  /** Sleep score (0-100) */
  sleepScore?: number;
  /** Readiness score (0-100) */
  readinessScore?: number;
}

/**
 * Full session context dropped via esi:context
 */
export interface SessionContext {
  /** User identifier */
  userId?: string;
  /** User tier */
  tier?: UserTier;
  /** Emotional state (multi-source) */
  emotion?: EmotionContext;
  /** Behavioral signals */
  behavior?: BehaviorContext;
  /** Environmental context */
  environment?: EnvironmentContext;
  /** Biometric signals */
  biometric?: BiometricContext;
  /** Current route */
  currentRoute?: string;
  /** Session start timestamp */
  sessionStartedAt?: number;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cyrano response intent types
 */
export type CyranoIntent =
  | 'greeting'              // Initial greeting
  | 'proactive-check-in'    // Unprompted check-in
  | 'supportive-presence'   // Gentle acknowledgment
  | 'gentle-nudge'          // Soft suggestion
  | 'tool-suggestion'       // Recommend a tool
  | 'navigation-hint'       // Suggest a route
  | 'intervention'          // Protective intervention
  | 'celebration'           // Celebrate progress
  | 'reflection'            // Prompt reflection
  | 'guidance'              // Offer guidance
  | 'farewell'              // Session ending
  | 'custom';               // Custom intent

/**
 * Cyrano response tone
 */
export type CyranoTone =
  | 'warm'
  | 'calm'
  | 'encouraging'
  | 'playful'
  | 'professional'
  | 'empathetic'
  | 'neutral';

/**
 * Trigger conditions for Cyrano response
 */
export type CyranoTrigger =
  | `dwell:>${number}s`           // Dwell time exceeded
  | `scroll:>${number}`           // Scroll depth exceeded
  | `emotion:${string}`           // Emotion detected
  | `behavior:aimless`            // Aimless clicking
  | `behavior:hesitation`         // Hesitation detected
  | `hrv:<${number}`              // HRV below threshold
  | `stress:>${number}`           // Stress above threshold
  | `session:start`               // Session started
  | `session:idle:${number}m`     // Idle for N minutes
  | `navigation:to:${string}`     // Navigated to route
  | `tool:completed:${string}`    // Tool completed
  | `time:${string}`              // Time-based trigger
  | 'always'                      // Always trigger
  | 'never';                      // Never trigger (manual only)

/**
 * Cyrano whisper configuration
 */
export interface CyranoWhisperConfig {
  /** Response intent */
  intent: CyranoIntent;
  /** Response tone */
  tone?: CyranoTone;
  /** Trigger condition */
  trigger?: CyranoTrigger;
  /** Fallback text if inference fails */
  fallback?: string;
  /** Suggested tool to surface */
  suggestTool?: string;
  /** Suggested route to navigate */
  suggestRoute?: string;
  /** Auto-accept navigation (for MCP) */
  autoAcceptNavigation?: boolean;
  /** Priority (higher = more important) */
  priority?: number;
  /** Maximum times to trigger per session */
  maxTriggersPerSession?: number;
  /** Cooldown between triggers (seconds) */
  cooldownSeconds?: number;
  /** Whether to speak via TTS */
  speak?: boolean;
  /** Whether to show as caption */
  showCaption?: boolean;
  /** Required user tier */
  requiredTier?: UserTier;
}

/**
 * Halo observation pattern types
 */
export type HaloObservation =
  | 'anxiety-pattern'
  | 'stress-accumulation'
  | 'emotional-shift'
  | 'behavioral-loop'
  | 'decision-paralysis'
  | 'growth-opportunity'
  | 'values-misalignment'
  | 'blind-spot'
  | 'crisis-indicators'
  | 'positive-momentum'
  | 'synchronicity'
  | 'temporal-echo'
  | 'custom';

/**
 * Halo action types
 */
export type HaloAction =
  | 'suggest-breathing'
  | 'suggest-grounding'
  | 'suggest-journaling'
  | 'suggest-break'
  | 'offer-tool'
  | 'adjust-pace'
  | 'reduce-complexity'
  | 'increase-support'
  | 'celebrate-progress'
  | 'shield-intervention'
  | 'crisis-protocol'
  | 'whisper-to-cyrano'
  | 'adapt-content'
  | 'none';

/**
 * Halo meta-insight configuration
 */
export interface HaloInsightConfig {
  /** Pattern to observe */
  observe: HaloObservation;
  /** Observation window (e.g., '3-pages', '5-minutes', 'session') */
  window?: string;
  /** Action to take when pattern detected */
  action?: HaloAction;
  /** Sensitivity threshold (0-1) */
  sensitivity?: number;
  /** Whether this is a crisis-level observation */
  crisisLevel?: boolean;
  /** Custom insight parameters */
  parameters?: Record<string, unknown>;
}

// ============================================================================
// Chat Exhaust Types
// ============================================================================

/**
 * Chat exhaust types - everything becomes conversation
 */
export type ChatExhaustType =
  | 'system'            // Session start, env data
  | 'esi:context'       // Page drops context
  | 'halo→cyrano'       // Halo whispers to Cyrano
  | 'cyrano→page'       // Cyrano whispers to page
  | 'behavior'          // User action
  | 'emotion'           // Emotion shift detected
  | 'user'              // Explicit user message
  | 'cyrano'            // Cyrano response
  | 'tool:invoke'       // Tool invocation
  | 'tool:complete'     // Tool completion
  | 'navigation';       // Route change

/**
 * Individual chat exhaust entry
 */
export interface ChatExhaustEntry {
  /** Entry type */
  type: ChatExhaustType;
  /** Timestamp */
  timestamp: number;
  /** Entry content (varies by type) */
  content: unknown;
  /** Whether this was visible to user */
  visible?: boolean;
  /** Source of the entry */
  source?: string;
}

/**
 * ESI result extended with whisper channel data
 */
export interface ESIWhisperResult extends ESIResult {
  /** Chat exhaust generated by this directive */
  exhaust?: ChatExhaustEntry[];
  /** Suggested tool from Cyrano */
  suggestedTool?: string;
  /** Suggested route from Cyrano */
  suggestedRoute?: string;
  /** Whether to auto-accept navigation */
  autoAcceptNavigation?: boolean;
  /** Halo insights triggered */
  haloInsights?: HaloInsightConfig[];
}

// ============================================================================
// ESI Context Directive (Page → Cyrano)
// ============================================================================

/**
 * Create an ESI directive to drop session context into the whisper stream.
 * This is how pages communicate their state to Cyrano.
 *
 * @example
 * ```tsx
 * <esiContext
 *   emotion={{ primary: 'anxious', valence: -0.3, arousal: 0.7 }}
 *   behavior={{ scrollDepth: 0.8, dwellTime: 45000 }}
 *   environment={{ weather: { temp: 72, condition: 'sunny' }, uv: 6 }}
 * />
 * ```
 */
export function esiContext(
  context: SessionContext,
  options: {
    /** Whether to emit as chat exhaust */
    emitExhaust?: boolean;
    /** Custom directive ID */
    id?: string;
  } = {}
): ESIDirective {
  const { emitExhaust = true, id } = options;

  return {
    id: id || `esi-context-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: 'custom',
      custom: {
        type: 'context-drop',
        emitExhaust,
      },
    },
    content: {
      type: 'json',
      value: JSON.stringify(context),
    },
    contextAware: true,
    signals: ['emotion', 'preferences', 'history', 'time', 'device'],
  };
}

// ============================================================================
// ESI Cyrano Directive (Cyrano → Page)
// ============================================================================

/**
 * Create an ESI directive for Cyrano to whisper to the page.
 * Cyrano responds based on intent, tone, and trigger conditions.
 *
 * @example
 * ```tsx
 * <esiCyrano
 *   intent="proactive-check-in"
 *   trigger="dwell:>60s"
 *   tone="warm"
 *   fallback="I'm here if you need me"
 * />
 * ```
 */
export function esiCyrano(
  config: CyranoWhisperConfig,
  options: Partial<ESIParams> = {}
): ESIDirective {
  const {
    intent,
    tone = 'warm',
    trigger = 'always',
    fallback,
    suggestTool,
    suggestRoute,
    autoAcceptNavigation = false,
    priority = 1,
    maxTriggersPerSession,
    cooldownSeconds,
    speak = false,
    showCaption = true,
    requiredTier,
  } = config;

  // Build system prompt based on intent and tone
  const systemPrompt = buildCyranoSystemPrompt(intent, tone);

  return {
    id: `esi-cyrano-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: 'llm',
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 150,
      fallback,
      custom: {
        type: 'cyrano-whisper',
        intent,
        tone,
        trigger,
        suggestTool,
        suggestRoute,
        autoAcceptNavigation,
        priority,
        maxTriggersPerSession,
        cooldownSeconds,
        speak,
        showCaption,
      },
      ...options,
    },
    content: {
      type: 'template',
      value: buildCyranoPrompt(intent, trigger),
      variables: {
        intent,
        tone,
        trigger,
      },
    },
    contextAware: true,
    signals: ['emotion', 'preferences', 'history', 'time'],
    requiredTier,
  };
}

/**
 * Build system prompt for Cyrano based on intent and tone
 */
function buildCyranoSystemPrompt(intent: CyranoIntent, tone: CyranoTone): string {
  const toneGuide: Record<CyranoTone, string> = {
    warm: 'Be warm, caring, and approachable. Use gentle language.',
    calm: 'Be calm, measured, and reassuring. Use a steady pace.',
    encouraging: 'Be supportive and uplifting. Celebrate small wins.',
    playful: 'Be light-hearted and fun. Use appropriate humor.',
    professional: 'Be clear and direct. Maintain professionalism.',
    empathetic: 'Show deep understanding. Validate feelings.',
    neutral: 'Be balanced and objective. Provide information.',
  };

  const intentGuide: Record<CyranoIntent, string> = {
    greeting: 'Welcome the user. Make them feel at home.',
    'proactive-check-in': 'Check in gently. Ask how they are doing.',
    'supportive-presence': 'Simply acknowledge. Let them know you are here.',
    'gentle-nudge': 'Suggest an action softly. No pressure.',
    'tool-suggestion': 'Recommend a tool that might help.',
    'navigation-hint': 'Suggest exploring another area.',
    intervention: 'Step in supportively. Offer help.',
    celebration: 'Celebrate their progress. Be genuinely happy for them.',
    reflection: 'Invite them to reflect. Ask thoughtful questions.',
    guidance: 'Offer helpful guidance. Be a trusted advisor.',
    farewell: 'Wish them well. Leave the door open.',
    custom: 'Respond appropriately to the context.',
  };

  return `You are Cyrano, an ambient AI companion. ${toneGuide[tone]} ${intentGuide[intent]}

Keep responses brief (1-2 sentences). Be natural and conversational.
Never start with "I" - use "You" or the situation as the subject.
Never say "As an AI" or similar phrases.
Respond to the emotional context provided.`;
}

/**
 * Build prompt for Cyrano based on intent and trigger
 */
function buildCyranoPrompt(intent: CyranoIntent, trigger: CyranoTrigger): string {
  const prompts: Record<CyranoIntent, string> = {
    greeting: 'Generate a warm greeting based on the time of day and user context.',
    'proactive-check-in': 'Check in with the user based on their emotional state and behavior.',
    'supportive-presence': 'Acknowledge the user\'s presence and current activity.',
    'gentle-nudge': 'Gently suggest the user might benefit from a particular action.',
    'tool-suggestion': 'Suggest a specific tool that could help with the user\'s current state.',
    'navigation-hint': 'Suggest the user might want to explore a different area.',
    intervention: 'Offer supportive intervention based on detected stress or difficulty.',
    celebration: 'Celebrate the user\'s progress or achievement.',
    reflection: 'Invite the user to reflect on their current experience.',
    guidance: 'Offer helpful guidance for the user\'s current situation.',
    farewell: 'Say goodbye warmly, acknowledging the session.',
    custom: 'Respond appropriately to the context provided.',
  };

  let prompt = prompts[intent] || prompts.custom;

  // Add trigger context
  if (trigger !== 'always' && trigger !== 'never') {
    prompt += ` The trigger condition is: ${trigger}.`;
  }

  return prompt;
}

// ============================================================================
// ESI Halo Directive (Halo Meta-Insight)
// ============================================================================

/**
 * Create an ESI directive for Halo meta-insight observation.
 * Halo observes patterns across pages and whispers to Cyrano.
 *
 * @example
 * ```tsx
 * <esiHalo
 *   observe="anxiety-pattern"
 *   window="3-pages"
 *   action="suggest-breathing"
 * />
 * ```
 */
export function esiHalo(
  config: HaloInsightConfig,
  options: Partial<ESIParams> = {}
): ESIDirective {
  const {
    observe,
    window = 'session',
    action = 'whisper-to-cyrano',
    sensitivity = 0.5,
    crisisLevel = false,
    parameters = {},
  } = config;

  return {
    id: `esi-halo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    params: {
      model: 'custom',
      custom: {
        type: 'halo-insight',
        observe,
        window,
        action,
        sensitivity,
        crisisLevel,
        parameters,
      },
      ...options,
    },
    content: {
      type: 'json',
      value: JSON.stringify({
        observation: observe,
        window,
        action,
        sensitivity,
        crisisLevel,
      }),
    },
    contextAware: true,
    signals: ['emotion', 'history', 'time'],
  };
}

// ============================================================================
// Whisper Channel Processing
// ============================================================================

/**
 * Check if a Cyrano trigger condition is met
 */
export function evaluateTrigger(
  trigger: CyranoTrigger,
  context: UserContext,
  sessionContext?: SessionContext
): boolean {
  if (trigger === 'always') return true;
  if (trigger === 'never') return false;

  // Parse trigger string
  const [type, condition] = trigger.split(':');

  switch (type) {
    case 'dwell': {
      // dwell:>60s
      const match = condition?.match(/>(\d+)s/);
      if (!match) return false;
      const threshold = parseInt(match[1], 10) * 1000;
      const dwellTime = sessionContext?.behavior?.dwellTime || 0;
      return dwellTime > threshold;
    }

    case 'scroll': {
      // scroll:>0.8
      const match = condition?.match(/>(\d+\.?\d*)/);
      if (!match) return false;
      const threshold = parseFloat(match[1]);
      const scrollDepth = sessionContext?.behavior?.scrollDepth || 0;
      return scrollDepth > threshold;
    }

    case 'emotion': {
      // emotion:anxious
      const targetEmotion = condition;
      return sessionContext?.emotion?.primary === targetEmotion ||
             context.emotionState?.primary === targetEmotion;
    }

    case 'behavior': {
      // behavior:aimless, behavior:hesitation
      if (condition === 'aimless') {
        return sessionContext?.behavior?.isAimlessClicking === true;
      }
      if (condition === 'hesitation') {
        return sessionContext?.behavior?.hesitationDetected === true;
      }
      return false;
    }

    case 'hrv': {
      // hrv:<40
      const match = condition?.match(/<(\d+)/);
      if (!match) return false;
      const threshold = parseInt(match[1], 10);
      const hrv = sessionContext?.biometric?.hrv || 100;
      return hrv < threshold;
    }

    case 'stress': {
      // stress:>70
      const match = condition?.match(/>(\d+)/);
      if (!match) return false;
      const threshold = parseInt(match[1], 10);
      const stress = sessionContext?.biometric?.stressScore || 0;
      return stress > threshold;
    }

    case 'session': {
      // session:start, session:idle:5m
      if (condition === 'start') {
        return context.isNewSession;
      }
      const idleMatch = condition?.match(/idle:(\d+)m/);
      if (idleMatch) {
        // Would need last activity timestamp to evaluate
        return false;
      }
      return false;
    }

    case 'navigation': {
      // navigation:to:/breathing
      const targetRoute = condition?.replace('to:', '');
      return sessionContext?.currentRoute === targetRoute;
    }

    case 'time': {
      // time:morning (6-11), time:evening (18-21)
      const hour = context.localHour;
      if (condition === 'morning') return hour >= 6 && hour < 12;
      if (condition === 'afternoon') return hour >= 12 && hour < 18;
      if (condition === 'evening') return hour >= 18 && hour < 22;
      if (condition === 'night') return hour >= 22 || hour < 6;
      return false;
    }

    default:
      return false;
  }
}

/**
 * Generate chat exhaust entry from directive result
 */
export function createExhaustEntry(
  directive: ESIDirective,
  result: ESIResult,
  type: ChatExhaustType
): ChatExhaustEntry {
  return {
    type,
    timestamp: Date.now(),
    content: {
      directiveId: directive.id,
      output: result.output,
      model: result.model,
      success: result.success,
      latencyMs: result.latencyMs,
    },
    visible: type === 'cyrano' || type === 'user',
    source: directive.params.model,
  };
}

// ============================================================================
// Tool Suggestion Helpers
// ============================================================================

/**
 * Common tool suggestions based on context
 */
export const CYRANO_TOOL_SUGGESTIONS: Record<string, {
  triggers: CyranoTrigger[];
  tool: string;
  reason: string;
}> = {
  breathing: {
    triggers: ['stress:>70', 'hrv:<40', 'emotion:anxious'],
    tool: 'breathing/4-7-8',
    reason: 'You seem stressed - a breathing exercise might help',
  },
  grounding: {
    triggers: ['emotion:overwhelmed', 'behavior:aimless'],
    tool: 'grounding/5-4-3-2-1',
    reason: 'A grounding exercise can help center you',
  },
  journaling: {
    triggers: ['dwell:>120s', 'emotion:reflective'],
    tool: 'journaling/freeform',
    reason: 'Would you like to write about what\'s on your mind?',
  },
  insights: {
    triggers: ['navigation:to:/insights', 'dwell:>60s'],
    tool: 'insights/dashboard',
    reason: 'Your recent patterns are ready to explore',
  },
};

/**
 * Get tool suggestions based on session context
 */
export function getToolSuggestions(
  context: UserContext,
  sessionContext?: SessionContext
): Array<{ tool: string; reason: string; priority: number }> {
  const suggestions: Array<{ tool: string; reason: string; priority: number }> = [];

  for (const [, config] of Object.entries(CYRANO_TOOL_SUGGESTIONS)) {
    for (const trigger of config.triggers) {
      if (evaluateTrigger(trigger, context, sessionContext)) {
        suggestions.push({
          tool: config.tool,
          reason: config.reason,
          priority: trigger.startsWith('stress') || trigger.startsWith('hrv') ? 2 : 1,
        });
        break; // One suggestion per tool
      }
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}

// All functions are exported at their definition site
