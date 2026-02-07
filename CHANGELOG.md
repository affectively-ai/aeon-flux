# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-02-07

### Added

#### Runtime Package (`@aeon-pages/runtime`)

- **Offline Queue System**
  - `offline/types.ts` - Type definitions for offline operations, queue config, sync, conflicts, network state
  - `offline/encryption.ts` - AES-256-GCM encryption using Web Crypto API with UCAN or session-based key derivation
  - `offline/encrypted-queue.ts` - Priority queuing (high/normal/low) with 50MB capacity, automatic compaction, retry logic

- **Sync Coordination**
  - `sync/coordinator.ts` - Network state tracking, bandwidth profiling, adaptive batch sizing
  - `sync/conflict-resolver.ts` - Conflict detection with resolution strategies (local-wins, remote-wins, merge, last-modified, manual)

- **Push Notifications**
  - `service-worker-push.ts` - Push notification handler with background sync support
  - Integrated push handlers into main service worker

- **Durable Object Sync Endpoints**
  - `POST /sync-queue` - Receive offline queue batch
  - `GET /queue-status` - Return pending operations and conflicts
  - `POST /resolve-conflict` - Manual conflict resolution

- **Extended Configuration Types**
  - `PushOptions` - Push notification configuration
  - `InstallOptions` - PWA install prompt configuration
  - Enhanced `OfflineOptions` with encryption, sync, and storage sub-configs

#### React Package (`@aeon-pages/react`)

- **Hooks**
  - `useNetworkState` - Network state and bandwidth monitoring
  - `useConflicts` - Conflict management with resolution methods

- **Components**
  - `InstallPrompt` - PWA install prompt with iOS detection (+ `useInstallPrompt` hook)
  - `PushNotifications` - Push subscription management (+ `usePushNotifications` hook)
  - `OfflineDiagnostics` - Composable diagnostic panels for network, service worker, cache, queue, and conflicts

### Tests

- Added comprehensive test suites for all new modules:
  - `offline/encryption.test.ts` - 20 tests
  - `offline/encrypted-queue.test.ts` - 35 tests
  - `sync/conflict-resolver.test.ts` - 38 tests
  - `sync/coordinator.test.ts` - 33 tests

## [0.2.0] - 2025-01-15

### Added

- Initial release of core framework
- Page session management with Durable Objects
- Real-time collaboration via WebSocket
- CRDT-based conflict resolution
- Service worker with total preload strategy
- React integration with hooks and components
- CLI for project scaffolding and builds
- Build system with pre-rendering support

## [0.1.0] - 2025-01-01

### Added

- Project initialization
- Basic architecture design
- Proof of concept implementation
