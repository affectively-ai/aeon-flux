/**
 * Aeon Router - Personalized Routing System
 *
 * The website comes to the person - adaptive routing with:
 * - User context signals (emotion, tier, preferences)
 * - Speculative prefetching
 * - Edge Side Inference (ESI)
 * - Pluggable adapters (heuristic, AI, hybrid)
 */
export type { EmotionState, Viewport, ConnectionType, UserTier, UserContext, ThemeMode, LayoutDensity, LayoutType, SkeletonHints, RouteDecision, ComponentNode, ComponentTree, ComponentTreeSchema, RouterAdapter, AIRouterConfig, SpeculationConfig, PersonalizationConfig, RouterConfig, RouterConfigWithESI, ESIModel, ESIContentType, ESIParams, ESIContent, ESIDirective, ESIResult, ESIProcessor, ESIConfig, TranslationResult, TranslationProviderConfig, SupportedLanguageCode, } from './types';
export { DEFAULT_ROUTER_CONFIG, DEFAULT_ESI_CONFIG } from './types';
export { EdgeWorkersESIProcessor, esiInfer, esiEmbed, esiEmotion, esiVision, esiWithContext, } from './esi';
export { esiTranslate, generateTranslationCacheKey, getCachedTranslation, setCachedTranslation, clearTranslationCache, readHeadTranslationConfig, normalizeLanguageCode, getLanguageName, getSupportedLanguages, detectTargetLanguage, translateWithAIGateway, } from './esi-translate';
export { ESI, ESIProvider, ESIInfer, ESIEmbed, ESIEmotion, ESIVision, useESI, useESIInfer, useGlobalESIState, useESIFeature, useESITier, useESIEmotionState, useESIPreferences, updateGlobalESIState, useNavigation, } from './esi-react';
export type { ESIProviderProps, ESIInferProps, ESIEmbedProps, ESIEmotionProps, ESIVisionProps, UseESIInferOptions, GlobalESIState, NavigationRouter, } from './esi-react';
export { ESITranslate, TranslationProvider, TranslationContext, useTranslation, useTranslationOptional, } from './esi-translate-react';
export type { ESITranslateProps, TranslationProviderProps, TranslationContextValue, } from './esi-translate-react';
export { TranslationObserver, useTranslationObserver, initTranslationObserver, } from './esi-translate-observer';
export type { TranslationObserverConfig, } from './esi-translate-observer';
export { HeuristicAdapter } from './heuristic-adapter';
export type { HeuristicAdapterConfig, TierFeatures, SignalProcessor, } from './heuristic-adapter';
export { extractUserContext, createContextMiddleware, setContextCookies, addSpeculationHeaders, serializeToESIState, generateESIStateScript, generateESIStateScriptFromContext, } from './context-extractor';
export type { ContextExtractorOptions, ESIState, } from './context-extractor';
export { SpeculationManager, supportsSpeculationRules, supportsLinkPrefetch, autoInitSpeculation, createSpeculationHook, } from './speculation';
export type { SpeculationOptions, SpeculationState, } from './speculation';
export { parseWithSchema, generateSchemaPrompt, createControlProcessor, esiIf, esiMatch, } from './esi-control';
export type { ESICondition, ESIIfDirective, ESIMatchDirective, ESIControlResult, ESISchemaParams, ESISchemaResult, ESIControlProcessor, } from './esi-control';
export { ESIControl, ESIStructured, ESIIf, ESIShow, ESIHide, ESIWhen, ESIUnless, ESIMatch, ESICase, ESIDefault, ESIFirst, ESITierGate, ESIEmotionGate, ESITimeGate, ESIForEach, ESISelect, ESIABTest, ESIClamp, ESIScore, ESICollaborative, ESIReflect, ESIOptimize, ESIAuto, } from './esi-control-react';
export type { ESIStructuredProps, ESIIfProps, ESIShowProps, ESIHideProps, ESIWhenProps, ESIUnlessProps, ESIMatchProps, ESICaseProps, ESIDefaultProps, ESIFirstProps, ESITierGateProps, ESIEmotionGateProps, ESITimeGateProps, ESIForEachProps, ESISelectProps, ESIABTestProps, ESIClampProps, ESIScoreProps, ESICollaborativeProps, ESIReflectProps, ESIOptimizeProps, ESIAutoProps, OptimizeMeta, } from './esi-control-react';
export { esiContext, esiCyrano, esiHalo, evaluateTrigger, createExhaustEntry, getToolSuggestions, CYRANO_TOOL_SUGGESTIONS, } from './esi-cyrano';
export type { SessionContext, EmotionContext, BehaviorContext, EnvironmentContext, BiometricContext, CyranoWhisperConfig, CyranoIntent, CyranoTone, CyranoTrigger, HaloInsightConfig, HaloObservation, HaloAction, ChatExhaustType, ChatExhaustEntry, ESIWhisperResult, } from './esi-cyrano';
export { parseResource, formatResource, capabilityGrantsAccess, createNodeCapabilityVerifier, createNodeReadCapability, createNodeWriteCapability, createTreeCapability, createPathCapability, createWildcardNodeCapability, checkNodeAccess, filterAccessibleNodes, getMostSpecificCapability, } from './merkle-capability';
export type { NodeCapabilityVerifier, NodeVerifierOptions } from './merkle-capability';
