// ─────────────────────────────────────────────────────────────────────────────
// shared/config/personal-modules.config.ts
//
// Sidebar catalog for the personal space. Same ModuleItem shape as the
// organization catalog so the sidebar components need no special-casing — only
// the contents, the group order and the logo differ.
//
// These modules are not org-provisioned, so nothing filters them by
// activeModuleKeys (see SidebarCatalog.filterByOrgModules).
// ─────────────────────────────────────────────────────────────────────────────

import type { ModuleItem } from './modules.config';

export const PERSONAL_MODULES_CATALOG: ModuleItem[] = [
  {
    id: 'personal-dashboard',
    name: 'Dashboard',
    path: '/personal/dashboard',
    icon: 'dashboard-rounded',
    category: 'General',
    available: true,
    pinned: true,
  },

  // ── Suscripciones ─────────────────────────────────────────────────────────
  {
    id: 'personal-subscriptions',
    name: 'Suscripciones',
    path: '/personal/subscriptions',
    icon: 'subscriptions-rounded',
    category: 'Suscripciones',
    available: true,
  },
  {
    id: 'personal-categories',
    name: 'Categorías',
    path: '/personal/categories',
    icon: 'category-rounded',
    category: 'Suscripciones',
    available: true,
  },
  {
    id: 'personal-payment-methods',
    name: 'Métodos de pago',
    path: '/personal/payment-methods',
    icon: 'credit-card-rounded',
    category: 'Suscripciones',
    available: true,
  },

  // ── Configuración ─────────────────────────────────────────────────────────
  {
    id: 'personal-appearance',
    name: 'Personalización',
    path: '/personal/appearance',
    icon: 'palette-rounded',
    category: 'Configuración',
    available: true,
  },
  {
    id: 'personal-settings',
    name: 'Preferencias',
    path: '/personal/settings',
    icon: 'tune-rounded',
    category: 'Configuración',
    available: true,
  },
];

/** 'General' is absent: Dashboard is pinned and rendered by Favorites. */
export const PERSONAL_SIDEBAR_CATEGORIES = ['Suscripciones', 'Configuración'];

export const PERSONAL_SIDEBAR_CATALOG = {
  items: PERSONAL_MODULES_CATALOG,
  categories: PERSONAL_SIDEBAR_CATEGORIES,
  brand: 'app' as const,
  settingsPath: '/personal/settings',
  filterByOrgModules: false,
  favoritesNamespace: 'personal',
  hiddenPathSegment: 'personal',
};
