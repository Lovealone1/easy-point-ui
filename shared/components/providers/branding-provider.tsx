'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore, type OrganizationConfig } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useFavoritesStore } from '@/shared/store/use-favorites-store';
import { getMe } from '@/features/auth/services/auth.service';
import { getConfig } from '@/features/organization-configs/services/organization-configs.service';
import { generateShades } from '@/shared/utils/color-shades';


async function forceLogout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
  }
  window.location.replace('/auth');
}

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

  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    resetBrandingDOM();
    return;
  }

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

export function useAuthBrandingReset(): void {
  const setTheme = useUiStore((s) => s.setTheme);
  const setLoadingSession = useAuthStore((s) => s.setLoadingSession);

  useEffect(() => {
    setTheme('light');
    resetBrandingDOM();
    setLoadingSession(true);
  }, [setTheme, setLoadingSession]);
}

export default function BrandingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
  const { initForUser, clearForUser } = useFavoritesStore();

  // Initialize favorites store when user logs in
  useEffect(() => {
    if (user?.id) {
      initForUser(user.id);
    }
  }, [user?.id, initForUser]);

  useEffect(() => {
    function handleUnauthorized() {
      clearSession();
      clearForUser();
      void forceLogout();
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearSession, clearForUser]);

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
              { orgRoles: [firstOrg.role], permissions: firstOrg.permissions ?? [] }
            );
            if (firstOrg.config) {
              setOrganizationConfig(firstOrg.config);
              applyBrandingToDOM(firstOrg.config, setTheme);
              await new Promise((resolve) => setTimeout(resolve, 600));
            }
          }
        } else {
          clearSession();
          await forceLogout();
          return;
        }
      } catch (error) {
        const is401 =
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status === 401;

        if (!is401) {
          console.error('Session recovery failed unexpectedly:', error);
        }

        clearSession();
        await forceLogout();
        return;
      } finally {
        setLoadingSession(false);
      }
    }

    recoverSession();
  }, []);

  useEffect(() => {
    if (!activeOrganization) return;

    async function fetchOrgConfig() {
      try {
        const config = await getConfig();
        const prevConfig = useAuthStore.getState().organizationConfig;

        const merged: OrganizationConfig = {
          ...prevConfig,
          ...config,

          primaryColor: config.primaryColor ?? prevConfig?.primaryColor ?? null,
          defaultTheme: config.defaultTheme ?? prevConfig?.defaultTheme ?? 'SYSTEM',
          logoUrl: config.logoUrl ?? prevConfig?.logoUrl ?? null,
          logoShortUrl: config.logoShortUrl ?? prevConfig?.logoShortUrl ?? null,
          organizationEmail: config.organizationEmail ?? prevConfig?.organizationEmail ?? null,
          organizationName: config.organizationName || prevConfig?.organizationName || activeOrganization?.name || 'Organización',
          plan: config.plan ?? prevConfig?.plan ?? 'FREE',
        };

        setOrganizationConfig(merged);

        // Apply branding immediately after merging — don't rely solely on the
        // useEffect below, which can miss updates when the object reference
        // doesn't change or when setTheme is captured as a stale closure.
        const { hasUserSetTheme } = useUiStore.getState();
        applyBrandingToDOM(merged, setTheme, !hasUserSetTheme);
      } catch (error) {
        console.error('Failed to fetch organization config:', error);
      }
    }

    fetchOrgConfig();
  }, [activeOrganization, setTheme]);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      resetBrandingDOM();
      return;
    }

    if (!organizationConfig) return;

    const { hasUserSetTheme } = useUiStore.getState();
    applyBrandingToDOM(organizationConfig, setTheme, !hasUserSetTheme);
  }, [pathname, organizationConfig, setTheme]);

  if (isLoadingSession || !user || !profileHydrated) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-32 w-32 animate-pulse rounded-full border border-primary/30 bg-primary/5 blur-xl transition-all duration-500"></div>
          <div className="h-16 w-16 animate-spin rounded-full border-t-2 border-r-2 border-primary transition-all duration-500"></div>
          <div className="absolute h-10 w-10 animate-ping rounded-full border border-primary/50 transition-all duration-500"></div>
        </div>
        <p className="mt-6 text-sm font-semibold tracking-wider text-primary/70 animate-pulse uppercase transition-all duration-500">
          Iniciando EasyPoint...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
