/**
 * Tests for CSS Manifest Generator
 */

import { describe, test, expect } from 'bun:test';
import {
  generateCSSForClass,
  generateCSSForClasses,
  generateCriticalCSS,
  extractClassesFromTree,
} from '../css-manifest';

describe('CSS Manifest Generator', () => {
  describe('generateCSSForClass', () => {
    test('generates background color classes', () => {
      const rule = generateCSSForClass('bg-blue-500');
      expect(rule).not.toBeNull();
      expect(rule?.declarations).toContain('background-color');
      expect(rule?.declarations).toContain('#3b82f6');
    });

    test('generates background color with opacity', () => {
      const rule = generateCSSForClass('bg-blue-500/50');
      expect(rule).not.toBeNull();
      expect(rule?.declarations).toContain('background-color');
      expect(rule?.declarations).toContain('rgba');
      expect(rule?.declarations).toContain('0.5');
    });

    test('generates text color classes', () => {
      const rule = generateCSSForClass('text-red-600');
      expect(rule).not.toBeNull();
      expect(rule?.declarations).toContain('color');
      expect(rule?.declarations).toContain('#dc2626');
    });

    test('generates text size classes', () => {
      const rule = generateCSSForClass('text-lg');
      expect(rule).not.toBeNull();
      expect(rule?.declarations).toContain('font-size');
      expect(rule?.declarations).toContain('1.125rem');
    });

    test('generates padding classes', () => {
      const rule = generateCSSForClass('p-4');
      expect(rule).not.toBeNull();
      expect(rule?.declarations).toBe('padding: 1rem');
    });

    test('generates directional padding classes', () => {
      const px = generateCSSForClass('px-4');
      expect(px).not.toBeNull();
      expect(px?.declarations).toContain('padding-left: 1rem');
      expect(px?.declarations).toContain('padding-right: 1rem');

      const pt = generateCSSForClass('pt-2');
      expect(pt).not.toBeNull();
      expect(pt?.declarations).toBe('padding-top: 0.5rem');
    });

    test('generates margin classes', () => {
      const rule = generateCSSForClass('m-4');
      expect(rule).not.toBeNull();
      expect(rule?.declarations).toBe('margin: 1rem');
    });

    test('generates negative margin classes', () => {
      const rule = generateCSSForClass('-mt-4');
      expect(rule).not.toBeNull();
      expect(rule?.declarations).toBe('margin-top: -1rem');
    });

    test('generates width classes', () => {
      const wFull = generateCSSForClass('w-full');
      expect(wFull).not.toBeNull();
      expect(wFull?.declarations).toBe('width: 100%');

      const w12 = generateCSSForClass('w-12');
      expect(w12).not.toBeNull();
      expect(w12?.declarations).toBe('width: 3rem');
    });

    test('generates fractional width classes', () => {
      const rule = generateCSSForClass('w-1/2');
      expect(rule).not.toBeNull();
      expect(rule?.declarations).toContain('width:');
      expect(rule?.declarations).toContain('50');
    });

    test('generates border radius classes', () => {
      const rounded = generateCSSForClass('rounded');
      expect(rounded).not.toBeNull();
      expect(rounded?.declarations).toBe('border-radius: 0.25rem');

      const roundedLg = generateCSSForClass('rounded-lg');
      expect(roundedLg).not.toBeNull();
      expect(roundedLg?.declarations).toBe('border-radius: 0.5rem');

      const roundedFull = generateCSSForClass('rounded-full');
      expect(roundedFull).not.toBeNull();
      expect(roundedFull?.declarations).toBe('border-radius: 9999px');
    });

    test('generates flex classes', () => {
      const flex = generateCSSForClass('flex');
      expect(flex).not.toBeNull();
      expect(flex?.declarations).toBe('display: flex');

      const flexCol = generateCSSForClass('flex-col');
      expect(flexCol).not.toBeNull();
      expect(flexCol?.declarations).toBe('flex-direction: column');

      const itemsCenter = generateCSSForClass('items-center');
      expect(itemsCenter).not.toBeNull();
      expect(itemsCenter?.declarations).toBe('align-items: center');

      const justifyBetween = generateCSSForClass('justify-between');
      expect(justifyBetween).not.toBeNull();
      expect(justifyBetween?.declarations).toBe('justify-content: space-between');
    });

    test('generates grid classes', () => {
      const grid = generateCSSForClass('grid');
      expect(grid).not.toBeNull();
      expect(grid?.declarations).toBe('display: grid');

      const gridCols3 = generateCSSForClass('grid-cols-3');
      expect(gridCols3).not.toBeNull();
      expect(gridCols3?.declarations).toContain('grid-template-columns');
      expect(gridCols3?.declarations).toContain('repeat(3');
    });

    test('generates gap classes', () => {
      const gap = generateCSSForClass('gap-4');
      expect(gap).not.toBeNull();
      expect(gap?.declarations).toBe('gap: 1rem');

      const gapX = generateCSSForClass('gap-x-2');
      expect(gapX).not.toBeNull();
      expect(gapX?.declarations).toBe('column-gap: 0.5rem');
    });

    test('generates font weight classes', () => {
      const bold = generateCSSForClass('font-bold');
      expect(bold).not.toBeNull();
      expect(bold?.declarations).toBe('font-weight: 700');

      const semibold = generateCSSForClass('font-semibold');
      expect(semibold).not.toBeNull();
      expect(semibold?.declarations).toBe('font-weight: 600');
    });

    test('generates shadow classes', () => {
      const shadow = generateCSSForClass('shadow');
      expect(shadow).not.toBeNull();
      expect(shadow?.declarations).toContain('box-shadow');

      const shadowLg = generateCSSForClass('shadow-lg');
      expect(shadowLg).not.toBeNull();
      expect(shadowLg?.declarations).toContain('box-shadow');
    });

    test('generates transition classes', () => {
      const transition = generateCSSForClass('transition');
      expect(transition).not.toBeNull();
      expect(transition?.declarations).toContain('transition-property');
      expect(transition?.declarations).toContain('transition-duration');
    });

    test('generates hover variant', () => {
      const rule = generateCSSForClass('hover:bg-blue-600');
      expect(rule).not.toBeNull();
      expect(rule?.selector).toContain(':hover');
      expect(rule?.declarations).toContain('background-color');
    });

    test('generates focus variant', () => {
      const rule = generateCSSForClass('focus:ring-2');
      expect(rule).not.toBeNull();
      expect(rule?.selector).toContain(':focus');
    });

    test('generates responsive variants', () => {
      const mdRule = generateCSSForClass('md:flex');
      expect(mdRule).not.toBeNull();
      expect(mdRule?.mediaQuery).toBe('(min-width: 768px)');
      expect(mdRule?.declarations).toBe('display: flex');

      const lgRule = generateCSSForClass('lg:grid-cols-3');
      expect(lgRule).not.toBeNull();
      expect(lgRule?.mediaQuery).toBe('(min-width: 1024px)');
    });

    test('generates combined responsive and hover variants', () => {
      const rule = generateCSSForClass('md:hover:bg-blue-600');
      expect(rule).not.toBeNull();
      expect(rule?.mediaQuery).toBe('(min-width: 768px)');
      expect(rule?.selector).toContain(':hover');
    });

    test('returns null for unknown classes', () => {
      const rule = generateCSSForClass('unknown-class-xyz');
      expect(rule).toBeNull();
    });
  });

  describe('generateCSSForClasses', () => {
    test('generates CSS for multiple classes', () => {
      const classes = new Set(['flex', 'items-center', 'p-4', 'bg-blue-500']);
      const css = generateCSSForClasses(classes);

      expect(css).toContain('display: flex');
      expect(css).toContain('align-items: center');
      expect(css).toContain('padding: 1rem');
      expect(css).toContain('background-color');
    });

    test('groups media queries', () => {
      const classes = new Set(['flex', 'md:hidden', 'lg:grid']);
      const css = generateCSSForClasses(classes);

      expect(css).toContain('@media (min-width: 768px)');
      expect(css).toContain('@media (min-width: 1024px)');
    });

    test('handles empty set', () => {
      const css = generateCSSForClasses(new Set());
      expect(css).toBe('');
    });

    test('deduplicates identical rules', () => {
      const classes = new Set(['flex', 'flex']);
      const css = generateCSSForClasses(classes);
      const flexCount = (css.match(/display: flex/g) || []).length;
      expect(flexCount).toBe(1);
    });
  });

  describe('generateCriticalCSS', () => {
    test('includes box-sizing reset', () => {
      const css = generateCriticalCSS();
      expect(css).toContain('box-sizing: border-box');
    });

    test('includes keyframe animations', () => {
      const css = generateCriticalCSS();
      expect(css).toContain('@keyframes spin');
      expect(css).toContain('@keyframes pulse');
    });

    test('includes base element resets', () => {
      const css = generateCriticalCSS();
      expect(css).toContain('body { margin: 0');
      expect(css).toContain('a { color: inherit');
    });
  });

  describe('extractClassesFromTree', () => {
    test('extracts classes from simple tree', () => {
      const tree = {
        type: 'div',
        props: { className: 'flex items-center p-4' },
        children: [],
      };

      const classes = extractClassesFromTree(tree);
      expect(classes.has('flex')).toBe(true);
      expect(classes.has('items-center')).toBe(true);
      expect(classes.has('p-4')).toBe(true);
    });

    test('extracts classes from nested tree', () => {
      const tree = {
        type: 'div',
        props: { className: 'container' },
        children: [
          {
            type: 'h1',
            props: { className: 'text-2xl font-bold' },
            children: ['Hello'],
          },
          {
            type: 'p',
            props: { className: 'text-gray-600' },
            children: ['World'],
          },
        ],
      };

      const classes = extractClassesFromTree(tree);
      expect(classes.has('container')).toBe(true);
      expect(classes.has('text-2xl')).toBe(true);
      expect(classes.has('font-bold')).toBe(true);
      expect(classes.has('text-gray-600')).toBe(true);
    });

    test('handles class attribute (not just className)', () => {
      const tree = {
        type: 'div',
        props: { class: 'flex gap-4' },
        children: [],
      };

      const classes = extractClassesFromTree(tree);
      expect(classes.has('flex')).toBe(true);
      expect(classes.has('gap-4')).toBe(true);
    });

    test('handles tree with no classes', () => {
      const tree = {
        type: 'div',
        props: { id: 'root' },
        children: ['Hello'],
      };

      const classes = extractClassesFromTree(tree);
      expect(classes.size).toBe(0);
    });

    test('handles deeply nested tree', () => {
      const tree = {
        type: 'div',
        props: { className: 'level-1' },
        children: [
          {
            type: 'div',
            props: { className: 'level-2' },
            children: [
              {
                type: 'div',
                props: { className: 'level-3' },
                children: [
                  {
                    type: 'span',
                    props: { className: 'level-4' },
                    children: ['Deep'],
                  },
                ],
              },
            ],
          },
        ],
      };

      const classes = extractClassesFromTree(tree);
      expect(classes.has('level-1')).toBe(true);
      expect(classes.has('level-2')).toBe(true);
      expect(classes.has('level-3')).toBe(true);
      expect(classes.has('level-4')).toBe(true);
    });
  });
});
