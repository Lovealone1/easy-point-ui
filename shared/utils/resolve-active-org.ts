import type { OrganizationConfig } from '@/shared/store/use-auth-store';

export interface OrgMembershipCandidate {
  id: string;
  name: string;
  slug: string;
  role: string;
  permissions?: string[];
  config?: OrganizationConfig | null;
}

/** Cookie the workspace picker writes so the choice survives a reload. */
export const ACTIVE_ORG_COOKIE = 'ep_active_org';

/**
 * Single point of choice for which organization becomes the active tenant out
 * of a user's memberships.
 *
 * `preferredId` is the workspace picker's answer, read back from a cookie —
 * the auth store holds no persisted state, so every reload re-derives the
 * active org from scratch and would otherwise snap back to the first one.
 * Falls back to the first membership when there is no preference, or when the
 * preferred organization is no longer one the user belongs to.
 */
export function resolveActiveOrg(
  orgs: OrgMembershipCandidate[] | null | undefined,
  preferredId?: string | null
): OrgMembershipCandidate | null {
  if (!orgs?.length) return null;
  if (preferredId) {
    const preferred = orgs.find((org) => org.id === preferredId);
    if (preferred) return preferred;
  }
  return orgs[0];
}

/** Reads the preferred organization id from the cookie. SSR-safe. */
export function readPreferredOrgId(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${ACTIVE_ORG_COOKIE}=`));

  return match ? decodeURIComponent(match.slice(ACTIVE_ORG_COOKIE.length + 1)) : null;
}

/** Records the workspace picker's choice for subsequent page loads. */
export function writePreferredOrgId(orgId: string): void {
  if (typeof document === 'undefined') return;
  // Not security-sensitive: the API authorizes every request against the
  // membership itself. This only remembers a UI preference.
  document.cookie = `${ACTIVE_ORG_COOKIE}=${encodeURIComponent(orgId)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
