"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useFavoritesStore } from '@/shared/store/use-favorites-store';
import { logout } from '@/shared/services/auth.service';
import { useRouter } from 'next/navigation';
import { MODULES_CATALOG } from '@/shared/config/modules.config';
import { AppIcon } from '@/shared/components/ui/app-icon';
import {
  Bell,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  Settings,
  User,
  Loader2,
  Shield,
  Building2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Generates a deterministic hue from a string (used for avatar bg) */
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/** Returns HSL bg + text classes for the avatar based on the email */
function getAvatarColors(email: string): { bg: string; text: string } {
  const hue = stringToHue(email);
  const saturation = 55;
  const lightness = 42;
  return {
    bg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: '#ffffff',
  };
}

/** Gets user initials from name or email */
function getInitials(user: { firstName?: string | null; lastName?: string | null; email: string }): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName.slice(0, 2).toUpperCase();
  }
  // fallback: first 2 chars of email local part
  return user.email.split('@')[0].slice(0, 2).toUpperCase();
}

/** Maps globalRole enum to a human-readable label */
function formatRole(role: string | null): string {
  if (!role) return 'Usuario';
  const map: Record<string, string> = {
    ADMIN: 'Administrador',
    MODERATOR: 'Moderador',
    USER: 'Usuario',
    SUPER_ADMIN: 'Super Admin',
  };
  return map[role] ?? role;
}

/** Resolves a path segment to a human-readable label */
function segmentToLabel(segment: string): string {
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    'organization-config': 'Ajustes de Marca',
    settings: 'Configuración',
    users: 'Usuarios',
    inventory: 'Inventario',
    sales: 'Ventas',
    reports: 'Reportes',
    products: 'Productos',
    pos: 'Punto de Venta',
    finances: 'Finanzas',
    operations: 'Operaciones',
  };

  // Check if it matches a module name
  const mod = MODULES_CATALOG.find((m) => m.path === `/${segment}`);
  if (mod) return mod.name;

  return labels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Bell
// ─────────────────────────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Placeholder: no notifications yet
  const count = 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        id="header-notifications-btn"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
          "text-muted-foreground hover:text-foreground",
          "bg-transparent hover:bg-muted/60 border border-transparent hover:border-border/40",
          open && "bg-muted/60 border-border/40 text-foreground"
        )}
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      <div
        className={cn(
          "absolute right-0 top-[calc(100%+8px)] w-72 rounded-xl border border-border/50 bg-popover shadow-lg transition-all duration-200 z-50 overflow-hidden",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-[13px] font-semibold text-foreground tracking-tight">Notificaciones</span>
          {count > 0 && (
            <button className="text-[11px] text-primary hover:underline font-medium">
              Marcar todo como leído
            </button>
          )}
        </div>
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-8 px-4 gap-2">
          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-[12px] text-muted-foreground text-center">
            No tienes notificaciones nuevas
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Menu
// ─────────────────────────────────────────────────────────────────────────────

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
}

function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } catch { /* ignore */ } finally {
      clearSession();
      router.replace('/auth');
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
            {orgRole && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border border-border/40">
                <Building2 className="h-2.5 w-2.5" />
                {orgRole}
              </span>
            )}
          </div>
        </div>

        {/* Menu actions */}
        <div className="p-1.5">
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 group"
            onClick={() => setOpen(false)}
          >
            <User className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
            <span>Mi perfil</span>
            <span className="ml-auto text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded-full border border-border/30">
              Próximamente
            </span>
          </button>

          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 group"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
            <span>Preferencias</span>
            <span className="ml-auto text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded-full border border-border/30">
              Próximamente
            </span>
          </button>
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

