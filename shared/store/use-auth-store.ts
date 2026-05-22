// ─────────────────────────────────────────────────────────────────────────────
// shared/store/use-auth-store.ts
//
// In-memory auth state — aligned with the NestJS backend contract.
//
// Login data flow:
//   1. POST /api/auth/verify-otp  → { user: { id, email } }  → setUserFromLogin()
//   2. GET  /api/v1/users/me      → full profile              → hydrateProfile()
//   3. org selected               → org membership fetch      → setActiveOrganization()
//
// Security model:
//   - access_token: HttpOnly cookie — invisible to JS
//   - refresh_token: HttpOnly cookie — invisible to JS
//   - x-organization-id: Axios default header (in-memory), cleared on logout
//   - No localStorage, no sessionStorage, ever.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { AuthUser, ActiveOrganization, LoginUser } from '@/shared/types/auth.types';
import { apiClient } from '@/shared/services/api-client';

// ─────────────────────────────────────────────────────────────────────────────
// State & Actions
// ─────────────────────────────────────────────────────────────────────────────

export interface OrganizationConfig {
  id: string;
  organizationId: string;
  logoUrl: string | null;
  primaryColor: string | null;
  defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM';
  timezone?: string;
  currency?: string;
  language?: string;
  dateFormat?: string;
  organizationName: string;
  organizationEmail: string | null;
  plan: string;
  planActiveUntil: string | null;
  organizationIsActive: boolean;
}

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────

  /**
   * Authenticated user profile. Null means the user is not logged in.
   *
   * After login: only `id` and `email` are populated.
   * After profile hydration: `firstName`, `lastName`, `globalRole` etc. are set.
   * After org selection: `orgRoles` and `permissions` are populated.
   */
  user: AuthUser | null;

  /**
   * Active organization selected by the user.
   * Null until the user selects (or is redirected to) an org context.
   */
  activeOrganization: ActiveOrganization | null;

  /**
   * Active organization branding/visual configuration.
   */
  organizationConfig: OrganizationConfig | null;

  /**
   * Temporary email stored during the passwordless login/register flow.
   * If null, the user should not be able to access the OTP verification page.
   */
  pendingVerificationEmail: string | null;

  /**
   * Intent of the current OTP flow — 'login' or 'register'.
   * Stored so the OTP page can forward the correct intent to verify-otp.
   */
  pendingIntent: 'login' | 'register' | null;

  /**
   * Registration fields captured from the register form.
   * Stored here temporarily so the OTP page can send them to the backend
   * on successful verification (if needed by the backend), or we can
   * use them client-side after verify-otp succeeds.
   */
  pendingRegistrationData: {
    firstName: string;
    lastName: string;
    phone?: string;
  } | null;

  /**
   * True while the initial session is being validated on mount.
   * The root layout or a SessionProvider should flip this to false
   * once the /api/v1/users/me call completes (success or 401).
   */
  isLoadingSession: boolean;

  /** True once /api/v1/users/me has fetched and merged full profile data. */
  profileHydrated: boolean;

  // ── Derived ────────────────────────────────────────────────────────────────

  /** Convenience flag — true when `user` is not null. */
  isAuthenticated: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Populates the minimal user identity after a successful OTP verification.
   * Only `id` and `email` are available at this point.
   * Call `hydrateProfile` afterwards to fill in the full profile.
   */
  setUserFromLogin: (loginUser: LoginUser) => void;

  /**
   * Merges full profile data from /api/v1/users/me into the auth store.
   * Safe to call on any existing `user` object — partial update via spread.
   */
  hydrateProfile: (
    profile: Pick<
      AuthUser,
      'firstName' | 'lastName' | 'fullName' | 'avatarUrl' | 'globalRole'
    >,
  ) => void;

  /**
   * Populates org-scoped roles and permissions after the user selects an org.
   * Also sets the Axios x-organization-id default header.
   */
  setActiveOrganization: (
    org: ActiveOrganization,
    membership?: { orgRoles: string[]; permissions: string[] },
  ) => void;

  /**
   * Sets/updates the active organization configuration.
   */
  setOrganizationConfig: (config: OrganizationConfig | null) => void;

  /**
   * Clears all auth state from memory.
   * Does NOT clear the HttpOnly cookies — that is done by POST /api/auth/logout.
   * Also removes the x-organization-id Axios header.
   */
  clearSession: () => void;

  /** Sets the email waiting for OTP verification and the flow intent. */
  setPendingVerification: (
    email: string,
    intent: 'login' | 'register',
    registrationData?: { firstName: string; lastName: string; phone?: string },
  ) => void;

  /** @deprecated use setPendingVerification instead. Kept for backward compat. */
  setPendingVerificationEmail: (email: string | null) => void;

  /** Controls the loading state while validating the session on mount. */
  setLoadingSession: (loading: boolean) => void;

  /**
   * Returns true if the user has the given granular permission in the
   * active organization. Always false before org membership is loaded.
   */
  hasPermission: (permission: string) => boolean;

  /**
   * Returns true if the user has any of the given org-scoped roles.
   * Always false before org membership is loaded.
   */
  hasOrgRole: (...roles: string[]) => boolean;

  /**
   * Returns true if the user has the given global platform role.
   * Available as soon as the profile is hydrated (globalRole from JWT payload).
   */
  hasGlobalRole: (role: AuthUser['globalRole']) => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Blank user template — avoids repeated object literals
