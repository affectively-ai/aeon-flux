# @affectively/aeon-pages-analytics

**Zero-instrumentation analytics.** Automatic click tracking with Merkle tree node IDs and rich ESI context.

```bash
bun add @affectively/aeon-pages-analytics
```

## What is this?

Aeon Analytics automatically tracks every click in your application without any manual instrumentation. Each click event includes:

- **Merkle hash** of the clicked component (content-addressable, stable across renders)
- **Full tree path** from root to clicked node
- **Rich ESI context** (user tier, emotion state, features, session info)
- **Element metadata** (text, aria-label, role, href)
- **Position data** (viewport and document coordinates)

Everything flows to GTM dataLayer for GA4 custom events.

## Quick Start

### 1. Server-Side: Inject GTM

```typescript
// In your HTML template
const gtmContainerId = env.GTM_CONTAINER_ID;

const html = `
<!DOCTYPE html>
<html>
<head>
  <!-- GTM Script -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${gtmContainerId}');</script>
</head>
<body>
  <!-- GTM noscript -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmContainerId}"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  ...
</body>
</html>
`;
```

### 2. Client-Side: Initialize Tracking

```typescript
import {
  initClickTracker,
  initContextBridgeWithRetry,
  pushPageView,
  syncESIToDataLayer,
} from '@affectively/aeon-pages-analytics';

// Initialize on page load
initContextBridgeWithRetry({ maxRetries: 3, retryDelayMs: 500 });
initClickTracker({
  debounceMs: 100,
  maxTextLength: 150,
  excludeSelectors: ['.no-track', '[data-no-track]'],
  includePosition: true,
});
pushPageView();

// Track SPA navigation
history.pushState = function(...args) {
  originalPushState(...args);
  syncESIToDataLayer();
  pushPageView();
};
```

### 3. React Provider (Optional)

```tsx
import { AeonAnalyticsProvider } from '@affectively/aeon-pages-analytics';

export default function App({ Component, pageProps }) {
  return (
    <AeonAnalyticsProvider
      gtmContainerId="GTM-XXXXXX"
      trackClicks={true}
      syncESIContext={true}
    >
      <Component {...pageProps} />
    </AeonAnalyticsProvider>
  );
}
```

## Merkle Tree Hashing

Each component gets a deterministic hash based on its content:

```typescript
import { hashNodeSync, buildMerkleTreeSync } from '@affectively/aeon-pages-analytics';

// Hash = SHA-256(type + sorted_props + child_hashes)
const hash = hashNodeSync('Button', { onClick: fn }, ['child1hash']);
// Returns: "a1b2c3d4e5f6" (12-char truncated hash)

// Build tree from component tree
const merkleTree = buildMerkleTreeSync(componentTree);
// Map<nodeId, MerkleNode> with hashes and paths
```

### Why Merkle Trees?

- **Stable IDs** - Same content = same hash, even if DOM order changes
- **Tree paths** - Full ancestry for every click
- **Change detection** - Compare trees to find what changed
- **Cacheable** - Same tree = same hashes

## DataLayer Events

### Context Event (on page load)
```javascript
{
  event: 'aeon.context',
  user: { tier: 'pro', id: 'user_123', sessionId: 'sess_abc' },
  emotion: { primary: 'focused', valence: 0.3, arousal: 0.6 },
  features: { aiInference: true, emotionTracking: true },
  device: { viewport: { width: 1920, height: 1080 }, connection: '4g' },
  time: { localHour: 14, timezone: 'America/New_York' }
}
```

### Click Event
```javascript
{
  event: 'aeon.click',
  aeon: { version: '0.1.0', timestamp: 1707321600000 },
  click: {
    merkleHash: 'a1b2c3d4e5f6',
    treePath: ['root', 'layout', 'header', 'nav', 'settings-button'],
    treePathHashes: ['f1e2d3c4b5a6', 'b2c3d4e5f6a1', ...],
    element: {
      tagName: 'BUTTON',
      text: 'Settings',
      ariaLabel: 'Open settings menu',
      role: 'button'
    },
    position: { x: 1450, y: 32, viewportX: 1450, viewportY: 32 }
  },
  context: {
    userTier: 'pro',
    emotionState: { primary: 'focused', valence: 0.3, arousal: 0.6 },
    sessionId: 'sess_abc'
  }
}
```

