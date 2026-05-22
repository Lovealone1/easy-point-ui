// ─────────────────────────────────────────────────────────────────────────────
// shared/config/modules.config.ts
//
// Single source of truth for the sidebar module catalog.
//
// `available: true`  → route exists, link is fully interactive.
// `available: false` → coming soon; rendered as disabled/muted in the sidebar.
// ─────────────────────────────────────────────────────────────────────────────

export interface ModuleItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  category: 'Ventas' | 'Inventario' | 'Operaciones' | 'Finanzas' | 'Administración';
  /** Whether this module has a real page behind it. Unavailable modules are
   *  rendered as disabled items with a "Próximamente" badge. */
  available: boolean;
}

export const MODULES_CATALOG: ModuleItem[] = [
  // ── Ventas y POS ──────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard-rounded',
    category: 'Ventas',
    available: true,
  }
];
