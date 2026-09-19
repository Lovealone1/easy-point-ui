// ─────────────────────────────────────────────────────────────────────────────
// shared/store/use-admin-auth-store.ts
//
// In-memory state for the ADMINISTRATION CONSOLE session.
//
// A second store, not a branch inside use-auth-store, for the same reason the
// console has a second Axios instance: both shells run in one SPA, and
// navigating between them would otherwise have one identity overwrite the
// other — including clearSession(), which would empty the dashboard's state
// every time someone left the console.
//
// Security model matches the dashboard's:
//   - admin_access_token / admin_refresh_token: HttpOnly, invisible to JS
//   - no localStorage, no sessionStorage, ever
//   - never an organization: the console is not a tenant. Pages that act on
//     one send x-organization-id per request.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { AuthUser, LoginUser } from '@/features/auth/types/auth.types';

interface AdminAuthState {
  /** The signed-in administrator. Null means no console session. */
  user: AuthUser | null;

  /** True while the console session is being recovered on mount. */
  isLoadingSession: boolean;

  /** True once /auth/admin/me has returned and been merged. */
  profileHydrated: boolean;

  isAuthenticated: boolean;

  setUserFromLogin: (loginUser: LoginUser) => void;

  hydrateProfile: (
    profile: Pick<AuthUser, 'firstName' | 'lastName' | 'fullName' | 'avatarUrl' | 'globalRole'>,
  ) => void;

  setLoadingSession: (loading: boolean) => void;

  /**
   * Clears console state from memory. Does NOT touch the dashboard store or
   * the dashboard's cookies — leaving the console must never sign you out of
   * your organization.
   */
  clearSession: () => void;
}

function makeBlankUser(loginUser: LoginUser): AuthUser {
  return {
    id: loginUser.id,
    email: loginUser.email,
    firstName: null,
    lastName: null,
    fullName: null,
    globalRole: null,
    orgRole: null,
    orgRoles: [],
    permissions: [],
  };
}

export const useAdminAuthStore = create<AdminAuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoadingSession: true,
  profileHydrated: false,

  setUserFromLogin: (loginUser) =>
    set({ user: makeBlankUser(loginUser), isAuthenticated: true }),

  hydrateProfile: (profile) => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, ...profile }, profileHydrated: true });
  },

  setLoadingSession: (loading) => set({ isLoadingSession: loading }),

  clearSession: () =>
    set({
      user: null,
      isAuthenticated: false,
      profileHydrated: false,
      isLoadingSession: true,
    }),
}));
