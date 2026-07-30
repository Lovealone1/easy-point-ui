import { Toaster } from '@/shared/components/ui/sonner';
import ThemeProvider from '@/shared/components/providers/theme-provider';
import QueryProvider from '@/shared/components/providers/query-provider';

// Full-viewport shell — no split-panel chrome here. The step content
// (OnboardingView) owns the layout so it can adapt per step: the choice
// and org-form steps keep the split brand panel, the modules step drops
// it to use the full screen width for the selection grid.
export default function OnboardingLayout({
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
