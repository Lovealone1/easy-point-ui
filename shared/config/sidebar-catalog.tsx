"use client";

// ─────────────────────────────────────────────────────────────────────────────
// shared/config/sidebar-catalog.tsx
//
// The sidebar is shared by two shells — the organization dashboard and the
// personal space — that differ only in what they list, which logo they show and
// where "Ajustes" points. Rather than prop-drill a catalog through four levels
// (Sidebar → Menu/Favorites/Header/Footer) or fork the components, each shell
// provides its catalog here and the pieces read it.
//
// Default is the organization catalog, so any component rendered outside a
// provider keeps behaving exactly as it did before.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext } from 'react';
import { ORG_SIDEBAR_CATALOG } from './modules.config';
import type { ModuleItem } from './modules.config';

export interface SidebarCatalog {
  items: ModuleItem[];
  /** Group order for the menu. Groups with no matching item are dropped. */
  categories: string[];
  /**
   * 'organization' paints the tenant's uploaded logo with an initial fallback;
   * 'app' paints the EasyPoint mark, since a personal space has no branding of
   * its own to show.
   */
  brand: 'organization' | 'app';
  /** Destination of the footer's "Ajustes" link. */
  settingsPath: string;
  /**
   * Whether to hide items the organization has not provisioned. False for the
   * personal space, whose modules are not org-provisioned at all — leaving it
   * true would hide every item, since activeModuleKeys is org-scoped.
   */
  filterByOrgModules: boolean;
  /**
   * Keeps favorites from the two shells out of each other's list. Both write to
   * localStorage under the same user id, so without this an org module could
   * show up pinned in the personal sidebar.
   */
  favoritesNamespace: string;
  /**
   * A leading path segment that groups this shell's routes but is not a page of
   * its own (the personal space lives under /personal). Breadcrumbs skip it —
   * otherwise it renders as a link to a route that does not exist.
   */
  hiddenPathSegment?: string;
}

const SidebarCatalogContext = createContext<SidebarCatalog>(ORG_SIDEBAR_CATALOG);

export function SidebarCatalogProvider({
  catalog,
  children,
}: {
  catalog: SidebarCatalog;
  children: React.ReactNode;
}) {
  return <SidebarCatalogContext.Provider value={catalog}>{children}</SidebarCatalogContext.Provider>;
}

export function useSidebarCatalog(): SidebarCatalog {
  return useContext(SidebarCatalogContext);
}
