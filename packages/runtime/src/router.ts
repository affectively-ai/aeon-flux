/**
 * Aeon Router - TypeScript wrapper for WASM router
 *
 * Handles route matching with Next.js-style patterns:
 * - Static: /about
 * - Dynamic: /blog/[slug]
 * - Catch-all: /api/[...path]
 * - Optional catch-all: /docs/[[...slug]]
 */

import type { RouteDefinition, RouteMatch } from './types';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

interface RouterOptions {
  routesDir: string;
  componentsDir?: string;
}

interface ParsedRoute {
  pattern: string;
  segments: Segment[];
  definition: RouteDefinition;
}

type Segment =
  | { type: 'static'; value: string }
  | { type: 'dynamic'; name: string }
  | { type: 'catchAll'; name: string }
  | { type: 'optionalCatchAll'; name: string };

/**
 * Aeon Router - file-based routing with dynamic segment support
 */
export class AeonRouter {
  private routes: ParsedRoute[] = [];
  private routesDir: string;
  private componentsDir?: string;

  constructor(options: RouterOptions) {
    this.routesDir = options.routesDir;
    this.componentsDir = options.componentsDir;
  }

  /**
   * Scan the routes directory and build the route table
   */
  async scan(): Promise<void> {
    this.routes = [];
    await this.scanDirectory(this.routesDir, '');
    this.sortRoutes();
  }

  /**
   * Reload routes (for hot reload)
   */
  async reload(): Promise<void> {
    await this.scan();
  }

  /**
   * Match a URL path to a route
   */
  match(path: string): RouteMatch | null {
    const pathSegments = path
      .replace(/^\/|\/$/g, '')
      .split('/')
      .filter(Boolean);

    for (const parsed of this.routes) {
      const params = this.matchSegments(parsed.segments, pathSegments);
      if (params !== null) {
        const sessionId = this.resolveSessionId(
          parsed.definition.sessionId,
          params,
        );
        return {
          route: parsed.definition,
          params,
          sessionId,
          componentId: parsed.definition.componentId,
          isAeon: parsed.definition.isAeon,
        };
      }
    }

    return null;
  }

  /**
   * Check if a route exists
   */
  hasRoute(path: string): boolean {
    return this.match(path) !== null;
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RouteDefinition[] {
    return this.routes.map((r) => r.definition);
  }

  /**
   * Add a route manually (for dynamic creation)
   */
  addRoute(definition: RouteDefinition): void {
    const segments = this.parsePattern(definition.pattern);
    this.routes.push({ pattern: definition.pattern, segments, definition });
    this.sortRoutes();
  }

  // Private methods

  private async scanDirectory(dir: string, prefix: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip route groups in URL but process their contents
          const isRouteGroup =
            entry.name.startsWith('(') && entry.name.endsWith(')');
          const newPrefix = isRouteGroup ? prefix : `${prefix}/${entry.name}`;
          await this.scanDirectory(fullPath, newPrefix);
        } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
          // Found a page file
          const route = await this.createRouteFromFile(fullPath, prefix);
          if (route) {
            this.routes.push(route);
          }
        }
      }
    } catch (error) {
      console.error(`[aeon] Error scanning directory ${dir}:`, error);
    }
  }

  private async createRouteFromFile(
    filePath: string,
    prefix: string,
  ): Promise<ParsedRoute | null> {
    try {
      // Read file to check for 'use aeon' directive
      const file = Bun.file(filePath);
      const content = await file.text();
      const isAeon =
        content.includes("'use aeon'") || content.includes('"use aeon"');

      // Convert file path to route pattern
      const pattern = prefix || '/';
      const segments = this.parsePattern(pattern);

      // Generate session ID template
      const sessionId = this.generateSessionId(pattern);

      // Component ID from file path
      const componentId =
        relative(this.routesDir, filePath)
          .replace(/\.(tsx?|jsx?)$/, '')
          .replace(/\//g, '-')
          .replace(/page$/, '')
          .replace(/-$/, '') || 'index';

      const definition: RouteDefinition = {
        pattern,
        sessionId,
        componentId,
        isAeon,
      };

      return { pattern, segments, definition };
    } catch (error) {
      console.error(`[aeon] Error reading file ${filePath}:`, error);
      return null;
    }
  }

  private parsePattern(pattern: string): Segment[] {
    return pattern
      .replace(/^\/|\/$/g, '')
      .split('/')
      .filter(Boolean)
      .filter((s) => !(s.startsWith('(') && s.endsWith(')'))) // Skip route groups
      .map((s): Segment => {
        if (s.startsWith('[[...') && s.endsWith(']]')) {
          return { type: 'optionalCatchAll', name: s.slice(5, -2) };
        }
        if (s.startsWith('[...') && s.endsWith(']')) {
          return { type: 'catchAll', name: s.slice(4, -1) };
        }
        if (s.startsWith('[') && s.endsWith(']')) {
          return { type: 'dynamic', name: s.slice(1, -1) };
        }
        return { type: 'static', value: s };
      });
  }

  private matchSegments(
    routeSegments: Segment[],
    pathSegments: string[],
  ): Record<string, string> | null {
    const params: Record<string, string> = {};
    let pathIdx = 0;

    for (const segment of routeSegments) {
      switch (segment.type) {
        case 'static':
          if (
            pathIdx >= pathSegments.length ||
            pathSegments[pathIdx] !== segment.value
          ) {
            return null;
          }
          pathIdx++;
          break;

        case 'dynamic':
          if (pathIdx >= pathSegments.length) {
            return null;
          }
          params[segment.name] = pathSegments[pathIdx];
          pathIdx++;
          break;

        case 'catchAll':
          if (pathIdx >= pathSegments.length) {
            return null; // Must match at least one segment
          }
          params[segment.name] = pathSegments.slice(pathIdx).join('/');
          pathIdx = pathSegments.length;
          break;

        case 'optionalCatchAll':
          if (pathIdx < pathSegments.length) {
            params[segment.name] = pathSegments.slice(pathIdx).join('/');
            pathIdx = pathSegments.length;
          }
          break;
      }
    }

    // All path segments must be consumed
    return pathIdx === pathSegments.length ? params : null;
  }

  private generateSessionId(pattern: string): string {
    return (
      pattern
        .replace(/^\/|\/$/g, '')
        .replace(/\[\.\.\.(\w+)\]/g, '$$$1')
        .replace(/\[\[\.\.\.(\w+)\]\]/g, '$$$1')
        .replace(/\[(\w+)\]/g, '$$$1')
        .replace(/\//g, '-') || 'index'
    );
  }

  private resolveSessionId(
    template: string,
    params: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`$${key}`, value);
    }
    return result;
  }

  private sortRoutes(): void {
    // Sort by specificity: static > dynamic > catch-all
    this.routes.sort((a, b) => {
      const scoreA = this.routeSpecificity(a.segments);
      const scoreB = this.routeSpecificity(b.segments);
      return scoreB - scoreA;
    });
  }

  private routeSpecificity(segments: Segment[]): number {
    let score = 0;
    for (let i = 0; i < segments.length; i++) {
      const positionWeight = 1000 - i;
      const segment = segments[i];
      switch (segment.type) {
        case 'static':
          score += positionWeight * 10;
          break;
        case 'dynamic':
          score += positionWeight * 5;
          break;
        case 'catchAll':
          score += 1;
          break;
        case 'optionalCatchAll':
          score += 0;
          break;
      }
    }
    return score;
  }
}
