import { Toaster } from '@/shared/components/ui/sonner';
import QueryProvider from '@/shared/components/providers/query-provider';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import DashboardHeader from '@/shared/components/layout/dashboard-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {/* 
          Here we will eventually add the global Sidebar and Navbar.
          For now, it just renders the children with all the required providers.
        */}
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <DashboardHeader />
          <div className="flex flex-1 overflow-hidden">
            {/* <Sidebar /> */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
        
        {/* Notifier Provider (Sonner) */}
        <Toaster position="top-right" richColors />
      </QueryProvider>
    </ThemeProvider>
  );
}
