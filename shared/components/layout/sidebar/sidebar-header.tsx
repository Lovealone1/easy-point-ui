"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { Button } from '@/shared/components/ui/button';
import { SidebarClose } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function SidebarHeader() {
  const { organizationConfig, activeOrganization } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, setMobileMenuOpen } = useUiStore();

  const handleLogoClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileMenuOpen(false);
    } else {
      toggleSidebar();
    }
  };

  const logoShortUrl = organizationConfig?.logoShortUrl;
  const logoUrl = organizationConfig?.logoUrl;
  const orgName =
    organizationConfig?.organizationName ||
    activeOrganization?.name ||
    'O';

  const [collapsedLogoToRender, setCollapsedLogoToRender] = useState<string | null>(null);
  const [expandedLogoToRender, setExpandedLogoToRender] = useState<string | null>(null);

  useEffect(() => {
    setCollapsedLogoToRender(logoShortUrl || logoUrl || null);
  }, [logoShortUrl, logoUrl]);

  useEffect(() => {
    setExpandedLogoToRender(logoUrl || null);
  }, [logoUrl]);

  const handleCollapsedImageError = () => {
    if (collapsedLogoToRender === logoShortUrl && logoUrl) {
      setCollapsedLogoToRender(logoUrl);
    } else {
      setCollapsedLogoToRender(null);
    }
  };

  const handleExpandedImageError = () => {
    setExpandedLogoToRender(null);
  };

  const initial = orgName.charAt(0).toUpperCase();

  return (
    <div className="relative flex items-center justify-center h-16 border-b border-sidebar-border shrink-0 px-3">
      <div
        onClick={handleLogoClick}
        title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
        className={cn(
          "cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-300 ease-in-out",
          isSidebarCollapsed 
            ? "w-10 h-10 rounded-xl" 
            : "w-44 h-11 rounded-xl"
        )}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Collapsed state logo */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out",
              isSidebarCollapsed 
                ? "opacity-100 scale-100 pointer-events-auto" 
                : "opacity-0 scale-90 pointer-events-none"
            )}
          >
            {collapsedLogoToRender ? (
              <img
                src={collapsedLogoToRender}
                alt={orgName}
                className="object-contain w-full h-full"
                onError={handleCollapsedImageError}
              />
            ) : (
              <div className="w-full h-full bg-muted border border-sidebar-border flex items-center justify-center font-bold text-base text-foreground select-none rounded-xl">
                {initial}
              </div>
            )}
          </div>

          {/* Expanded state logo */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out",
              !isSidebarCollapsed 
                ? "opacity-100 scale-100 pointer-events-auto" 
                : "opacity-0 scale-90 pointer-events-none"
            )}
          >
            {expandedLogoToRender ? (
              <img
                src={expandedLogoToRender}
                alt={orgName}
                className="max-h-full max-w-full object-contain"
                onError={handleExpandedImageError}
              />
            ) : (
              <div className="w-11 h-11 bg-muted border border-sidebar-border flex items-center justify-center font-bold text-xl text-foreground select-none rounded-xl">
                {initial}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapse button — absolute so it doesn't shrink the logo area */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "absolute right-2 hidden md:flex h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 transition-all duration-300",
          isSidebarCollapsed ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
        )}
        title="Colapsar barra lateral"
      >
        <SidebarClose className="h-4 w-4" />
      </Button>
    </div>
  );
}
