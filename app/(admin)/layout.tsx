"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/shared/store/use-auth-store';
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

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoadingSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingSession) {
      if (!isAuthenticated) {
        router.replace('/auth');
      } else if (user?.globalRole !== 'ADMIN') {
        router.replace('/dashboard');
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
            <div className="flex h-screen overflow-hidden bg-background text-foreground">
              <AdminSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <AdminHeader />
                <SmoothScrollMain className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 lg:p-10">
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
