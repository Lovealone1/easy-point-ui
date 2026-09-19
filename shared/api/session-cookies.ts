// ─────────────────────────────────────────────────────────────────────────────
// shared/api/session-cookies.ts
//
// The two applications Easy Point serves from one deployment: the tenant
// dashboard and the administration console. They share a domain and a Next.js
// app; they do not share a session.
//
// Mirrors src/modules/auth/session.constants.ts in the API — change both.
// ─────────────────────────────────────────────────────────────────────────────

export type SessionScope = 'tenant' | 'admin';

interface SessionCookieNames {
  access: string;
  refresh: string;
}

/**
 * Both pairs sit at `Path=/` rather than `/admin`. The browser talks to the
 * BFF under `/api`, so a cookie scoped to `/admin` would never reach the
 * request that needs it. What keeps the sessions apart is the distinct names
 * here plus the scope the API bakes into each token.
 */
export const SESSION_COOKIES: Record<SessionScope, SessionCookieNames> = {
  tenant: { access: 'access_token', refresh: 'refresh_token' },
  admin: { access: 'admin_access_token', refresh: 'admin_refresh_token' },
};

/**
 * NestJS auth route prefix per application.
 */
export const NEST_AUTH_PREFIX: Record<SessionScope, string> = {
  tenant: '/api/v1/auth',
  admin: '/api/v1/auth/admin',
};

/**
 * The BFF namespace that carries each application's credential.
 *
 * This is the mechanism that decides which session a browser request uses:
 * the URL, not a mutable header on a shared client. The admin shell talks to
 * `/api/admin/...` and therefore cannot accidentally send — or be sent — the
 * dashboard's token, however the two shells interleave in one SPA session.
 */
export const BFF_API_BASE: Record<SessionScope, string> = {
  tenant: '/api/v1',
  admin: '/api/admin/v1',
};

export const BFF_AUTH_BASE: Record<SessionScope, string> = {
  tenant: '/api/auth',
  admin: '/api/admin/auth',
};

/** Cookie holding the org the workspace picker last selected. */
export const ACTIVE_ORG_COOKIE = 'ep_active_org';
