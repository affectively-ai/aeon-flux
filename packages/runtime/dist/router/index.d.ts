/**
 * Aeon Router - Personalized Routing System
 *
 * The website comes to the person - adaptive routing with:
 * - User context signals (emotion, tier, preferences)
 * - Speculative prefetching
 * - Edge Side Inference (ESI)
 * - Pluggable adapters (heuristic, AI, hybrid)
 */
export type { EmotionState, Viewport, ConnectionType, UserTier, UserContext, ThemeMode, LayoutDensity, LayoutType, SkeletonHints, RouteDecision, ComponentNode, ComponentTree, ComponentTreeSchema, RouterAdapter, AIRouterConfig, SpeculationConfig, PersonalizationConfig, RouterConfig, RouterConfigWithESI, ESIModel, ESIContentType, ESIParams, ESIContent, ESIDirective, ESIResult, ESIProcessor, ESIConfig, } from './types';
export { DEFAULT_ROUTER_CONFIG, DEFAULT_ESI_CONFIG } from './types';
export { EdgeWorkersESIProcessor, esiInfer, esiEmbed, esiEmotion, esiVision, esiWithContext, } from './esi';
export { ESI, ESIProvider, ESIInfer, ESIEmbed, ESIEmotion, ESIVision, useESI, useESIInfer, useGlobalESIState, useESIFeature, useESITier, useESIEmotionState, useESIPreferences, updateGlobalESIState, } from './esi-react';
export type { ESIProviderProps, ESIInferProps, ESIEmbedProps, ESIEmotionProps, ESIVisionProps, UseESIInferOptions, GlobalESIState, } from './esi-react';
export { HeuristicAdapter } from './heuristic-adapter';
export type { HeuristicAdapterConfig, TierFeatures, SignalProcessor, } from './heuristic-adapter';
export { extractUserContext, createContextMiddleware, setContextCookies, addSpeculationHeaders, serializeToESIState, generateESIStateScript, generateESIStateScriptFromContext, } from './context-extractor';
export type { ContextExtractorOptions, ESIState, } from './context-extractor';
export { SpeculationManager, supportsSpeculationRules, supportsLinkPrefetch, autoInitSpeculation, createSpeculationHook, } from './speculation';
export type { SpeculationOptions, SpeculationState, } from './speculation';
export { parseWithSchema, generateSchemaPrompt, createControlProcessor, esiIf, esiMatch, } from './esi-control';
export type { ESICondition, ESIIfDirective, ESIMatchDirective, ESIControlResult, ESISchemaParams, ESISchemaResult, ESIControlProcessor, } from './esi-control';
export { ESIControl, ESIStructured, ESIIf, ESIMatch, ESICase, ESIDefault, ESICollaborative, ESIReflect, ESIOptimize, ESIAuto, } from './esi-control-react';
export type { ESIStructuredProps, ESIIfProps, ESIMatchProps, ESICaseProps, ESIDefaultProps, ESICollaborativeProps, ESIReflectProps, ESIOptimizeProps, ESIAutoProps, OptimizeMeta, } from './esi-control-react';
export { esiContext, esiCyrano, esiHalo, evaluateTrigger, createExhaustEntry, getToolSuggestions, CYRANO_TOOL_SUGGESTIONS, } from './esi-cyrano';
export type { SessionContext, EmotionContext, BehaviorContext, EnvironmentContext, BiometricContext, CyranoWhisperConfig, CyranoIntent, CyranoTone, CyranoTrigger, HaloInsightConfig, HaloObservation, HaloAction, ChatExhaustType, ChatExhaustEntry, ESIWhisperResult, } from './esi-cyrano';
