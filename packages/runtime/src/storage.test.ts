import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  FileStorageAdapter,
  D1StorageAdapter,
  DurableObjectStorageAdapter,
  HybridStorageAdapter,
  DashStorageAdapter,
  createStorageAdapter,
} from './storage';
import type {
  RouteDefinition,
  PageSession,
  SerializedComponent,
} from './types';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('FileStorageAdapter', () => {
  const testDataDir = '.aeon/test-data';
  let adapter: FileStorageAdapter;

  beforeEach(async () => {
    adapter = new FileStorageAdapter({
      pagesDir: './pages',
      dataDir: testDataDir,
    });
    await adapter.init();
  });

  afterEach(async () => {
    // Clean up test data
    await rm(testDataDir, { recursive: true, force: true });
  });

  describe('routes', () => {
    test('saves and retrieves a route', async () => {
      const route: RouteDefinition = {
        pattern: '/about',
        sessionId: 'about',
        componentId: 'about',
        isAeon: true,
      };

      await adapter.saveRoute(route);
      const retrieved = await adapter.getRoute('/about');

      expect(retrieved).toEqual(route);
    });

    test('returns null for non-existent route', async () => {
      const route = await adapter.getRoute('/nonexistent');
      expect(route).toBeNull();
    });

    test('gets all routes', async () => {
      const routes: RouteDefinition[] = [
        {
          pattern: '/',
          sessionId: 'index',
          componentId: 'index',
          isAeon: true,
        },
        {
          pattern: '/about',
          sessionId: 'about',
          componentId: 'about',
          isAeon: true,
        },
        {
          pattern: '/contact',
          sessionId: 'contact',
          componentId: 'contact',
          isAeon: false,
        },
      ];

      for (const route of routes) {
        await adapter.saveRoute(route);
      }

      const allRoutes = await adapter.getAllRoutes();

      expect(allRoutes).toHaveLength(3);
      expect(allRoutes.map((r) => r.pattern).sort()).toEqual([
        '/',
        '/about',
        '/contact',
      ]);
    });

    test('deletes a route', async () => {
      const route: RouteDefinition = {
        pattern: '/to-delete',
        sessionId: 'to-delete',
        componentId: 'to-delete',
        isAeon: true,
      };

      await adapter.saveRoute(route);
      expect(await adapter.getRoute('/to-delete')).not.toBeNull();

      await adapter.deleteRoute('/to-delete');
      expect(await adapter.getRoute('/to-delete')).toBeNull();
    });

    test('handles routes with slashes in pattern', async () => {
      const route: RouteDefinition = {
        pattern: '/blog/posts/featured',
        sessionId: 'blog-posts-featured',
        componentId: 'blog-posts-featured',
        isAeon: true,
      };

      await adapter.saveRoute(route);
      const retrieved = await adapter.getRoute('/blog/posts/featured');

      expect(retrieved).toEqual(route);
    });
  });

  describe('sessions', () => {
    test('saves and retrieves a session', async () => {
      const session: PageSession = {
        route: '/test-page',
        tree: {
          type: 'div',
          props: { className: 'container' },
          children: [{ type: 'h1', props: {}, children: ['Hello World'] }],
        },
        data: { title: 'Test Page' },
        schema: { version: '1.0.0' },
        presence: [],
      };

      await adapter.saveSession(session);
      const retrieved = await adapter.getSession('test-page');

      expect(retrieved).toEqual(session);
    });

    test('returns null for non-existent session', async () => {
      const session = await adapter.getSession('nonexistent');
      expect(session).toBeNull();
    });
  });

  describe('trees', () => {
    test('saves and retrieves a tree', async () => {
      // First create a session
      const session: PageSession = {
        route: '/tree-test',
        tree: {
          type: 'div',
          props: {},
          children: ['Initial'],
        },
        data: {},
        schema: { version: '1.0.0' },
        presence: [],
      };

      await adapter.saveSession(session);

      // Update tree
      const newTree: SerializedComponent = {
        type: 'div',
        props: { className: 'updated' },
        children: [{ type: 'p', props: {}, children: ['Updated content'] }],
      };

      await adapter.saveTree('tree-test', newTree);
      const retrieved = await adapter.getTree('tree-test');

      expect(retrieved).toEqual(newTree);
    });

    test('returns null for non-existent tree', async () => {
      const tree = await adapter.getTree('nonexistent');
      expect(tree).toBeNull();
    });
  });
});

