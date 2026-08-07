// ─────────────────────────────────────────────────────────────────────────────
// app/(workspace)/layout.tsx
//
// Shell for the workspace picker. Deliberately thin and deliberately NOT inside
// (dashboard): that layout mounts BrandingProvider, whose session recovery
// bounces any user without an organization to /onboarding — and choosing the
// personal space is a legitimate reason to have none.
// ─────────────────────────────────────────────────────────────────────────────

import { Toaster } from '@/shared/components/ui/sonner';
import QueryProvider from '@/shared/components/providers/query-provider';
import ThemeProvider from '@/shared/components/providers/theme-provider';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
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
