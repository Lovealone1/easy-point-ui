import { Toaster } from '@/shared/components/ui/sonner';
import QueryProvider from '@/shared/components/providers/query-provider';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import BrandingProvider from '@/shared/components/providers/branding-provider';
import DashboardHeader from '@/shared/components/layout/dashboard-header';
import Sidebar from '@/shared/components/layout/sidebar/sidebar';
import SmoothScrollMain from '@/shared/components/layout/smooth-scroll-main';
import EnvironmentSwitchGate from '@/shared/components/layout/environment-switch-gate';
import { SidebarCatalogProvider } from '@/shared/config/sidebar-catalog';
import { ORG_SIDEBAR_CATALOG } from '@/shared/config/modules.config';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <BrandingProvider>
        <QueryProvider>
          <SidebarCatalogProvider catalog={ORG_SIDEBAR_CATALOG}>
          <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <DashboardHeader />
              <SmoothScrollMain className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
              </SmoothScrollMain>
            </div>
          </div>

          {/* Notifier Provider (Sonner) */}
          <Toaster position="top-right" richColors />
          <EnvironmentSwitchGate />
          </SidebarCatalogProvider>
        </QueryProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
