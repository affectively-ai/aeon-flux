/**
 * Aeon Pages Cloudflare Worker
 *
 * Entry point for Cloudflare Workers deployment.
 * Handles routing to Durable Objects and static assets.
 */
export { AeonPageSession, AeonRoutesRegistry } from './durable-object';
interface Env {
    PAGE_SESSIONS: DurableObjectNamespace;
    ROUTES_REGISTRY: DurableObjectNamespace;
    DB?: D1Database;
    CACHE?: KVNamespace;
    ENVIRONMENT: string;
}
interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<void>;
}
interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    run(): Promise<void>;
    first<T>(): Promise<T | null>;
    all<T>(): Promise<{
        results: T[];
    }>;
}
interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: {
        expirationTtl?: number;
    }): Promise<void>;
    delete(key: string): Promise<void>;
}
interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
}
interface DurableObjectId {
    toString(): string;
}
interface DurableObjectStub {
    fetch(request: Request): Promise<Response>;
}
declare const _default: {
    fetch(request: Request, env: Env): Promise<Response>;
};
export default _default;
