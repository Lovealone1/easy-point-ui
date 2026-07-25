'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Placeholder: no notifications yet
  const count = 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        id="header-notifications-btn"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
          "text-muted-foreground hover:text-foreground",
          "bg-transparent hover:bg-muted/60 border border-transparent hover:border-border/40",
          open && "bg-muted/60 border-border/40 text-foreground"
        )}
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      <div
        className={cn(
          "absolute right-0 top-[calc(100%+8px)] w-72 rounded-xl border border-border/50 bg-popover shadow-lg transition-all duration-200 z-50 overflow-hidden",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-[13px] font-semibold text-foreground tracking-tight">Notificaciones</span>
          {count > 0 && (
            <button className="text-[11px] text-primary hover:underline font-medium">
              Marcar todo como leído
            </button>
          )}
        </div>
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-8 px-4 gap-2">
          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-[12px] text-muted-foreground text-center">
            No tienes notificaciones nuevas
          </span>
        </div>
      </div>
    </div>
  );
}
