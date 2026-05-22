'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { getMe } from '@/shared/services/auth.service';
import { getConfig } from '@/shared/services/organization-configs.service';
import { generateShades } from '@/shared/utils/color-shades';

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

  // 2. Fetch config when active organization changes
  useEffect(() => {
    if (!activeOrganization) return;

    async function fetchOrgConfig() {
      try {
        const config = await getConfig();
        setOrganizationConfig(config);
      } catch (error) {
        console.error('Failed to fetch organization configurations:', error);
      }
    }

    fetchOrgConfig();
  }, [activeOrganization]);

  // 3. Apply branding colors & theme whenever organizationConfig or theme changes
  useEffect(() => {
    if (!organizationConfig) return;

    const root = document.documentElement;
    const primaryColor = organizationConfig.primaryColor || '#8b1fc1';
    const shades = generateShades(primaryColor);
    const defaultTheme = organizationConfig.defaultTheme || 'SYSTEM';
    
    const applyConfig = () => {
      let resolvedTheme: 'light' | 'dark' = 'light';
      if (defaultTheme === 'DARK') {
        resolvedTheme = 'dark';
      } else if (defaultTheme === 'LIGHT') {
        resolvedTheme = 'light';
      } else {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      // Update UI Store (which applies classes and updates theme)
      setTheme(resolvedTheme);

      // Apply CSS variables to :root
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
    };

    applyConfig();

    if (defaultTheme === 'SYSTEM') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyConfig();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
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
