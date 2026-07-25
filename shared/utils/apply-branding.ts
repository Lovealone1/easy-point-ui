import { generateShades } from '@/shared/utils/color-shades';
import type { OrganizationConfig } from '@/shared/store/use-auth-store';

export async function forceLogout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
  }
  window.location.replace('/auth');
}

/**
 * Applies brand CSS variables and optionally the initial theme to the DOM.
 * Only ever called from the dashboard shell — the admin shell never mounts
 * org branding and calls `resetBrandingDOM()` directly instead.
 *
 * @param config         The organization config with primaryColor and defaultTheme.
 * @param setThemeFn     The UI store's setTheme action (applies .dark class).
 * @param applyTheme     When true (default), also resolves and applies the theme
 *                       from config. Pass false when the user has already set their
 *                       own theme preference for the session — in that case only
 *                       the CSS color variables are updated.
 */
export function applyBrandingToDOM(
  config: OrganizationConfig,
  setThemeFn: (mode: 'light' | 'dark') => void,
  applyTheme = true,
): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  const primaryColor = config.primaryColor || '#8b1fc1';
  const shades = generateShades(primaryColor);

  let resolvedTheme: 'light' | 'dark' = 'light';
  if (applyTheme) {
    const defaultTheme = config.defaultTheme || 'SYSTEM';
    if (defaultTheme === 'DARK') {
      resolvedTheme = 'dark';
    } else if (defaultTheme === 'LIGHT') {
      resolvedTheme = 'light';
    } else {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setThemeFn(resolvedTheme);
  } else {
    resolvedTheme = root.classList.contains('dark') ? 'dark' : 'light';
  }

  const isDark = resolvedTheme === 'dark';
  const activePrimary = isDark ? shades[400] : shades[500];

  root.style.setProperty('--primary', activePrimary);
  root.style.setProperty('--ring', activePrimary);
  root.style.setProperty('--sidebar-primary', activePrimary);

  Object.entries(shades).forEach(([shade, hex]) => {
    root.style.setProperty(`--color-brand-${shade}`, hex);
  });
  root.style.setProperty('--color-brand-DEFAULT', shades[500]);
}

export function resetBrandingDOM(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.removeProperty('--primary');
  root.style.removeProperty('--ring');
  root.style.removeProperty('--sidebar-primary');

  const shadesKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', 'DEFAULT'];
  shadesKeys.forEach((shade) => {
    root.style.removeProperty(`--color-brand-${shade}`);
  });
}
