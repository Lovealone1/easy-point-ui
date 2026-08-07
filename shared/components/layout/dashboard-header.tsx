"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useFavoritesStore } from '@/shared/store/use-favorites-store';
import { useSidebarCatalog } from '@/shared/config/sidebar-catalog';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ChevronRight, Home, Menu } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { rolesService } from '@/features/roles/services/roles.service';
import { roleKeys } from '@/features/roles/hooks/use-roles';
import { segmentToLabel } from '@/shared/components/layout/header/avatar-utils';
import NotificationBell from '@/shared/components/layout/header/notification-bell';
import UserMenu from '@/shared/components/layout/header/user-menu';

// ─────────────────────────────────────────────────────────────────────────────
// Breadcrumbs
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumbs() {
  const pathname = usePathname();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const catalog = useSidebarCatalog();

  /** Home is whichever module the active catalog pins. */
  const homePath = catalog.items.find((m) => m.pinned)?.path ?? '/';

  // Build segments: split path, remove empty strings
  const segments = pathname.split('/').filter(Boolean);

  // If we are on a roles dynamic route, fetch the role name dynamically
  const isRolePath = segments[0] === 'roles';
  const roleId = isRolePath && segments[1] ? segments[1] : '';

  const { data: role } = useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => rolesService.getById(roleId),
    enabled: !!roleId && roleId !== 'create',
  });

  // Determine the leaf module for the pin button. Matched on the full path
  // rather than the last segment, because personal-space modules are nested
  // (/personal/subscriptions) while organization ones are not.
  const leafSegment = segments[segments.length - 1];
  const leafMod = catalog.items.find((m) => m.path === pathname) ?? null;
  const canPin = leafMod && !leafMod.pinned;
  const isPinned = canPin ? isFavorite(leafMod!.id) : false;

  // ── Pin button (shared between mobile and desktop) ──
  const PinButton = canPin ? (
    <button
      id="header-pin-favorite-btn"
      onClick={() => toggleFavorite(leafMod!.id)}
      title={isPinned ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className={cn(
        "ml-1 flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200 shrink-0 group",
        isPinned
          ? "text-primary hover:bg-primary/10"
          : "text-muted-foreground/40 hover:text-primary hover:bg-primary/10"
      )}
      aria-label={isPinned ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <AppIcon
        name={isPinned ? 'keep-rounded' : 'keep-off-rounded'}
        className={cn("h-4 w-4 transition-transform duration-200 group-hover:scale-110")}
      />
    </button>
  ) : null;

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-[15px] text-muted-foreground font-medium" style={{ letterSpacing: '-0.12px' }}>Inicio</span>
      </nav>
    );
  }

  // Leaf label (for mobile compact view)
  let leafLabel = leafMod
    ? leafMod.name
    : segmentToLabel(leafSegment ?? '');

  if (isRolePath && segments.length > 1 && leafSegment === roleId && role) {
    leafLabel = role.name;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-hidden w-full">
      {/* ── Mobile: show only the leaf segment + pin ── */}
      <span className="md:hidden flex items-center gap-1.5 min-w-0 overflow-hidden">
        <Link
          href={homePath}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 shrink-0"
          title="Inicio"
        >
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        <span
          className="text-[15px] font-semibold text-primary truncate"
          style={{ letterSpacing: '-0.12px' }}
        >
          {leafLabel}
        </span>
        {PinButton}
      </span>

      {/* ── Desktop: full breadcrumb chain ── */}
      <span className="hidden md:flex items-center gap-1.5 min-w-0 overflow-hidden flex-1">
        <Link
          href={homePath}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 shrink-0"
          title="Inicio"
        >
          <Home className="h-4 w-4" />
        </Link>

        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

        {segments.map((segment, idx) => {
          const href = '/' + segments.slice(0, idx + 1).join('/');
          const isLast = idx === segments.length - 1;

          // Grouping segment with no page behind it — skip rather than render
          // a link to a 404.
          if (!isLast && idx === 0 && segment === catalog.hiddenPathSegment) return null;

          // Match on the accumulated href so nested catalogs resolve too.
          const mod = catalog.items.find((m) => m.path === href);

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

                {/* Module Name — primary color when active (isLast) */}
                {isLast ? (
                  <span
                    className="text-[15px] font-semibold text-primary truncate"
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
          let label = segmentToLabel(segment);
          if (isRolePath && idx === 1 && role) {
            label = role.name;
          }

          const isRoleSegmentNonClickable = isRolePath && idx === 1;

          return (
            <span key={href} className="flex items-center gap-1.5 min-w-0">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
              {isLast || isRoleSegmentNonClickable ? (
                <span
                  className={cn(
                    "text-[15px] truncate select-none",
                    isLast ? "font-semibold text-primary" : "font-medium text-muted-foreground/75"
                  )}
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
        {PinButton}
      </span>
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

        {/* Breadcrumbs — visible on all breakpoints */}
        <div className="flex items-center min-w-0 flex-1 overflow-hidden">
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
        {user && <UserMenu user={user} environment="dashboard" />}
      </div>
    </header>
  );
}
