# @affectively/aeon-flux

**The CMS IS the website.** Collaborative page framework with CRDT-based flux state and hyperpersonalized routing.

```
'use aeon';  // One directive enables everything
```

## What is Aeon Flux?

Aeon Flux is a lightweight, collaborative page framework that unifies:

- **CMS = Website** - No separate admin panel, edit in place
- **Editor = Viewer** - Click to edit, changes are live
- **Backend = Frontend** - One runtime, runs on edge
- **Pages from D1** - No file system, pure database
- **AI Everywhere** - Edge Side Inference (ESI) brings AI to any component

The name comes from:
1. **Flux** - CRDT-based data model for conflict-free collaboration
2. **Aeon Flux** - The classic anime (a syzygy of human and machine)

## Key Features

| Feature | Description |
|---------|-------------|
| **Zero-Dependency Rendering** | Single HTML with inline CSS, assets, fonts |
| **Hyperpersonalized Routing** | The website comes to the person |
| **Edge Side Inference (ESI)** | AI inference at render time |
| **Pages from D1** | No file system in production |
| **~20KB WASM runtime** | vs 500KB+ Next.js |
| **Multi-layer caching** | KV (1ms) → D1 (5ms) → Session (50ms) |
| **Speculative pre-rendering** | Zero-latency navigation |
| **Built-in collaboration** | Real-time editing with presence |
| **GitHub PR Publishing** | Visual edits → TSX → Git → Deploy |
| **Lazy hydration** | Only hydrate interactive components on visibility |

## Live Infrastructure

```
https://aeon-flux.taylorbuley.workers.dev
```

| Endpoint | Description |
|----------|-------------|
| `/health` | Health check |
| `/session/:id` | WebSocket for real-time collab |
| `/session/:id/session` | Session state (GET/PUT) |
| `/session/:id/presence` | Active users |
| `/routes` | Route registry |

## Quick Start

```bash
# Install
bun add @affectively/aeon-pages-runtime

# Or use the worker directly
curl https://aeon-flux.taylorbuley.workers.dev/health
```

## Hyperpersonalized Routing

**"The website comes to the person"** - Routes adapt based on user context.

```typescript
import { HeuristicAdapter, extractUserContext } from '@affectively/aeon-pages-runtime';

const adapter = new HeuristicAdapter({
  defaultPaths: ['/', '/chat', '/settings'],
  signals: {
    deriveTheme: (ctx) => ctx.localHour > 18 ? 'dark' : 'light',
    deriveAccent: (ctx) => ctx.emotionState?.primary === 'happy' ? '#FFD700' : '#6366f1',
  },
});

// Route decision includes personalization
const decision = await adapter.route('/dashboard', userContext, componentTree);
// { theme: 'dark', accent: '#FFD700', prefetch: ['/chat'], density: 'comfortable', ... }
```

### Performance

| Operation | 100 nodes | 500 nodes |
|-----------|-----------|-----------|
| `route()` | 0.014ms | 0.05ms |
| `speculate()` | 0.003ms | 0.007ms |
| `personalizeTree()` | 0.026ms | 0.109ms |

Sub-millisecond routing on every request.

## Edge Side Inference (ESI)

Bring AI to any component at render time. Like Varnish ESI, but for inference.

```tsx
import { ESI, ESIProvider } from '@affectively/aeon-pages-runtime/router';

// Basic inference
<ESI.Infer model="llm" cache={300}>
  Summarize this page for {user.name}
</ESI.Infer>

// Structured output with Zod
<ESI.Structured schema={z.object({ sentiment: z.enum(['positive', 'negative']) })}>
  Analyze: {userMessage}
</ESI.Structured>

// Conditional rendering
<ESI.If
  prompt="Should we show a discount?"
  schema={z.object({ show: z.boolean() })}
  when={(r) => r.show}
>
  <DiscountBanner />
</ESI.If>

// Presence-aware (adapts for multiple viewers)
<ESI.Collaborative schema={summarySchema}>
  Summarize for {presence.length} viewers: {content}
</ESI.Collaborative>

// Self-optimizing (improves when user is alone)
<ESI.Optimize
  schema={contentSchema}
  maxIterations={3}
  goal="Improve clarity and engagement"
>
  {draftContent}
</ESI.Optimize>

// Format transformations - wrap any ESI output
<ESI.Markdown gfm>
  <ESI.Infer>Generate API documentation</ESI.Infer>
</ESI.Markdown>

<ESI.Latex displayMode>
  <ESI.Infer>Write the quadratic formula</ESI.Infer>
</ESI.Latex>

<ESI.Json indent={4} copyable>
  <ESI.Structured schema={dataSchema}>Analyze this</ESI.Structured>
</ESI.Json>

// Text-to-code with coding models
<ESI.Code
  generateFrom="A debounce utility function"
  language="typescript"
  model="codestral"
  lineNumbers
  copyable
/>
```

