'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useFavoritesStore } from '@/shared/store/use-favorites-store';
import { getMe } from '@/features/auth/services/auth.service';
import { resolveActiveOrg } from '@/shared/utils/resolve-active-org';
import { applyBrandingToDOM, forceLogout } from '@/shared/utils/apply-branding';

// Hold the splash visible long enough for the org brand color swap
// (see .brand-fade in globals.css, 700ms) to be perceptible.
const BRAND_REVEAL_HOLD_MS = 900;

interface UseSessionRecoveryOptions {
  /** Whether to apply org branding (colors/theme) to the DOM once the
   *  session resolves. Dashboard: true. Admin: false — the admin shell
   *  ignores org branding entirely and stays on the default palette. */
  applyBranding: boolean;
}

/**
 * Bootstraps the session on mount: recovers the user + active organization
 * from `/auth/me`, and tears the session down on 401. Shared by the
 * dashboard and admin shells so both authenticate the same way.
 */
export function useSessionRecovery({ applyBranding }: UseSessionRecoveryOptions): void {
  const {
    user,
    profileHydrated,
    setUserFromLogin,
    hydrateProfile,
    setActiveOrganization,
    setOrganizationConfig,
    setLoadingSession,
    clearSession,
  } = useAuthStore();
  const setTheme = useUiStore((s) => s.setTheme);
  const clearForUser = useFavoritesStore((s) => s.clearForUser);

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

          const activeOrg = resolveActiveOrg(data.organizations);
          if (activeOrg) {
            setActiveOrganization(
              { id: activeOrg.id, name: activeOrg.name, slug: activeOrg.slug },
              { orgRoles: [activeOrg.role], permissions: activeOrg.permissions ?? [] }
            );
            if (activeOrg.config) {
              setOrganizationConfig(activeOrg.config);
              if (applyBranding) {
                applyBrandingToDOM(activeOrg.config, setTheme);
                await new Promise((resolve) => setTimeout(resolve, BRAND_REVEAL_HOLD_MS));
              }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
