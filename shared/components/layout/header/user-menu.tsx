'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, Settings, Shield, User, Building2, ArrowLeftRight, MonitorSmartphone } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useAdminAuthStore } from '@/shared/store/use-admin-auth-store';
import { useEnvironmentSwitchStore } from '@/shared/store/use-environment-switch-store';
import { logout } from '@/features/auth/services/auth.service';
import { adminLogout } from '@/features/auth/services/admin-auth.service';
import { getAvatarColors, getInitials, formatRole } from './avatar-utils';

interface UserMenuProps {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    globalRole?: string | null;
    orgRoles?: string[];
  };
  /** Which shell this menu renders in — decides the cross-environment item. */
  environment: 'dashboard' | 'admin';
}

export default function UserMenu({ user, environment }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const clearTenantSession = useAuthStore((s) => s.clearSession);
  const clearAdminSession = useAdminAuthStore((s) => s.clearSession);
  const requestEnvironmentSwitch = useEnvironmentSwitchStore((s) => s.request);

  const initials = getInitials(user);
  const avatarColors = getAvatarColors(user.email);
  const displayName = user.fullName || user.firstName
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    : user.email.split('@')[0];
  const roleLabel = formatRole(user.globalRole ?? null);
  const orgRole = user.orgRoles?.[0] ?? null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /**
   * Signs out of THIS shell only.
   *
   * Each shell holds its own cookies, session and store, so leaving the
   * console does not touch the organization session and vice versa. To end
   * both at once there is "sign out everywhere" on the API
   * (POST /auth/logout-all).
   */
  const handleLogout = async () => {
    const isAdmin = environment === 'admin';
    setIsLoggingOut(true);
    try {
      await (isAdmin ? adminLogout() : logout());
    } catch {
      /* ignore */
    } finally {
      if (isAdmin) {
        clearAdminSession();
        router.replace('/admin/login');
      } else {
        clearTenantSession();
        router.replace('/auth');
      }
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Avatar trigger button — avatar only */}
      <button
        id="header-user-menu-btn"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200",
          "border border-transparent hover:border-border/40 hover:bg-muted/60",
          open && "border-border/40 bg-muted/60"
        )}
        aria-label="Menú de usuario"
        title={displayName}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-[13px] shrink-0 select-none"
          style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}
        >
          {initials}
        </div>
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          "absolute right-0 top-[calc(100%+8px)] w-64 rounded-xl border border-border/50 bg-popover shadow-xl z-50 overflow-hidden",
          "transition-all duration-200",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        )}
      >
        {/* User identity section */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            {/* Large avatar */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] shrink-0 select-none"
              style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate tracking-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          {/* Role badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
              <Shield className="h-2.5 w-2.5" />
              {roleLabel}
            </span>
            {environment === 'dashboard' && orgRole && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border border-border/40">
                <Building2 className="h-2.5 w-2.5" />
                {orgRole}
              </span>
            )}
          </div>
        </div>

        {/* Menu actions */}
        <div className="p-1.5">
          {/* Both shells route through the picker rather than a fixed panel:
              the user may have several organizations and a personal space. */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              requestEnvironmentSwitch('/workspace');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 group"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
            <span>{environment === 'admin' ? 'Salir del panel admin' : 'Cambiar de espacio'}</span>
          </button>

          {/* Account settings only from the dashboard, not the console.
              /account runs on a TENANT session — the BFF sends the tenant
              cookies — and the edge middleware bounces anyone without one to
              /auth. An administrator holding only a console session would
              follow this link straight out of the console, so the console
              simply does not offer it. */}
          {environment === 'dashboard' && (
            <>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/account/profile');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 group"
            >
              <User className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
              <span>Mi perfil</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/account/appearance');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 group"
            >
              <Settings className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
              <span>Configuración de cuenta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/account/sessions');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 group"
            >
              <MonitorSmartphone className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
              <span>Mis sesiones</span>
            </button>
            </>
          )}
        </div>

        {/* Divider + Logout */}
        <div className="p-1.5 border-t border-border/40">
          <button
            id="header-logout-btn"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150",
              "text-destructive/80 hover:text-destructive hover:bg-destructive/10",
              isLoggingOut && "opacity-60 cursor-not-allowed"
            )}
          >
            {isLoggingOut
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <LogOut className="h-3.5 w-3.5" />
            }
            <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
