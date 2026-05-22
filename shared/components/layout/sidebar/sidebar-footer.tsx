"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { Settings, HelpCircle, Sun, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function SidebarFooter() {
  const pathname = usePathname();
  const { organizationConfig, activeOrganization } = useAuthStore();
  const { theme, toggleTheme, isSidebarCollapsed } = useUiStore();

  // Use organizationConfig as the primary source; fall back to activeOrganization
  // for name/initial while the full config is still loading.
  const orgName =
    organizationConfig?.organizationName ||
    activeOrganization?.name ||
    'Organización';
  const orgEmail = organizationConfig?.organizationEmail ?? null;
  const orgPlan = organizationConfig?.plan || 'FREE';
  const initial = orgName.charAt(0).toUpperCase();
  const isDark = theme === 'dark';

  const planBadgeClass =
    orgPlan === 'PREMIUM'
      ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      : orgPlan === 'BASIC'
        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        : 'bg-muted text-muted-foreground border-sidebar-border';

  return (
    <div className="mt-auto border-t border-sidebar-border shrink-0 p-3 space-y-3 bg-card/10">

      {/* Utilities */}
      <div className="space-y-0.5">
        <Link
          href="/organization-config"
          className={cn(
            "flex items-center text-xs font-medium rounded-lg transition-colors hover:bg-muted/50",
            isSidebarCollapsed ? "justify-center px-0 py-2.5 w-full" : "gap-3 px-3 py-2",
            pathname === '/organization-config'
              ? "bg-brand-500/10 text-brand-500 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Ajustes de Marca"
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!isSidebarCollapsed && <span className="truncate">Ajustes de Marca</span>}
        </Link>

        <Link
          href="/dashboard"
          className={cn(
            "flex items-center text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50",
            isSidebarCollapsed ? "justify-center px-0 py-2.5 w-full" : "gap-3 px-3 py-2"
          )}
          title="Soporte y Ayuda"
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          {!isSidebarCollapsed && <span className="truncate">Soporte y Ayuda</span>}
        </Link>
      </div>

      {/* Theme Switcher */}
      <div className="px-1">
        {isSidebarCollapsed ? (
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center h-8 rounded-lg bg-muted/40 hover:bg-muted border border-sidebar-border text-foreground transition-all duration-200"
            title={isDark ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        ) : (
          <div className="flex items-center p-1 rounded-lg bg-muted border border-sidebar-border">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium rounded-md transition-all",
                !isDark ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Claro</span>
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium rounded-md transition-all",
                isDark ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Oscuro</span>
            </button>
          </div>
        )}
      </div>

      {/* Organization Info Card */}
      <div className="px-1">
        {isSidebarCollapsed ? (
          /* Collapsed: just the initial avatar */
          <div
            className="w-full flex items-center justify-center h-10 rounded-xl bg-muted/30 border border-sidebar-border"
            title={`${orgName}${orgPlan ? ` · ${orgPlan}` : ''}`}
          >
            <div className="w-7 h-7 rounded-lg bg-muted border border-sidebar-border text-foreground flex items-center justify-center font-bold text-sm select-none">
              {initial}
            </div>
          </div>
        ) : (
          /* Expanded: full org card */
          <div className="p-3 rounded-xl border border-sidebar-border bg-card/40 hover:bg-card/60 transition-all duration-200 space-y-2">
            {/* Name + email row */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-muted border border-sidebar-border text-foreground flex items-center justify-center font-bold text-sm shrink-0 select-none">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-foreground truncate leading-none">
                  {orgName}
                </span>
                {orgEmail ? (
                  <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                    {orgEmail}
                  </span>
                ) : (
                  <span className="block text-[10px] text-muted-foreground/40 truncate mt-0.5 italic">
                    Sin email registrado
                  </span>
                )}
              </div>
            </div>

            {/* Plan badge */}
            <div className="flex items-center justify-between pt-1.5 border-t border-sidebar-border text-[10px] select-none">
              <span className="text-muted-foreground font-medium">Plan actual:</span>
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                planBadgeClass
              )}>
                {orgPlan === 'PREMIUM' && <Sparkles className="h-2.5 w-2.5 animate-pulse" />}
                <span>{orgPlan}</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
