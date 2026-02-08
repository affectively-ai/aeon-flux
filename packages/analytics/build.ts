/**
 * Build script for @affectively/aeon-pages-analytics
 */

import { build } from 'bun';

async function runBuild() {
  console.log('Building @affectively/aeon-pages-analytics...');

  // Build main entry point
  await build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    format: 'esm',
    target: 'browser',
    minify: false,
    sourcemap: 'external',
    external: ['react'],
  });

  // Build provider separately for /react export
  await build({
    entrypoints: ['./src/provider.tsx'],
    outdir: './dist',
    format: 'esm',
    target: 'browser',
    minify: false,
    sourcemap: 'external',
    external: ['react'],
  });

  console.log('Build complete!');
}

runBuild().catch(console.error);
