import { create } from 'zustand';
import type { ThemeMode } from '@/shared/types/auth.types';


interface UiState {

  /** Current color scheme. Default is 'light'. Will be overridden by server
   *  organization config once the user logs in. */
  theme: ThemeMode;


  /** Whether the sidebar is collapsed (icon-only) or expanded. */
  isSidebarCollapsed: boolean;

  /** Whether the mobile drawer overlay is open. */
  isMobileMenuOpen: boolean;


  /** Full-page loading overlay (e.g. during org switching). */
  isPageLoading: boolean;


  /**
   * Sets the theme and applies the .dark class to <html>.
   * This is the single source of truth for theme switching.
   * Called on initial load with the server-provided preference,
   * and on manual toggle by the user.
   */
  setTheme: (mode: ThemeMode) => void;

  /** Toggles between light and dark. */
  toggleTheme: () => void;

  /** Expand or collapse the sidebar. */
  toggleSidebar: () => void;

  /** Explicitly set sidebar state (e.g. on small viewports). */
  setSidebarCollapsed: (collapsed: boolean) => void;

  /** Open/close the mobile menu overlay. */
  setMobileMenuOpen: (open: boolean) => void;

  /** Show or hide the full-page loading overlay. */
  setPageLoading: (loading: boolean) => void;
}


/**
 * Applies or removes the `.dark` class on <html>.
 * Safe to call during SSR (checks for `document`).
 */
function applyThemeToDom(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}


/**
 * UI Store — controls global interface state.
 *
 * Theme note:
 * - Default theme is 'light' (hardcoded for now).
 * - Once the user logs in, the server sends the organization's preferred theme
 *   (from org-config). The auth hydration flow should call `setTheme()` with
 *   that value — this store is the single point of truth for DOM theme class.
 * - We intentionally do NOT persist this to localStorage so that the server
 *   configuration always wins on a fresh load.
 */
export const useUiStore = create<UiState>()((set, get) => ({
  theme: 'light',
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  isPageLoading: false,

  setTheme: (mode) => {
    applyThemeToDom(mode);
    set({ theme: mode });
  },

  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'light' ? 'dark' : 'light';
    applyThemeToDom(next);
    set({ theme: next });
  },

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  setPageLoading: (loading) => set({ isPageLoading: loading }),
}));
