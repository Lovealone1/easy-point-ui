"use client";

import { useState } from 'react';
import { useUiStore } from '@/shared/store/use-ui-store';
import SidebarHeader from './sidebar-header';
import SidebarSearch from './sidebar-search';
import SidebarMenu from './sidebar-menu';
import SidebarFooter from './sidebar-footer';
import { cn } from '@/shared/lib/utils';

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isSidebarCollapsed, isMobileMenuOpen, setMobileMenuOpen } = useUiStore();

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Main Sidebar Aside */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:static md:translate-x-0 md:flex-shrink-0",
          isSidebarCollapsed ? "md:w-20" : "md:w-64",
          isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        )}
      >
        <SidebarHeader />

        <SidebarSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Scrollable module list */}
        <SidebarMenu searchQuery={searchQuery} />

        <SidebarFooter />
      </aside>
    </>
  );
}
