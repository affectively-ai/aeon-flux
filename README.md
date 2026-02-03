# @affectively/aeon-flux

**The CMS IS the website.** Collaborative page framework with CRDT-based flux state.

```
'use aeon';  // One directive enables everything
```

## What is Aeon Flux?

Aeon Flux is a lightweight, collaborative page framework that unifies:

- **CMS = Website** - No separate admin panel, edit in place
- **Editor = Viewer** - Click to edit, changes are live
- **Backend = Frontend** - One runtime, runs on edge
- **Pages from D1** - No file system, pure database

The name comes from:
1. **Flux** - CRDT-based data model for conflict-free collaboration
2. **Aeon Flux** - The classic anime (a syzygy of human and machine)

## Key Features

| Feature | Description |
|---------|-------------|
| **Pages from D1** | No file system in production, pure database |
| **~187KB runtime** | WASM core vs 500KB+ Next.js |
| **10x faster dev server** | Bun-powered, no webpack |
| **Built-in collaboration** | Real-time editing with presence |
| **Skeleton matching** | Zero CLS with pre-calculated layouts |
| **Durable Objects** | Strong consistency for real-time sync |
| **Distributed by default** | Uses Aeon sync system |

## Quick Start

```bash
# Install
bun add @affectively/aeon-flux

# Initialize project
bun aeon init my-app
cd my-app

# Run dev server
bun run dev

# Build for Cloudflare
bun run build
```

## The `'use aeon'` Directive

Add this directive to any page to enable collaborative features:

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

## Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AEON FLUX PRODUCTION                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cloudflare Worker        D1 Database       Durable Objects │
│  ─────────────────        ───────────       ────────────── │
│  WASM Router              Routes            Real-time sync  │
│  SSR Rendering            Sessions          Presence        │
│  WebSocket upgrade        Component trees   Collaboration   │
│                                                             │
│  ✓ No file system                                           │
│  ✓ Pages come from D1                                       │
│  ✓ Strong consistency via Durable Objects                   │
│  ✓ Eventual propagation to D1 replicas                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Storage Adapters

| Adapter | Use Case |
|---------|----------|
| **Dash** ⭐ | AFFECTIVELY ecosystem (recommended) |
| **File** | Development, local testing |
| **D1** | Cloudflare, eventual consistency |
| **Durable Objects** | Cloudflare, strong consistency |
| **Hybrid** | D1 + DO for best of both |

### Dash Adapter (Recommended)

Dash is AFFECTIVELY's real-time sync system built on Aeon. Use it for seamless integration with the AFFECTIVELY ecosystem:

```typescript
import { createDashClient } from '@affectively/dash';
import { DashStorageAdapter, createAeonServer } from '@affectively/aeon-flux';

// Create Dash client
const dash = createDashClient({
  endpoint: process.env.DASH_ENDPOINT,
  auth: { token: await getAuthToken() },
});

// Use Dash as storage backend
const storage = new DashStorageAdapter(dash, {
  routesCollection: 'aeon-routes',
  sessionsCollection: 'aeon-sessions',
  presenceCollection: 'aeon-presence',
});

// Real-time subscriptions built-in!
storage.subscribeToSession('my-page', (changes) => {
  console.log('Page updated:', changes);
});

storage.subscribeToPresence('my-page', (changes) => {
  console.log('Presence updated:', changes);
});
```

**Why Dash?**
- Real-time sync across all clients (WebSocket-based)
- CRDT conflict resolution (no data loss)
- Offline-first with automatic sync
- Presence tracking built-in
- Works with existing AFFECTIVELY infrastructure

### Other Adapters

```typescript
import { createStorageAdapter } from '@affectively/aeon-flux';

// File-based (development)
const devStorage = createStorageAdapter({ type: 'file', pagesDir: './pages' });

// D1 (Cloudflare production)
const prodStorage = createStorageAdapter({ type: 'd1', d1: env.DB });

// Hybrid (D1 + Durable Objects)
const hybridStorage = createStorageAdapter({
  type: 'hybrid',
  d1: env.DB,
  durableObjectNamespace: env.AEON_SESSIONS,
});

// Dash (AFFECTIVELY ecosystem)
const dashStorage = createStorageAdapter({
  type: 'dash',
  dash: dashClient,
  dashCollections: {
    routes: 'my-routes',
    sessions: 'my-sessions',
  },
});
```

## CLI Commands

