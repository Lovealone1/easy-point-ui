// ─────────────────────────────────────────────────────────────────────────────
// shared/hooks/use-org-membership.ts
//
// React Query wrapper around GET /auth/me that keeps the auth store in sync.
//
// Caching strategy:
//   staleTime  = 24 hours   — roles/permissions are stable configuration,
//                             not volatile session state. They change only
//                             when an admin explicitly modifies them.
//   gcTime     = 24 hours   — keep the cached data in memory the full day.
//   refetchOnWindowFocus = false — do NOT re-fetch just because the user
//                             switches tabs. The explicit invalidation is the
//                             only trigger for a re-fetch.
//
// Invalidation:
//   When an admin changes a user's role from the roles management panel,
//   call:
//     queryClient.invalidateQueries({ queryKey: orgMembershipKey() })
//   React Query will re-fetch in the background and update the store silently.
//
// This hook is intended for mounting once at the app/provider level
// (e.g. inside BrandingProvider). Individual components should use
// `usePermissions()` instead — no network, always synchronous.
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, type OrganizationConfig } from '@/shared/store/use-auth-store';
import { getMe } from '@/features/auth/services/auth.service';
import { applyBrandingToDOM } from '@/shared/components/providers/branding-provider';
import { useUiStore } from '@/shared/store/use-ui-store';

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
// Exported so the roles management panel can call invalidateQueries with it.
// ─────────────────────────────────────────────────────────────────────────────
export const orgMembershipKey = (orgId?: string) =>
  ['org-membership', orgId] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 24-hour stale time in ms
// ─────────────────────────────────────────────────────────────────────────────
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches `/auth/me` and hydrates the auth store with the user's profile,
 * org role, and granular permissions.
 *
 * Re-runs automatically when `orgId` changes (org switch).
 * Otherwise, the result is cached for 24 hours — no background polling,
 * no refetch on focus. Manual invalidation via `orgMembershipKey` is the
 * only trigger for a fresh fetch.
 *
 * @param orgId  The active organization ID. Query is disabled when null.
 */
export function useOrgMembership(orgId: string | null | undefined) {
  const {
    setUserFromLogin,
    hydrateProfile,
    setActiveOrganization,
    setOrganizationConfig,
    setLoadingSession,
  } = useAuthStore();

  const { setTheme, hasUserSetTheme } = useUiStore();

  return useQuery({
    queryKey: orgMembershipKey(orgId ?? undefined),
    queryFn: async () => {
      const data = await getMe();

      if (!data?.id) {
        throw new Error('Session not found — /auth/me returned no user');
      }

      // ── 1. Hydrate user identity ─────────────────────────────────────────
      setUserFromLogin({ id: data.id, email: data.email });
      hydrateProfile({
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        fullName:
          data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : null,
        avatarUrl: data.avatarUrl ?? undefined,
        globalRole: data.globalRole ?? null,
      });

      // ── 2. Hydrate org membership (role + permissions) ───────────────────
      const org = data.organizations?.[0] ?? null;

      if (org) {
        setActiveOrganization(
          { id: org.id, name: org.name, slug: org.slug },
          {
            orgRoles: [org.role],
            // permissions is the new field returned by the updated /auth/me
            permissions: org.permissions ?? [],
          },
        );

        // ── 3. Apply branding ──────────────────────────────────────────────
        if (org.config) {
          const config = org.config as OrganizationConfig;
          setOrganizationConfig(config);
          applyBrandingToDOM(config, setTheme, !hasUserSetTheme);
        }
      }

      setLoadingSession(false);

      return data;
    },

    // ── Cache configuration ────────────────────────────────────────────────
    staleTime: ONE_DAY_MS,        // treat data as fresh for 24 hours
    gcTime: ONE_DAY_MS,           // keep in cache for 24 hours
    refetchOnWindowFocus: false,  // no surprise refetches on tab focus
    refetchOnReconnect: false,    // no refetch on reconnect either
    retry: false,                 // don't retry on error (e.g. 401 → evict)

    // Only run when we have an active org context
    enabled: !!orgId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a callback that invalidates the org membership cache for the
 * currently active organization.
 *
 * Use this after any mutation that changes a user's role or permissions:
 *
 * ```ts
 * const invalidateMembership = useInvalidateOrgMembership();
 *
 * const mutation = useMutation({
 *   mutationFn: organizationUsersService.updateRole,
 *   onSuccess: () => invalidateMembership(),
 * });
 * ```
 */
export function useInvalidateOrgMembership() {
  const queryClient = useQueryClient();
  const activeOrg = useAuthStore((s) => s.activeOrganization);

  return () => {
    queryClient.invalidateQueries({
      queryKey: orgMembershipKey(activeOrg?.id),
    });
  };
}
