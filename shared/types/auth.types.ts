
/**
 * Authenticated user profile.
 * The access_token is NEVER stored here — it lives in an HttpOnly cookie
 * managed exclusively by the Next.js BFF server.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  /** Roles within the active organization (dynamic, from DB) */
  roles: string[];
  /** Granular permissions assigned to the user */
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
