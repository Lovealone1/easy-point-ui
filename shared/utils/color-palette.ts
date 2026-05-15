// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ThemePalette {
  /** Full color shade scale (50–950) */
  shades: ColorShades;
  /** CSS custom properties ready to inject into :root */
  cssVars: Record<string, string>;
  /** HSL values extracted from the base color */
  hsl: { h: number; s: number; l: number };
  /** Normalized hex of the received color */
  baseHex: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Space Conversions (no external dependencies)
// ─────────────────────────────────────────────────────────────────────────────

/** Converts a hex string (#rrggbb or #rgb) to its RGB components (0–255). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;

  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  };
}

/** Converts RGB (0–255) to HSL (h: 0–360, s: 0–100, l: 0–100). */
export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rn:
        h = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / delta + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Converts HSL (h: 0–360, s: 0–100, l: 0–100) to RGB (0–255). */
export function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const sn = s / 100;
  const ln = l / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Converts RGB (0–255) to a hex string (#rrggbb). */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
      .join('')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Palette Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Target lightness and saturation boost per shade step.
 *
 * Strategy:
 * - The Hue stays constant across all shades (brand identity).
 * - Lightness is interpolated from near-white (96%) to near-black (6%).
 * - sBoost applies a small saturation offset to prevent washed-out extremes:
 *   positive at mid-range (more vibrant), negative at edges (more neutral).
 */
const SHADE_TARGETS = [
  { key: '50'  as const, l: 96, sBoost: -30 }, // Near-white with a brand tint
  { key: '100' as const, l: 90, sBoost: -20 },
  { key: '200' as const, l: 80, sBoost: -10 },
  { key: '300' as const, l: 68, sBoost: -4  },
  { key: '400' as const, l: 56, sBoost: 2   }, // Vibrant zone
  { key: '500' as const, l: 44, sBoost: 4   }, // Palette center
  { key: '600' as const, l: 34, sBoost: 2   },
  { key: '700' as const, l: 26, sBoost: 0   },
  { key: '800' as const, l: 18, sBoost: -5  },
  { key: '900' as const, l: 11, sBoost: -10 },
  { key: '950' as const, l:  6, sBoost: -15 }, // Near-black with a brand tint
];

/**
 * Generates an 11-step color palette (50–950) from a single base hex color.
 *
 * Strategy:
 * 1. Extract the Hue from the base color → permanent brand identity.
 * 2. Extract the base Saturation → used as reference for vibrancy.
 * 3. Generate each shade by adjusting Lightness and applying a small
 *    saturation boost/reduction so extreme shades don't look flat.
 *
 * @example
 * const palette = generateColorPalette('#331246');
 * palette.shades['50']  // '#f3ebf7'  (very light lavender)
 * palette.shades['500'] // '#7c2fa6'  (mid-range purple)
 * palette.shades['950'] // '#0a0210'  (near-black purple)
 *
 * // Inject into the document root:
 * Object.entries(palette.cssVars).forEach(([key, value]) => {
 *   document.documentElement.style.setProperty(key, value);
 * });
 */
export function generateColorPalette(hex: string): ThemePalette {
  const rgb = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const shades = {} as ColorShades;
  const cssVars: Record<string, string> = {};

  for (const { key, l: targetL, sBoost } of SHADE_TARGETS) {
    const adjustedS = Math.max(0, Math.min(100, s + sBoost));
    const shadeRgb = hslToRgb(h, adjustedS, targetL);
    const shadeHex = rgbToHex(shadeRgb.r, shadeRgb.g, shadeRgb.b);

    shades[key] = shadeHex;
    cssVars[`--color-brand-${key}`] = shadeHex;
  }

  cssVars['--color-brand-DEFAULT'] = shades['500'];

  return {
    shades,
    cssVars,
    hsl: { h, s, l },
    baseHex: rgbToHex(rgb.r, rgb.g, rgb.b),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Injection Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Injects the generated palette as CSS custom properties on the document root.
 * Must only be called from client-side code (`'use client'` components).
 *
 * @param palette - The palette returned by `generateColorPalette`
 */
export function injectPaletteIntoCss(palette: ThemePalette): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  for (const [property, value] of Object.entries(palette.cssVars)) {
    root.style.setProperty(property, value);
  }
}
