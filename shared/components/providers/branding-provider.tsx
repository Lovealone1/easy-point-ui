'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type OrganizationConfig } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { getMe } from '@/shared/services/auth.service';
import { getConfig } from '@/shared/services/organization-configs.service';
import { generateShades } from '@/shared/utils/color-shades';

// ─────────────────────────────────────────────────────────────────────────────
// Pure DOM function — applies brand colors & theme class synchronously.
// Can be called outside React's render cycle (e.g. inside an async function)
// to avoid the one-frame flash that happens when relying solely on useEffect.
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Applies brand CSS variables and optionally the initial theme to the DOM.
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

  // Resolve which shade to use for --primary based on the theme that WILL be active.
  // Even when not applying the theme, we need to know light vs dark for correct shade.
  let resolvedTheme: 'light' | 'dark' = 'light';
  if (applyTheme) {
    const defaultTheme = config.defaultTheme || 'SYSTEM';
    if (defaultTheme === 'DARK') {
      resolvedTheme = 'dark';
    } else if (defaultTheme === 'LIGHT') {
      resolvedTheme = 'light';
    } else {
      // SYSTEM: read OS preference at the moment of initial load only.
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    // Apply .dark class and colorScheme on <html>
    setThemeFn(resolvedTheme);
  } else {
    // User has manually set the theme — respect it, just read current DOM state.
    resolvedTheme = root.classList.contains('dark') ? 'dark' : 'light';
  }

  // Apply CSS variables to :root inline style (highest specificity, overrides globals.css)
  const isDark = resolvedTheme === 'dark';
  const activePrimary = isDark ? shades[400] : shades[500];

  root.style.setProperty('--primary', activePrimary);
  root.style.setProperty('--ring', activePrimary);
  root.style.setProperty('--sidebar-primary', activePrimary);

  // Overwrite all individual shade variables
  Object.entries(shades).forEach(([shade, hex]) => {
    root.style.setProperty(`--color-brand-${shade}`, hex);
  });
  root.style.setProperty('--color-brand-DEFAULT', shades[500]);
}

export default function BrandingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    user,
    profileHydrated,
    activeOrganization,
    organizationConfig,
    isLoadingSession,
    setUserFromLogin,
    hydrateProfile,
    setActiveOrganization,
    setOrganizationConfig,
    setLoadingSession,
    clearSession,
  } = useAuthStore();

  const { setTheme } = useUiStore();

  // 1. Session Recovery on Mount
  useEffect(() => {
    async function recoverSession() {
      if (user && profileHydrated) {
        setLoadingSession(false);
        return;
      }

      try {
        const data = await getMe();
        if (data && data.id) {
          setUserFromLogin({ id: data.id, email: data.email });
          hydrateProfile({
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            fullName: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null,
            avatarUrl: undefined,
            globalRole: data.globalRole || null,
          });

          if (data.organizations && data.organizations.length > 0) {
            const firstOrg = data.organizations[0];
            setActiveOrganization(
              { id: firstOrg.id, name: firstOrg.name, slug: firstOrg.slug },
              { orgRoles: [firstOrg.role], permissions: [] }
            );
            if (firstOrg.config) {
              setOrganizationConfig(firstOrg.config);
              // ⚡ Apply branding SYNCHRONOUSLY before clearing the loading gate.
              // Without this, React batches setState + setLoadingSession into a single
              // render, so children appear before useEffect([organizationConfig]) fires,
              // causing a one-frame flash of the default purple from globals.css.
              applyBrandingToDOM(firstOrg.config, setTheme);
            }
          }
        } else {
          clearSession();
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Session recovery failed:', error);
        clearSession();
        router.push('/auth/login');
      } finally {
        setLoadingSession(false);
      }
    }

    recoverSession();
  }, []);

  // 2. Re-fetch full config (including organizationEmail, plan, etc.) whenever
  // the active organization changes. This runs on initial load too — the session
  // recovery above sets a minimal config from getMe(); calling getConfig() here
  // ensures we always get the complete OrganizationConfigEntity with all fields
  // (organizationEmail, plan, planActiveUntil, organizationIsActive) from the DB.
  useEffect(() => {
    if (!activeOrganization) return;

    async function fetchOrgConfig() {
      try {
        const config = await getConfig();
        const prevConfig = useAuthStore.getState().organizationConfig;

        // Merge: spread the fresh config over the previous one, but keep
        // branding-critical fields from the fresh response so colors always update.
        setOrganizationConfig({
          ...prevConfig,
          ...config,
          // Ensure org-level fields from the entity are preserved
          organizationEmail: config.organizationEmail ?? prevConfig?.organizationEmail ?? null,
          organizationName: config.organizationName || prevConfig?.organizationName || activeOrganization?.name || 'Organización',
          plan: config.plan ?? prevConfig?.plan ?? 'FREE',
        });
      } catch (error) {
        console.error('Failed to fetch organization config:', error);
      }
    }

    fetchOrgConfig();
  }, [activeOrganization]);

  // 3. Re-apply branding whenever organizationConfig changes (e.g. from settings page).
  // The initial application during mount is done synchronously in recoverSession above.
  // When the user has already set their own theme for the session (hasUserSetTheme),
  // we only refresh the CSS color variables without touching the active theme.
  useEffect(() => {
    if (!organizationConfig) return;

    const { hasUserSetTheme } = useUiStore.getState();
    // applyTheme = false when user has manually overridden the theme this session.
    // This preserves the user's choice even when config is re-fetched (e.g. settings save).
    applyBrandingToDOM(organizationConfig, setTheme, !hasUserSetTheme);
    // Note: we intentionally do NOT set up a prefers-color-scheme listener here.
    // The initial theme is a one-time bootstrap from the org config. After that,
    // the user is in control — OS theme changes should NOT override their session.
  }, [organizationConfig]);

  if (isLoadingSession) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-32 w-32 animate-pulse rounded-full border border-purple-500/30 bg-purple-500/5 blur-xl"></div>
          <div className="h-16 w-16 animate-spin rounded-full border-t-2 border-r-2 border-purple-500"></div>
          <div className="absolute h-10 w-10 animate-ping rounded-full border border-purple-400/50"></div>
        </div>
        <p className="mt-6 text-sm font-semibold tracking-wider text-purple-200/70 animate-pulse uppercase">
          Iniciando EasyPoint...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