### Page View Event
```javascript
{
  event: 'aeon.pageview',
  page: {
    path: '/dashboard',
    title: 'Dashboard - AFFECTIVELY',
    merkleRoot: 'abc123def456'
  },
  user: { tier: 'pro', sessionId: 'sess_abc' }
}
```

## API Reference

### Click Tracking

```typescript
// Initialize
initClickTracker(options?: ClickTrackingOptions): void

// Stop tracking
stopClickTracker(): void

// Check status
isClickTrackerActive(): boolean

// Manual tracking
trackClick(element: HTMLElement, event: MouseEvent): void
trackInteraction(type: string, data: Record<string, unknown>): void
```

### Context Bridge

```typescript
// ESI state access
getESIState(): ESIState | null
hasESIState(): boolean
getESIProperty<K extends keyof ESIState>(key: K): ESIState[K] | null

// Sync to dataLayer
syncESIToDataLayer(): void
pushPageView(): void

// Watch for changes
watchESIChanges(): () => void
initContextBridge(): void
initContextBridgeWithRetry(options: { maxRetries: number, retryDelayMs: number }): void

// Utilities
isAdmin(): boolean
hasFeature(feature: string): boolean
meetsTierRequirement(tier: UserTier): boolean
getUserTier(): UserTier
getEmotionState(): EmotionState | null
```

### Merkle Tree

```typescript
// Sync hashing (uses djb2)
hashNodeSync(type: string, props: object, childHashes: string[]): string
buildMerkleTreeSync(tree: ComponentTree): MerkleTree

// Async hashing (uses SHA-256)
hashNodeAsync(type: string, props: object, childHashes: string[]): Promise<string>
buildMerkleTree(tree: ComponentTree): Promise<MerkleTree>

// DOM helpers
getMerkleAttributes(node: MerkleNode): Record<string, string>
parseMerkleFromElement(el: HTMLElement): MerkleNode | null
findNearestMerkleElement(el: HTMLElement): HTMLElement | null

// Verification
verifyMerkleTree(tree: MerkleTree): boolean
diffMerkleTrees(a: MerkleTree, b: MerkleTree): MerkleDiff
```

### GTM Loader

```typescript
// Inject GTM
injectGTM(config: GTMConfig): void
injectGTMNoScript(containerId: string): void
initializeGTM(config: GTMConfig): void

// SSR helpers
generateGTMScriptTag(containerId: string): string
generateGTMNoScriptTag(containerId: string): string
generateDataLayerScript(initialData: object): string

// Status
isGTMInjected(): boolean
isGTMReady(): boolean
waitForGTM(timeout?: number): Promise<void>
```

## Configuration

```typescript
interface AnalyticsConfig {
  // Required: GTM container ID
  gtmContainerId: string;           // 'GTM-XXXXXX'

  // Optional: Customize behavior
  trackClicks?: boolean;            // Default: true
  trackPageViews?: boolean;         // Default: true
  syncESIContext?: boolean;         // Default: true

  // Click tracking options
  clickOptions?: {
    debounceMs?: number;            // Default: 0
    maxTextLength?: number;         // Default: 100
    excludeSelectors?: string[];    // e.g., ['.no-track']
    includePosition?: boolean;      // Default: true
  };

  // Data layer customization
  dataLayerName?: string;           // Default: 'dataLayer'
  eventPrefix?: string;             // Default: 'aeon'
}
```

## ESI State Types

```typescript
type UserTier = 'free' | 'starter' | 'pro' | 'enterprise' | 'admin';

interface ESIState {
  userTier: UserTier;
  isAdmin?: boolean;
  userId?: string;
  sessionId?: string;
  isNewSession?: boolean;
  emotionState?: {
    primary: string;
    valence: number;
    arousal: number;
  };
  preferences?: Record<string, unknown>;
  features?: Record<string, boolean>;
  recentPages?: string[];
  viewport?: { width: number; height: number };
  connection?: string;
  localHour?: number;
  timezone?: string;
}
```

## License

MIT
