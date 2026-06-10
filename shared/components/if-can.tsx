// ─────────────────────────────────────────────────────────────────────────────
// shared/components/if-can.tsx
//
// Declarative permission gate component.
//
// Renders children only when the current user has the required permission(s).
// Falls back to `fallback` (default: null) when access is denied.
//
// Usage:
//   <IfCan permission="sales:create">
//     <Button>Nueva venta</Button>
//   </IfCan>
//
//   <IfCan permission="employees:delete" fallback={<p>Sin acceso</p>}>
//     <DeleteButton />
//   </IfCan>
//
//   <IfCan anyOf={['sales:create', 'sales:read']}>
//     <SalesPanel />
//   </IfCan>
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { usePermissions } from '@/shared/hooks/use-permissions';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface IfCanBaseProps {
  children: React.ReactNode;
  /** Rendered when the user does not have access. Defaults to null. */
  fallback?: React.ReactNode;
}

interface IfCanSingleProps extends IfCanBaseProps {
  /** Require exactly this one permission. */
  permission: string;
  anyOf?: never;
  allOf?: never;
}

interface IfCanAnyProps extends IfCanBaseProps {
  permission?: never;
  /** Require at least one of these permissions. */
  anyOf: string[];
  allOf?: never;
}

interface IfCanAllProps extends IfCanBaseProps {
  permission?: never;
  anyOf?: never;
  /** Require all of these permissions. */
  allOf: string[];
}

type IfCanProps = IfCanSingleProps | IfCanAnyProps | IfCanAllProps;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders `children` when the current user has the required permission(s).
 * Uses `usePermissions()` internally — zero network calls.
 */
export function IfCan({ children, fallback = null, ...props }: IfCanProps) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = false;

  if ('permission' in props && props.permission) {
    allowed = can(props.permission);
  } else if ('anyOf' in props && props.anyOf) {
    allowed = canAny(...props.anyOf);
  } else if ('allOf' in props && props.allOf) {
    allowed = canAll(...props.allOf);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
