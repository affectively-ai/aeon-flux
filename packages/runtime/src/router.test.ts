import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { AeonRouter } from './router';
import type { RouteDefinition } from './types';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';

describe('AeonRouter', () => {
  let router: AeonRouter;

  beforeEach(() => {
    router = new AeonRouter({ routesDir: './pages' });
  });

  describe('addRoute and match', () => {
    test('matches static route', () => {
      router.addRoute({
        pattern: '/about',
        sessionId: 'about',
        componentId: 'about',
        isAeon: true,
      });

      const match = router.match('/about');

      expect(match).not.toBeNull();
      expect(match!.route.pattern).toBe('/about');
      expect(match!.params).toEqual({});
      expect(match!.sessionId).toBe('about');
    });

    test('matches root route', () => {
      router.addRoute({
        pattern: '/',
        sessionId: 'index',
        componentId: 'index',
        isAeon: true,
      });

      const match = router.match('/');

      expect(match).not.toBeNull();
      expect(match!.route.pattern).toBe('/');
    });

    test('matches dynamic route [slug]', () => {
      router.addRoute({
        pattern: '/blog/[slug]',
        sessionId: 'blog-$slug',
        componentId: 'blog-slug',
        isAeon: true,
      });

      const match = router.match('/blog/my-first-post');

      expect(match).not.toBeNull();
      expect(match!.params).toEqual({ slug: 'my-first-post' });
      expect(match!.sessionId).toBe('blog-my-first-post');
    });

    test('matches multiple dynamic segments', () => {
      router.addRoute({
        pattern: '/users/[userId]/posts/[postId]',
        sessionId: 'users-$userId-posts-$postId',
        componentId: 'user-post',
        isAeon: true,
      });

      const match = router.match('/users/123/posts/456');

      expect(match).not.toBeNull();
      expect(match!.params).toEqual({ userId: '123', postId: '456' });
      expect(match!.sessionId).toBe('users-123-posts-456');
    });

    test('matches catch-all route [...path]', () => {
      router.addRoute({
        pattern: '/api/[...path]',
        sessionId: 'api-$path',
        componentId: 'api-catchall',
        isAeon: false,
      });

      const match = router.match('/api/users/123/posts');

      expect(match).not.toBeNull();
      expect(match!.params).toEqual({ path: 'users/123/posts' });
    });

    test('catch-all requires at least one segment', () => {
      router.addRoute({
        pattern: '/api/[...path]',
        sessionId: 'api-$path',
        componentId: 'api-catchall',
        isAeon: false,
      });

      const match = router.match('/api');

      expect(match).toBeNull();
    });

    test('matches optional catch-all [[...slug]]', () => {
      router.addRoute({
        pattern: '/docs/[[...slug]]',
        sessionId: 'docs-$slug',
        componentId: 'docs',
        isAeon: true,
      });

      // With segments
      const matchWithSlug = router.match('/docs/getting-started/installation');
      expect(matchWithSlug).not.toBeNull();
      expect(matchWithSlug!.params).toEqual({
        slug: 'getting-started/installation',
      });

      // Without segments (optional)
      const matchWithoutSlug = router.match('/docs');
      expect(matchWithoutSlug).not.toBeNull();
      expect(matchWithoutSlug!.params).toEqual({});
    });

    test('returns null for non-matching route', () => {
      router.addRoute({
        pattern: '/about',
        sessionId: 'about',
        componentId: 'about',
        isAeon: true,
      });

      const match = router.match('/contact');

      expect(match).toBeNull();
    });

    test('static route takes precedence over dynamic', () => {
      router.addRoute({
        pattern: '/blog/[slug]',
        sessionId: 'blog-$slug',
        componentId: 'blog-slug',
        isAeon: true,
      });
      router.addRoute({
        pattern: '/blog/featured',
        sessionId: 'blog-featured',
        componentId: 'blog-featured',
        isAeon: true,
      });

      const match = router.match('/blog/featured');

      expect(match).not.toBeNull();
      expect(match!.route.pattern).toBe('/blog/featured');
      expect(match!.params).toEqual({});
    });

    test('dynamic route takes precedence over catch-all', () => {
      router.addRoute({
        pattern: '/api/[...path]',
        sessionId: 'api-$path',
        componentId: 'api-catchall',
        isAeon: false,
      });
      router.addRoute({
        pattern: '/api/[version]',
        sessionId: 'api-$version',
        componentId: 'api-version',
        isAeon: false,
      });

      const match = router.match('/api/v1');

      expect(match).not.toBeNull();
      expect(match!.route.pattern).toBe('/api/[version]');
      expect(match!.params).toEqual({ version: 'v1' });
    });
  });

  describe('hasRoute', () => {
    test('returns true for existing route', () => {
      router.addRoute({
        pattern: '/about',
        sessionId: 'about',
        componentId: 'about',
        isAeon: true,
      });

      expect(router.hasRoute('/about')).toBe(true);
    });

    test('returns false for non-existing route', () => {
      expect(router.hasRoute('/nonexistent')).toBe(false);
    });
  });

  describe('getRoutes', () => {
    test('returns all registered routes', () => {
      router.addRoute({
        pattern: '/',
        sessionId: 'index',
        componentId: 'index',
        isAeon: true,
      });
      router.addRoute({
        pattern: '/about',
        sessionId: 'about',
        componentId: 'about',
        isAeon: true,
      });
      router.addRoute({
        pattern: '/blog/[slug]',
        sessionId: 'blog-$slug',
        componentId: 'blog-slug',
        isAeon: true,
      });

      const routes = router.getRoutes();

      expect(routes).toHaveLength(3);
      expect(routes.map((r) => r.pattern)).toContain('/');
      expect(routes.map((r) => r.pattern)).toContain('/about');
      expect(routes.map((r) => r.pattern)).toContain('/blog/[slug]');
    });
  });

  describe('route groups', () => {
    test('skips route groups in pattern', () => {
      // Route groups like (marketing) should not appear in URL
      router.addRoute({
        pattern: '/(marketing)/about',
        sessionId: 'about',
        componentId: 'about',
        isAeon: true,
      });

      // Should match /about, not /(marketing)/about
      const match = router.match('/about');
      expect(match).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    test('handles trailing slashes', () => {
      router.addRoute({
        pattern: '/about',
        sessionId: 'about',
        componentId: 'about',
        isAeon: true,
      });

      expect(router.match('/about/')).not.toBeNull();
      expect(router.match('/about')).not.toBeNull();
    });

    test('handles leading slashes', () => {
      router.addRoute({
        pattern: '/about',
        sessionId: 'about',
        componentId: 'about',
        isAeon: true,
      });

      expect(router.match('about')).not.toBeNull();
      expect(router.match('/about')).not.toBeNull();
    });

    test('handles empty path as root', () => {
      router.addRoute({
        pattern: '/',
        sessionId: 'index',
        componentId: 'index',
        isAeon: true,
      });

      expect(router.match('')).not.toBeNull();
      expect(router.match('/')).not.toBeNull();
    });

    test('does not match partial segments', () => {
      router.addRoute({
        pattern: '/blog',
        sessionId: 'blog',
        componentId: 'blog',
        isAeon: true,
      });

      expect(router.match('/blogger')).toBeNull();
      expect(router.match('/blog-posts')).toBeNull();
    });

    test('handles deeply nested routes', () => {
      router.addRoute({
        pattern: '/a/b/c/d/e/f',
        sessionId: 'deep',
        componentId: 'deep',
        isAeon: true,
      });

      const match = router.match('/a/b/c/d/e/f');
      expect(match).not.toBeNull();
      expect(match!.route.pattern).toBe('/a/b/c/d/e/f');
    });

    test('handles special characters in dynamic segments', () => {
      router.addRoute({
        pattern: '/posts/[slug]',
        sessionId: 'posts-$slug',
        componentId: 'posts-slug',
        isAeon: true,
      });

      const match = router.match('/posts/hello-world-2024');
      expect(match).not.toBeNull();
      expect(match!.params.slug).toBe('hello-world-2024');
    });
  });

  describe('session ID resolution', () => {
    test('resolves session ID with single param', () => {
      router.addRoute({
        pattern: '/blog/[slug]',
        sessionId: 'blog-$slug',
        componentId: 'blog-slug',
        isAeon: true,
      });

      const match = router.match('/blog/my-post');
      expect(match!.sessionId).toBe('blog-my-post');
    });

    test('resolves session ID with multiple params', () => {
      router.addRoute({
        pattern: '/[lang]/blog/[slug]',
        sessionId: '$lang-blog-$slug',
        componentId: 'lang-blog-slug',
        isAeon: true,
      });

      const match = router.match('/en/blog/hello-world');
      expect(match!.sessionId).toBe('en-blog-hello-world');
    });

    test('resolves session ID with catch-all', () => {
      router.addRoute({
        pattern: '/docs/[...path]',
        sessionId: 'docs-$path',
        componentId: 'docs-path',
        isAeon: true,
      });

      const match = router.match('/docs/api/reference/auth');
      expect(match!.sessionId).toBe('docs-api/reference/auth');
    });
  });
});

describe('AeonRouter file scanning', () => {
  const testPagesDir = '.aeon/test-pages';
  let router: AeonRouter;

  beforeEach(async () => {
    // Create test pages directory structure
    await mkdir(join(testPagesDir, 'blog', '[slug]'), { recursive: true });
    await mkdir(join(testPagesDir, 'about'), { recursive: true });
    await mkdir(join(testPagesDir, '(marketing)', 'landing'), {
      recursive: true,
    });

    // Create page files
    await writeFile(
      join(testPagesDir, 'page.tsx'),
      `'use aeon';\nexport default function Home() { return <div>Home</div>; }`,
    );
    await writeFile(
      join(testPagesDir, 'about', 'page.tsx'),
      `export default function About() { return <div>About</div>; }`,
    );
    await writeFile(
      join(testPagesDir, 'blog', '[slug]', 'page.tsx'),
      `'use aeon';\nexport default function BlogPost() { return <div>Blog</div>; }`,
    );
    await writeFile(
      join(testPagesDir, '(marketing)', 'landing', 'page.tsx'),
      `"use aeon";\nexport default function Landing() { return <div>Landing</div>; }`,
    );

    router = new AeonRouter({ routesDir: testPagesDir });
  });

  afterEach(async () => {
    await rm(testPagesDir, { recursive: true, force: true });
  });

  test('scans directory and finds pages', async () => {
    await router.scan();
    const routes = router.getRoutes();

    expect(routes.length).toBeGreaterThanOrEqual(3);
  });

  test('detects use aeon directive with single quotes', async () => {
    await router.scan();

    const homeMatch = router.match('/');
    expect(homeMatch).not.toBeNull();
    expect(homeMatch!.isAeon).toBe(true);
  });

  test('detects use aeon directive with double quotes', async () => {
    await router.scan();

    // Landing page uses double quotes for 'use aeon'
    const landingMatch = router.match('/landing');
    expect(landingMatch).not.toBeNull();
    expect(landingMatch!.isAeon).toBe(true);
  });

  test('detects non-aeon pages', async () => {
    await router.scan();

    const aboutMatch = router.match('/about');
    expect(aboutMatch).not.toBeNull();
    expect(aboutMatch!.isAeon).toBe(false);
  });

  test('handles dynamic segments from directory names', async () => {
    await router.scan();

    const blogMatch = router.match('/blog/my-post');
    expect(blogMatch).not.toBeNull();
    expect(blogMatch!.params.slug).toBe('my-post');
  });

  test('skips route groups in URL pattern', async () => {
    await router.scan();

    // (marketing) should not appear in URL
    const landingMatch = router.match('/landing');
    expect(landingMatch).not.toBeNull();

    // Should NOT match with route group in URL
    const withGroup = router.match('/(marketing)/landing');
    expect(withGroup).toBeNull();
  });

  test('reload rescans directory', async () => {
    await router.scan();
    const initialRoutes = router.getRoutes().length;

    // Add a new page
    await mkdir(join(testPagesDir, 'contact'), { recursive: true });
    await writeFile(
      join(testPagesDir, 'contact', 'page.tsx'),
      `export default function Contact() { return <div>Contact</div>; }`,
    );

    await router.reload();
    const newRoutes = router.getRoutes().length;

    expect(newRoutes).toBeGreaterThan(initialRoutes);
  });

  test('handles non-existent directory gracefully', async () => {
    const badRouter = new AeonRouter({ routesDir: './nonexistent-dir' });
    await badRouter.scan();

    const routes = badRouter.getRoutes();
    expect(routes).toEqual([]);
  });
});