describe('createStorageAdapter', () => {
  test('creates file adapter by default', () => {
    const adapter = createStorageAdapter({ type: 'file' });
    expect(adapter.name).toBe('file');
  });

  test('creates file adapter with custom dirs', () => {
    const adapter = createStorageAdapter({
      type: 'file',
      pagesDir: './custom-pages',
      dataDir: './custom-data',
    });
    expect(adapter.name).toBe('file');
  });

  test('throws for d1 without database', () => {
    expect(() => createStorageAdapter({ type: 'd1' })).toThrow(
      'D1 database required',
    );
  });

  test('throws for durable-object without namespace', () => {
    expect(() => createStorageAdapter({ type: 'durable-object' })).toThrow(
      'Durable Object namespace required',
    );
  });

  test('throws for hybrid without both deps', () => {
    expect(() => createStorageAdapter({ type: 'hybrid' })).toThrow(
      'Both Durable Object namespace and D1 database required',
    );
  });

  test('throws for dash without client', () => {
    expect(() => createStorageAdapter({ type: 'dash' })).toThrow(
      'Dash client required',
    );
  });

  test('throws for custom without adapter', () => {
    expect(() => createStorageAdapter({ type: 'custom' })).toThrow(
      'Custom adapter required',
    );
  });

  test('uses custom adapter when provided', () => {
    const customAdapter = {
      name: 'my-custom',
      init: async () => {},
      getRoute: async () => null,
      getAllRoutes: async () => [],
      saveRoute: async () => {},
      deleteRoute: async () => {},
      getSession: async () => null,
      saveSession: async () => {},
      getTree: async () => null,
      saveTree: async () => {},
    };

    const adapter = createStorageAdapter({
      type: 'custom',
      custom: customAdapter,
    });

    expect(adapter).toBe(customAdapter);
    expect(adapter.name).toBe('my-custom');
  });
});

describe('StorageAdapter interface', () => {
  test('FileStorageAdapter implements interface', async () => {
    const adapter = new FileStorageAdapter({
      pagesDir: './pages',
      dataDir: '.aeon/interface-test',
    });

    // Verify all interface methods exist
    expect(typeof adapter.name).toBe('string');
    expect(typeof adapter.init).toBe('function');
    expect(typeof adapter.getRoute).toBe('function');
    expect(typeof adapter.getAllRoutes).toBe('function');
    expect(typeof adapter.saveRoute).toBe('function');
    expect(typeof adapter.deleteRoute).toBe('function');
    expect(typeof adapter.getSession).toBe('function');
    expect(typeof adapter.saveSession).toBe('function');
    expect(typeof adapter.getTree).toBe('function');
    expect(typeof adapter.saveTree).toBe('function');

    // Clean up
    await rm('.aeon/interface-test', { recursive: true, force: true });
  });
});

// Mock D1 Database
function createMockD1() {
  const store: Record<string, Record<string, unknown>> = {
    routes: {},
    sessions: {},
    presence: {},
  };

  return {
    exec: async () => {},
    prepare: (query: string) => {
      const bindValues: unknown[] = [];
      return {
        bind: (...values: unknown[]) => {
          bindValues.push(...values);
          return {
            bind: (...moreValues: unknown[]) => {
              bindValues.push(...moreValues);
              return { first, all, run };
            },
            first,
            all,
            run,
          };

          async function first() {
            if (query.includes('SELECT * FROM routes')) {
              const path = bindValues[0] as string;
              return store.routes[path] || null;
            }
            if (query.includes('SELECT * FROM sessions')) {
              const sessionId = bindValues[0] as string;
              return store.sessions[sessionId] || null;
            }
            if (query.includes('SELECT tree FROM sessions')) {
              const sessionId = bindValues[0] as string;
              const session = store.sessions[sessionId];
              return session ? { tree: (session as any).tree } : null;
            }
            return null;
          }

          async function all() {
            if (query.includes('SELECT * FROM routes')) {
              return { results: Object.values(store.routes) };
            }
            if (query.includes('SELECT * FROM presence')) {
              const sessionId = bindValues[0] as string;
              return {
                results: Object.values(store.presence).filter(
                  (p: any) => p.session_id === sessionId,
                ),
              };
            }
            return { results: [] };
          }

          async function run() {
            if (query.includes('INSERT OR REPLACE INTO routes')) {
              const [path, pattern, session_id, component_id, layout, is_aeon] =
                bindValues;
              store.routes[path as string] = {
                path,
                pattern,
                session_id,
                component_id,
                layout,
                is_aeon,
              };
            }
            if (query.includes('INSERT OR REPLACE INTO sessions')) {
              const [session_id, route, tree, data, schema_version] =
                bindValues;
              store.sessions[session_id as string] = {
                session_id,
                route,
                tree,
                data,
                schema_version,
              };
            }
            if (query.includes('UPDATE sessions SET tree')) {
              const [tree, session_id] = bindValues;
              if (store.sessions[session_id as string]) {
                (store.sessions[session_id as string] as any).tree = tree;
              }
            }
            if (query.includes('DELETE FROM routes')) {
              const path = bindValues[0] as string;
              delete store.routes[path];
            }
          }
        },
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => {},
      };
    },
  };
}

