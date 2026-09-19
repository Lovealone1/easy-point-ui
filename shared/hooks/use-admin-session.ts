'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/shared/store/use-admin-auth-store';
import { getAdminMe } from '@/features/auth/services/admin-auth.service';
import { ADMIN_UNAUTHORIZED_EVENT } from '@/shared/services/admin-api-client';
import { isSessionUnauthorized } from '@/shared/api/session-error';

/**
 * Bootstraps the console session on mount.
 *
 * Much simpler than the dashboard's useSessionRecovery, and deliberately so:
 * there is no organization to resolve, no branding to apply and no
 * subscription to check. The console is not a tenant.
 *
 * On 401 it sends the operator to /admin/login rather than /auth — losing the
 * console session says nothing about their dashboard session, which stays
 * signed in.
 */
export function useAdminSession() {
  const [sessionError, setSessionError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();

  const { user, profileHydrated, setUserFromLogin, hydrateProfile, setLoadingSession, clearSession } =
    useAdminAuthStore();

  useEffect(() => {
    function handleUnauthorized() {
      clearSession();
      router.replace('/admin/login');
    }

    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearSession, router]);

  useEffect(() => {
    let cancelled = false;

    async function recover() {
      setSessionError(false);
      setLoadingSession(true);

      if (user && profileHydrated) {
        setLoadingSession(false);
        return;
      }

      try {
        const data = await getAdminMe();
        if (cancelled) return;

        if (!data?.id) {
          clearSession();
          router.replace('/admin/login');
          return;
        }

        setUserFromLogin({ id: data.id, email: data.email });
        hydrateProfile({
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          fullName: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null,
          avatarUrl: undefined,
          globalRole: data.globalRole || null,
        });
      } catch (error) {
        if (cancelled) return;

        // A transient failure keeps the splash up with a retry; only a genuine
        // 401 sends them back to the console sign-in.
        if (!isSessionUnauthorized(error)) {
          console.error('Admin session recovery failed unexpectedly:', error);
          setSessionError(true);
          return;
        }

        clearSession();
        router.replace('/admin/login');
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    }

    recover();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return { sessionError, retrySession: () => setAttempt((value) => value + 1) };
}
