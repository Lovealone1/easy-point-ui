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

function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Shade 400 becomes `--primary` / `--sidebar-primary` in dark mode (see
 * globals.css), i.e. the active/interactive color rendered directly on the
 * near-black sidebar and canvas surfaces. Its normal 20%-toward-white mix
 * is fine for typical brand colors, but organizations that haven't set a
 * custom color (schema default `primaryColor = "#000000"`) — or picked one
 * close to black — end up with a shade 400 that's still almost black,
 * making the active nav item render as an unreadable dark-on-dark block.
 *
 * This computes the extra mix-toward-white weight needed so shade 400
 * never drops below a legible minimum luminance, while leaving already-
 * light base colors (which clear the floor at the normal 0.2 weight)
 * untouched.
 */
function weightForMinLuminance(
  base: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  minLuminance: number,
  fallbackWeight: number,
): number {
  const baseLum = luminance(base);
  if (baseLum >= minLuminance) return fallbackWeight;

  const targetLum = luminance(target);
  if (targetLum <= baseLum) return fallbackWeight;

  const requiredWeight = (minLuminance - baseLum) / (targetLum - baseLum);
  return Math.min(1, Math.max(fallbackWeight, requiredWeight));
}

// Perceptual luminance (0–255) floor for shade 400. Comfortably legible
// against the app's dark-mode surfaces (--sidebar/--background sit around
// luminance 25–40).
const DARK_MODE_ACTIVE_MIN_LUMINANCE = 110;

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

  const shade400Weight = weightForMinLuminance(
    baseRgb,
    white,
    DARK_MODE_ACTIVE_MIN_LUMINANCE,
    0.2,
  );

  return {
    50: mix(baseRgb, white, 0.92),
    100: mix(baseRgb, white, 0.8),
    200: mix(baseRgb, white, 0.6),
    300: mix(baseRgb, white, 0.4),
    400: mix(baseRgb, white, shade400Weight),
    500: rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b),
    600: mix(baseRgb, darkBase, 0.2),
    700: mix(baseRgb, darkBase, 0.4),
    800: mix(baseRgb, darkBase, 0.6),
    900: mix(baseRgb, darkBase, 0.8),
    950: mix(baseRgb, darkBase, 0.92),
  };
}
