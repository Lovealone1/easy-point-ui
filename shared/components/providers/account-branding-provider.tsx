'use client';

// ─────────────────────────────────────────────────────────────────────────────
// shared/components/providers/account-branding-provider.tsx
//
// Gate for the account-settings shell. Closest to PersonalBrandingProvider —
// recover the session, theme the DOM from UserPreferences, hold the children
// behind a splash — with the two redirects removed, and that removal is the
// whole reason this file exists rather than reusing one of the others:
//
//   1. BrandingProvider bounces a user with no organization to /onboarding.
//      Account settings must be reachable by a personal-space user, who
//      legitimately has none.
//   2. PersonalBrandingProvider bounces anyone whose personal onboarding is
//      unfinished, also to /onboarding. An organization user has usually never
//      started that wizard, so opening their own profile would throw them into
//      a personal-space setup they never asked for.
//
// Nothing here is org-scoped, so there is no getConfig() call and no module
// guard — both would 403 without an x-organization-id header.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useFavoritesStore } from '@/shared/store/use-favorites-store';
import { useSessionRecovery } from '@/shared/hooks/use-session-recovery';
import { useUserPreferences } from '@/features/user-onboarding/hooks/use-user-onboarding';
import { applyBrandingToDOM } from '@/shared/utils/apply-branding';
import EnvironmentSplash from '@/shared/components/ui/environment-splash';
import { ACCOUNT_SIDEBAR_CATALOG } from '@/shared/config/account-modules.config';

export default function AccountBrandingProvider({ children }: { children: React.ReactNode }) {
  const { user, profileHydrated, isLoadingSession } = useAuthStore();
  const setTheme = useUiStore((s) => s.setTheme);
  const initForUser = useFavoritesStore((s) => s.initForUser);

  const sessionRecovery = useSessionRecovery({ applyBranding: false });

  const { data: preferences, isLoading: isLoadingPreferences } = useUserPreferences();

  useEffect(() => {
    if (user?.id) initForUser(user.id, ACCOUNT_SIDEBAR_CATALOG.favoritesNamespace);
  }, [user?.id, initForUser]);

  // The colour and theme a person picks in /account/appearance are the ones
  // this panel is painted with, so it themes itself from the same source.
  useEffect(() => {
    if (!preferences) return;

    const { hasUserSetTheme } = useUiStore.getState();
    applyBrandingToDOM(
      { primaryColor: preferences.primaryColor, defaultTheme: preferences.defaultTheme },
      setTheme,
      !hasUserSetTheme
    );
  }, [preferences, setTheme]);

  const isBooting =
    sessionRecovery.sessionError ||
    isLoadingSession ||
    !user ||
    !profileHydrated ||
    isLoadingPreferences;

  return (
    <>
      <AnimatePresence>
        {isBooting && <EnvironmentSplash {...sessionRecovery} key="environment-splash" />}
      </AnimatePresence>
      {!isBooting && children}
    </>
  );
}
