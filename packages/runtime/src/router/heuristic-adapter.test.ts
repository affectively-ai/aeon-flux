/**
 * Tests for HeuristicAdapter
 */

import { describe, expect, test, beforeEach } from 'bun:test';
import { HeuristicAdapter } from './heuristic-adapter';
import type {
  UserContext,
  ComponentTree,
  ComponentNode,
  ThemeMode,
} from './types';

// Mock component tree
function createMockTree(nodes: ComponentNode[] = []): ComponentTree {
  const nodeMap = new Map<string, ComponentNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  if (nodes.length === 0) {
    nodeMap.set('root', { id: 'root', type: 'page' });
  }

  return {
    rootId: nodes[0]?.id || 'root',
    nodes: nodeMap,
    getNode: (id) => nodeMap.get(id),
    getChildren: () => [],
    getSchema: () => ({
      rootId: nodes[0]?.id || 'root',
      nodeCount: nodeMap.size,
      nodeTypes: [...new Set(nodes.map((n) => n.type))],
      depth: 1,
    }),
    clone: () => createMockTree(nodes),
  };
}

// Mock user context
function createMockContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    tier: 'free',
    recentPages: [],
    dwellTimes: new Map(),
    clickPatterns: [],
    preferences: {},
    viewport: { width: 1920, height: 1080 },
    connection: 'fast',
    reducedMotion: false,
    localHour: 12,
    timezone: 'UTC',
    isNewSession: true,
    ...overrides,
  };
}

