import type { OrganizationConfig } from '@/shared/store/use-auth-store';

export interface OrgMembershipCandidate {
  id: string;
  name: string;
  slug: string;
  role: string;
  permissions?: string[];
  config?: OrganizationConfig | null;
}

/**
 * Single point of choice for which organization becomes the active tenant
 * out of a user's memberships. Currently always the first — the extension
 * point for a future org switcher (user preference, org-in-URL, etc).
 */
export function resolveActiveOrg(
  orgs: OrgMembershipCandidate[] | null | undefined
): OrgMembershipCandidate | null {
  if (!orgs?.length) return null;
  return orgs[0];
}