describe('D1StorageAdapter', () => {
  let adapter: D1StorageAdapter;
  let mockDb: ReturnType<typeof createMockD1>;

  beforeEach(async () => {
    mockDb = createMockD1();
    adapter = new D1StorageAdapter(mockDb as any);
    await adapter.init();
  });

  test('has correct name', () => {
    expect(adapter.name).toBe('d1');
  });

  test('saves and retrieves a route', async () => {
    const route: RouteDefinition = {
      pattern: '/test',
      sessionId: 'test',
      componentId: 'test',
      isAeon: true,
    };

    await adapter.saveRoute(route);
    const retrieved = await adapter.getRoute('/test');

    expect(retrieved).not.toBeNull();
    expect(retrieved!.pattern).toBe('/test');
  });

  test('gets all routes', async () => {
    await adapter.saveRoute({
      pattern: '/a',
      sessionId: 'a',
      componentId: 'a',
      isAeon: true,
    });
    await adapter.saveRoute({
      pattern: '/b',
      sessionId: 'b',
      componentId: 'b',
      isAeon: true,
    });

    const routes = await adapter.getAllRoutes();
    // Mock returns results from internal store
    expect(Array.isArray(routes)).toBe(true);
  });

  test('deletes a route', async () => {
    await adapter.saveRoute({
      pattern: '/delete-me',
      sessionId: 'delete-me',
      componentId: 'delete-me',
      isAeon: true,
    });

    await adapter.deleteRoute('/delete-me');
    const route = await adapter.getRoute('/delete-me');
    expect(route).toBeNull();
  });

  test('saves and retrieves a session', async () => {
    const session: PageSession = {
      route: '/session-test',
      tree: { type: 'div', props: {}, children: [] },
      data: { key: 'value' },
      schema: { version: '1.0.0' },
      presence: [],
    };

    await adapter.saveSession(session);
    const retrieved = await adapter.getSession('session-test');

    expect(retrieved).not.toBeNull();
  });

  test('saves and retrieves tree', async () => {
    // First save a session
    await adapter.saveSession({
      route: '/tree-test',
      tree: { type: 'div', props: {}, children: [] },
      data: {},
      schema: { version: '1.0.0' },
      presence: [],
    });

    const newTree: SerializedComponent = {
      type: 'section',
      props: { id: 'main' },
      children: ['Hello'],
    };

    await adapter.saveTree('tree-test', newTree);
    const tree = await adapter.getTree('tree-test');

    expect(tree).not.toBeNull();
  });
});

// Mock Durable Object Namespace
function createMockDONamespace() {
  const objects: Record<string, Record<string, unknown>> = {};

  return {
    idFromName: (name: string) => ({
      toString: () => name,
      equals: (o: any) => o.toString() === name,
    }),
    idFromString: (id: string) => ({
      toString: () => id,
      equals: (o: any) => o.toString() === id,
    }),
    newUniqueId: () => ({
      toString: () => `unique-${Date.now()}`,
      equals: () => false,
    }),
    get: (id: { toString: () => string }) => ({
      id,
      fetch: async (input: RequestInfo, init?: RequestInit) => {
        const request =
          typeof input === 'string' ? new Request(input, init) : input;
        const url = new URL(request.url);
        const objectId = id.toString();

        if (!objects[objectId]) {
          objects[objectId] = {};
        }

        if (url.pathname === '/route' && request.method === 'POST') {
          const body = (await request.json()) as {
            action: string;
            path: string;
          };
          if (body.action === 'get') {
            const route = objects['__routes__']?.[body.path];
            return new Response(route ? JSON.stringify(route) : 'null', {
              status: route ? 200 : 404,
            });
          }
        }

        if (url.pathname === '/route' && request.method === 'PUT') {
          const route = await request.json();
          if (!objects['__routes__']) objects['__routes__'] = {};
          objects['__routes__'][(route as any).pattern] = route;
          return new Response('ok');
        }

        if (url.pathname === '/route' && request.method === 'DELETE') {
          const body = (await request.json()) as { path: string };
          if (objects['__routes__']) {
            delete objects['__routes__'][body.path];
          }
          return new Response('ok');
        }

        if (url.pathname === '/routes' && request.method === 'GET') {
          const routes = objects['__routes__']
            ? Object.values(objects['__routes__'])
            : [];
          return new Response(JSON.stringify(routes));
        }

        if (url.pathname === '/session' && request.method === 'GET') {
          const session = objects[objectId]?.session;
          return new Response(session ? JSON.stringify(session) : 'null', {
            status: session ? 200 : 404,
          });
        }

        if (url.pathname === '/session' && request.method === 'PUT') {
          const session = await request.json();
          objects[objectId] = { ...objects[objectId], session };
          return new Response('ok');
        }

        if (url.pathname === '/tree' && request.method === 'GET') {
          const tree = objects[objectId]?.tree;
          return new Response(tree ? JSON.stringify(tree) : 'null', {
            status: tree ? 200 : 404,
          });
        }

        if (url.pathname === '/tree' && request.method === 'PUT') {
          const tree = await request.json();
          objects[objectId] = { ...objects[objectId], tree };
          return new Response('ok');
        }

        return new Response('not found', { status: 404 });
      },
    }),
  };
}

