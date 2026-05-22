"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/shared/store/use-ui-store';
import { MODULES_CATALOG, type ModuleItem } from '@/shared/config/modules.config';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { cn } from '@/shared/lib/utils';

interface SidebarFavoritesProps {
  searchQuery: string;
}

/**
 * SidebarFavorites component
 * Renders pinned modules (like the Dashboard) and future dynamic user favorites.
 * Up to 5 favorites total are supported (1 pinned + 4 user-customizable).
 */
export default function SidebarFavorites({ searchQuery }: SidebarFavoritesProps) {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useUiStore();

  // 1. Get pinned favorites from the modules configuration
  const pinnedFavorites = MODULES_CATALOG.filter((mod) => mod.pinned);

  // 2. Placeholder for dynamic user-added favorites (stored in state/localStorage later).
  // Currently empty, but can accommodate up to 4 additional items.
  const dynamicFavorites: ModuleItem[] = [];

  // Combine pinned and dynamic favorites, ensuring a maximum of 5 items
  const allFavorites = [...pinnedFavorites, ...dynamicFavorites].slice(0, 5);

  // Filter based on active search query
  const filteredFavorites = allFavorites.filter((mod) =>
    mod.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If no favorites match the search criteria, do not render the section
  if (filteredFavorites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {/* Favorites Section Header — hidden when sidebar is collapsed */}
      {!isSidebarCollapsed && (
        <span className="text-[10px] font-bold text-brand-200 uppercase tracking-wider px-3 select-none">
          Favoritos
        </span>
      )}

      {/* Favorites List */}
      <div className="space-y-0.5">
        {filteredFavorites.map((mod) => {
          const isActive = pathname === mod.path;

          return (
            <div
              key={`fav-${mod.id}`}
              className={cn(
                "group relative flex items-center rounded-lg transition-colors hover:bg-muted/50",
                isSidebarCollapsed ? "justify-center" : "justify-between"
              )}
            >
              <Link
                href={mod.path}
                className={cn(
                  "flex items-center text-xs font-medium rounded-lg transition-colors",
                  isSidebarCollapsed
                    ? "justify-center px-0 py-2.5 w-full"
                    : "gap-3 px-3 py-2 flex-1 min-w-0",
                  isActive
                    ? "bg-brand-500/10 text-brand-500 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isSidebarCollapsed ? mod.name : undefined}
              >
                <AppIcon
                  name={mod.icon}
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-brand-500" : "text-brand-400 group-hover:text-brand-500"
                  )}
                />
                
                {!isSidebarCollapsed && (
                  <span className="truncate animate-fade-in">{mod.name}</span>
                )}

                {/* Pin indicator on pinned favorites (always shown for Dashboard, non-removable) */}
                {!isSidebarCollapsed && mod.pinned && (
                  <AppIcon
                    name="keep-rounded"
                    className="ml-auto h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0"
                  />
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
