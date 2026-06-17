"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { cn } from '@/shared/lib/utils';
import {
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { logout } from '@/features/auth/services/auth.service';
import { useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, clearSession } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const isDark = theme === 'dark';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      /* ignore */
    } finally {
      clearSession();
      router.replace('/auth');
    }
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full flex-shrink-0">
      {/* Header */}
      <div className="flex items-center h-16 border-b border-sidebar-border shrink-0 px-6 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center font-bold">
          EP
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-foreground leading-none">EasyPoint Admin</span>
          <span className="text-[10px] text-brand-500 font-semibold tracking-wider uppercase mt-0.5">Control Global</span>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-brand-200 uppercase tracking-wider px-3 select-none">
            Módulos
          </span>

          <div className="space-y-0.5">
            <Link
              href="/admin/organizations"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors border-l-[3px]",
                pathname === '/admin/organizations'
                  ? "bg-brand-500/10 text-brand-500 border-brand-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
              )}
            >
              <AppIcon
                name="domain-rounded"
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  pathname === '/admin/organizations' ? "text-brand-500" : "text-brand-400"
                )}
              />
              <span className="truncate">Organizaciones</span>
            </Link>

            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors border-l-[3px]",
                pathname === '/admin/users'
                  ? "bg-brand-500/10 text-brand-500 border-brand-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
              )}
            >
              <AppIcon
                name="manage-accounts-rounded"
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  pathname === '/admin/users' ? "text-brand-500" : "text-brand-400"
                )}
              />
              <span className="truncate">Usuarios</span>
            </Link>

            <Link
              href="/admin/organization-users"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors border-l-[3px]",
                pathname === '/admin/organization-users'
                  ? "bg-brand-500/10 text-brand-500 border-brand-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
              )}
            >
              <AppIcon
                name="groups-rounded"
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  pathname === '/admin/organization-users' ? "text-brand-500" : "text-brand-400"
                )}
              />
              <span className="truncate">Usuarios por Org.</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border shrink-0 p-3 space-y-3 bg-card/10">
        {/* Theme switch */}
        <div className="px-1">
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
        </div>

        {/* Admin profile Identity card */}
        {user && (
          <div className="relative overflow-hidden p-3 rounded-xl border border-sidebar-border bg-card/40 hover:bg-brand-500/5 transition-all duration-300 space-y-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold text-xs select-none">
                {getInitials(user.email)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-foreground truncate leading-none">
                  {user.fullName || user.firstName || user.email.split('@')[0]}
                </span>
                <span className="block text-[9px] text-muted-foreground truncate mt-1">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-sidebar-border text-[9px]">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-brand-500" />
                Rol Global:
              </span>
              <span className="font-bold text-brand-500 uppercase">ADMIN</span>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 mt-2 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