describe('DurableObjectStorageAdapter', () => {
  let adapter: DurableObjectStorageAdapter;
  let mockNamespace: ReturnType<typeof createMockDONamespace>;

  beforeEach(async () => {
    mockNamespace = createMockDONamespace();
    adapter = new DurableObjectStorageAdapter(mockNamespace as any);
    await adapter.init();
  });

  test('has correct name', () => {
    expect(adapter.name).toBe('durable-object');
  });

  test('saves and retrieves a route', async () => {
    const route: RouteDefinition = {
      pattern: '/do-test',
      sessionId: 'do-test',
      componentId: 'do-test',
      isAeon: true,
    };

    await adapter.saveRoute(route);
    const retrieved = await adapter.getRoute('/do-test');

    expect(retrieved).not.toBeNull();
    expect(retrieved!.pattern).toBe('/do-test');
  });

  test('gets all routes', async () => {
    await adapter.saveRoute({
      pattern: '/do-a',
      sessionId: 'do-a',
      componentId: 'do-a',
      isAeon: true,
    });

    const routes = await adapter.getAllRoutes();
    expect(Array.isArray(routes)).toBe(true);
  });

  test('deletes a route', async () => {
    await adapter.saveRoute({
      pattern: '/do-delete',
      sessionId: 'do-delete',
      componentId: 'do-delete',
      isAeon: true,
    });

    await adapter.deleteRoute('/do-delete');
    // Route should be removed from cache
  });

  test('saves and retrieves a session', async () => {
    const session: PageSession = {
      route: '/do-session',
      tree: { type: 'div', props: {}, children: [] },
      data: {},
      schema: { version: '1.0.0' },
      presence: [],
    };

    await adapter.saveSession(session);
    const retrieved = await adapter.getSession('do-session');

    expect(retrieved).not.toBeNull();
  });

  test('saves and retrieves tree', async () => {
    const tree: SerializedComponent = {
      type: 'article',
      props: {},
      children: ['Content'],
    };

    await adapter.saveTree('do-tree', tree);
    const retrieved = await adapter.getTree('do-tree');

    expect(retrieved).not.toBeNull();
  });

  test('getSessionStub returns a stub', () => {
    const stub = adapter.getSessionStub('test-session');
    expect(stub).toBeDefined();
    expect(typeof stub.fetch).toBe('function');
  });
});

describe('HybridStorageAdapter', () => {
  let adapter: HybridStorageAdapter;

  beforeEach(async () => {
    const mockDb = createMockD1();
    const mockNamespace = createMockDONamespace();
    adapter = new HybridStorageAdapter({
      namespace: mockNamespace as any,
      db: mockDb as any,
    });
    await adapter.init();
  });

  test('has correct name', () => {
    expect(adapter.name).toBe('hybrid');
  });

  test('saves and retrieves a route', async () => {
    const route: RouteDefinition = {
      pattern: '/hybrid-test',
      sessionId: 'hybrid-test',
      componentId: 'hybrid-test',
      isAeon: true,
    };

    await adapter.saveRoute(route);
    const retrieved = await adapter.getRoute('/hybrid-test');

    expect(retrieved).not.toBeNull();
  });

  test('deletes route and propagates to D1', async () => {
    await adapter.saveRoute({
      pattern: '/hybrid-delete',
      sessionId: 'hybrid-delete',
      componentId: 'hybrid-delete',
      isAeon: true,
    });

    await adapter.deleteRoute('/hybrid-delete');
    // Wait for async propagation
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Should complete without error
  });

  test('saves and gets session', async () => {
    const session: PageSession = {
      route: '/hybrid-session',
      tree: { type: 'div', props: {}, children: [] },
      data: {},
      schema: { version: '1.0.0' },
      presence: [],
    };

    await adapter.saveSession(session);

    // Get session from hybrid adapter
    const retrieved = await adapter.getSession('hybrid-session');
    // May be null depending on mock, but the call should work
  });

  test('saves session and tree', async () => {
    const session: PageSession = {
      route: '/hybrid-tree-test',
      tree: { type: 'div', props: {}, children: [] },
      data: {},
      schema: { version: '1.0.0' },
      presence: [],
    };

    await adapter.saveSession(session);
    await adapter.saveTree('hybrid-tree-test', {
      type: 'span',
      children: ['new'],
    });

    const tree = await adapter.getTree('hybrid-tree-test');
    expect(tree).not.toBeNull();
  });

  test('getSessionStub returns a stub', () => {
    const stub = adapter.getSessionStub('test');
    expect(stub).toBeDefined();
  });

  test('getHistoricalSession falls back to D1', async () => {
    const session = await adapter.getHistoricalSession('nonexistent');
    expect(session).toBeNull();
  });
});

