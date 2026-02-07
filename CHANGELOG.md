# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2026-02-07

### Added

- `/esi` export path for ESI hooks (`useESITier`, `useESIEmotionState`, etc.)

## [1.1.2] - 2026-02-07

### Documentation

- Added ESI Global State injection pattern to README
- Documented tier-based hooks (`useESITier`, `useESIEmotionState`, `useESIFeature`, `useGlobalESIState`)
- Added `/esi` export path documentation

## [1.1.1] - 2026-02-07

### Fixed

- CLI binary path corrected to `packages/cli/dist/index.js`

## [1.1.0] - 2026-02-07

### Added

- **Edge Side Inference (ESI)** - AI inference at render time
  - `<ESI.Infer>` - Basic inference with caching
  - `<ESI.Structured>` - Zod schema validation for structured output
  - `<ESI.If>` - Conditional rendering based on AI decisions
  - `<ESI.Collaborative>` - Presence-aware inference
  - `<ESI.Optimize>` - Self-improving content generation
- **Tier-based feature gating** - Control features by user tier (free/starter/pro/enterprise)
- **Global state injection** - `window.__AEON_ESI_STATE__` for zero-CLS personalization

## [1.0.0] - 2026-02-01

### Core Features

- **Zero-Dependency Rendering** - Single HTML with inline CSS, assets, fonts
- **Hyperpersonalized Routing** - Routes adapt based on user context
- **~20KB WASM Runtime** - Rust-compiled WebAssembly for performance
- **Multi-layer Caching** - KV (1ms) -> D1 (5ms) -> Session (50ms)
- **Speculative Pre-rendering** - Zero-latency navigation via prediction
- **Real-time Collaboration** - CRDT-based conflict-free editing
- **GitHub PR Publishing** - Visual edits compile to TSX and create PRs

### Runtime

- Durable Objects for session management
- WebSocket-based real-time sync
- Service worker with total preload strategy
- Speculation Rules API support

### React Integration

- `useAeonPage()` - Full page context with presence and sync
- `usePresence()` - Collaborative cursors and editing state
- `useAeonData<T>()` - Typed collaborative data store
- `useCollaborativeInput()` - Ready-to-use collaborative inputs
- `useOfflineStatus()` - Network awareness

### CLI

- `aeon init` - Project scaffolding
- `aeon dev` - Development server with hot reload
- `aeon build` - Production build for Cloudflare Workers
- `aeon start` - Production server

### Offline Support

- Encrypted offline queue with AES-256-GCM
- Priority-based sync (high/normal/low)
- Conflict resolution strategies (local-wins, remote-wins, merge, manual)
- Push notifications with background sync

### Performance

| Metric | Value |
|--------|-------|
| Requests per page | 1 |
| Bundle size | ~110KB |
| TTFB | 50ms |
| First Paint | <100ms |
| TTI | <300ms |
| CLS | 0 |