### ESI Format Components

Transform inference output before rendering:

| Component | Purpose |
|-----------|---------|
| `ESI.Markdown` | Render markdown as HTML (GFM support) |
| `ESI.Latex` | Render LaTeX math expressions |
| `ESI.Json` | Pretty-print JSON with syntax highlighting |
| `ESI.Plaintext` | Plain text with whitespace control |
| `ESI.Code` | Code blocks with text-to-code generation |
| `ESI.Semantic` | Extract topics/entities → structured HTML/microdata |

### ESI.Code with Coding Models

`ESI.Code` supports specialized coding models for text-to-code generation:

```tsx
// Text-to-code: generate from natural language
<ESI.Code
  generateFrom="A React hook that fetches user data with loading state"
  language="typescript"
  model="codestral"
  lineNumbers
  copyable
/>

// Available models
type CodeModel =
  | 'codestral'      // Mistral Codestral (default)
  | 'deepseek'       // DeepSeek Coder
  | 'starcoder'      // StarCoder
  | 'codellama'      // Code Llama
  | 'qwen-coder'     // Qwen Coder
  | 'claude'         // Claude
  | 'gpt-4';         // GPT-4

// Auto-detect language
<ESI.Code autoDetect model="deepseek">
  {someCodeString}
</ESI.Code>
```

### ESI.Semantic - Embeddings to Structured HTML

Extract semantic topics, entities, and emotions → generate Schema.org microdata:

```tsx
// Extract topics as JSON-LD structured data
<ESI.Semantic format="jsonld" schemaType="Article" extractEntities extractEmotion>
  {articleText}
</ESI.Semantic>

// Display as interactive tags
<ESI.Semantic format="tags" maxTopics={5} extractEmotion>
  <ESI.Infer>Summarize this news article</ESI.Infer>
</ESI.Semantic>

// Output formats: microdata | jsonld | rdfa | tags
// Uses: embed model (embeddings), classify model (entities), emotion model
```

## Zero-Dependency Rendering

Every page is a **completely self-contained HTML document**. No external requests needed.

```
Single Request → Instant Render
├── Inline CSS (tree-shaken, only used classes)
├── Inline assets (SVG, images as data URIs)
├── Inline fonts (@font-face with embedded data)
├── Minimal hydration script (lazy, on visibility)
└── WASM-rendered at edge (~7ms total)
```

### Multi-Layer Caching

```
Request → KV Cache (1ms) → D1 Cache (5ms) → Session Render (50ms)
                ↓                 ↓                  ↓
           Return HTML       Cache to KV        Cache to KV + D1
```

All pages are pre-rendered at build time and cached. First request for any route is a cache hit.

### Speculative Pre-Rendering

Pages are pre-rendered **before the user clicks**, based on:
- Link visibility (IntersectionObserver)
- Hover intent
- Navigation prediction (Markov chain, community patterns)
- Browser Speculation Rules API

```typescript
import { initSpeculativeRendering } from '@affectively/aeon-pages-runtime';

// Enable instant navigation
initSpeculativeRendering({
  maxCachedPages: 5,
  prerenderOnHover: true,
});
```

### Performance

| Metric | Before | After |
|--------|--------|-------|
| Requests | 15-30 | 1 |
| Total bytes | ~655KB | ~110KB |
| TTFB | 100ms | 50ms |
| First Paint | 500ms | <100ms |
| Time to Interactive | 2000ms | <300ms |
| CLS | 0.05 | 0 |

## GitHub PR Publishing

Visual edits compile to TSX and create PRs automatically.

```
Edit in browser → Durable Object → "Publish" → TSX → PR → CI deploys
```

### WebSocket Commands

```javascript
const ws = new WebSocket('wss://aeon-flux.taylorbuley.workers.dev/session/my-page?userId=user1');

// Publish current tree → creates PR
ws.send(JSON.stringify({ type: 'publish' }));
// Response: { type: 'publish', payload: { prNumber: 123, autoMerged: false } }

// Merge a PR
ws.send(JSON.stringify({ type: 'merge', payload: { prNumber: 123 } }));
```

