/**
 * Aeon Router - Personalized Routing System
 *
 * The website comes to the person - adaptive routing with:
 * - User context signals (emotion, tier, preferences)
 * - Speculative prefetching
 * - Edge Side Inference (ESI)
 * - Pluggable adapters (heuristic, AI, hybrid)
 */

// Core types
export type {
  // User Context
  EmotionState,
  Viewport,
  ConnectionType,
  UserTier,
  UserContext,

  // Route Decision
  ThemeMode,
  LayoutDensity,
  LayoutType,
  SkeletonHints,
  RouteDecision,

  // Component Tree
  ComponentNode,
  ComponentTree,
  ComponentTreeSchema,

  // Router Adapter
  RouterAdapter,

  // Configuration
  AIRouterConfig,
  SpeculationConfig,
  PersonalizationConfig,
  RouterConfig,
  RouterConfigWithESI,

  // ESI Types
  ESIModel,
  ESIContentType,
  ESIParams,
  ESIContent,
  ESIDirective,
  ESIResult,
  ESIProcessor,
  ESIConfig,
} from './types';

// Default configs
export { DEFAULT_ROUTER_CONFIG, DEFAULT_ESI_CONFIG } from './types';

// ESI Processor
export {
  EdgeWorkersESIProcessor,
  esiInfer,
  esiEmbed,
  esiEmotion,
  esiVision,
  esiWithContext,
} from './esi';

// ESI React Components
export {
  ESI,
  ESIProvider,
  ESIInfer,
  ESIEmbed,
  ESIEmotion,
  ESIVision,
  useESI,
  useESIInfer,
  // Global ESI State hooks (consume window.__AEON_ESI_STATE__)
  useGlobalESIState,
  useESIFeature,
  useESITier,
  useESIEmotionState,
  useESIPreferences,
  updateGlobalESIState,
} from './esi-react';
export type {
  ESIProviderProps,
  ESIInferProps,
  ESIEmbedProps,
  ESIEmotionProps,
  ESIVisionProps,
  UseESIInferOptions,
  GlobalESIState,
} from './esi-react';

// Adapters
export { HeuristicAdapter } from './heuristic-adapter';
export type {
  HeuristicAdapterConfig,
  TierFeatures,
  SignalProcessor,
} from './heuristic-adapter';

// Context Extraction
export {
  extractUserContext,
  createContextMiddleware,
  setContextCookies,
  addSpeculationHeaders,
  // ESI State Serialization
  serializeToESIState,
  generateESIStateScript,
  generateESIStateScriptFromContext,
} from './context-extractor';
export type {
  ContextExtractorOptions,
  ESIState,
} from './context-extractor';

// Speculation (client-side prefetching)
export {
  SpeculationManager,
  supportsSpeculationRules,
  supportsLinkPrefetch,
  autoInitSpeculation,
  createSpeculationHook,
} from './speculation';
export type {
  SpeculationOptions,
  SpeculationState,
} from './speculation';

// ESI Control Language
export {
  parseWithSchema,
  generateSchemaPrompt,
  createControlProcessor,
  esiIf,
  esiMatch,
} from './esi-control';
export type {
  ESICondition,
  ESIIfDirective,
  ESIMatchDirective,
  ESIControlResult,
  ESISchemaParams,
  ESISchemaResult,
  ESIControlProcessor,
} from './esi-control';

// ESI Control React Components
export {
  ESIControl,
  // Core
  ESIStructured,
  // Conditionals
  ESIIf,
  ESIShow,
  ESIHide,
  ESIWhen,
  ESIUnless,
  // Pattern Matching
  ESIMatch,
  ESICase,
  ESIDefault,
  ESIFirst,
  // Gates
  ESITierGate,
  ESIEmotionGate,
  ESITimeGate,
  // Iteration & Selection
  ESIForEach,
  ESISelect,
  ESIABTest,
  // Numeric
  ESIClamp,
  ESIScore,
  // Advanced
  ESICollaborative,
  ESIReflect,
  ESIOptimize,
  ESIAuto,
} from './esi-control-react';
export type {
  ESIStructuredProps,
  ESIIfProps,
  ESIShowProps,
  ESIHideProps,
  ESIWhenProps,
  ESIUnlessProps,
  ESIMatchProps,
  ESICaseProps,
  ESIDefaultProps,
  ESIFirstProps,
  ESITierGateProps,
  ESIEmotionGateProps,
  ESITimeGateProps,
  ESIForEachProps,
  ESISelectProps,
  ESIABTestProps,
  ESIClampProps,
  ESIScoreProps,
  ESICollaborativeProps,
  ESIReflectProps,
  ESIOptimizeProps,
  ESIAutoProps,
  OptimizeMeta,
} from './esi-control-react';

// ESI Cyrano Whisper Channel
export {
  esiContext,
  esiCyrano,
  esiHalo,
  evaluateTrigger,
  createExhaustEntry,
  getToolSuggestions,
  CYRANO_TOOL_SUGGESTIONS,
} from './esi-cyrano';
export type {
  SessionContext,
  EmotionContext,
  BehaviorContext,
  EnvironmentContext,
  BiometricContext,
  CyranoWhisperConfig,
  CyranoIntent,
  CyranoTone,
  CyranoTrigger,
  HaloInsightConfig,
  HaloObservation,
  HaloAction,
  ChatExhaustType,
  ChatExhaustEntry,
  ESIWhisperResult,
} from './esi-cyrano';
