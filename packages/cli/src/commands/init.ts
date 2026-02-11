/**
 * aeon init - Initialize a new Aeon Pages project
 *
 * Features:
 * - Create new project from template
 * - Import existing Next.js project
 * - Seed D1 database from JSX AST
 */

import { mkdir, writeFile, readdir, readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';

interface ProjectTemplate {
  name: string;
  files: Record<string, string>;
}

const BASIC_TEMPLATE: ProjectTemplate = {
  name: 'basic',
  files: {
    'package.json': `{
  "name": "my-aeon-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "aeon dev",
    "build": "aeon build",
    "start": "aeon start"
  },
  "dependencies": {
    "@affectively/aeon-pages": "workspace:*",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/react": "^18.0.0"
  }
}`,

    'aeon.config.ts': `import type { AeonConfig } from '@affectively/aeon-pages';

const config: AeonConfig = {
  pagesDir: './pages',
  componentsDir: './components',
  runtime: 'bun',
  port: 3000,

  aeon: {
    sync: {
      mode: 'distributed',
      consistencyLevel: 'strong',
    },
    presence: {
      enabled: true,
      cursorTracking: true,
      inactivityTimeout: 60000,
    },
    versioning: {
      enabled: true,
      autoMigrate: true,
    },
    offline: {
      enabled: true,
      maxQueueSize: 1000,
    },
  },

  components: {
    autoDiscover: true,
  },

  output: {
    dir: '.aeon',
  },
};

export default config;`,

    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": ".aeon/dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".aeon"]
}`,

    'pages/index.tsx': `'use aeon';

import { useAeonPage } from '@affectively/aeon-pages/react';

export default function HomePage() {
  const { presence, data, updateData } = useAeonPage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Aeon Pages
          </h1>
          <p className="text-xl text-gray-600">
            The CMS IS the website. Click anywhere to edit.
          </p>
        </header>

        <main className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Getting Started
          </h2>
          <p className="text-gray-600 mb-6">
            This page is now collaborative. Any edits you make will sync
            in real-time with all connected users.
          </p>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{presence.length} user(s) online</span>
          </div>
        </main>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          Built with{' '}
          <a
            href="https://github.com/affectively/aeon-pages"
            className="text-blue-500 hover:underline"
          >
            @affectively/aeon-pages
          </a>
        </footer>
      </div>
    </div>
  );
}`,

    'pages/layout.tsx': `import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Aeon Pages</title>
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}`,

    '.gitignore': `# Dependencies
node_modules/