describe('HeuristicAdapter', () => {
  let adapter: HeuristicAdapter;

  beforeEach(() => {
    adapter = new HeuristicAdapter();
  });

  describe('route()', () => {
    test('returns a valid RouteDecision', async () => {
      const context = createMockContext();
      const tree = createMockTree();

      const decision = await adapter.route('/', context, tree);

      expect(decision.route).toBe('/');
      expect(decision.sessionId).toBeDefined();
      expect(decision.routerName).toBe('heuristic');
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.routedAt).toBeDefined();
    });

    test('generates correct density for mobile viewport', async () => {
      const context = createMockContext({
        viewport: { width: 375, height: 667 },
      });
      const tree = createMockTree();

      const decision = await adapter.route('/', context, tree);

      expect(decision.density).toBe('compact');
    });

    test('generates correct density for large desktop', async () => {
      const context = createMockContext({
        viewport: { width: 2560, height: 1440 },
      });
      const tree = createMockTree();

      const decision = await adapter.route('/', context, tree);

      expect(decision.density).toBe('comfortable');
    });

    test('suggests dark theme at night', async () => {
      const context = createMockContext({ localHour: 22 });
      const tree = createMockTree();

      const decision = await adapter.route('/', context, tree);

      expect(decision.theme).toBe('dark');
    });

    test('suggests light theme during day', async () => {
      const context = createMockContext({ localHour: 10 });
      const tree = createMockTree();

      const decision = await adapter.route('/', context, tree);

      expect(decision.theme).toBe('light');
    });

    test('respects explicit theme preference', async () => {
      const context = createMockContext({
        localHour: 22, // Night
        preferences: { theme: 'light' },
      });
      const tree = createMockTree();

      const decision = await adapter.route('/', context, tree);

      expect(decision.theme).toBe('light');
    });

    test('computes prefetch based on connection speed', async () => {
      // Use adapter with multiple default paths so there's something to prefetch
      const adapterWithPaths = new HeuristicAdapter({
        defaultPaths: ['/', '/about', '/contact', '/help'],
      });
      const fastContext = createMockContext({ connection: 'fast' });
      const slowContext = createMockContext({ connection: 'slow-2g' });
      const tree = createMockTree();

      const fastDecision = await adapterWithPaths.route('/', fastContext, tree);
      const slowDecision = await adapterWithPaths.route('/', slowContext, tree);

      expect(fastDecision.prefetch?.length).toBeGreaterThan(0);
      expect(slowDecision.prefetch?.length).toBe(0);
    });
  });

  describe('speculate()', () => {
    test('returns predictions from navigation history', async () => {
      const context = createMockContext({
        recentPages: ['/', '/chat', '/', '/chat', '/', '/settings'],
      });

      const predictions = await adapter.speculate('/', context);

      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions).toContain('/chat');
    });

    test('returns default paths when no history', async () => {
      const adapter = new HeuristicAdapter({
        defaultPaths: ['/home', '/about', '/contact'],
      });
      const context = createMockContext({ recentPages: [] });

      const predictions = await adapter.speculate('/home', context);

      expect(predictions).toContain('/about');
      expect(predictions).toContain('/contact');
      expect(predictions).not.toContain('/home'); // Excludes current
    });
  });

  describe('personalizeTree()', () => {
    test('hides components from hiddenComponents list', () => {
      const tree = createMockTree([
        { id: 'root', type: 'page', children: ['child1', 'child2'] },
        { id: 'child1', type: 'section' },
        { id: 'child2', type: 'section' },
      ]);

      const decision = {
        route: '/',
        sessionId: 'test',
        hiddenComponents: ['child1'],
        routedAt: Date.now(),
        routerName: 'heuristic',
        confidence: 1,
      };

      const personalized = adapter.personalizeTree(tree, decision);
      const hiddenNode = personalized.getNode('child1');

      expect(hiddenNode?.defaultHidden).toBe(true);
    });
  });

  describe('custom signals', () => {
    test('uses custom deriveAccent', async () => {
      const customAdapter = new HeuristicAdapter({
        signals: {
          deriveAccent: (ctx) =>
            ctx.emotionState?.primary === 'happy' ? '#FFD700' : '#808080',
        },
      });

      const happyContext = createMockContext({
        emotionState: {
          primary: 'happy',
          valence: 0.8,
          arousal: 0.6,
          confidence: 0.9,
        },
      });

      const decision = await customAdapter.route(
        '/',
        happyContext,
        createMockTree(),
      );

      expect(decision.accent).toBe('#FFD700');
    });

    test('uses custom deriveTheme', async () => {
      const customAdapter = new HeuristicAdapter({
        signals: {
          deriveTheme: (ctx) =>
            ctx.emotionState?.valence && ctx.emotionState.valence < 0
              ? 'dark'
              : 'light',
        },
      });

      const sadContext = createMockContext({
        localHour: 10, // Daytime
        emotionState: {
          primary: 'sad',
          valence: -0.6,
          arousal: 0.3,
          confidence: 0.8,
        },
      });

      const decision = await customAdapter.route(
        '/',
        sadContext,
        createMockTree(),
      );

      expect(decision.theme).toBe('dark');
    });

    test('uses custom predictNavigation', async () => {
      const customAdapter = new HeuristicAdapter({
        signals: {
          predictNavigation: () => ['/custom1', '/custom2', '/custom3'],
        },
      });

      const context = createMockContext();
      const predictions = await customAdapter.speculate('/', context);

      expect(predictions).toEqual(['/custom1', '/custom2', '/custom3']);
    });
  });

  describe('tier-based feature flags', () => {
    test('includes tier features in route decision', async () => {
      const customAdapter = new HeuristicAdapter({
        tierFeatures: {
          free: { basicFeature: true, premiumFeature: false },
          starter: { basicFeature: true, premiumFeature: true },
          pro: { basicFeature: true, premiumFeature: true },
          enterprise: { basicFeature: true, premiumFeature: true },
        },
      });

      const freeContext = createMockContext({ tier: 'free' });
      const starterContext = createMockContext({ tier: 'starter' });

      const freeDecision = await customAdapter.route(
        '/',
        freeContext,
        createMockTree(),
      );
      const starterDecision = await customAdapter.route(
        '/',
        starterContext,
        createMockTree(),
      );

      expect(freeDecision.featureFlags?.premiumFeature).toBe(false);
      expect(starterDecision.featureFlags?.premiumFeature).toBe(true);
    });
  });
});
