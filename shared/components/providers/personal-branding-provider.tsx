'use client';

// ─────────────────────────────────────────────────────────────────────────────
// shared/components/providers/personal-branding-provider.tsx
//
// Twin of BrandingProvider for the personal space. Same job — recover the
// session, theme the DOM, gate the children behind a splash — but with three
// deliberate differences:
//
//   1. No redirectWhenNoOrg. A personal user legitimately has no organization;
//      BrandingProvider would bounce them straight to /onboarding.
//   2. Theming comes from UserPreferences, not an OrganizationConfig.
//   3. No module-access guard and no getConfig() call — both are org-scoped and
//      would 403 without an x-organization-id header.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useFavoritesStore } from '@/shared/store/use-favorites-store';
import { useSessionRecovery } from '@/shared/hooks/use-session-recovery';
import { useUserPreferences } from '@/features/user-onboarding/hooks/use-user-onboarding';
import { applyBrandingToDOM } from '@/shared/utils/apply-branding';
import EnvironmentSplash from '@/shared/components/ui/environment-splash';
import { PERSONAL_SIDEBAR_CATALOG } from '@/shared/config/personal-modules.config';

export default function PersonalBrandingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profileHydrated, isLoadingSession } = useAuthStore();
  const setTheme = useUiStore((s) => s.setTheme);
  const initForUser = useFavoritesStore((s) => s.initForUser);

  useSessionRecovery({ applyBranding: false });

  // One query covers both the onboarding gate and the theme: UserPreferences
  // carries onboardingCompleted alongside primaryColor/defaultTheme.
  const { data: preferences, isLoading: isLoadingPreferences } = useUserPreferences();

  // Favorites are namespaced per shell so org modules never surface here.
  useEffect(() => {
    if (user?.id) initForUser(user.id, PERSONAL_SIDEBAR_CATALOG.favoritesNamespace);
  }, [user?.id, initForUser]);

  // A user who has not finished the wizard has no timezone or currency yet,
  // and every total on these pages depends on both.
  useEffect(() => {
    if (preferences && !preferences.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [preferences, router]);

  useEffect(() => {
    if (!preferences) return;

    const { hasUserSetTheme } = useUiStore.getState();
    applyBrandingToDOM(
      { primaryColor: preferences.primaryColor, defaultTheme: preferences.defaultTheme },
      setTheme,
      !hasUserSetTheme
    );
  }, [preferences, setTheme]);

  const isBooting = isLoadingSession || !user || !profileHydrated || isLoadingPreferences;

  return (
    <>
      <AnimatePresence>{isBooting && <EnvironmentSplash key="environment-splash" />}</AnimatePresence>
      {!isBooting && children}
    </>
  );
}
