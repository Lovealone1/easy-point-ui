'use client';

import React, { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useSessionRecovery } from '@/shared/hooks/use-session-recovery';
import { resetBrandingDOM } from '@/shared/utils/apply-branding';
import { apiClient } from '@/shared/services/api-client';
import EnvironmentSplash from '@/shared/components/ui/environment-splash';

/**
 * Session bootstrap for the admin shell — authenticates the same way as
 * the dashboard's BrandingProvider, but never applies org branding and
 * never carries the tenant's x-organization-id header into admin requests
 * (see shared/store/use-auth-store.ts for what that header controls).
 */
export default function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const { user, profileHydrated, isLoadingSession } = useAuthStore();

  useSessionRecovery({ applyBranding: false });

  useEffect(() => {
    resetBrandingDOM();
    delete apiClient.defaults.headers.common['x-organization-id'];
  }, []);

  const isBooting = isLoadingSession || !user || !profileHydrated;

  return (
    <>
      <AnimatePresence>
        {isBooting && (
          <EnvironmentSplash key="admin-session-splash" label="Preparando el panel de administración" />
        )}
      </AnimatePresence>
      {!isBooting && children}
    </>
  );
}
