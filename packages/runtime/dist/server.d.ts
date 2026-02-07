/**
 * Aeon Pages Bun Server
 *
 * Lightweight server for serving Aeon pages with:
 * - Hot reload in development
 * - Collaborative route mutations via Aeon sync
 * - File system persistence
 * - Personalized routing with speculation
 */
import { AeonRouter } from './router';
import { AeonRouteRegistry } from './registry';
import type { AeonConfig } from './types';
import type { RouterConfig, RouteDecision, UserContext } from './router/types';
export interface ServerOptions {
    config: AeonConfig;
    /** Personalized router configuration */
    router?: RouterConfig;
    onRouteChange?: (route: string, type: 'add' | 'update' | 'remove') => void;
    onRouteDecision?: (decision: RouteDecision, context: UserContext) => void;
}
/**
 * Create an Aeon Pages server using Bun's native server
 */
export declare function createAeonServer(options: ServerOptions): Promise<Bun.Server<undefined>>;
export { AeonRouter, AeonRouteRegistry };
