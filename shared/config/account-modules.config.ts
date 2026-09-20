// ─────────────────────────────────────────────────────────────────────────────
// shared/config/account-modules.config.ts
//
// Sidebar catalog for account settings — the third shell, after the
// organization dashboard and the personal space.
//
// Same ModuleItem shape as the other two, so Sidebar and its four children need
// no special-casing. What is settled here is that account settings is a panel
// in its own right rather than a page inside one of the other shells: these
// pages are about the person, and the same person reaches them from an
// organization, from their personal space, or from the console.
//
// Nothing is `pinned`, so SidebarFavorites renders nothing — a five-item
// settings menu has no use for favourites, and the component already returns
// null when no item matches.
// ─────────────────────────────────────────────────────────────────────────────

import type { ModuleItem } from './modules.config';

export const ACCOUNT_MODULES_CATALOG: ModuleItem[] = [
  // ── Cuenta ────────────────────────────────────────────────────────────────
  {
    id: 'account-profile',
    name: 'Perfil',
    path: '/account/profile',
    icon: 'person-rounded',
    category: 'Cuenta',
    available: true,
  },
  {
    id: 'account-email',
    name: 'Correo y acceso',
    path: '/account/email',
    icon: 'mail-rounded',
    category: 'Cuenta',
    available: true,
  },
  {
    id: 'account-sessions',
    name: 'Sesiones',
    path: '/account/sessions',
    icon: 'devices-rounded',
    category: 'Cuenta',
    available: true,
  },

  // ── Preferencias ──────────────────────────────────────────────────────────
  {
    id: 'account-appearance',
    name: 'Apariencia',
    path: '/account/appearance',
    icon: 'palette-rounded',
    category: 'Preferencias',
    available: true,
  },
  {
    id: 'account-billing',
    name: 'Facturación electrónica',
    path: '/account/billing',
    icon: 'receipt-long-rounded',
    category: 'Preferencias',
    available: true,
  },
];

export const ACCOUNT_SIDEBAR_CATEGORIES = ['Cuenta', 'Preferencias'];

export const ACCOUNT_SIDEBAR_CATALOG = {
  items: ACCOUNT_MODULES_CATALOG,
  categories: ACCOUNT_SIDEBAR_CATEGORIES,
  /** No organization owns this panel, so it carries the EasyPoint mark. */
  brand: 'app' as const,
  settingsPath: '/account/profile',
  /** These are not org-provisioned modules; filtering would hide all of them. */
  filterByOrgModules: false,
  favoritesNamespace: 'account',
  hiddenPathSegment: 'account',
};