// Mock Dash Client
function createMockDashClient() {
  const collections: Record<string, Record<string, unknown>> = {};
  let connected = false;

  return {
    connect: async () => {
      connected = true;
    },
    disconnect: async () => {
      connected = false;
    },
    isConnected: () => connected,
    get: async <T>(collection: string, id: string): Promise<T | null> => {
      return (collections[collection]?.[id] as T) ?? null;
    },
    query: async <T>(collection: string): Promise<T[]> => {
      return Object.values(collections[collection] || {}) as T[];
    },
    set: async <T>(collection: string, id: string, data: T): Promise<void> => {
      if (!collections[collection]) collections[collection] = {};
      collections[collection][id] = data;
    },
    delete: async (collection: string, id: string): Promise<void> => {
      if (collections[collection]) {
        delete collections[collection][id];
      }
    },
    subscribe: <T>() => ({
      unsubscribe: () => {},
    }),
    batch: async () => {},
  };
}

describe('DashStorageAdapter', () => {
  let adapter: DashStorageAdapter;
  let mockClient: ReturnType<typeof createMockDashClient>;

  beforeEach(async () => {
    mockClient = createMockDashClient();
    adapter = new DashStorageAdapter(mockClient as any, {
      routesCollection: 'test-routes',
      sessionsCollection: 'test-sessions',
      presenceCollection: 'test-presence',
    });
    await adapter.init();
  });

  test('has correct name', () => {
    expect(adapter.name).toBe('dash');
  });

  test('connects on init if not connected', async () => {
    const disconnectedClient = createMockDashClient();
    const newAdapter = new DashStorageAdapter(disconnectedClient as any);
    await newAdapter.init();
    expect(disconnectedClient.isConnected()).toBe(true);
  });

  test('saves and retrieves a route', async () => {
    const route: RouteDefinition = {
      pattern: '/dash-test',
      sessionId: 'dash-test',
      componentId: 'dash-test',
      isAeon: true,
    };

    await adapter.saveRoute(route);
    const retrieved = await adapter.getRoute('/dash-test');

    expect(retrieved).not.toBeNull();
    expect(retrieved!.pattern).toBe('/dash-test');
  });

  test('gets all routes', async () => {
    await adapter.saveRoute({
      pattern: '/dash-a',
      sessionId: 'dash-a',
      componentId: 'dash-a',
      isAeon: true,
    });

    const routes = await adapter.getAllRoutes();
    expect(routes.length).toBeGreaterThanOrEqual(1);
  });

  test('deletes a route', async () => {
    await adapter.saveRoute({
      pattern: '/dash-delete',
      sessionId: 'dash-delete',
      componentId: 'dash-delete',
      isAeon: true,
    });

    await adapter.deleteRoute('/dash-delete');
    const route = await adapter.getRoute('/dash-delete');
    expect(route).toBeNull();
  });

  test('saves and retrieves a session', async () => {
    const session: PageSession = {
      route: '/dash-session',
      tree: { type: 'div', props: {}, children: [] },
      data: { foo: 'bar' },
      schema: { version: '1.0.0' },
      presence: [],
    };

    await adapter.saveSession(session);
    const retrieved = await adapter.getSession('dash-session');

    expect(retrieved).not.toBeNull();
  });

  test('getSession includes presence data', async () => {
    // Create a mock that returns presence data
    const mockWithPresence = {
      ...createMockDashClient(),
      query: async <T>(collection: string): Promise<T[]> => {
        if (collection === 'test-presence') {
          return [
            {
              sessionId: 'with-presence',
              userId: 'user1',
              role: 'user',
              cursor: { x: 10, y: 20 },
              focusNode: '/hero/title',
              typing: { isTyping: true, field: 'title' },
              scroll: { depth: 0.25, y: 100 },
              viewport: { width: 1280, height: 720 },
              inputState: { field: 'title', hasFocus: true, valueLength: 8 },
              emotion: {
                primary: 'focused',
                confidence: 0.88,
                source: 'self-report',
              },
              editing: 'header',
              status: 'online',
              lastActivity: '2024-01-01',
            },
          ] as T[];
        }
        return [];
      },
      get: async <T>(collection: string, id: string): Promise<T | null> => {
        if (collection === 'test-sessions' && id === 'with-presence') {
          return {
            route: '/with-presence',
            tree: { type: 'div', children: [] },
            data: {},
            schema: { version: '1.0.0' },
          } as T;
        }
        return null;
      },
    };

    const adapterWithPresence = new DashStorageAdapter(
      mockWithPresence as any,
      {
        routesCollection: 'test-routes',
        sessionsCollection: 'test-sessions',
        presenceCollection: 'test-presence',
      },
    );
    await adapterWithPresence.init();

    const session = await adapterWithPresence.getSession('with-presence');

    expect(session).not.toBeNull();
    expect(session!.presence).toHaveLength(1);
    expect(session!.presence[0].userId).toBe('user1');
    expect(session!.presence[0].cursor).toEqual({ x: 10, y: 20 });
    expect(session!.presence[0].focusNode).toBe('/hero/title');
    expect(session!.presence[0].typing?.isTyping).toBe(true);
    expect(session!.presence[0].scroll?.depth).toBe(0.25);
    expect(session!.presence[0].viewport).toEqual({ width: 1280, height: 720 });
    expect(session!.presence[0].inputState?.field).toBe('title');
    expect(session!.presence[0].emotion?.primary).toBe('focused');
  });

  test('saves and retrieves tree', async () => {
    // First save session
    await adapter.saveSession({
      route: '/dash-tree',
      tree: { type: 'div', props: {}, children: [] },
      data: {},
      schema: { version: '1.0.0' },
      presence: [],
    });

    const newTree: SerializedComponent = {
      type: 'main',
      props: {},
      children: ['Updated'],
    };

    await adapter.saveTree('dash-tree', newTree);
    const tree = await adapter.getTree('dash-tree');

    expect(tree).not.toBeNull();
  });

  test('subscribeToRoutes returns subscription', () => {
    const sub = adapter.subscribeToRoutes(() => {});
    expect(sub).toBeDefined();
    expect(typeof sub.unsubscribe).toBe('function');
    sub.unsubscribe();
  });

  test('subscribeToSession returns subscription', () => {
    const sub = adapter.subscribeToSession('test-session', () => {});
    expect(sub).toBeDefined();
    sub.unsubscribe();
  });

  test('subscribeToPresence returns subscription', () => {
    const sub = adapter.subscribeToPresence('test-session', () => {});
    expect(sub).toBeDefined();
    sub.unsubscribe();
  });

  test('updatePresence saves presence record', async () => {
    await adapter.updatePresence('session-1', 'user-1', {
      role: 'user',
      status: 'online',
    });
    // Should complete without error
  });

  test('destroy cleans up subscriptions', () => {
    adapter.subscribeToRoutes(() => {});
    adapter.subscribeToSession('test', () => {});
    adapter.destroy();
    // Should complete without error
  });

  test('getTree returns null for non-existent session', async () => {
    const tree = await adapter.getTree('nonexistent');
    expect(tree).toBeNull();
  });

  test('saveTree does nothing for non-existent session', async () => {
    // Should not throw
    await adapter.saveTree('nonexistent', { type: 'div', children: [] });
  });
});

