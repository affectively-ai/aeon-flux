/**
 * Aeon Analytics Types
 *
 * TypeScript interfaces for automatic click tracking, GTM integration,
 * and Merkle tree-based node identification.
 */

// ============================================================================
// GTM Configuration
// ============================================================================

export interface GTMConfig {
  /** GTM Container ID (e.g., 'GTM-XXXXXX') */
  containerId: string;

  /** Defer script loading (default: true) */
  defer?: boolean;

  /** Custom dataLayer name (default: 'dataLayer') */
  dataLayerName?: string;
}

// ============================================================================
// Analytics Configuration
// ============================================================================

export interface ClickTrackingOptions {
  /** Debounce rapid clicks in milliseconds (default: 0) */
  debounceMs?: number;

  /** Max text length to capture (default: 100) */
  maxTextLength?: number;

  /** CSS selectors to exclude from tracking */
  excludeSelectors?: string[];

  /** Include click position data (default: true) */
  includePosition?: boolean;

  /** Include full tree path (default: true) */
  includeTreePath?: boolean;
}

export interface AnalyticsConfig {
  /** Required: GTM container ID */
  gtmContainerId: string;

  /** Enable click tracking (default: true) */
  trackClicks?: boolean;

  /** Enable page view tracking (default: true) */
  trackPageViews?: boolean;

  /** Sync ESI context to dataLayer (default: true) */
  syncESIContext?: boolean;

  /** Click tracking options */
  clickOptions?: ClickTrackingOptions;

  /** Custom dataLayer name (default: 'dataLayer') */
  dataLayerName?: string;

  /** Event name prefix (default: 'aeon') */
  eventPrefix?: string;

  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Merkle Tree Types
// ============================================================================

export interface MerkleNode {
  /** SHA-256 hash truncated to 12 characters */
  hash: string;

  /** Original node ID from ComponentTree */
  originalId: string;

  /** Component type name */
  type: string;

  /** Component props (sanitized for hashing) */
  props: Record<string, unknown>;

  /** Child Merkle hashes */
  childHashes: string[];

  /** Ancestry path from root (node types) */
  path: string[];

  /** Ancestry path hashes */
  pathHashes: string[];

  /** Depth in tree (0 = root) */
  depth: number;
}

export interface MerkleTree {
  /** Root hash of the entire tree */
  rootHash: string;

  /** Map of original node ID to MerkleNode */
  nodes: Map<string, MerkleNode>;

  /** Get MerkleNode by original ID */
  getNode(id: string): MerkleNode | undefined;

  /** Get MerkleNode by hash */
  getNodeByHash(hash: string): MerkleNode | undefined;

  /** Get all nodes at a depth level */
  getNodesAtDepth(depth: number): MerkleNode[];
}

// ============================================================================
// DOM Attributes
// ============================================================================

/** Data attribute for Merkle hash */
export const MERKLE_ATTR = 'data-aeon-merkle';

/** Data attribute for tree path */
export const PATH_ATTR = 'data-aeon-path';

/** Data attribute for tree path hashes */
export const PATH_HASHES_ATTR = 'data-aeon-path-hashes';

/** Data attribute for node type */
export const TYPE_ATTR = 'data-aeon-type';

// ============================================================================
// ESI State Types (mirrored from runtime for standalone usage)
// ============================================================================

export type UserTier = 'free' | 'starter' | 'pro' | 'enterprise' | 'admin';
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'fast';

export interface EmotionState {
  primary: string;
  valence: number;
  arousal: number;
  confidence?: number;
}

export interface ESIStateFeatures {
  aiInference: boolean;
  emotionTracking: boolean;
  collaboration: boolean;
  advancedInsights: boolean;
  customThemes: boolean;
  voiceSynthesis: boolean;
  imageAnalysis: boolean;
}

export interface ESIState {
  userTier: UserTier;
  /** Admin flag - bypasses all tier restrictions */
  isAdmin?: boolean;
  emotionState?: EmotionState;
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    reducedMotion: boolean;
    language?: string;
  };
  sessionId?: string;
  localHour: number;
  timezone: string;
  features: ESIStateFeatures;
  userId?: string;
  isNewSession: boolean;
  recentPages: string[];
  viewport: { width: number; height: number };
  connection: ConnectionType;
}

// ============================================================================
// DataLayer Event Types
// ============================================================================

export interface AeonEventBase {
  event: string;
  aeon: {
    version: string;
    timestamp: number;
  };
}

export interface ElementInfo {
  tagName: string;
  text: string;
  ariaLabel?: string;
  role?: string;
  href?: string;
  id?: string;
  className?: string;
}

export interface PositionInfo {
  x: number;
  y: number;
  viewportX: number;
  viewportY: number;
}

export interface ContextEvent extends AeonEventBase {
  event: 'aeon.context';
  user: {
    tier: UserTier;
    id?: string;
    sessionId?: string;
    isNewSession: boolean;
  };
  emotion?: EmotionState;
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    reducedMotion: boolean;
    language?: string;
  };
  features: ESIStateFeatures;
  device: {
    viewport: { width: number; height: number };
    connection: ConnectionType;
  };
  time: {
    localHour: number;
    timezone: string;
  };
  recentPages: string[];
}

export interface PageViewEvent extends AeonEventBase {
  event: 'aeon.pageview';
  page: {
    path: string;
    title: string;
    merkleRoot: string;
  };
  user: {
    tier: UserTier;
    id?: string;
    sessionId?: string;
    isNewSession: boolean;
  };
  emotion?: EmotionState;
  features: ESIStateFeatures;
  device: {
    viewport: { width: number; height: number };
    connection: ConnectionType;
    reducedMotion: boolean;
  };
  time: {
    localHour: number;
    timezone: string;
  };
}

export interface ClickEvent extends AeonEventBase {
  event: 'aeon.click';
  click: {
    merkleHash: string;
    treePath: string[];
    treePathHashes: string[];
    element: ElementInfo;
    position: PositionInfo;
  };
  context: Partial<ESIState>;
}

export type DataLayerEvent = ContextEvent | PageViewEvent | ClickEvent;

// ============================================================================
// Window Extensions
// ============================================================================

declare global {
  interface Window {
    __AEON_ESI_STATE__?: ESIState & {
      update?: (partial: Partial<ESIState>) => void;
      subscribe?: (listener: (state: ESIState) => void) => () => void;
    };
    dataLayer?: unknown[];
    __AEON_MERKLE_TREE__?: MerkleTree;
    __AEON_ANALYTICS_INITIALIZED__?: boolean;
  }
}

// ============================================================================
// Component Tree Types (for build-time integration)
// ============================================================================

export interface ComponentNode {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
  requiredTier?: UserTier;
  relevanceSignals?: string[];
  defaultHidden?: boolean;
}

export interface ComponentTree {
  rootId: string;
  nodes: Map<string, ComponentNode>;
  getNode(id: string): ComponentNode | undefined;
  getChildren(id: string): ComponentNode[];
}

// ============================================================================
// Serialized Types (for data attributes)
// ============================================================================

export interface SerializedMerkleInfo {
  hash: string;
  path: string[];
  pathHashes: string[];
  type: string;
  depth: number;
}
