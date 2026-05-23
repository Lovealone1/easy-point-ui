import { create } from 'zustand';
import type { ThemeMode } from '@/features/auth/types/auth.types';


interface UiState {

  /** Current color scheme. Default is 'light'. Will be overridden ONCE on
   *  initial session load by the organization config from the server.
   *  After that, user changes take precedence for the rest of the session. */
  theme: ThemeMode;

  /**
   * True once the user has manually toggled the theme during this session.
   * When true, branding updates from the org config settings page will
   * re-apply colors but will NOT override the user's chosen theme.
   */
  hasUserSetTheme: boolean;

  /** Whether the sidebar is collapsed (icon-only) or expanded. */
  isSidebarCollapsed: boolean;

  /** Whether the mobile drawer overlay is open. */
  isMobileMenuOpen: boolean;

  /** Full-page loading overlay (e.g. during org switching). */
  isPageLoading: boolean;

  /**
   * Sets the theme and applies the .dark class to <html>.
   * This is the single source of truth for theme switching.
   * Called ONCE on initial load with the server-provided preference.
   */
  setTheme: (mode: ThemeMode) => void;

  /**
   * Called when the user manually toggles the theme.
   * Sets hasUserSetTheme = true so subsequent config updates do not
   * override the user's choice for the rest of the session.
   */
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
 * Theme lifecycle:
 * - On initial session load: `setTheme()` is called once with the org's
 *   preferred theme from the server. `hasUserSetTheme` remains false.
 * - When the user manually toggles: `toggleTheme()` is called, which sets
 *   `hasUserSetTheme = true`. From this point, org config changes will only
 *   update CSS color variables — NOT the active theme.
 * - We intentionally do NOT persist to localStorage. A fresh page load always
 *   starts with the org's configured default theme.
 */
export const useUiStore = create<UiState>()((set, get) => ({
  theme: 'light',
  hasUserSetTheme: false,
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
    set({ theme: next, hasUserSetTheme: true });
  },

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  setPageLoading: (loading) => set({ isPageLoading: loading }),
}));
