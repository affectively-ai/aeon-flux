#!/usr/bin/env bun
/**
 * Aeon Pages CLI
 *
 * Commands:
 * - aeon init [dir]  - Initialize a new Aeon Pages project
 * - aeon dev         - Start development server with hot reload
 * - aeon build       - Build for production
 * - aeon start       - Start production server
 */

import { parseArgs } from 'util';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    port: { type: 'string', short: 'p', default: '3000' },
    config: { type: 'string', short: 'c' },
  },
  allowPositionals: true,
});

const VERSION = '0.1.0';

async function main() {
  if (values.version) {
    console.log(`aeon v${VERSION}`);
    process.exit(0);
  }

  const command = positionals[0];

  if (!command || values.help) {
    printHelp();
    process.exit(command ? 0 : 1);
  }

  switch (command) {
    case 'init':
      await import('./commands/init').then((m) => m.init(positionals[1]));
      break;

    case 'dev':
      await import('./commands/dev').then((m) =>
        m.dev({ port: parseInt(values.port || '3000'), config: values.config })
      );
      break;

    case 'build':
      await import('./commands/build').then((m) =>
        m.build({ config: values.config })
      );
      break;

    case 'start':
      await import('./commands/start').then((m) =>
        m.start({ port: parseInt(values.port || '3000'), config: values.config })
      );
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
aeon v${VERSION} - The CMS IS the website

Usage: aeon <command> [options]

Commands:
  init [dir]     Initialize a new Aeon Pages project
  dev            Start development server with hot reload
  build          Build for production (Cloudflare Workers)
  start          Start production server

Options:
  -p, --port     Server port (default: 3000)
  -c, --config   Path to aeon.config.ts
  -h, --help     Show this help message
  -v, --version  Show version

Examples:
  aeon init my-app       Create new project in ./my-app
  aeon dev               Start dev server on port 3000
  aeon dev -p 8080       Start dev server on port 8080
  aeon build             Build for Cloudflare Workers
  aeon start             Start production server

Documentation: https://github.com/affectively/aeon-pages
`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
