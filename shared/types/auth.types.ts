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
   * Values: 'SUPER_ADMIN' | 'USER' (from GlobalRole enum in Prisma)
   */
  globalRole: 'ADMIN' | 'MODERATOR' | 'USER' | null;
  /**
   * Org-scoped roles — populated after the user selects an organization.
   * Empty until setActiveOrganization is called and org data is fetched.
   */
  orgRoles: string[];
  /**
   * Granular permissions for the active organization.
   * Empty until org membership data is fetched.
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
