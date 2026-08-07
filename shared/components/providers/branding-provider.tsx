'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { useAuthStore, type OrganizationConfig } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useFavoritesStore } from '@/shared/store/use-favorites-store';
import { useOrgModulesStore } from '@/shared/store/use-org-modules-store';
import { useSessionRecovery } from '@/shared/hooks/use-session-recovery';
import { getConfig } from '@/features/organization-configs/services/organization-configs.service';
import { organizationModulesService } from '@/features/organization-modules/services/organization-modules.service';
import { applyBrandingToDOM, resetBrandingDOM } from '@/shared/utils/apply-branding';
import { toast } from 'sonner';
import { MODULES_CATALOG } from '@/shared/config/modules.config';
import EnvironmentSplash from '@/shared/components/ui/environment-splash';

export { applyBrandingToDOM, resetBrandingDOM };

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
    setOrganizationConfig,
  } = useAuthStore();

  const { setTheme } = useUiStore();
  const { initForUser } = useFavoritesStore();
  const { activeModuleKeys } = useOrgModulesStore();

  useSessionRecovery({
    applyBranding: true,
    redirectWhenNoOrg: '/onboarding',
    blockWhenAccessExpired: true,
  });

  // Re-apply the x-organization-id Axios header on mount so it survives a
  // round-trip through the admin shell, which clears it while active
  // (see AdminSessionProvider). No membership arg — user state is untouched.
  useEffect(() => {
    if (activeOrganization) {
      useAuthStore.getState().setActiveOrganization(activeOrganization);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize favorites store when user logs in
  useEffect(() => {
    if (user?.id) {
      initForUser(user.id);
    }
  }, [user?.id, initForUser]);

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

        // The trial/subscription can lapse mid-session (not just on login) —
        // re-check on every org-config fetch, not only session recovery.
        if (merged.accessBlocked && pathname !== '/trial-expired') {
          window.location.replace('/trial-expired');
        }
      } catch (error) {
        console.error('Failed to fetch organization config:', error);
      }
    }

    fetchOrgConfig();
  }, [activeOrganization, setTheme]);

  useEffect(() => {
    if (!activeOrganization) {
      useOrgModulesStore.getState().clearActiveModules();
      return;
    }

    // Access is already known to be blocked (subscription/trial expired) —
    // SubscriptionAccessGuard rejects this endpoint too, so skip the request
    // instead of logging an expected 403. The org-config effect above already
    // triggers the redirect to /trial-expired.
    if (useAuthStore.getState().organizationConfig?.accessBlocked) return;

    async function fetchOrgModules() {
      try {
        const modules = await organizationModulesService.getOrgModules(activeOrganization!.id);
        const keys = modules.map((m) => m.key);
        useOrgModulesStore.getState().setActiveModules(keys);
      } catch (error) {
        console.error('Failed to fetch organization modules:', error);
      }
    }

    fetchOrgModules();
  }, [activeOrganization?.id, pathname, organizationConfig?.accessBlocked]);

  useEffect(() => {
    if (
      pathname === '/auth' ||
      pathname === '/dashboard' ||
      pathname === '/unauthorized' ||
      pathname === '/trial-expired'
    ) {
      return;
    }

    if (activeModuleKeys === null) return;

    // Find the module in the catalog that matches the current pathname prefix
    const matchingModule = MODULES_CATALOG.find((mod) => {
      if (mod.path === '/') return false;
      return pathname.startsWith(mod.path);
    });

    if (matchingModule && !matchingModule.pinned) {
      if (!activeModuleKeys.has(matchingModule.id)) {
        toast.error(`El módulo "${matchingModule.name}" no está activo para tu organización.`);
        window.location.replace('/unauthorized');
      }
    }
  }, [pathname, activeModuleKeys]);

  useEffect(() => {
    if (!organizationConfig) return;

    const { hasUserSetTheme } = useUiStore.getState();
    applyBrandingToDOM(organizationConfig, setTheme, !hasUserSetTheme);
  }, [pathname, organizationConfig, setTheme]);

  const isBooting = isLoadingSession || !user || !profileHydrated;

  return (
    <>
      <AnimatePresence>
        {isBooting && <EnvironmentSplash key="environment-splash" />}
      </AnimatePresence>
      {!isBooting && children}
    </>
  );
}
