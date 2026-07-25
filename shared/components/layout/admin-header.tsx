"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Home, ChevronRight, Menu } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { organizationsAdminService } from '@/features/organization/services/organizations-admin.service';
import { usersService } from '@/features/users/services/users.service';
import { segmentToLabel } from '@/shared/components/layout/header/avatar-utils';
import NotificationBell from '@/shared/components/layout/header/notification-bell';
import UserMenu from '@/shared/components/layout/header/user-menu';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Breadcrumbs — mirrors the dashboard's, minus favorites/pin (a tenant
// sidebar concept) and rooted at /admin instead of /dashboard.
// ─────────────────────────────────────────────────────────────────────────────

function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const isOrgAdminPath = segments[0] === 'admin' && segments[1] === 'organizations';
  const orgId = isOrgAdminPath && segments[2] ? segments[2] : '';

  const { data: org } = useQuery({
    queryKey: ['organizations-admin', 'detail', orgId],
    queryFn: () => organizationsAdminService.getById(orgId),
    enabled: !!orgId,
  });

  const isUserInfoPath = segments[0] === 'admin' && segments[1] === 'user-info';
  const userInfoUserId = isUserInfoPath && segments[2] ? segments[2] : '';

  const { data: userInfoUser } = useQuery({
    queryKey: ['users', 'detail', userInfoUserId],
    queryFn: () => usersService.getById(userInfoUserId),
    enabled: !!userInfoUserId,
  });

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-[15px] text-muted-foreground font-medium" style={{ letterSpacing: '-0.12px' }}>
          Panel de administración
        </span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-hidden w-full">
      <Link
        href="/admin"
        className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 shrink-0"
        title="Inicio"
      >
        <Home className="h-4 w-4" />
      </Link>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

      {segments.map((segment, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/');
        const isLast = idx === segments.length - 1;

        let label = segmentToLabel(segment);
        if (isOrgAdminPath && idx === 2 && org) {
          label = org.name;
        }
        if (isUserInfoPath && idx === 2 && userInfoUser) {
          const fullName = [userInfoUser.firstName, userInfoUser.lastName].filter(Boolean).join(' ');
          label = fullName || userInfoUser.email;
        }

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
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminHeader — Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminHeader() {
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
        <button
          id="header-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center min-w-0 flex-1 overflow-hidden">
          <AdminBreadcrumbs />
        </div>
      </div>

      {/* ── Right section: Notifications + User menu ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="hidden md:block w-px h-5 bg-border/50 mx-1" />

        <NotificationBell />

        <div className="w-px h-5 bg-border/50 mx-0.5" />

        {user && <UserMenu user={user} environment="admin" />}
      </div>
    </header>
  );
}
