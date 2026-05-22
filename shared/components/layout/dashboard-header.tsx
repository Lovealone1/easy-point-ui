"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Moon, Sun, LogOut, Loader2, Menu } from 'lucide-react';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { logout } from '@/shared/services/auth.service';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const { theme, toggleTheme, setMobileMenuOpen } = useUiStore();
  const isDark = theme === 'dark';
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const organizationConfig = useAuthStore((s) => s.organizationConfig);

  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [organizationConfig?.logoUrl]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } catch { /* ignore */ } finally {
      clearSession();
      router.replace('/auth');
    }
  };

  return (
    <header className="flex justify-between items-center w-full h-16 px-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu for Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          title="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Brand/Logo - Only shown on Mobile */}
        <div className="flex md:hidden items-center gap-2 select-none">
          {organizationConfig?.logoUrl && !logoError ? (
            <img
              src={organizationConfig.logoUrl}
              alt="Logo"
              className="h-7 w-auto object-contain transition-opacity duration-300"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-sm font-bold tracking-tight text-foreground truncate">
              {organizationConfig?.organizationName || 'EasyPoint'}
            </span>
          )}
        </div>


        {/* User Email - Only shown on Desktop */}
        {user && (
          <span className="text-xs font-medium text-muted-foreground hidden md:inline-block bg-muted/50 border border-border/30 px-2.5 py-1 rounded-full">
            {user.email}
          </span>
        )}
      </div>
      
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="flex gap-2 items-center h-8 text-xs border-border/40 hover:bg-accent/40"
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline-block">{isDark ? 'Claro' : 'Oscuro'}</span>
        </Button>
        
        <Button
          id="logout-button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex gap-2 items-center h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/5"
        >
          {isLoggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline-block">{isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}</span>
        </Button>
      </div>
    </header>
  );
}
