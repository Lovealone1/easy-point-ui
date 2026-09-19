// ─────────────────────────────────────────────────────────────────────────────
// app/(admin-auth)/layout.tsx
//
// Shell for the administration console sign-in.
//
// Deliberately NOT inside (admin): that layout mounts AdminSessionProvider and
// AdminGuard, both of which bounce anyone without a console session to this
// very page. Route groups do not appear in the URL, so /admin/login still
// sits under /admin as far as the edge middleware and the user are concerned.
// ─────────────────────────────────────────────────────────────────────────────
import { Toaster } from '@/shared/components/ui/sonner';
import ThemeProvider from '@/shared/components/providers/theme-provider';

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 w-[380px] h-[380px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <main className="relative z-10 w-full max-w-md">{children}</main>

        <footer className="relative z-10 mt-12 text-xs text-muted-foreground">
          © 2026 Easypoint Saas
        </footer>
      </div>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
