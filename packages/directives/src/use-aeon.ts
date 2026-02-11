/**
 * 'use aeon' Directive Processor
 *
 * Transforms pages with the 'use aeon' directive to enable:
 * - Collaborative editing
 * - Real-time presence
 * - Schema versioning
 * - Offline support
 *
 * @example
 * Input:
 * ```tsx
 * 'use aeon';
 *
 * export default function Page() {
 *   return <div>Hello</div>;
 * }
 * ```
 *
 * Output:
 * ```tsx
 * import { AeonPageProvider, useAeonPage } from '@affectively/aeon-pages/react';
 *
 * function Page() {
 *   return <div>Hello</div>;
 * }
 *
 * export default function AeonWrappedPage(props) {
 *   return (
 *     <AeonPageProvider route="/path/to/page">
 *       <Page {...props} />
 *     </AeonPageProvider>
 *   );
 * }
 * ```
 */

export interface TransformOptions {
  /** File path for route derivation */
  filePath: string;
  /** Base pages directory */
  pagesDir?: string;
}

export interface TransformResult {
  /** Transformed code */
  code: string;
  /** Whether the file was transformed */
  transformed: boolean;
  /** Derived route from file path */
  route: string;
}

/**
 * Check if a file contains the 'use aeon' directive
 */
export function hasAeonDirective(code: string): boolean {
  // Match 'use aeon' or "use aeon" at the start of the file
  const directivePattern = /^['"]use aeon['"];?\s*\n/m;
  return directivePattern.test(code.trimStart());
}

/**
 * Process the 'use aeon' directive and transform the code
 */
export function processAeonDirective(
  code: string,
  options: TransformOptions,
): TransformResult {
  const { filePath, pagesDir = './pages' } = options;

  // Check for directive
  if (!hasAeonDirective(code)) {
    return {
      code,
      transformed: false,
      route: deriveRoute(filePath, pagesDir),
    };
  }

  const route = deriveRoute(filePath, pagesDir);

  // Remove the directive
  const codeWithoutDirective = code.replace(/^['"]use aeon['"];?\s*\n/m, '');

  // Find the default export
  const defaultExportMatch = codeWithoutDirective.match(
    /export\s+default\s+function\s+(\w+)/,
  );

  if (!defaultExportMatch) {
    // Handle arrow function exports or other patterns
    return transformArrowExport(codeWithoutDirective, route);
  }

  const componentName = defaultExportMatch[1];

  // Transform the code
  const transformedCode = `
// Aeon Pages - Transformed from 'use aeon' directive
import { AeonPageProvider, useAeonPage } from '@affectively/aeon-pages/react';

${codeWithoutDirective.replace(
  /export\s+default\s+function\s+(\w+)/,
  'function $1',
)}

// Re-export useAeonPage for convenience
export { useAeonPage };

// Wrapped component with Aeon providers
export default function AeonWrappedPage(props: any) {
  return (
    <AeonPageProvider route="${route}">
      <${componentName} {...props} />
    </AeonPageProvider>
  );
}
`.trim();

  return {
    code: transformedCode,
    transformed: true,
    route,
  };
}

/**
 * Transform arrow function or other export patterns
 */
function transformArrowExport(code: string, route: string): TransformResult {
  // Match: export default () => ... or export default function() ...
  const arrowExportMatch = code.match(
    /export\s+default\s+((?:\([^)]*\)|[^=])\s*=>|function\s*\()/,
  );

  if (!arrowExportMatch) {
    // No recognizable default export, wrap the whole thing
    return {
      code: `
// Aeon Pages - Transformed from 'use aeon' directive
import { AeonPageProvider, useAeonPage } from '@affectively/aeon-pages/react';

const OriginalPage = (() => {
  ${code}
  return undefined; // Placeholder
})();

export { useAeonPage };

export default function AeonWrappedPage(props: any) {
  return (
    <AeonPageProvider route="${route}">
      {OriginalPage}
    </AeonPageProvider>
  );
}
`.trim(),
      transformed: true,
      route,
    };
  }

  // Extract the arrow function/anonymous function
  const transformedCode = `
// Aeon Pages - Transformed from 'use aeon' directive
import { AeonPageProvider, useAeonPage } from '@affectively/aeon-pages/react';

${code.replace(/export\s+default\s+/, 'const OriginalPage = ')}

export { useAeonPage };

export default function AeonWrappedPage(props: any) {
  return (
    <AeonPageProvider route="${route}">
      <OriginalPage {...props} />
    </AeonPageProvider>
  );
}
`.trim();

  return {
    code: transformedCode,
    transformed: true,
    route,
  };
}

/**
 * Derive route from file path
 *
 * @example
 * - pages/index.tsx -> /
 * - pages/about.tsx -> /about
 * - pages/blog/[slug].tsx -> /blog/[slug]
 * - pages/blog/[slug]/page.tsx -> /blog/[slug]
 */
export function deriveRoute(filePath: string, pagesDir: string): string {
  // Normalize paths
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPagesDir = pagesDir.replace(/\\/g, '/').replace(/\/$/, '');

  // Remove pages directory prefix
  let route = normalizedPath;
  if (route.startsWith(normalizedPagesDir)) {
    route = route.slice(normalizedPagesDir.length);
  }

  // Remove file extension
  route = route.replace(/\.(tsx?|jsx?)$/, '');

  // Remove /page suffix (Next.js app router style)
  route = route.replace(/\/page$/, '');

  // Remove /index suffix
  route = route.replace(/\/index$/, '');

  // Handle route groups (parentheses)
  route = route.replace(/\/\([^)]+\)/g, '');

  // Ensure leading slash
  if (!route.startsWith('/')) {
    route = '/' + route;
  }

  // Handle root
  if (route === '' || route === '/') {
    return '/';
  }

  return route;
}

/**
 * Bun plugin for processing 'use aeon' directives
 */
export function aeonBunPlugin(options: { pagesDir?: string } = {}) {
  return {
    name: 'aeon-directive',
    setup(build: { onLoad: (opts: unknown, callback: unknown) => void }) {
      build.onLoad(
        { filter: /\.(tsx?|jsx?)$/ },
        async (args: { path: string }) => {
          const file = Bun.file(args.path);
          const code = await file.text();

          if (!hasAeonDirective(code)) {
            return undefined; // Let Bun handle it normally
          }

          const result = processAeonDirective(code, {
            filePath: args.path,
            pagesDir: options.pagesDir,
          });

          return {
            contents: result.code,
            loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts',
          };
        },
      );
    },
  };
}

// Export for use in build tools
export default {
  hasAeonDirective,
  processAeonDirective,
  deriveRoute,
  aeonBunPlugin,
};