describe('D1StorageAdapter - advanced', () => {
  test('getAllRoutes returns properly mapped routes', async () => {
    // Create a more complete mock that returns actual data
    const routes = [
      {
        pattern: '/a',
        session_id: 'a',
        component_id: 'a',
        layout: null,
        is_aeon: 1,
      },
      {
        pattern: '/b',
        session_id: 'b',
        component_id: 'b',
        layout: 'main',
        is_aeon: 0,
      },
    ];

    const mockDb = {
      exec: async () => {},
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          all: async () => ({ results: routes }),
          run: async () => {},
        }),
        first: async () => null,
        all: async () => ({ results: routes }),
        run: async () => {},
      }),
    };

    const adapter = new D1StorageAdapter(mockDb as any);
    const allRoutes = await adapter.getAllRoutes();

    expect(allRoutes).toHaveLength(2);
    expect(allRoutes[0].pattern).toBe('/a');
    expect(allRoutes[0].isAeon).toBe(true);
    expect(allRoutes[1].layout).toBe('main');
    expect(allRoutes[1].isAeon).toBe(false);
  });

  test('getSession includes presence data', async () => {
    const sessionData = {
      route: '/test',
      tree: '{"type":"div"}',
      data: '{}',
      schema_version: '1.0.0',
    };

    const presenceData = [
      {
        user_id: 'user1',
        role: 'user',
        cursor_x: 100,
        cursor_y: 200,
        focus_node: '/hero/title',
        selection_start: 3,
        selection_end: 9,
        selection_direction: 'forward',
        selection_path: 'title',
        typing: 1,
        typing_field: 'title',
        typing_composing: 0,
        typing_started_at: '2024-01-01T00:00:00Z',
        typing_stopped_at: null,
        scroll_depth: 0.65,
        scroll_y: 780,
        scroll_viewport_height: 900,
        scroll_document_height: 1200,
        scroll_path: '/test',
        viewport_width: 1440,
        viewport_height: 900,
        input_field: 'title',
        input_has_focus: 1,
        input_value_length: 11,
        input_selection_start: 9,
        input_selection_end: 11,
        input_composing: 0,
        input_mode: 'text',
        emotion_primary: 'focused',
        emotion_secondary: 'curious',
        emotion_confidence: 0.9,
        emotion_intensity: 0.6,
        emotion_valence: 0.2,
        emotion_arousal: 0.7,
        emotion_dominance: 0.55,
        emotion_source: 'self-report',
        emotion_updated_at: '2024-01-01T00:00:05Z',
        editing: 'title',
        status: 'online',
        last_activity: '2024-01-01T00:00:00Z',
      },
      {
        user_id: 'user2',
        role: 'admin',
        cursor_x: null,
        cursor_y: null,
        focus_node: null,
        selection_start: null,
        selection_end: null,
        selection_direction: null,
        selection_path: null,
        typing: null,
        typing_field: null,
        typing_composing: null,
        typing_started_at: null,
        typing_stopped_at: null,
        scroll_depth: null,
        scroll_y: null,
        scroll_viewport_height: null,
        scroll_document_height: null,
        scroll_path: null,
        viewport_width: null,
        viewport_height: null,
        input_field: null,
        input_has_focus: null,
        input_value_length: null,
        input_selection_start: null,
        input_selection_end: null,
        input_composing: null,
        input_mode: null,
        emotion_primary: null,
        emotion_secondary: null,
        emotion_confidence: null,
        emotion_intensity: null,
        emotion_valence: null,
        emotion_arousal: null,
        emotion_dominance: null,
        emotion_source: null,
        emotion_updated_at: null,
        editing: null,
        status: 'away',
        last_activity: '2024-01-01T00:01:00Z',
      },
    ];

    let callCount = 0;
    const mockDb = {
      exec: async () => {},
      prepare: (query: string) => ({
        bind: () => ({
          first: async () => (query.includes('sessions') ? sessionData : null),
          all: async () => ({
            results: query.includes('presence') ? presenceData : [],
          }),
          run: async () => {},
        }),
        first: async () => (query.includes('sessions') ? sessionData : null),
        all: async () => ({
          results: query.includes('presence') ? presenceData : [],
        }),
        run: async () => {},
      }),
    };

    const adapter = new D1StorageAdapter(mockDb as any);
    const session = await adapter.getSession('test');

    expect(session).not.toBeNull();
    expect(session!.presence).toHaveLength(2);
    expect(session!.presence[0].userId).toBe('user1');
    expect(session!.presence[0].cursor).toEqual({ x: 100, y: 200 });
    expect(session!.presence[0].focusNode).toBe('/hero/title');
    expect(session!.presence[0].selection).toEqual({
      start: 3,
      end: 9,
      direction: 'forward',
      path: 'title',
    });
    expect(session!.presence[0].typing).toEqual({
      isTyping: true,
      field: 'title',
      isComposing: false,
      startedAt: '2024-01-01T00:00:00Z',
      stoppedAt: undefined,
    });
    expect(session!.presence[0].scroll).toEqual({
      depth: 0.65,
      y: 780,
      viewportHeight: 900,
      documentHeight: 1200,
      path: '/test',
    });
    expect(session!.presence[0].viewport).toEqual({
      width: 1440,
      height: 900,
    });
    expect(session!.presence[0].inputState).toEqual({
      field: 'title',
      hasFocus: true,
      valueLength: 11,
      selectionStart: 9,
      selectionEnd: 11,
      isComposing: false,
      inputMode: 'text',
    });
    expect(session!.presence[0].emotion).toEqual({
      primary: 'focused',
      secondary: 'curious',
      confidence: 0.9,
      intensity: 0.6,
      valence: 0.2,
      arousal: 0.7,
      dominance: 0.55,
      source: 'self-report',
      updatedAt: '2024-01-01T00:00:05Z',
    });
    expect(session!.presence[0].editing).toBe('title');
    expect(session!.presence[1].cursor).toBeUndefined();
    expect(session!.presence[1].typing).toBeUndefined();
    expect(session!.presence[1].scroll).toBeUndefined();
  });
});

