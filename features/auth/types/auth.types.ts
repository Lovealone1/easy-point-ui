// ─────────────────────────────────────────────────────────────────────────────
// shared/types/auth.types.ts
//
// These types are shaped by what NestJS actually returns.
//
// Login flow response (POST /auth/otp/verify):
//   { message, user: { id, email } }
//   → no roles/permissions yet — those come after selecting an org
//
// Full profile (/api/v1/users/me — future):
//   { id, email, firstName, lastName, globalRole, ... }
//
// Org membership (/api/v1/organizations/:id/me — future):
//   { roles: string[], permissions: string[] }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimum user data returned by POST /auth/otp/verify.
 * Extended progressively as more profile endpoints are called.
 *
 * The access_token is NEVER stored here — it lives in an HttpOnly cookie
 * managed exclusively by the Next.js BFF server.
 */
export interface AuthUser {
  id: string;
  email: string;
  /** Populated after calling /api/v1/users/me — null until hydrated */
  firstName: string | null;
  lastName: string | null;
  /** Computed display name — null until profile is hydrated */
  fullName: string | null;
  avatarUrl?: string;
  /**
   * Global platform role returned by NestJS JWT payload.
   * Values: 'ADMIN' | 'MODERATOR' | 'USER' (from GlobalRole enum in Prisma)
   */
  globalRole: 'ADMIN' | 'MODERATOR' | 'USER' | null;
  /**
   * Active org-scoped role name — populated after the user selects an organization.
   * e.g. 'OWNER' | 'ADMINISTRATOR' | 'CAJERO' | ...
   * Null until setActiveOrganization is called.
   */
  orgRole: string | null;
  /**
   * Org-scoped roles — kept as array to leave the door open for multi-role
   * support in the future. For now always contains at most one entry.
   * Empty until setActiveOrganization is called and org data is fetched.
   */
  orgRoles: string[];
  /**
   * Granular permission keys for the active organization role.
   * e.g. ['sales:create', 'inventory:read', 'employees:view_salary']
   * Empty until org membership data is fetched from /auth/me.
   */
  permissions: string[];
}

/**
 * Active organization context.
 * The org ID is sent as the x-organization-id header by the Axios client
 * on every request. It is stored in memory only (not in cookies or localStorage).
 */
export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  logoShortUrl?: string;
  /** Primary brand color hex sent from the server (e.g. "#571777") */
  primaryColor?: string;
}

/** Application-level UI preferences (per session, not persisted). */
export type ThemeMode = 'light' | 'dark';

/**
 * Minimal user shape returned by the BFF verify-otp route.
 * Used to initialise the auth store after login — before full profile hydration.
 */
export interface LoginUser {
  id: string;
  email: string;
}
