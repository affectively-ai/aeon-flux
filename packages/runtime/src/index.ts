/**
 * @affectively/aeon-pages-runtime
 *
 * Lightweight runtime for Aeon Pages - the CMS IS the website.
 *
 * @example
 * ```typescript
 * import { createAeonServer } from '@affectively/aeon-pages-runtime/server';
 *
 * const server = await createAeonServer({
 *   config: {
 *     pagesDir: './pages',
 *     runtime: 'bun',
 *     aeon: {
 *       sync: { mode: 'distributed' },
 *       presence: { enabled: true },
 *     },
 *   },
 * });
 *
 * console.log(`Aeon Pages running on port ${server.port}`);
 * ```
 */

// Core exports
export { createAeonServer } from './server';
export { AeonRouter } from './router';
export { AeonRouteRegistry } from './registry';

// Storage adapters
export {
  createStorageAdapter,
  FileStorageAdapter,
  D1StorageAdapter,
  DurableObjectStorageAdapter,
  HybridStorageAdapter,
  DashStorageAdapter,
} from './storage';
export type { StorageAdapter } from './storage';

// Cloudflare Durable Object classes (for deployment)
export { AeonPageSession, AeonRoutesRegistry } from './durable-object';

// Type exports
export type {
  AeonConfig,
  AeonOptions,
  SyncOptions,
  VersioningOptions,
  PresenceOptions,
  OfflineOptions,
  ComponentOptions,
  OutputOptions,
  RouteDefinition,
  RouteMatch,
  RouteMetadata,
  RouteOperation,
  SerializedComponent,
  PageSession,
  PresenceInfo,
  PresenceUser,
  AeonCapability,
} from './types';

// Version
export const VERSION = '0.1.0';
