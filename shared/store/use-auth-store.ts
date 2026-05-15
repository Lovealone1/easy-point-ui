import { create } from 'zustand';
import type { AuthUser, ActiveOrganization } from '@/shared/types/auth.types';
import { apiClient } from '@/shared/services/api-client';

// ─────────────────────────────────────────────────────────────────────────────
// State & Actions
// ─────────────────────────────────────────────────────────────────────────────

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────

  /** Authenticated user profile. Null means the user is not logged in. */
  user: AuthUser | null;

  /**
   * Active organization selected by the user.
   * A user with no organization yet will have this as null.
   */
  activeOrganization: ActiveOrganization | null;

  /** True while the initial session is being validated against the server. */
  isLoadingSession: boolean;

  // ── Derived ────────────────────────────────────────────────────────────────

  /** Convenience flag — true when user is not null. */
  isAuthenticated: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Stores the user profile in memory after a successful login or
   * session hydration. No localStorage, no cookies — tokens live in
   * the HttpOnly cookie managed by the Next.js BFF.
   */
  setUser: (user: AuthUser) => void;

  /**
   * Sets the active organization and updates the Axios default header
   * (x-organization-id) so all subsequent API calls include it automatically.
   */
  setActiveOrganization: (org: ActiveOrganization) => void;

  /**
   * Clears all auth state from memory.
   * Does NOT clear the HttpOnly cookie (that is done server-side via
   * the /api/v1/auth/logout BFF endpoint).
   */
  clearSession: () => void;

  /** Sets the loading state while validating the session on mount. */
  setLoadingSession: (loading: boolean) => void;

  /** Returns true if the user has a specific permission. */
  hasPermission: (permission: string) => boolean;

  /** Returns true if the user has any of the given roles. */
  hasRole: (...roles: string[]) => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auth Store — in-memory only.
 *
 * Security model:
 * - The access_token lives in an HttpOnly cookie → invisible to JavaScript.
 * - The x-organization-id is set as a default Axios header (in memory) when
 *   the user selects an organization. It is never persisted to localStorage.
 * - On a hard refresh, the session is re-hydrated from the server using the
 *   cookie (which the browser sends automatically to Next.js BFF routes).
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  activeOrganization: null,
  isAuthenticated: false,
  isLoadingSession: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
    }),

  setActiveOrganization: (org) => {
    // Inject the org ID into Axios so every client-side request includes it.
    // The BFF proxy will forward this header to NestJS.
    apiClient.defaults.headers.common['x-organization-id'] = org.id;

    set({ activeOrganization: org });
  },

  clearSession: () => {
    // Remove the org header from Axios when the user logs out.
    delete apiClient.defaults.headers.common['x-organization-id'];

    set({
      user: null,
      activeOrganization: null,
      isAuthenticated: false,
    });
  },

  setLoadingSession: (loading) => set({ isLoadingSession: loading }),

  hasPermission: (permission) => {
    const { user } = get();
    return user?.permissions.includes(permission) ?? false;
  },

  hasRole: (...roles) => {
    const { user } = get();
    return roles.some((role) => user?.roles.includes(role)) ?? false;
  },
}));
