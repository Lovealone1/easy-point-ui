'use client';

import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useAdminAuthStore } from '@/shared/store/use-admin-auth-store';
import { useAdminSession } from '@/shared/hooks/use-admin-session';
import { resetBrandingDOM } from '@/shared/utils/apply-branding';
import EnvironmentSplash from '@/shared/components/ui/environment-splash';

/**
 * Session bootstrap for the administration console.
 *
 * This used to be the entire separation between the two shells: a single
 * `delete apiClient.defaults.headers.common['x-organization-id']` on mount,
 * which BrandingProvider put straight back when the user returned to the
 * dashboard. Both shells shared one session, one store and one Axios client,
 * so the console was never more than a different set of pages.
 *
 * It is now what its name always claimed: it recovers a session of its own,
 * against its own cookies, store and client.
 */
export default function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const { user, profileHydrated, isLoadingSession } = useAdminAuthStore();

  const sessionRecovery = useAdminSession();

  // The console ignores organization branding and stays on the default
  // palette, so undo whatever the dashboard painted on the way in.
  React.useEffect(() => {
    resetBrandingDOM();
  }, []);

  const isBooting = sessionRecovery.sessionError || isLoadingSession || !user || !profileHydrated;

  return (
    <>
      <AnimatePresence>
        {isBooting && (
          <EnvironmentSplash
            {...sessionRecovery}
            key="admin-session-splash"
            label="Preparando el panel de administración"
          />
        )}
      </AnimatePresence>
      {!isBooting && children}
    </>
  );
}
