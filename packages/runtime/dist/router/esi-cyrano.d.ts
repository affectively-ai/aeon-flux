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
export type CyranoIntent = 'greeting' | 'proactive-check-in' | 'supportive-presence' | 'gentle-nudge' | 'tool-suggestion' | 'navigation-hint' | 'intervention' | 'celebration' | 'reflection' | 'guidance' | 'farewell' | 'custom';
/**
 * Cyrano response tone
 */
export type CyranoTone = 'warm' | 'calm' | 'encouraging' | 'playful' | 'professional' | 'empathetic' | 'neutral';
/**
 * Trigger conditions for Cyrano response
 */
export type CyranoTrigger = `dwell:>${number}s` | `scroll:>${number}` | `emotion:${string}` | `behavior:aimless` | `behavior:hesitation` | `hrv:<${number}` | `stress:>${number}` | `session:start` | `session:idle:${number}m` | `navigation:to:${string}` | `tool:completed:${string}` | `time:${string}` | 'always' | 'never';
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
export type HaloObservation = 'anxiety-pattern' | 'stress-accumulation' | 'emotional-shift' | 'behavioral-loop' | 'decision-paralysis' | 'growth-opportunity' | 'values-misalignment' | 'blind-spot' | 'crisis-indicators' | 'positive-momentum' | 'synchronicity' | 'temporal-echo' | 'custom';
/**
 * Halo action types
 */
export type HaloAction = 'suggest-breathing' | 'suggest-grounding' | 'suggest-journaling' | 'suggest-break' | 'offer-tool' | 'adjust-pace' | 'reduce-complexity' | 'increase-support' | 'celebrate-progress' | 'shield-intervention' | 'crisis-protocol' | 'whisper-to-cyrano' | 'adapt-content' | 'none';
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
/**
 * Chat exhaust types - everything becomes conversation
 */
export type ChatExhaustType = 'system' | 'esi:context' | 'halo→cyrano' | 'cyrano→page' | 'behavior' | 'emotion' | 'user' | 'cyrano' | 'tool:invoke' | 'tool:complete' | 'navigation';
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
export declare function esiContext(context: SessionContext, options?: {
    /** Whether to emit as chat exhaust */
    emitExhaust?: boolean;
    /** Custom directive ID */
    id?: string;
}): ESIDirective;
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
export declare function esiCyrano(config: CyranoWhisperConfig, options?: Partial<ESIParams>): ESIDirective;
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
export declare function esiHalo(config: HaloInsightConfig, options?: Partial<ESIParams>): ESIDirective;
/**
 * Check if a Cyrano trigger condition is met
 */
export declare function evaluateTrigger(trigger: CyranoTrigger, context: UserContext, sessionContext?: SessionContext): boolean;
/**
 * Generate chat exhaust entry from directive result
 */
export declare function createExhaustEntry(directive: ESIDirective, result: ESIResult, type: ChatExhaustType): ChatExhaustEntry;
/**
 * Common tool suggestions based on context
 */
export declare const CYRANO_TOOL_SUGGESTIONS: Record<string, {
    triggers: CyranoTrigger[];
    tool: string;
    reason: string;
}>;
/**
 * Get tool suggestions based on session context
 */
export declare function getToolSuggestions(context: UserContext, sessionContext?: SessionContext): Array<{
    tool: string;
    reason: string;
    priority: number;
}>;
