"use client";

import { useState, useEffect } from 'react';
import { useOrganizationsAdmin } from '@/features/organization/hooks/use-organizations-admin';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { Input } from '@/shared/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Building2,
  Mail,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch organizations
  const { data, isLoading, error, refetch } = useOrganizationsAdmin({
    search: debouncedSearch,
    limit: 50,
  });

  const getPlanStyles = (plan: string) => {
    switch (plan) {
      case 'PREMIUM':
        return 'bg-brand-500/10 text-brand-500 border-brand-500/20';
      case 'BASIC':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
          label: 'Activa',
        };
      case 'FROZEN':
        return {
          bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          dot: 'bg-amber-500',
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
          label: 'Congelada',
        };
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
          dot: 'bg-rose-500',
          icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
          label: 'Inactiva',
        };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatPlanActiveUntil = (dateString: string | null, plan: string) => {
    if (plan === 'FREE') return 'Permanente';
    if (!dateString) return 'No definida';
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const organizations = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Search Input (No container) */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <Input
          type="text"
          placeholder="Buscar organización por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 text-xs border-border bg-card focus-visible:ring-brand-500 placeholder:text-muted-foreground/50 shadow-sm"
        />
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <span className="text-xs text-muted-foreground font-medium">Buscando organizaciones...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Error al cargar datos</h3>
            <p className="text-[11px] text-muted-foreground">
              No pudimos conectar con el servidor. Por favor, intenta de nuevo.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline"
          >
            Reintentar consulta
          </button>
        </div>
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Sin resultados</h3>
            <p className="text-[11px] text-muted-foreground">
              No encontramos organizaciones que coincidan con la búsqueda actual.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map((org) => {
            const statusConfig = getStatusStyles(org.status);
            return (
              <div
                key={org.id}
                className="group relative flex flex-col justify-between overflow-hidden p-5 rounded-2xl border border-border/80 bg-card hover:border-brand-500/35 hover:shadow-md transition-all duration-300 shadow-sm"
              >
                {/* Background ambient light */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Top Section: Avatar & Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-500/5 border border-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-base select-none shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-foreground truncate group-hover:text-brand-500 transition-colors leading-tight">
                          {org.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground min-w-0">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate">{org.slug}.easypoint.app</span>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 select-none",
                      statusConfig.bg
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusConfig.dot)} />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2.5 pt-1.5 text-[11px] text-muted-foreground">
                    {/* Owner Email */}
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      {org.email ? (
                        <span className="truncate text-foreground/80">{org.email}</span>
                      ) : (
                        <span className="italic text-muted-foreground/40">Sin email</span>
                      )}
                    </div>

                    {/* Creation Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      <span>Creado el: <span className="text-foreground/85">{formatDate(org.createdAt)}</span></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Plan badge and renewal */}
                <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between gap-4 text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/85 font-medium">Plan asignado:</span>
                    <span className={cn(
                      "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1 max-w-max",
                      getPlanStyles(org.plan)
                    )}>
                      {org.plan}
                    </span>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-muted-foreground/85 font-medium">Vence:</span>
                    <span className="text-foreground/85 font-semibold mt-1">
                      {formatPlanActiveUntil(org.planActiveUntil, org.plan)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
