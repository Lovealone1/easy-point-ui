"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useRouter } from 'next/navigation';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import BrandingProvider from '@/shared/components/providers/branding-provider';
import QueryProvider from '@/shared/components/providers/query-provider';
import { Toaster } from '@/shared/components/ui/sonner';
import AdminSidebar from '@/shared/components/layout/admin-sidebar';
import DashboardHeader from '@/shared/components/layout/dashboard-header';

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
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-primary"></div>
          <span className="text-xs text-muted-foreground font-medium">Validando credenciales de administrador...</span>
        </div>
      </div>
    );
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
      <BrandingProvider>
        <QueryProvider>
          <AdminGuard>
            <div className="flex h-screen overflow-hidden bg-background text-foreground">
              <AdminSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 lg:p-10">
                  {children}
                </main>
              </div>
            </div>
          </AdminGuard>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
