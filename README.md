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
| `@affectively/aeon-pages-runtime` | Runtime (npm) |
| `@affectively/aeon-pages-runtime/router` | Personalized routing + ESI |
| `@affectively/aeon-pages-runtime/server` | Server utilities |

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
