/**
 * Build script for aeon-pages-runtime
 *
 * Marks React as external to prevent duplicate React instances
 * when consumers bundle this package.
 */

const entrypoints = [
  './src/index.ts',
  './src/server.ts',
  './src/router/index.ts',
];

async function build() {
  const result = await Bun.build({
    entrypoints,
    outdir: './dist',
    target: 'browser', // Changed from 'bun' to 'browser' for client compatibility
    splitting: true,
    format: 'esm',
    external: [
      // Mark React as external - consumers provide their own React
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      // Also mark peer dependencies as external
      'zod',
      '@affectively/aeon',
      '@affectively/auth',
    ],
  });

  if (!result.success) {
    console.error('Build failed:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  console.log('Build successful:');
  for (const output of result.outputs) {
    console.log(`  ${output.path}`);
  }
}

build();
