import { Toaster } from '@/shared/components/ui/sonner';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import QueryProvider from '@/shared/components/providers/query-provider';

// Full-viewport shell for pages a user with no working access still needs to
// reach — deliberately outside (dashboard), which requires an active org and
// enabled modules via BrandingProvider.
export default function BlockedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
          {children}
        </div>
        <Toaster position="top-right" richColors />
      </QueryProvider>
    </ThemeProvider>
  );
}
