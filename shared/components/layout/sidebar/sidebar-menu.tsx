"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/shared/store/use-ui-store';
import { MODULES_CATALOG, type ModuleItem } from '@/shared/config/modules.config';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { cn } from '@/shared/lib/utils';

interface SidebarMenuProps {
  searchQuery: string;
}

type CategoryType = ModuleItem['category'];

const CATEGORIES: CategoryType[] = ['Ventas', 'Inventario', 'Operaciones', 'Finanzas', 'Administración'];

export default function SidebarMenu({ searchQuery }: SidebarMenuProps) {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useUiStore();

  // Filter catalog based on search query
  const filteredCatalog = MODULES_CATALOG.filter((mod) =>
    mod.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredCatalog.length === 0) {
    return (
      <div className="px-6 py-4 text-center text-xs text-muted-foreground">
        No se encontraron módulos
      </div>
    );
  }

  // Group modules by category
  const groupedModules = CATEGORIES.reduce((acc, cat) => {
    const mods = filteredCatalog.filter((m) => m.category === cat);
    if (mods.length > 0) {
      acc[cat] = mods;
    }
    return acc;
  }, {} as Record<CategoryType, ModuleItem[]>);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-4">
      {CATEGORIES.map((cat) => {
        const mods = groupedModules[cat];
        if (!mods) return null;

        return (
          <div key={`cat-${cat}`} className="space-y-1">
            {/* Category header — hidden when collapsed */}
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 select-none">
                {cat}
              </span>
            )}

            {/* Modules list */}
            <div className="space-y-0.5">
              {mods.map((mod) => {
                const isActive = pathname === mod.path;

                if (!mod.available) {
                  // Disabled / coming-soon state
                  return (
                    <div
                      key={`menu-${mod.id}`}
                      className={cn(
                        "group relative flex items-center rounded-lg",
                        isSidebarCollapsed ? "justify-center" : ""
                      )}
                      title={isSidebarCollapsed ? `${mod.name} (Próximamente)` : undefined}
                    >
                      <div
                        className={cn(
                          "flex items-center text-xs font-medium rounded-lg cursor-not-allowed opacity-40",
                          isSidebarCollapsed
                            ? "justify-center px-0 py-2.5 w-full"
                            : "gap-3 px-3 py-2 flex-1 min-w-0",
                          "text-muted-foreground"
                        )}
                      >
                        <AppIcon
                          name={mod.icon}
                          className="h-4 w-4 shrink-0"
                        />
                        {!isSidebarCollapsed && (
                          <span className="truncate flex-1">{mod.name}</span>
                        )}
                        {!isSidebarCollapsed && (
                          <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded-full border border-border/30 shrink-0">
                            Pronto
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // Available module
                return (
                  <div
                    key={`menu-${mod.id}`}
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
                          isActive ? "text-brand-500" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!isSidebarCollapsed && (
                        <span className="truncate animate-fade-in">{mod.name}</span>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
