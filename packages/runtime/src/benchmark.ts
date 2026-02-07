/**
 * Aeon Flux Benchmarks
 *
 * Run: bun run src/benchmark.ts
 */

import { HeuristicAdapter } from './router/heuristic-adapter';
import { compileTreeToTSX } from './tree-compiler';
import type { UserContext, ComponentTree, ComponentNode } from './router/types';

// Mock data
function createMockContext(): UserContext {
  return {
    tier: 'pro',
    recentPages: ['/', '/chat', '/settings', '/chat', '/', '/tools'],
    dwellTimes: new Map([['/', 5000], ['/chat', 12000]]),
    clickPatterns: ['nav-chat', 'btn-send', 'nav-home'],
    preferences: { theme: 'dark' },
    viewport: { width: 1920, height: 1080 },
    connection: 'fast',
    reducedMotion: false,
    localHour: 14,
    timezone: 'America/New_York',
    isNewSession: false,
  };
}

function createMockTree(nodeCount: number): ComponentTree {
  const nodes = new Map<string, ComponentNode>();

  nodes.set('root', { id: 'root', type: 'Page', children: [] });

  for (let i = 0; i < nodeCount; i++) {
    const id = `node-${i}`;
    nodes.set(id, {
      id,
      type: i % 3 === 0 ? 'Section' : i % 3 === 1 ? 'Text' : 'Button',
      props: { title: `Node ${i}`, className: 'test-class' },
    });
    (nodes.get('root')!.children as string[]).push(id);
  }

  return {
    rootId: 'root',
    nodes,
    getNode: (id) => nodes.get(id),
    getChildren: (id) => {
      const node = nodes.get(id);
      if (!node?.children) return [];
      return (node.children as string[]).map(cid => nodes.get(cid)!);
    },
    getSchema: () => ({ rootId: 'root', nodeCount: nodes.size, nodeTypes: ['Page', 'Section', 'Text', 'Button'], depth: 2 }),
    clone: () => createMockTree(nodeCount),
  };
}

function createMockTreeForCompiler(nodeCount: number) {
  const children = [];
  for (let i = 0; i < nodeCount; i++) {
    children.push({
      id: `node-${i}`,
      type: i % 3 === 0 ? 'Section' : i % 3 === 1 ? 'Text' : 'Button',
      props: { title: `Node ${i}`, className: 'test-class' },
      children: i % 5 === 0 ? [{ id: `nested-${i}`, type: 'Span', text: 'Nested content' }] : [],
    });
  }
  return { id: 'root', type: 'Page', children };
}

async function benchmark(name: string, fn: () => unknown | Promise<unknown>, iterations: number = 1000) {
  // Warmup
  for (let i = 0; i < 10; i++) await fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const elapsed = performance.now() - start;

  const avgMs = elapsed / iterations;
  const opsPerSec = Math.round(1000 / avgMs);

  console.log(`${name.padEnd(40)} ${avgMs.toFixed(3).padStart(8)}ms  ${opsPerSec.toLocaleString().padStart(8)} ops/sec`);

  return { name, avgMs, opsPerSec };
}

async function main() {
  console.log('\n🚀 Aeon Flux Benchmarks\n');
  console.log('='.repeat(70));

  const adapter = new HeuristicAdapter({
    defaultPaths: ['/', '/chat', '/settings', '/tools', '/about'],
  });
  const context = createMockContext();

  // Router benchmarks
  console.log('\n📍 HeuristicAdapter.route()\n');

  for (const nodeCount of [10, 50, 100, 500]) {
    const tree = createMockTree(nodeCount);
    await benchmark(`  route() with ${nodeCount} nodes`, () => adapter.route('/', context, tree));
  }

  // Speculation benchmarks
  console.log('\n🔮 HeuristicAdapter.speculate()\n');

  await benchmark('  speculate() - empty history', () =>
    adapter.speculate('/', { ...context, recentPages: [] })
  );

  await benchmark('  speculate() - 6 page history', () =>
    adapter.speculate('/', context)
  );

  await benchmark('  speculate() - 50 page history', () =>
    adapter.speculate('/', { ...context, recentPages: Array(50).fill('/').map((_, i) => `/${i % 5}`) })
  );

  // Tree compiler benchmarks
  console.log('\n🌳 Tree → TSX Compiler\n');

  for (const nodeCount of [10, 50, 100, 500]) {
    const tree = createMockTreeForCompiler(nodeCount);
    await benchmark(`  compile ${nodeCount} nodes → TSX`, () =>
      compileTreeToTSX(tree, { route: '/test' })
    , 100);
  }

  // Personalization benchmarks
  console.log('\n🎨 personalizeTree()\n');

  for (const nodeCount of [10, 50, 100, 500]) {
    const tree = createMockTree(nodeCount);
    const decision = await adapter.route('/', context, tree);
    await benchmark(`  personalize ${nodeCount} nodes`, () =>
      adapter.personalizeTree(tree, decision)
    );
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Benchmarks complete\n');
}

main().catch(console.error);
