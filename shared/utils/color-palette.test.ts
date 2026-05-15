import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  generateColorPalette,
} from './color-palette';

// ─────────────────────────────────────────────────────────────────────────────
// hexToRgb
// ─────────────────────────────────────────────────────────────────────────────

describe('hexToRgb', () => {
  it('converts a full 6-digit hex correctly', () => {
    expect(hexToRgb('#331246')).toEqual({ r: 51, g: 18, b: 70 });
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts a shorthand 3-digit hex correctly', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('accepts hex without the # prefix', () => {
    expect(hexToRgb('331246')).toEqual({ r: 51, g: 18, b: 70 });
  });

  it('is case-insensitive', () => {
    expect(hexToRgb('#FF0000')).toEqual(hexToRgb('#ff0000'));
  });

  it('throws on invalid hex values', () => {
    expect(() => hexToRgb('#gggggg')).toThrow('Invalid hex color');
    expect(() => hexToRgb('#12345')).toThrow('Invalid hex color');
    expect(() => hexToRgb('')).toThrow('Invalid hex color');
    expect(() => hexToRgb('not-a-color')).toThrow('Invalid hex color');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// rgbToHsl
// ─────────────────────────────────────────────────────────────────────────────

describe('rgbToHsl', () => {
  it('converts pure white correctly', () => {
    const result = rgbToHsl(255, 255, 255);
    expect(result.l).toBe(100);
    expect(result.s).toBe(0);
  });

  it('converts pure black correctly', () => {
    const result = rgbToHsl(0, 0, 0);
    expect(result.l).toBe(0);
    expect(result.s).toBe(0);
  });

  it('converts pure red correctly', () => {
    const result = rgbToHsl(255, 0, 0);
    expect(result.h).toBe(0);
    expect(result.s).toBe(100);
    expect(result.l).toBe(50);
  });

  it('converts pure green correctly', () => {
    const result = rgbToHsl(0, 255, 0);
    expect(result.h).toBe(120);
    expect(result.s).toBe(100);
    expect(result.l).toBe(50);
  });

  it('converts pure blue correctly', () => {
    const result = rgbToHsl(0, 0, 255);
    expect(result.h).toBe(240);
    expect(result.s).toBe(100);
    expect(result.l).toBe(50);
  });

  it('extracts hue within 0–360 range', () => {
    const { h } = rgbToHsl(51, 18, 70);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(360);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hslToRgb
// ─────────────────────────────────────────────────────────────────────────────

describe('hslToRgb', () => {
  it('converts white correctly', () => {
    expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts black correctly', () => {
    expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts pure red correctly', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts pure green correctly', () => {
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('converts pure blue correctly', () => {
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('produces values within the 0–255 range', () => {
    const { r, g, b } = hslToRgb(285, 59, 44);
    expect(r).toBeGreaterThanOrEqual(0); expect(r).toBeLessThanOrEqual(255);
    expect(g).toBeGreaterThanOrEqual(0); expect(g).toBeLessThanOrEqual(255);
    expect(b).toBeGreaterThanOrEqual(0); expect(b).toBeLessThanOrEqual(255);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// rgbToHex
// ─────────────────────────────────────────────────────────────────────────────

describe('rgbToHex', () => {
  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('pads single-digit hex values', () => {
    expect(rgbToHex(1, 2, 3)).toBe('#010203');
  });

  it('clamps values above 255', () => {
    expect(rgbToHex(300, 0, 0)).toBe('#ff0000');
  });

  it('clamps values below 0', () => {
    expect(rgbToHex(-10, 0, 0)).toBe('#000000');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateColorPalette  (core logic)
// ─────────────────────────────────────────────────────────────────────────────

describe('generateColorPalette', () => {
  const SHADE_KEYS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
  const HEX_REGEX = /^#[0-9a-f]{6}$/;

  describe('output shape', () => {
    it('returns all 11 shade keys', () => {
      const { shades } = generateColorPalette('#331246');
      SHADE_KEYS.forEach((key) => {
        expect(shades).toHaveProperty(key);
      });
    });

    it('all shades are valid lowercase hex strings', () => {
      const { shades } = generateColorPalette('#331246');
      SHADE_KEYS.forEach((key) => {
        expect(shades[key]).toMatch(HEX_REGEX);
      });
    });

    it('returns all 11 CSS custom properties plus the DEFAULT token', () => {
      const { cssVars } = generateColorPalette('#331246');
      SHADE_KEYS.forEach((key) => {
        expect(cssVars).toHaveProperty(`--color-brand-${key}`);
      });
      expect(cssVars).toHaveProperty('--color-brand-DEFAULT');
    });

    it('CSS var DEFAULT equals the 500 shade', () => {
      const { shades, cssVars } = generateColorPalette('#331246');
      expect(cssVars['--color-brand-DEFAULT']).toBe(shades['500']);
    });

    it('returns the correct base HSL hue for the input color', () => {
      const { hsl } = generateColorPalette('#ff0000'); // pure red → hue 0
      expect(hsl.h).toBe(0);
    });

    it('returns the normalized baseHex', () => {
      const { baseHex } = generateColorPalette('#FF0000');
      expect(baseHex).toBe('#ff0000');
    });
  });

  describe('hue consistency (brand identity)', () => {
    it('all shades share the same hue as the base color', () => {
      const base = '#331246';
      const { shades, hsl: baseHsl } = generateColorPalette(base);

      SHADE_KEYS.forEach((key) => {
        const rgb = hexToRgb(shades[key]);
        const { h } = rgbToHsl(rgb.r, rgb.g, rgb.b);
        // Allow ±2° tolerance for rounding during conversion
        expect(Math.abs(h - baseHsl.h)).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('lightness ordering', () => {
    it('shade 50 is always lighter than shade 950', () => {
      const { shades } = generateColorPalette('#331246');
      const light = rgbToHsl(...Object.values(hexToRgb(shades['50'])) as [number, number, number]);
      const dark  = rgbToHsl(...Object.values(hexToRgb(shades['950'])) as [number, number, number]);
      expect(light.l).toBeGreaterThan(dark.l);
    });

    it('lightness decreases monotonically from 50 to 950', () => {
      const { shades } = generateColorPalette('#71289c');
      const lightnessValues = SHADE_KEYS.map((key) => {
        const rgb = hexToRgb(shades[key]);
        return rgbToHsl(rgb.r, rgb.g, rgb.b).l;
      });

      for (let i = 0; i < lightnessValues.length - 1; i++) {
        expect(lightnessValues[i]).toBeGreaterThan(lightnessValues[i + 1]);
      }
    });
  });

  describe('input variations', () => {
    it('accepts hex without # prefix', () => {
      expect(() => generateColorPalette('331246')).not.toThrow();
    });

    it('accepts shorthand 3-digit hex', () => {
      expect(() => generateColorPalette('#abc')).not.toThrow();
    });

    it('handles a very dark input color (#000000)', () => {
      const { shades } = generateColorPalette('#000000');
      expect(shades['50']).toMatch(HEX_REGEX);
      expect(shades['950']).toMatch(HEX_REGEX);
    });

    it('handles a very light input color (#ffffff)', () => {
      const { shades } = generateColorPalette('#ffffff');
      expect(shades['50']).toMatch(HEX_REGEX);
      expect(shades['950']).toMatch(HEX_REGEX);
    });

    it('throws on invalid hex input', () => {
      expect(() => generateColorPalette('not-a-color')).toThrow('Invalid hex color');
      expect(() => generateColorPalette('#gggggg')).toThrow('Invalid hex color');
    });
  });

  describe("user's example: #331246 (dark purple)", () => {
    it('generates a palette where 50 is light and 950 is near-black', () => {
      const { shades } = generateColorPalette('#331246');
      const light = rgbToHsl(...Object.values(hexToRgb(shades['50'])) as [number, number, number]);
      const dark  = rgbToHsl(...Object.values(hexToRgb(shades['950'])) as [number, number, number]);
      expect(light.l).toBeGreaterThan(80);
      expect(dark.l).toBeLessThan(15);
    });

    it('the brand hue is in the purple range (~285°)', () => {
      const { hsl } = generateColorPalette('#331246');
      expect(hsl.h).toBeGreaterThanOrEqual(270);
      expect(hsl.h).toBeLessThanOrEqual(300);
    });
  });
});
