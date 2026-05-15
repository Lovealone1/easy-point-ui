import { Toaster } from '@/shared/components/ui/sonner';
import QueryProvider from '@/shared/components/providers/query-provider';
import ThemeProvider from '@/shared/components/providers/theme-provider';

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
        <div className="flex min-h-screen bg-background text-foreground">
          {/* <Sidebar /> */}
          <main className="flex-1 overflow-y-auto">
            {/* <Navbar /> */}
            {children}
          </main>
        </div>
        
        {/* Notifier Provider (Sonner) */}
        <Toaster position="top-right" richColors />
      </QueryProvider>
    </ThemeProvider>
  );
}
