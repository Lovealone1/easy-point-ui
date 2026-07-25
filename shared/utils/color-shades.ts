/**
 * Utility to generate Tailwind-like color shades (50-950) from a single hex color.
 * Mixes with white for light shades (50-400) and with a dark base (#0a0717) for dark shades (600-950).
 */

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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  if (cleanHex.length !== 6) return null;

  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

function mix(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  weight: number // 0 to 1
): string {
  const r = color1.r * (1 - weight) + color2.r * weight;
  const g = color1.g * (1 - weight) + color2.g * weight;
  const b = color1.b * (1 - weight) + color2.b * weight;
  return rgbToHex(r, g, b);
}

const BRAND_DEFAULT_HEX = '#8b1fc1';

export function generateShades(baseHex: string): ColorShades {
  const baseRgb = hexToRgb(baseHex);

  // Fall back to the brand default palette (not a gray palette) when the
  // provided color can't be parsed, so the worst case is still on-brand.
  if (!baseRgb) {
    const fallbackRgb = hexToRgb(BRAND_DEFAULT_HEX)!;
    return buildShades(fallbackRgb);
  }

  return buildShades(baseRgb);
}

function buildShades(baseRgb: { r: number; g: number; b: number }): ColorShades {
  const white = { r: 255, g: 255, b: 255 };
  const darkBase = { r: 10, g: 7, b: 23 }; // #0a0717

  return {
    50: mix(baseRgb, white, 0.92),
    100: mix(baseRgb, white, 0.8),
    200: mix(baseRgb, white, 0.6),
    300: mix(baseRgb, white, 0.4),
    400: mix(baseRgb, white, 0.2),
    500: rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b),
    600: mix(baseRgb, darkBase, 0.2),
    700: mix(baseRgb, darkBase, 0.4),
    800: mix(baseRgb, darkBase, 0.6),
    900: mix(baseRgb, darkBase, 0.8),
    950: mix(baseRgb, darkBase, 0.92),
  };
}
