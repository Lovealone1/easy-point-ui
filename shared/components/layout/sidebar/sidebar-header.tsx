"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { Button } from '@/shared/components/ui/button';
import { SidebarClose } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function SidebarHeader() {
  const { organizationConfig, activeOrganization } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();

  const logoUrl = organizationConfig?.logoUrl;
  const orgName =
    organizationConfig?.organizationName ||
    activeOrganization?.name ||
    'O';

  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [logoUrl]);

  const initial = orgName.charAt(0).toUpperCase();

  return (
    <div className="relative flex items-center justify-center h-16 border-b border-sidebar-border shrink-0 px-3">

      {/* ── Collapsed state: small centered square ── */}
      {isSidebarCollapsed ? (
        <div
          onClick={toggleSidebar}
          title="Expandir barra lateral"
          className="w-10 h-10 cursor-pointer rounded-xl overflow-hidden flex items-center justify-center shrink-0"
        >
          {logoUrl && !hasImageError ? (
            <img
              src={logoUrl}
              alt={orgName}
              className="object-contain w-full h-full"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-muted border border-sidebar-border flex items-center justify-center font-bold text-base text-foreground select-none rounded-xl">
              {initial}
            </div>
          )}
        </div>
      ) : (
        /* ── Expanded state: logo fills available width ── */
        <>
          <div className="flex-1 flex items-center justify-center h-11 overflow-hidden rounded-xl">
            {logoUrl && !hasImageError ? (
              <img
                src={logoUrl}
                alt={orgName}
                className="max-h-full max-w-full object-contain"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <div className="w-11 h-11 bg-muted border border-sidebar-border flex items-center justify-center font-bold text-xl text-foreground select-none rounded-xl">
                {initial}
              </div>
            )}
          </div>

          {/* Collapse button — absolute so it doesn't shrink the logo area */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute right-2 hidden md:flex h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            title="Colapsar barra lateral"
          >
            <SidebarClose className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
