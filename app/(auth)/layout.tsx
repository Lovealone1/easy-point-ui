import { Toaster } from '@/shared/components/ui/sonner';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      {/* 
        The Toaster is here so auth pages can show errors (e.g., "Invalid credentials").
        We don't include QueryProvider here if auth pages don't fetch data, 
        but if they do, we can add it later. 
      */}
      {children}
      <Toaster position="top-right" richColors />
    </div>
  );
}