### Generated TSX

```tsx
'use aeon';

/**
 * AboutPage
 * Route: /about
 *
 * @generated by aeon-flux visual editor
 */

import type { FC } from 'react';
import { Hero } from '@/components/Hero';
import { Section } from '@/components/Section';

const AboutPage: FC = () => {
  return (
    <Page>
      <Hero title="About Us" />
      <Section>
        <Text>We believe in...</Text>
      </Section>
    </Page>
  );
};

export default AboutPage;
```

### Configuration

```toml
# wrangler.toml
[vars]
GITHUB_REPO = "owner/repo"
GITHUB_TREE_PATH = "apps/web/pages"
GITHUB_BASE_BRANCH = "staging"
GITHUB_DEV_BRANCH = "development"
GITHUB_AUTO_MERGE = "false"
```

## Production Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AEON FLUX ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Request + User Context                                                 │
│          │                                                               │
│          ▼                                                               │
│   ┌──────────────────┐     ┌──────────────────┐                         │
│   │ HeuristicAdapter │     │       ESI        │                         │
│   │  (personalize)   │     │   (inference)    │                         │
│   └────────┬─────────┘     └────────┬─────────┘                         │
│            │                        │                                    │
│            ▼                        ▼                                    │
│   ┌──────────────────────────────────────────────────┐                  │
│   │              Durable Objects                      │                  │
│   │    (sessions, presence, real-time sync)          │                  │
│   └──────────────────────────────────────────────────┘                  │
│            │                        │                                    │
│            ▼                        ▼                                    │
│   ┌──────────────┐          ┌──────────────┐                            │
│   │      D1      │          │    GitHub    │                            │
│   │  (storage)   │          │  (publish)   │                            │
│   └──────────────┘          └──────────────┘                            │
│                                                                          │
│   Edit visually → Sync via DO → Publish → TSX → PR → Deploy             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Local-First with Dash

Data lives client-side. No backend services needed.

```typescript
import { DashStorageAdapter } from '@affectively/aeon-pages-runtime';

const storage = new DashStorageAdapter(dashClient, {
  routesCollection: 'aeon-routes',
  sessionsCollection: 'aeon-sessions',
});

// Reads: instant (local)
// Writes: instant (local), syncs via DO
// Collab: Durable Objects
// AI: ESI at edge
```

## Speculation & Prefetching

Predict and prefetch likely next pages.

```typescript
import { SpeculationManager, createSpeculationHook } from '@affectively/aeon-pages-runtime/router';

// Client-side
const manager = new SpeculationManager({
  maxPrefetch: 5,
  hoverDelay: 100,
});

// Prefetch on hover
manager.observeLinks();

// Or use the hook
const useSpeculation = createSpeculationHook(manager);
```

