/**
 * Tests for Skeleton Dimension Extractor
 */

import { describe, expect, it } from 'bun:test';
import {
  extractDimensionsFromClasses,
  propsToDimensions,
  mergeDimensions,
} from '../skeleton-extractor';

describe('extractDimensionsFromClasses', () => {
  describe('width extraction', () => {
    it('extracts fixed width from w-{number}', () => {
      const result = extractDimensionsFromClasses('w-64');
      expect(result.width).toBe('16rem');
    });

    it('extracts w-full as 100%', () => {
      const result = extractDimensionsFromClasses('w-full');
      expect(result.width).toBe('100%');
    });

    it('extracts w-screen as 100vw', () => {
      const result = extractDimensionsFromClasses('w-screen');
      expect(result.width).toBe('100vw');
    });

    it('extracts fractional width w-1/2', () => {
      const result = extractDimensionsFromClasses('w-1/2');
      expect(result.width).toBe('50.000000%');
    });

    it('extracts fractional width w-2/3', () => {
      const result = extractDimensionsFromClasses('w-2/3');
      expect(result.width).toBe('66.666667%');
    });

    it('extracts arbitrary width w-[200px]', () => {
      const result = extractDimensionsFromClasses('w-[200px]');
      expect(result.width).toBe('200px');
    });

    it('extracts arbitrary width with percentage w-[50%]', () => {
      const result = extractDimensionsFromClasses('w-[50%]');
      expect(result.width).toBe('50%');
    });
  });

  describe('height extraction', () => {
    it('extracts fixed height from h-{number}', () => {
      const result = extractDimensionsFromClasses('h-12');
      expect(result.height).toBe('3rem');
    });

    it('extracts h-screen as 100vh', () => {
      const result = extractDimensionsFromClasses('h-screen');
      expect(result.height).toBe('100vh');
    });

    it('extracts h-full as 100%', () => {
      const result = extractDimensionsFromClasses('h-full');
      expect(result.height).toBe('100%');
    });

    it('extracts arbitrary height h-[100px]', () => {
      const result = extractDimensionsFromClasses('h-[100px]');
      expect(result.height).toBe('100px');
    });
  });

  describe('aspect ratio extraction', () => {
    it('extracts aspect-square as 1/1', () => {
      const result = extractDimensionsFromClasses('aspect-square');
      expect(result.aspectRatio).toBe('1/1');
    });

    it('extracts aspect-video as 16/9', () => {
      const result = extractDimensionsFromClasses('aspect-video');
      expect(result.aspectRatio).toBe('16/9');
    });

    it('extracts arbitrary aspect ratio aspect-[4/3]', () => {
      const result = extractDimensionsFromClasses('aspect-[4/3]');
      expect(result.aspectRatio).toBe('4/3');
    });
  });

  describe('padding extraction', () => {
    it('extracts p-4', () => {
      const result = extractDimensionsFromClasses('p-4');
      expect(result.padding).toBe('1rem');
    });

    it('extracts px-2', () => {
      const result = extractDimensionsFromClasses('px-2');
      expect(result.padding).toBe('0.5rem');
    });

    it('extracts py-6', () => {
      const result = extractDimensionsFromClasses('py-6');
      expect(result.padding).toBe('1.5rem');
    });
  });

  describe('margin extraction', () => {
    it('extracts m-4', () => {
      const result = extractDimensionsFromClasses('m-4');
      expect(result.margin).toBe('1rem');
    });

    it('extracts negative margin -m-2', () => {
      const result = extractDimensionsFromClasses('-m-2');
      expect(result.margin).toBe('-0.5rem');
    });

    it('extracts mx-auto', () => {
      const result = extractDimensionsFromClasses('mx-auto');
      expect(result.margin).toBe('auto');
    });
  });

  describe('gap extraction', () => {
    it('extracts gap-4', () => {
      const result = extractDimensionsFromClasses('gap-4');
      expect(result.gap).toBe('1rem');
    });

    it('extracts gap-x-2', () => {
      const result = extractDimensionsFromClasses('gap-x-2');
      expect(result.gap).toBe('0.5rem');
    });
  });

  describe('border radius extraction', () => {
    it('extracts rounded', () => {
      const result = extractDimensionsFromClasses('rounded');
      expect(result.borderRadius).toBe('0.25rem');
    });

    it('extracts rounded-lg', () => {
      const result = extractDimensionsFromClasses('rounded-lg');
      expect(result.borderRadius).toBe('0.5rem');
    });

    it('extracts rounded-full', () => {
      const result = extractDimensionsFromClasses('rounded-full');
      expect(result.borderRadius).toBe('9999px');
    });

    it('extracts rounded-none', () => {
      const result = extractDimensionsFromClasses('rounded-none');
      expect(result.borderRadius).toBe('0px');
    });
  });

  describe('min-height extraction', () => {
    it('extracts min-h-screen', () => {
      const result = extractDimensionsFromClasses('min-h-screen');
      expect(result.minHeight).toBe('100vh');
    });

    it('extracts min-h-full', () => {
      const result = extractDimensionsFromClasses('min-h-full');
      expect(result.minHeight).toBe('100%');
    });
  });

  describe('combined classes', () => {
    it('extracts all dimensions from multiple classes', () => {
      const result = extractDimensionsFromClasses('w-64 h-12 p-4 rounded-lg gap-2');
      expect(result.width).toBe('16rem');
      expect(result.height).toBe('3rem');
      expect(result.padding).toBe('1rem');
      expect(result.borderRadius).toBe('0.5rem');
      expect(result.gap).toBe('0.5rem');
    });

    it('handles responsive prefixes by using base class', () => {
      const result = extractDimensionsFromClasses('md:w-64 lg:h-12');
      expect(result.width).toBe('16rem');
      expect(result.height).toBe('3rem');
    });

    it('handles state prefixes by using base class', () => {
      const result = extractDimensionsFromClasses('hover:w-64 focus:h-12');
      expect(result.width).toBe('16rem');
      expect(result.height).toBe('3rem');
    });
  });

  describe('confidence score', () => {
    it('returns high confidence with width and height', () => {
      const result = extractDimensionsFromClasses('w-64 h-12');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('returns medium confidence with only width', () => {
      const result = extractDimensionsFromClasses('w-64');
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('returns low confidence with no dimension classes', () => {
      const result = extractDimensionsFromClasses('bg-blue-500 text-white');
      expect(result.confidence).toBe(0);
    });
  });
});

describe('propsToDimensions', () => {
  it('extracts width from props', () => {
    const result = propsToDimensions({ width: 200 });
    expect(result.width).toBe('200px');
  });

  it('extracts height from props', () => {
    const result = propsToDimensions({ height: '100px' });
    expect(result.height).toBe('100px');
  });

  it('maps size prop to dimensions', () => {
    const result = propsToDimensions({ size: 'lg' });
    expect(result.width).toBe('2.5rem');
    expect(result.height).toBe('2.5rem');
  });

  it('maps numeric size prop', () => {
    const result = propsToDimensions({ size: 48 });
    expect(result.width).toBe('48px');
    expect(result.height).toBe('48px');
  });

  it('handles missing props', () => {
    const result = propsToDimensions({});
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
    expect(result.confidence).toBe(0);
  });
});

describe('mergeDimensions', () => {
  it('merges dimensions with later sources taking priority', () => {
    const tailwind = extractDimensionsFromClasses('w-64 h-12');
    const props = propsToDimensions({ width: 200 });

    const result = mergeDimensions(tailwind, props);
    expect(result.width).toBe('200px'); // props override
    expect(result.height).toBe('3rem'); // from tailwind
  });

  it('takes max confidence', () => {
    const low = { confidence: 0.3, width: '100px' };
    const high = { confidence: 0.9, height: '50px' };

    const result = mergeDimensions(low, high);
    expect(result.confidence).toBe(0.9);
    expect(result.width).toBe('100px');
    expect(result.height).toBe('50px');
  });
});
