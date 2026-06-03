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
  category: 'Comercial' | 'Productos' | 'Insumos' | 'Operaciones' | 'Finanzas' | 'Administración' | 'General';
  /** Whether this module has a real page behind it. Unavailable modules are
   *  rendered as disabled items with a "Próximamente" badge. */
  available: boolean;
  pinned?: boolean;
}

export const MODULES_CATALOG: ModuleItem[] = [
  // ── Pinned & Dashboard ────────────────────────────────────────────────────
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard-rounded',
    category: 'General',
    available: true,
    pinned: true,
  },

  // ── Comercial ─────────────────────────────────────────────────────────────
  {
    id: 'clients',
    name: 'Clientes',
    path: '/clients',
    icon: 'group-rounded',
    category: 'Comercial',
    available: true,
  },
  {
    id: 'discount-rules',
    name: 'Reglas de Descuento',

    path: '/discount-rules',
    icon: 'percent-discount-rounded',
    category: 'Comercial',
    available: true,
  },
  {
    id: 'sales',
    name: 'Ventas',
    path: '/sales',
    icon: 'point-of-sale-rounded',
    category: 'Comercial',
    available: true,
  },

  // ── Productos ─────────────────────────────────────────────────────────────
  {
    id: 'inventory-movements',
    name: 'Movimientos de Inventario',
    path: '/inventory-movements',
    icon: 'sync-alt-rounded',
    category: 'Productos',
    available: true,
  },
  {
    id: 'product-categories',
    name: 'Categorías de Productos',
    path: '/product-categories',
    icon: 'category-rounded',
    category: 'Productos',
    available: true,
  },
  {
    id: 'product-purchases',
    name: 'Compras de Productos',
    path: '/product-purchases',
    icon: 'shopping-cart-rounded',
    category: 'Productos',
    available: true,
  },
  {
    id: 'product-stocks',
    name: 'Stock de Productos',
    path: '/product-stocks',
    icon: 'inventory-2-rounded',
    category: 'Productos',
    available: true,
  },
  {
    id: 'products',
    name: 'Productos',
    path: '/products',
    icon: 'inventory-rounded',
    category: 'Productos',
    available: true,
  },
  {
    id: 'suppliers',
    name: 'Proveedores',
    path: '/suppliers',
    icon: 'local-shipping-rounded',
    category: 'Productos',
    available: true,
  },

  // ── Insumos ───────────────────────────────────────────────────────────────
  {
    id: 'supplies',
    name: 'Insumos',
    path: '/supplies',
    icon: 'kitchen-rounded',
    category: 'Insumos',
    available: true,
  },
  {
    id: 'supply-movements',
    name: 'Movimientos de Insumos',
    path: '/supply-movements',
    icon: 'swap-horiz-rounded',
    category: 'Insumos',
    available: true,
  },
  {
    id: 'supply-purchases',
    name: 'Compras de Insumos',
    path: '/supply-purchases',
    icon: 'shopping-bag',
    category: 'Insumos',
    available: true,
  },
  {
    id: 'supply-stocks',
    name: 'Stock de Insumos',
    path: '/supply-stocks',
    icon: 'shelves-rounded',
    category: 'Insumos',
    available: true,
  },


  // ── Operaciones ───────────────────────────────────────────────────────────
  {
    id: 'productions',
    name: 'Producciones',
    path: '/productions',
    icon: 'factory-rounded',
    category: 'Operaciones',
    available: true,
  },
  {
    id: 'recipes',
    name: 'Recetas',
    path: '/recipes',
    icon: 'menu-book-rounded',
    category: 'Operaciones',
    available: true,
  },

  // ── Finanzas ──────────────────────────────────────────────────────────────
  {
    id: 'bank-accounts',
    name: 'Cuentas Bancarias',
    path: '/bank-accounts',
    icon: 'account-balance-rounded',
    category: 'Finanzas',
    available: true,
  },
  {
    id: 'financial-transactions',
    name: 'Transacciones Financieras',
    path: '/financial-transactions',
    icon: 'receipt-long-rounded',
    category: 'Finanzas',
    available: true,
  },
  {
    id: 'transaction-categories',
    name: 'Categorías de Transacciones',
    path: '/transaction-categories',
    icon: 'category-rounded',
    category: 'Finanzas',
    available: true,
  },
  {
    id: 'utilities',
    name: 'Utilidades',
    path: '/utilities',
    icon: 'trending-up-rounded',
    category: 'Finanzas',
    available: true,
  },

  // ── Administración ────────────────────────────────────────────────────────
  {
    id: 'employees',
    name: 'Empleados',
    path: '/employees',
    icon: 'badge-rounded',
    category: 'Administración',
    available: true,
  },
  {
    id: 'invitations',
    name: 'Invitaciones',
    path: '/invitations',
    icon: 'mail-rounded',
    category: 'Administración',
    available: true,
  },
  {
    id: 'organization',
    name: 'Organización',
    path: '/organization',
    icon: 'domain-rounded',
    category: 'Administración',
    available: true,
  },
  {
    id: 'organization-users',
    name: 'Usuarios de Organización',
    path: '/organization-users',
    icon: 'manage-accounts-rounded',
    category: 'Administración',
    available: true,
  },
  {
    id: 'roles',
    name: 'Roles',
    path: '/roles',
    icon: 'admin-panel-settings-rounded',
    category: 'Administración',
    available: true,
  }
];