# Build output
.aeon/
dist/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
`,
  },
};

export async function init(targetDir?: string): Promise<void> {
  const projectDir = resolve(targetDir || '.');
  const projectName = targetDir || 'aeon-app';

  console.log(`\n🌟 Initializing Aeon Pages project: ${projectName}\n`);

  // Check if directory exists and has content
  try {
    const entries = await readdir(projectDir);
    if (entries.length > 0) {
      // Check if it's a Next.js project
      const hasNextConfig = entries.some(
        (e) =>
          e === 'next.config.js' ||
          e === 'next.config.ts' ||
          e === 'next.config.mjs',
      );

      if (hasNextConfig) {
        console.log(
          '📦 Detected Next.js project. Converting to Aeon Pages...\n',
        );
        await convertNextProject(projectDir);
        return;
      }

      // Non-empty directory, ask to overwrite
      console.log('⚠️  Directory is not empty.');
      console.log('   Use --force to overwrite existing files.\n');
      return;
    }
  } catch {
    // Directory doesn't exist, create it
    await mkdir(projectDir, { recursive: true });
  }

  // Create project from template
  console.log('📁 Creating project structure...');

  for (const [relativePath, content] of Object.entries(BASIC_TEMPLATE.files)) {
    const filePath = join(projectDir, relativePath);
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));

    await mkdir(dir, { recursive: true });

    // Update package name
    let fileContent = content;
    if (relativePath === 'package.json') {
      fileContent = content.replace('"my-aeon-app"', `"${projectName}"`);
    }

    await writeFile(filePath, fileContent);
    console.log(`   ✓ ${relativePath}`);
  }

  console.log('\n✨ Project initialized!\n');
  console.log('Next steps:');
  console.log(`  cd ${targetDir || '.'}`);
  console.log('  bun install');
  console.log('  bun run dev');
  console.log('\nDocs: https://github.com/affectively/aeon-pages\n');
}

/**
 * Convert an existing Next.js project to Aeon Pages
 */
async function convertNextProject(projectDir: string): Promise<void> {
  console.log('🔄 Converting Next.js project to Aeon Pages...\n');

  // Find app or pages directory
  const appDir = join(projectDir, 'app');
  const pagesDir = join(projectDir, 'pages');

  let sourceDir: string;
  let isAppRouter = false;

  try {
    await stat(appDir);
    sourceDir = appDir;
    isAppRouter = true;
    console.log('   Found App Router (app/)\n');
  } catch {
    try {
      await stat(pagesDir);
      sourceDir = pagesDir;
      console.log('   Found Pages Router (pages/)\n');
    } catch {
      console.error('❌ No app/ or pages/ directory found.');
      return;
    }
  }

  // Scan for page files
  const pages = await scanPages(sourceDir, isAppRouter);
  console.log(`   Found ${pages.length} page(s):\n`);

  for (const page of pages) {
    console.log(`   📄 ${page.route}`);
  }

  // Create aeon.config.ts
  const configPath = join(projectDir, 'aeon.config.ts');
  await writeFile(configPath, BASIC_TEMPLATE.files['aeon.config.ts']);
  console.log('\n   ✓ Created aeon.config.ts');

  // Update package.json
  await updatePackageJson(projectDir);
  console.log('   ✓ Updated package.json scripts');

  console.log('\n✨ Conversion complete!\n');
  console.log('Next steps:');
  console.log("  1. Add 'use aeon'; to pages you want to make collaborative");
  console.log('  2. bun install');
  console.log('  3. bun run dev');
  console.log('\nNote: Your existing Next.js code will work with Aeon Pages.');
  console.log(
    "      Just add 'use aeon'; at the top of any page to enable collaboration.\n",
  );
}

interface PageInfo {
  route: string;
  filePath: string;
  hasAeonDirective: boolean;
}

async function scanPages(
  dir: string,
  isAppRouter: boolean,
): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];

  async function scan(currentDir: string, routePath: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Handle dynamic routes
        let segment = entry.name;
        if (segment.startsWith('[') && segment.endsWith(']')) {
          segment = `:${segment.slice(1, -1)}`;
        }
        await scan(fullPath, `${routePath}/${segment}`);
      } else if (entry.isFile()) {
        const isPage = isAppRouter
          ? entry.name === 'page.tsx' ||
            entry.name === 'page.ts' ||
            entry.name === 'page.jsx' ||
            entry.name === 'page.js'
          : entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx');

        if (isPage) {
          const content = await readFile(fullPath, 'utf-8');
          const hasAeon =
            content.includes("'use aeon'") || content.includes('"use aeon"');

          let route = routePath;
          if (!isAppRouter) {
            // Pages router: file name is the route
            const baseName = entry.name.replace(/\.(tsx|jsx|ts|js)$/, '');
            if (baseName !== 'index') {
              route = `${routePath}/${baseName}`;
            }
          }

          pages.push({
            route: route || '/',
            filePath: fullPath,
            hasAeonDirective: hasAeon,
          });
        }
      }
    }
  }

  await scan(dir, '');
  return pages;
}

async function updatePackageJson(projectDir: string): Promise<void> {
  const pkgPath = join(projectDir, 'package.json');

  try {
    const content = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);

    // Update scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.dev = 'aeon dev';
    pkg.scripts.build = 'aeon build';
    pkg.scripts.start = 'aeon start';

    // Add dependencies
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['@affectively/aeon-pages'] = 'workspace:*';

    await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (err) {
    console.error('Failed to update package.json:', err);
  }
}