```bash
# Initialize new project or convert Next.js
aeon init [dir]

# Development server with hot reload
aeon dev [-p 3000]

# Build for production (generates D1 migrations)
aeon build

# Start production server (local preview)
aeon start [-p 3000]
```

## Build Output

```
.aeon/
├── dist/
│   ├── worker.js      # Cloudflare Worker
│   └── runtime.wasm   # WASM core
├── migrations/
│   └── 0001_initial.sql
├── seed.sql           # Initial page data
├── manifest.json      # Route manifest
└── wrangler.toml      # Deploy config
```

## Hooks

### `useAeonPage()`

Main hook providing full access to Aeon features.

### `usePresence()`

Track who's viewing and editing:

```tsx
const { presence, localUser, updateCursor, updateEditing } = usePresence();
```

### `useAeonData<T>(key)`

Collaborative data with type safety:

```tsx
const [title, setTitle] = useAeonData<string>('title');
```

### `useCollaborativeInput(key)`

Ready-to-use collaborative input:

```tsx
const { value, onChange, onFocus, onBlur, editingBy } = useCollaborativeInput('title');
```

### `useOfflineStatus()`

Offline awareness:

```tsx
const { isOffline, isSyncing, pendingOperations, lastSyncAt } = useOfflineStatus();
```

## Configuration

```typescript
// aeon.config.ts
export default {
  pagesDir: './pages',
  runtime: 'cloudflare', // or 'bun'

  aeon: {
    sync: {
      mode: 'distributed',
      consistencyLevel: 'strong',
    },
    presence: {
      enabled: true,
      cursorTracking: true,
    },
    versioning: {
      enabled: true,
      autoMigrate: true,
    },
    offline: {
      enabled: true,
      maxQueueSize: 1000,
    },
  },
};
```

## vs Next.js

| | Next.js | Aeon Flux |
|-|---------|-----------|
| **Runtime** | ~500KB | ~187KB (WASM) |
| **Cold start** | 2-5s | <50ms |
| **Pages from** | Files | D1 Database |
| **Collaboration** | Add-on | Built-in |
| **CMS** | Separate | It IS the site |
| **Edge** | Partial | Full |
| **CLS** | Manual | Skeleton matching |
| **Consistency** | Eventual | Strong (via DO) |

## Authorization (UCAN + ZK)

Aeon Flux uses `@affectively/auth` for capability-based authorization with UCAN and ZK proofs:

```typescript
import { createAuth } from '@affectively/auth';

// Basic setup (works without UCAN/ZK libraries)
const auth = createAuth({ fallbackToSimple: true });

// Create a token
const token = await auth.createToken({
  userId: 'user-123',
  capabilities: [
    { can: 'read', with: '*' },
    { can: 'write', with: '/blog/*' },
  ],
});

// Verify capability
const canEdit = await auth.verifyCapability({
  capability: 'write',
  resource: '/blog/my-post',
  token,
});
```

**With full UCAN + ZK support:**

```typescript
import { createAuth } from '@affectively/auth';
import { createUCANClient } from '@affectively/ucan';
import { createZKProver } from '@affectively/zk';

const auth = createAuth({
  ucan: createUCANClient({ issuer: myDID }),
  zk: createZKProver({ circuit: 'capability-verify' }),
});

// Create ZK proof (verify without revealing token)
const proof = await auth.createPrivateProof({
  capability: 'read',
  resource: '/private/page',
  token: userToken,
});
```

**Capabilities** (customizable via TypeScript generics):
- `read` - View content
- `write` - Edit content
- `delete` - Remove content
- `admin` - Administrative access
- `*` - Full access

## Packages

| Package | Description |
|---------|-------------|
| `@affectively/aeon-flux` | Main package |
| `@affectively/aeon-flux/server` | Bun/Cloudflare server |
| `@affectively/aeon-flux/react` | React hooks & provider |
| `@affectively/aeon-flux-cli` | CLI tools |

### Dependencies

| Package | Purpose |
|---------|---------|
| `@affectively/aeon` | Distributed sync, presence, offline |
| `@affectively/auth` | UCAN + ZK authorization (optional) |
| `@affectively/dash` | Real-time sync backend (optional) |

## Requirements

- Bun >= 1.0.0
- React >= 18.0.0
- Cloudflare account (for production)

## License

MIT

---

*The CMS is the website. The editor is the viewer. Pages come from D1. One thing, not many.*
