'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/shared/store/use-ui-store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUiStore();

  // Ensures the DOM is synchronized with the Zustand store on mount and when theme changes.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  return <>{children}</>;
}
