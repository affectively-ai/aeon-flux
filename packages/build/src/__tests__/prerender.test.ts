/**
 * Tests for Pre-Rendering Module
 */

import { describe, test, expect } from 'bun:test';
import {
  prerenderPage,
  generatePreRenderSeedSQL,
  generatePreRenderMigrationSQL,
} from '../prerender';
import type { PageSession } from '../types';
import type { CSSManifest } from '../css-manifest';
import type { AssetManifest } from '../asset-manifest';
import type { FontManifest } from '../font-manifest';

// Mock manifests
const mockCSSManifest: CSSManifest = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  rules: {},
  variants: {},
  critical: '/* critical css */',
};

const mockAssetManifest: AssetManifest = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  assets: {
    '/logo.svg': {
      originalPath: '/path/to/logo.svg',
      dataUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      size: 100,
      format: 'svg',
    },
  },
  totalSize: 100,
  totalCount: 1,
};

const mockFontManifest: FontManifest = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  fonts: {},
  fontFaceCSS: '',
  totalSize: 0,
  totalCount: 0,
};

describe('Pre-Rendering Module', () => {
  describe('prerenderPage', () => {
    test('renders simple page to HTML', () => {
      const session: PageSession = {
        route: '/',
        tree: {
          type: 'div',
          props: { className: 'container' },
          children: [
            {
              type: 'h1',
              props: { className: 'text-2xl' },
              children: ['Hello World'],
            },
          ],
        },
        data: { title: 'Test Page' },
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
      });

      expect(result.route).toBe('/');
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<title>Test Page</title>');
      expect(result.html).toContain('Hello World');
      expect(result.html).toContain('class="container"');
      expect(result.html).toContain('class="text-2xl"');
      expect(result.size).toBeGreaterThan(0);
    });

    test('includes critical CSS in output', () => {
      const session: PageSession = {
        route: '/test',
        tree: { type: 'div', children: ['Test'] },
        data: {},
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
      });

      // Should contain actual critical CSS (box-sizing reset, etc.)
      expect(result.html).toContain('box-sizing: border-box');
      expect(result.html).toContain('@keyframes spin');
    });

    test('resolves asset references to data URIs', () => {
      const session: PageSession = {
        route: '/test',
        tree: {
          type: 'div',
          children: [
            {
              type: 'img',
              props: { src: '/logo.svg', alt: 'Logo' },
              children: [],
            },
          ],
        },
        data: {},
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
      });

      expect(result.html).toContain('data:image/svg+xml;base64');
      expect(result.html).not.toContain('src="/logo.svg"');
    });

    test('generates hydration script for interactive components', () => {
      const session: PageSession = {
        route: '/test',
        tree: {
          type: 'div',
          children: [
            {
              type: 'Button',
              props: { onClick: 'handleClick' },
              children: ['Click me'],
            },
          ],
        },
        data: {},
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
        addHydrationScript: true,
      });

      // The hydration script contains the component list and IntersectionObserver logic
      expect(result.html).toContain('IntersectionObserver');
      expect(result.html).toContain('__AEON__');
      expect(result.html).toContain('"Button"');
    });

    test('skips hydration script when disabled', () => {
      const session: PageSession = {
        route: '/test',
        tree: {
          type: 'div',
          children: [
            {
              type: 'Button',
              props: {},
              children: ['Click me'],
            },
          ],
        },
        data: {},
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
        addHydrationScript: false,
      });

      expect(result.html).not.toContain('IntersectionObserver');
    });

    test('escapes HTML in text content', () => {
      const session: PageSession = {
        route: '/test',
        tree: {
          type: 'div',
          children: ['<script>alert("xss")</script>'],
        },
        data: {},
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
      });

      expect(result.html).not.toContain('<script>alert');
      expect(result.html).toContain('&lt;script&gt;');
    });

    test('handles void elements correctly', () => {
      const session: PageSession = {
        route: '/test',
        tree: {
          type: 'div',
          children: [
            { type: 'img', props: { src: '/test.png', alt: 'Test' }, children: [] },
            { type: 'br', children: [] },
            { type: 'hr', children: [] },
            { type: 'input', props: { type: 'text' }, children: [] },
          ],
        },
        data: {},
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
      });

      // Void elements should not have closing tags
      expect(result.html).not.toContain('</img>');
      expect(result.html).not.toContain('</br>');
      expect(result.html).not.toContain('</hr>');
      expect(result.html).not.toContain('</input>');
    });

    test('converts className to class attribute', () => {
      const session: PageSession = {
        route: '/test',
        tree: {
          type: 'div',
          props: { className: 'test-class' },
          children: [],
        },
        data: {},
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
      });

      expect(result.html).toContain('class="test-class"');
      expect(result.html).not.toContain('className=');
    });

    test('handles style prop as object', () => {
      const session: PageSession = {
        route: '/test',
        tree: {
          type: 'div',
          props: {
            style: {
              backgroundColor: 'red',
              fontSize: '16px',
            },
          },
          children: [],
        },
        data: {},
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
      });

      expect(result.html).toContain('style="');
      expect(result.html).toContain('background-color: red');
      expect(result.html).toContain('font-size: 16px');
    });

    test('includes page metadata', () => {
      const session: PageSession = {
        route: '/test',
        tree: { type: 'div', children: [] },
        data: {
          title: 'My Page Title',
          description: 'My page description',
        },
        schema: { version: '1.0.0' },
      };

      const result = prerenderPage(session, {
        cssManifest: mockCSSManifest,
        assetManifest: mockAssetManifest,
        fontManifest: mockFontManifest,
      });

      expect(result.html).toContain('<title>My Page Title</title>');
      expect(result.html).toContain('name="description"');
      expect(result.html).toContain('content="My page description"');
    });
  });

  describe('generatePreRenderSeedSQL', () => {
    test('generates valid SQL for pages', () => {
      const pages = [
        { route: '/', html: '<html>Home</html>', css: '', size: 100, renderedAt: '2024-01-01T00:00:00Z' },
        { route: '/about', html: '<html>About</html>', css: '', size: 120, renderedAt: '2024-01-01T00:00:00Z' },
      ];

      const sql = generatePreRenderSeedSQL(pages, '1.0.0');

      expect(sql).toContain('INSERT OR REPLACE INTO rendered_pages');
      expect(sql).toContain("'/'");
      expect(sql).toContain("'/about'");
      expect(sql).toContain("'1.0.0'");
    });

    test('escapes single quotes in HTML', () => {
      const pages = [
        { route: '/', html: "<html>It's a test</html>", css: '', size: 100, renderedAt: '2024-01-01T00:00:00Z' },
      ];

      const sql = generatePreRenderSeedSQL(pages, '1.0.0');

      expect(sql).toContain("It''s a test");
      expect(sql).not.toContain("It's a test");
    });

    test('includes version in delete statement', () => {
      const pages = [
        { route: '/', html: '<html></html>', css: '', size: 100, renderedAt: '2024-01-01T00:00:00Z' },
      ];

      const sql = generatePreRenderSeedSQL(pages, '2.0.0');

      expect(sql).toContain("DELETE FROM rendered_pages WHERE version != '2.0.0'");
    });
  });

  describe('generatePreRenderMigrationSQL', () => {
    test('creates rendered_pages table', () => {
      const sql = generatePreRenderMigrationSQL();

      expect(sql).toContain('CREATE TABLE IF NOT EXISTS rendered_pages');
      expect(sql).toContain('route TEXT PRIMARY KEY');
      expect(sql).toContain('html TEXT NOT NULL');
      expect(sql).toContain('version TEXT NOT NULL');
    });

    test('creates render_manifests table', () => {
      const sql = generatePreRenderMigrationSQL();

      expect(sql).toContain('CREATE TABLE IF NOT EXISTS render_manifests');
      expect(sql).toContain('type TEXT PRIMARY KEY');
      expect(sql).toContain('manifest TEXT NOT NULL');
    });

    test('creates indexes', () => {
      const sql = generatePreRenderMigrationSQL();

      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_rendered_pages_version');
    });
  });
});