Supports [Speculation Rules API](https://developer.chrome.com/docs/web-platform/prerender-pages) with link prefetch fallback.

## Zero-Instrumentation Analytics

Automatic click tracking with Merkle tree node identification. Every click tracked without writing a single line of instrumentation code.

```typescript
import {
  initClickTracker,
  initContextBridgeWithRetry,
  pushPageView,
} from '@affectively/aeon-pages-analytics';

// Initialize on client
initContextBridgeWithRetry({ maxRetries: 3, retryDelayMs: 500 });
initClickTracker({
  debounceMs: 100,
  maxTextLength: 150,
  excludeSelectors: ['.no-track'],
});
pushPageView();
```

### What Gets Tracked

Every click automatically includes:

| Data | Description |
|------|-------------|
| **Merkle Hash** | Content-addressable ID (stable across renders) |
| **Tree Path** | `['root', 'layout', 'header', 'nav', 'button']` |
| **ESI Context** | User tier, emotion state, features, session |
| **Element Info** | Tag, text, aria-label, role, href |
| **Position** | Viewport and document coordinates |

### DataLayer Events

```javascript
// Click event pushed to dataLayer
{
  event: 'aeon.click',
  click: {
    merkleHash: 'a1b2c3d4e5f6',
    treePath: ['root', 'layout', 'header', 'settings-btn'],
    element: { tagName: 'BUTTON', text: 'Settings' }
  },
  context: {
    userTier: 'pro',
    emotionState: { primary: 'focused', valence: 0.3 }
  }
}
```

Works with GTM + GA4 out of the box. Set `GTM_CONTAINER_ID` in your environment.

## The `'use aeon'` Directive

```tsx
'use aeon';

export default function Page() {
  const {
    presence,    // Who's viewing/editing
    sync,        // Sync state and controls
    version,     // Schema version info
    data,        // Collaborative data store
    setData,     // Update data
  } = useAeonPage();

  return <div>...</div>;
}
```

## Hooks

| Hook | Purpose |
|------|---------|
| `useAeonPage()` | Full page context |
| `usePresence()` | Who's here, cursors, editing |
| `useAeonData<T>(key)` | Collaborative typed data |
| `useCollaborativeInput(key)` | Ready-to-use collab input |
| `useOfflineStatus()` | Offline awareness |
| `useESI()` | ESI context |
| `useESIInfer()` | Programmatic inference |
| `useESITier()` | User tier for feature gating |
| `useESIEmotionState()` | Current emotional context |
| `useESIFeature(name)` | Check feature availability |
| `useIsAdmin()` | Check if user is admin |
| `useMeetsTierRequirement(tier)` | Check if user meets tier |
| `useGlobalESIState()` | Full ESI state object |

## ESI Global State Injection

For zero-CLS tier-aware rendering, inject ESI state in the `<head>`:

```html
<script>
  window.__AEON_ESI_STATE__ = {
    userTier: 'pro',           // free | starter | pro | enterprise
    emotionState: {
      primary: 'focused',
      valence: 0.3,
      arousal: 0.6
    },
    preferences: {
      theme: 'dark',
      reducedMotion: false
    },
    sessionId: 'abc123',
    localHour: 14,
    timezone: 'America/New_York'
  };
</script>
```

Then use in components:

```tsx
import { useESITier } from '@affectively/aeon-flux/esi';

function PremiumFeature() {
  const tier = useESITier();

  if (tier === 'free') {
    return <UpgradePrompt />;
  }

  return <AdvancedAnalytics />;
}

## Configuration

```typescript
// aeon.config.ts
export default {
  pagesDir: './pages',
  runtime: 'cloudflare',

  router: {
    adapter: 'heuristic',
    speculation: {
      enabled: true,
      depth: 2,
      prerenderTop: 1,
    },
    personalization: {
      featureGating: true,
      emotionTheming: true,
      componentOrdering: true,
    },
  },

  esi: {
    enabled: true,
    endpoint: process.env.ESI_ENDPOINT,
    timeout: 5000,
    defaultCacheTtl: 300,
  },

  github: {
    repo: 'owner/repo',
    treePath: 'apps/web/pages',
    baseBranch: 'staging',
    devBranch: 'development',
    autoMerge: false,
  },
};
```

## Packages

| Package | Description |
|---------|-------------|
| `@affectively/aeon-flux` | Main package (npm) |
| `@affectively/aeon-flux/esi` | ESI hooks for tier gating |
| `@affectively/aeon-flux/react` | React bindings |
| `@affectively/aeon-flux/server` | Server utilities |
| `@affectively/aeon-pages-runtime` | Runtime (npm) |
| `@affectively/aeon-pages-runtime/router` | Personalized routing + ESI |
| `@affectively/aeon-pages-runtime/server` | Server utilities |
| `@affectively/aeon-pages-analytics` | Zero-instrumentation analytics with Merkle tree tracking |

## Deploy Your Own

```bash
cd packages/runtime

# Deploy worker
wrangler deploy

# Set GitHub token
wrangler secret put GITHUB_TOKEN

# Create D1 database (optional)
wrangler d1 create aeon-flux
wrangler d1 execute aeon-flux --file=./schema.sql
```

## vs Next.js

| | Next.js | Aeon Flux |
|-|---------|-----------|
| **Runtime** | ~500KB | ~187KB |
| **Routing** | Static | Personalized |
| **AI** | Add-on | ESI built-in |
| **CMS** | Separate | It IS the site |
| **Collaboration** | Add-on | Built-in |
| **Publish** | Manual | Visual → PR |
| **Edge** | Partial | Full |

## Requirements

- Bun >= 1.0.0
- React >= 18.0.0
- Zod >= 3.0.0
- Cloudflare account (for production)

## License

MIT

---

*The CMS is the website. The website comes to the person. Visual edits become code.*
