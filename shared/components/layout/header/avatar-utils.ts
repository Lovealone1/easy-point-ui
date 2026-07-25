import { MODULES_CATALOG } from '@/shared/config/modules.config';

/** Generates a deterministic hue from a string (used for avatar bg) */
export function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/** Returns HSL bg + text classes for the avatar based on the email */
export function getAvatarColors(email: string): { bg: string; text: string } {
  const hue = stringToHue(email);
  const saturation = 55;
  const lightness = 42;
  return {
    bg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: '#ffffff',
  };
}

/** Gets user initials from name or email */
export function getInitials(user: { firstName?: string | null; lastName?: string | null; email: string }): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName.slice(0, 2).toUpperCase();
  }
  // fallback: first 2 chars of email local part
  return user.email.split('@')[0].slice(0, 2).toUpperCase();
}

/** Maps globalRole enum to a human-readable label */
export function formatRole(role: string | null): string {
  if (!role) return 'Usuario';
  const map: Record<string, string> = {
    ADMIN: 'Administrador',
    MODERATOR: 'Moderador',
    USER: 'Usuario',
    SUPER_ADMIN: 'Super Admin',
  };
  return map[role] ?? role;
}

/** Resolves a path segment to a human-readable label */
export function segmentToLabel(segment: string): string {
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    'organization-config': 'Ajustes de Marca',
    'user-info': 'Información de Usuario',
    settings: 'Configuración',
    users: 'Usuarios',
    inventory: 'Inventario',
    sales: 'Ventas',
    reports: 'Reportes',
    products: 'Productos',
    pos: 'Punto de Venta',
    finances: 'Finanzas',
    operations: 'Operaciones',
    roles: 'Roles',
    permissions: 'Permisos',
    admin: 'Admin',
    organizations: 'Organizaciones',
    modules: 'Módulos',
    plans: 'Planes de Precios',
    subscriptions: 'Suscripciones',
    invoices: 'Facturas',
  };

  // Check if it matches a module name
  const mod = MODULES_CATALOG.find((m) => m.path === `/${segment}`);
  if (mod) return mod.name;

  return labels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}
