// ─────────────────────────────────────────────────────────────────────────────
// shared/hooks/use-permissions.ts
//
// Primary interface for access control in the frontend.
//
// Design principles:
//   - ZERO network calls — reads exclusively from the Zustand auth store.
//   - Data is hydrated once on app mount via BrandingProvider → /auth/me.
//   - staleTime on the backing query is 24h, so permissions are treated as
//     stable config, not volatile session data.
//   - When roles/permissions change (e.g. admin updates a user's role), the
//     roles panel invalidates the React Query cache, triggering a silent
//     background refresh that updates the store automatically.
//
// Usage:
//   const { can, isOwner, orgRole } = usePermissions();
//   if (!can('sales:create')) return <AccessDenied />;
// ─────────────────────────────────────────────────────────────────────────────
import { useAuthStore } from '@/shared/store/use-auth-store';

// ─────────────────────────────────────────────────────────────────────────────
// Role hierarchy constants
// Mirrors the backend role-hierarchy.helper.ts
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_ROLES = {
  OWNER: 'OWNER',
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

const GLOBAL_ROLES = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Return type
// ─────────────────────────────────────────────────────────────────────────────
export interface UsePermissionsReturn {
  /**
   * The active org role name.
   * e.g. 'OWNER' | 'ADMINISTRATOR' | 'CAJERO' | null
   * Null when no organization is active yet.
   */
  orgRole: string | null;

  /** True when the user's org role is 'OWNER'. */
  isOwner: boolean;

  /** True when the user's org role is 'ADMINISTRATOR'. */
  isAdmin: boolean;

  /**
   * True when the user's org role is either 'OWNER' or 'ADMINISTRATOR'.
   * Useful for rendering management-level UI without checking both.
   */
  isManagement: boolean;

  /** True when globalRole === 'ADMIN' — bypasses all org-level restrictions. */
  isSuperAdmin: boolean;

  /** True when globalRole === 'MODERATOR'. */
  isModerator: boolean;

  /** The global platform role. */
  globalRole: 'ADMIN' | 'MODERATOR' | 'USER' | null;

  /** Full list of permission keys for the active org role. */
  permissions: string[];

  /**
   * Returns true if the user has the given granular permission.
   *
   * ADMIN global role always returns true (bypass).
   * OWNER and ADMINISTRATOR org roles always return true (full org access).
   *
   * @example
   *   can('sales:create')
   *   can('employees:view_salary')
   */
  can: (permission: string) => boolean;

  /**
   * Returns true if the user has ANY of the given permissions.
   *
   * @example
   *   canAny('sales:create', 'sales:read')
   */
  canAny: (...permissions: string[]) => boolean;

  /**
   * Returns true if the user has ALL of the given permissions.
   *
   * @example
   *   canAll('sales:create', 'sales:void')
   */
  canAll: (...permissions: string[]) => boolean;

  /**
   * Returns true if the user has the given org-scoped role.
   * Prefer using `can()` for granular checks; use this only when you need
   * to gate UI on the role label itself (e.g. showing a "role" badge).
   */
  hasRole: (role: string) => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for reading the current user's roles and permissions.
 *
 * Consumes the Zustand auth store — no fetch, no async, always synchronous.
 * Safe to call in any client component without worrying about waterfalls.
 */
export function usePermissions(): UsePermissionsReturn {
  const user = useAuthStore((s) => s.user);

  const orgRole = user?.orgRole ?? null;
  const globalRole = user?.globalRole ?? null;
  const permissions = user?.permissions ?? [];

  // ── Derived role flags ───────────────────────────────────────────────────
  const isSuperAdmin = globalRole === GLOBAL_ROLES.ADMIN;
  const isModerator = globalRole === GLOBAL_ROLES.MODERATOR;
  const isOwner = orgRole === SYSTEM_ROLES.OWNER;
  const isAdmin = orgRole === SYSTEM_ROLES.ADMINISTRATOR;

  /**
   * Full org access is granted to:
   *   1. Global ADMIN (platform superadmin, bypass everything)
   *   2. OWNER of the organization
   *   3. ADMINISTRATOR of the organization
   */
  const hasFullOrgAccess = isSuperAdmin || isOwner || isAdmin;

  // ── Permission checkers ──────────────────────────────────────────────────

  function can(permission: string): boolean {
    if (hasFullOrgAccess) return true;
    return permissions.includes(permission);
  }

  function canAny(...perms: string[]): boolean {
    if (hasFullOrgAccess) return true;
    return perms.some((p) => permissions.includes(p));
  }

  function canAll(...perms: string[]): boolean {
    if (hasFullOrgAccess) return true;
    return perms.every((p) => permissions.includes(p));
  }

  function hasRole(role: string): boolean {
    return orgRole === role;
  }

  return {
    orgRole,
    isOwner,
    isAdmin,
    isManagement: isOwner || isAdmin,
    isSuperAdmin,
    isModerator,
    globalRole,
    permissions,
    can,
    canAny,
    canAll,
    hasRole,
  };
}