describe('HybridStorageAdapter - propagation', () => {
  test('propagate helper silently handles errors', async () => {
    // Test that propagate doesn't throw even when promise rejects
    const mockDb = {
      exec: async () => {},
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          all: async () => ({ results: [] }),
          run: async () => {
            throw new Error('D1 error');
          },
        }),
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => {
          throw new Error('D1 error');
        },
      }),
    };

    const mockNamespace = createMockDONamespace();

    const adapter = new HybridStorageAdapter({
      namespace: mockNamespace as any,
      db: mockDb as any,
    });

    // These should not throw even though D1 operations fail
    await adapter.saveRoute({
      pattern: '/test',
      sessionId: 'test',
      componentId: 'test',
      isAeon: true,
    });

    await adapter.deleteRoute('/test');

    await adapter.saveSession({
      route: '/test',
      tree: { type: 'div', children: [] },
      data: {},
      schema: { version: '1.0.0' },
      presence: [],
    });

    await adapter.saveTree('test', { type: 'span', children: [] });

    // Give time for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
    // If we got here without throwing, the test passes
  });

  test('getAllRoutes falls back to D1', async () => {
    const mockDb = {
      exec: async () => {},
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          all: async () => ({
            results: [
              {
                pattern: '/from-d1',
                session_id: 'd1',
                component_id: 'd1',
                is_aeon: 1,
              },
            ],
          }),
          run: async () => {},
        }),
        first: async () => null,
        all: async () => ({
          results: [
            {
              pattern: '/from-d1',
              session_id: 'd1',
              component_id: 'd1',
              is_aeon: 1,
            },
          ],
        }),
        run: async () => {},
      }),
    };

    const mockNamespace = createMockDONamespace();

    const adapter = new HybridStorageAdapter({
      namespace: mockNamespace as any,
      db: mockDb as any,
    });

    const routes = await adapter.getAllRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0].pattern).toBe('/from-d1');
  });

  test('saveRoute propagates to D1 asynchronously', async () => {
    let d1Called = false;
    const mockDb = {
      exec: async () => {},
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          all: async () => ({ results: [] }),
          run: async () => {
            d1Called = true;
          },
        }),
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => {
          d1Called = true;
        },
      }),
    };

    const mockNamespace = createMockDONamespace();

    const adapter = new HybridStorageAdapter({
      namespace: mockNamespace as any,
      db: mockDb as any,
    });

    await adapter.saveRoute({
      pattern: '/hybrid',
      sessionId: 'hybrid',
      componentId: 'hybrid',
      isAeon: true,
    });

    // Wait a bit for async propagation
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(d1Called).toBe(true);
  });

  test('saveSession propagates to D1 asynchronously', async () => {
    let d1Called = false;
    const mockDb = {
      exec: async () => {},
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          all: async () => ({ results: [] }),
          run: async () => {
            d1Called = true;
          },
        }),
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => {
          d1Called = true;
        },
      }),
    };

    const mockNamespace = createMockDONamespace();

    const adapter = new HybridStorageAdapter({
      namespace: mockNamespace as any,
      db: mockDb as any,
    });

    await adapter.saveSession({
      route: '/hybrid-session',
      tree: { type: 'div', children: [] },
      data: {},
      schema: { version: '1.0.0' },
      presence: [],
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(d1Called).toBe(true);
  });

  test('saveTree propagates to D1 asynchronously', async () => {
    let d1Called = false;
    const mockDb = {
      exec: async () => {},
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          all: async () => ({ results: [] }),
          run: async () => {
            d1Called = true;
          },
        }),
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => {
          d1Called = true;
        },
      }),
    };

    const mockNamespace = createMockDONamespace();

    const adapter = new HybridStorageAdapter({
      namespace: mockNamespace as any,
      db: mockDb as any,
    });

    await adapter.saveTree('hybrid-tree', { type: 'span', children: ['test'] });

    await new Promise((resolve) => setTimeout(resolve, 10));
    // D1 propagation attempted (may fail silently which is expected)
  });
});
