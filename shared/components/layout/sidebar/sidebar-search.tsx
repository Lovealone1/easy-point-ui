"use client";

import { useEffect, useRef } from 'react';
import { useUiStore } from '@/shared/store/use-ui-store';
import { Search } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';

interface SidebarSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function SidebarSearch({ searchQuery, setSearchQuery }: SidebarSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isSidebarCollapsed, setSidebarCollapsed } = useUiStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isSidebarCollapsed) {
          setSidebarCollapsed(false);
        }
        // Focus input after expanding transition
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarCollapsed, setSidebarCollapsed]);

  const handleSearchClick = () => {
    if (isSidebarCollapsed) {
      setSidebarCollapsed(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  };

  return (
    <div className="px-3 py-2 shrink-0">
      {isSidebarCollapsed ? (
        <button
          onClick={handleSearchClick}
          className="w-full flex items-center justify-center h-9 rounded-lg border border-sidebar-border hover:border-muted-foreground/30 hover:bg-muted/50 text-muted-foreground transition-all duration-200"
          title="Buscar (Cmd+K)"
        >
          <Search className="h-4 w-4" />
        </button>
      ) : (
        <div className="relative flex items-center group">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-brand-500 transition-colors" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs rounded-lg border-border/40 focus-visible:ring-brand-500/30 focus-visible:border-brand-500 transition-all bg-card/20"
          />
          <div className="absolute right-3 hidden sm:flex items-center gap-0.5 select-none pointer-events-none text-[10px] font-medium text-muted-foreground bg-muted border border-border px-1 py-0.5 rounded font-mono">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      )}
    </div>
  );
}
