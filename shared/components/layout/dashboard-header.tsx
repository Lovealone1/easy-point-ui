"use client";

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Moon, Sun, LogOut, Loader2 } from 'lucide-react';
import { useUiStore } from '@/shared/store/use-ui-store';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { logout } from '@/shared/services/auth.service';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const { theme, toggleTheme } = useUiStore();
  const isDark = theme === 'dark';
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } catch { /* ignore */ } finally {
      clearSession();
      router.replace('/auth');
    }
  };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full p-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight">EasyPoint</h1>
        {user && (
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
            {user.email}
          </span>
        )}
      </div>
      
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="flex gap-2 items-center"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="hidden sm:inline-block">{isDark ? 'Light' : 'Dark'}</span>
        </Button>
        
        <Button
          id="logout-button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex gap-2 items-center border-destructive/40 text-destructive hover:bg-destructive/5"
        >
          {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          <span className="hidden sm:inline-block">{isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}</span>
        </Button>
      </div>
    </header>
  );
}
