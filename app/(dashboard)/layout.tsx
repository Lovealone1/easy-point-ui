import { Toaster } from '@/shared/components/ui/sonner';
import QueryProvider from '@/shared/components/providers/query-provider';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import BrandingProvider from '@/shared/components/providers/branding-provider';
import DashboardHeader from '@/shared/components/layout/dashboard-header';
import Sidebar from '@/shared/components/layout/sidebar/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <BrandingProvider>
        <QueryProvider>
          <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <DashboardHeader />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
          
          {/* Notifier Provider (Sonner) */}
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
