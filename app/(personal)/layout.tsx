// ─────────────────────────────────────────────────────────────────────────────
// app/(personal)/layout.tsx
//
// Shell for the Personal Space. Structurally identical to (dashboard) — same
// Sidebar, same header, same scroll container — but fed a different sidebar
// catalog and gated by PersonalBrandingProvider instead of BrandingProvider,
// since a personal user has no organization and BrandingProvider would bounce
// them to /onboarding.
// ─────────────────────────────────────────────────────────────────────────────

import { Toaster } from '@/shared/components/ui/sonner';
import QueryProvider from '@/shared/components/providers/query-provider';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import PersonalBrandingProvider from '@/shared/components/providers/personal-branding-provider';
import DashboardHeader from '@/shared/components/layout/dashboard-header';
import Sidebar from '@/shared/components/layout/sidebar/sidebar';
import SmoothScrollMain from '@/shared/components/layout/smooth-scroll-main';
import EnvironmentSwitchGate from '@/shared/components/layout/environment-switch-gate';
import { SidebarCatalogProvider } from '@/shared/config/sidebar-catalog';
import { PERSONAL_SIDEBAR_CATALOG } from '@/shared/config/personal-modules.config';

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <PersonalBrandingProvider>
          <SidebarCatalogProvider catalog={PERSONAL_SIDEBAR_CATALOG}>
            <div className="flex h-screen overflow-hidden bg-background text-foreground">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <DashboardHeader />
                <SmoothScrollMain className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                  {children}
                </SmoothScrollMain>
              </div>
            </div>

            <Toaster position="top-right" richColors />
            <EnvironmentSwitchGate />
          </SidebarCatalogProvider>
        </PersonalBrandingProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
