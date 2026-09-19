// ─────────────────────────────────────────────────────────────────────────────
// app/(account)/layout.tsx
//
// Shell for account settings. Structurally identical to (dashboard) and
// (personal) — same Sidebar, same header, same scroll container — fed the
// account catalog and gated by AccountBrandingProvider, which is the one that
// redirects nobody. See the note in that file for why neither of the other two
// providers works here.
// ─────────────────────────────────────────────────────────────────────────────

import { Toaster } from '@/shared/components/ui/sonner';
import QueryProvider from '@/shared/components/providers/query-provider';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import AccountBrandingProvider from '@/shared/components/providers/account-branding-provider';
import DashboardHeader from '@/shared/components/layout/dashboard-header';
import Sidebar from '@/shared/components/layout/sidebar/sidebar';
import SmoothScrollMain from '@/shared/components/layout/smooth-scroll-main';
import EnvironmentSwitchGate from '@/shared/components/layout/environment-switch-gate';
import { SidebarCatalogProvider } from '@/shared/config/sidebar-catalog';
import { ACCOUNT_SIDEBAR_CATALOG } from '@/shared/config/account-modules.config';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AccountBrandingProvider>
          <SidebarCatalogProvider catalog={ACCOUNT_SIDEBAR_CATALOG}>
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
        </AccountBrandingProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