// ─────────────────────────────────────────────────────────────────────────────

function makeBlankUser(loginUser: LoginUser): AuthUser {
  return {
    id: loginUser.id,
    email: loginUser.email,
    firstName: null,
    lastName: null,
    fullName: null,
    globalRole: null,
    orgRoles: [],
    permissions: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  activeOrganization: null,
  organizationConfig: null,
  isAuthenticated: false,
  isLoadingSession: true,
  profileHydrated: false,
  pendingVerificationEmail: null,
  pendingIntent: null,
  pendingRegistrationData: null,

  // ── setUserFromLogin ────────────────────────────────────────────────────────
  setUserFromLogin: (loginUser) =>
    set({
      user: makeBlankUser(loginUser),
      isAuthenticated: true,
    }),

  // ── hydrateProfile ──────────────────────────────────────────────────────────
  hydrateProfile: (profile) => {
    const { user } = get();
    if (!user) return; // guard: must have logged in first

    set({
      user: {
        ...user,
        ...profile,
      },
      profileHydrated: true,
    });
  },

  // ── setActiveOrganization ───────────────────────────────────────────────────
  setActiveOrganization: (org, membership) => {
    // Inject the org ID into Axios so every client-side request includes it.
    // The BFF proxy forwards this header to NestJS.
    apiClient.defaults.headers.common['x-organization-id'] = org.id;

    const { user } = get();

    set({
      activeOrganization: org,
      ...(user && membership
        ? {
            user: {
              ...user,
              orgRoles: membership.orgRoles,
              permissions: membership.permissions,
            },
          }
        : {}),
    });
  },

  // ── setOrganizationConfig ───────────────────────────────────────────────────
  setOrganizationConfig: (config) => set({ organizationConfig: config }),

  // ── clearSession ────────────────────────────────────────────────────────────
  clearSession: () => {
    // Remove the org header from Axios when the user logs out.
    delete apiClient.defaults.headers.common['x-organization-id'];

    set({
      user: null,
      activeOrganization: null,
      organizationConfig: null,
      isAuthenticated: false,
      profileHydrated: false,
      pendingVerificationEmail: null,
      pendingIntent: null,
      pendingRegistrationData: null,
    });
  },

  // ── setPendingVerification ──────────────────────────────────────────────────
  setPendingVerification: (email, intent, registrationData) =>
    set({
      pendingVerificationEmail: email,
      pendingIntent: intent,
      pendingRegistrationData: registrationData ?? null,
    }),

  // ── setPendingVerificationEmail (deprecated) ───────────────────────────────
  setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),

  // ── setLoadingSession ───────────────────────────────────────────────────────
  setLoadingSession: (loading) => set({ isLoadingSession: loading }),

  // ── hasPermission ───────────────────────────────────────────────────────────
  hasPermission: (permission) => {
    const { user } = get();
    return user?.permissions.includes(permission) ?? false;
  },

  // ── hasOrgRole ──────────────────────────────────────────────────────────────
  hasOrgRole: (...roles) => {
    const { user } = get();
    return roles.some((role) => user?.orgRoles.includes(role)) ?? false;
  },

  // ── hasGlobalRole ───────────────────────────────────────────────────────────
  hasGlobalRole: (role) => {
    const { user } = get();
    return user?.globalRole === role;
  },
}));
