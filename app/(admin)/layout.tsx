"use client";

import { useEffect } from 'react';
import { useAdminAuthStore } from '@/shared/store/use-admin-auth-store';
import { useRouter } from 'next/navigation';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import AdminSessionProvider from '@/shared/components/providers/admin-session-provider';
import QueryProvider from '@/shared/components/providers/query-provider';
import { Toaster } from '@/shared/components/ui/sonner';
import AdminSidebar from '@/shared/components/layout/admin-sidebar';
import AdminHeader from '@/shared/components/layout/admin-header';
import SmoothScrollMain from '@/shared/components/layout/smooth-scroll-main';
import EnvironmentSwitchGate from '@/shared/components/layout/environment-switch-gate';
import { PageLoader } from '@/shared/components/ui/spinner';

/**
 * Last line of a three-part gate, and the weakest of the three — a render
 * guard, not an authorization boundary:
 *
 *   1. The API rejects every console endpoint that is not reached on a
 *      console session. That is the boundary.
 *   2. The edge middleware redirects /admin/* to /admin/login when the console
 *      cookie is absent, so nobody loads this bundle for nothing.
 *   3. This, which keeps the chrome from flashing before (1) and (2) answer.
 *
 * It reads the console store, never the dashboard's: being signed into an
 * organization says nothing about whether you may be here.
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoadingSession } = useAdminAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingSession) {
      if (!isAuthenticated) {
        router.replace('/admin/login');
      } else if (user?.globalRole !== 'ADMIN') {
        // A console session is only ever minted for a global admin, so this is
        // belt and braces rather than a path anyone reaches.
        router.replace('/admin/login');
      }
    }
  }, [isAuthenticated, user, isLoadingSession, router]);

  if (isLoadingSession || !isAuthenticated || user?.globalRole !== 'ADMIN') {
    return <PageLoader label="Validando credenciales de administrador..." />;
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AdminSessionProvider>
        <QueryProvider>
          <AdminGuard>
            <div className="app-viewport-shell flex overflow-hidden bg-background text-foreground">
              <AdminSidebar />
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <AdminHeader />
                <SmoothScrollMain className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain no-scrollbar p-4 md:p-8 lg:p-10">
                  {children}
                </SmoothScrollMain>
              </div>
            </div>
          </AdminGuard>
          <Toaster position="top-right" richColors />
          <EnvironmentSwitchGate />
        </QueryProvider>
      </AdminSessionProvider>
    </ThemeProvider>
  );
}