// ─────────────────────────────────────────────────────────────────────────────
// Breadcrumbs
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumbs() {
  const pathname = usePathname();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  // Build segments: split path, remove empty strings
  const segments = pathname.split('/').filter(Boolean);

  // Determine the leaf module for the pin button
  const leafSegment = segments[segments.length - 1];
  const leafMod = leafSegment
    ? MODULES_CATALOG.find((m) => m.path === `/${leafSegment}`)
    : null;
  // Pinned modules (Dashboard) cannot be toggled by the user
  const canPin = leafMod && !leafMod.pinned;
  const isPinned = canPin ? isFavorite(leafMod!.id) : false;

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-[15px] text-muted-foreground font-medium" style={{ letterSpacing: '-0.12px' }}>Inicio</span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-hidden">
      <Link
        href="/dashboard"
        className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 shrink-0"
        title="Inicio"
      >
        <Home className="h-4 w-4" />
      </Link>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

      {segments.map((segment, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/');
        const isLast = idx === segments.length - 1;

        // Try to find if this segment matches a module path
        const mod = MODULES_CATALOG.find((m) => m.path === `/${segment}`);

        if (mod) {
          return (
            <span key={href} className="flex items-center gap-1.5 min-w-0">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}

              {/* Category (Non-clickable) */}
              <span
                className="text-[15px] font-medium text-muted-foreground/70 select-none shrink-0"
                style={{ letterSpacing: '-0.12px' }}
              >
                {mod.category}
              </span>

              {/* Separator between Category and Name */}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

              {/* Module Name — brand-500 when active (isLast) */}
              {isLast ? (
                <span
                  className="text-[15px] font-semibold text-brand-500 truncate"
                  style={{ letterSpacing: '-0.12px' }}
                >
                  {mod.name}
                </span>
              ) : (
                <Link
                  href={mod.path}
                  className="text-[15px] font-medium text-muted-foreground hover:text-foreground truncate transition-colors duration-150"
                  style={{ letterSpacing: '-0.12px' }}
                >
                  {mod.name}
                </Link>
              )}
            </span>
          );
        }

        // Fallback for non-catalog segments
        const label = segmentToLabel(segment);
        return (
          <span key={href} className="flex items-center gap-1.5 min-w-0">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
            {isLast ? (
              <span
                className="text-[15px] font-semibold text-brand-500 truncate"
                style={{ letterSpacing: '-0.12px' }}
              >
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="text-[15px] font-medium text-muted-foreground hover:text-foreground truncate transition-colors duration-150"
                style={{ letterSpacing: '-0.12px' }}
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}

      {/* Pin button — shown only for non-pinned catalog modules */}
      {canPin && (
        <button
          id="header-pin-favorite-btn"
          onClick={() => toggleFavorite(leafMod!.id)}
          title={isPinned ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className={cn(
            "ml-1 flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200 shrink-0 group",
            isPinned
              ? "text-brand-500 hover:text-brand-600 hover:bg-brand-500/10"
              : "text-muted-foreground/40 hover:text-brand-500 hover:bg-brand-500/10"
          )}
          aria-label={isPinned ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <AppIcon
            name={isPinned ? 'keep-rounded' : 'keep-off-rounded'}
            className={cn(
              "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
            )}
          />
        </button>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DashboardHeader — Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardHeader() {
  const { setMobileMenuOpen } = useUiStore();
  const user = useAuthStore((s) => s.user);

  return (
    <header
      className={cn(
        "flex items-center w-full h-16 shrink-0 sticky top-0 z-40",
        "px-4 gap-3",
        "border-b border-sidebar-border",
        "bg-background/90 backdrop-blur-[20px] supports-[backdrop-filter]:bg-background/75",
      )}
    >
      {/* ── Left section: Mobile hamburger + breadcrumbs ── */}
      <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
        {/* Hamburger — mobile only */}
        <button
          id="header-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumbs — desktop only */}
        <div className="hidden md:flex items-center min-w-0 flex-1">
          <Breadcrumbs />
        </div>
      </div>

      {/* ── Right section: Notifications + User menu ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Divider */}
        <div className="hidden md:block w-px h-5 bg-border/50 mx-1" />

        <NotificationBell />

        {/* Divider */}
        <div className="w-px h-5 bg-border/50 mx-0.5" />

        {/* User menu */}
        {user && <UserMenu user={user} />}
      </div>
    </header>
  );
}
