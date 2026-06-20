"use client";

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/shared/store/use-auth-store';

export default function UnauthorizedPage() {
  const { activeOrganization } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative mb-6">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-brand-500/10 blur-xl animate-pulse"></div>
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500">
          <ShieldAlert className="w-10 h-10 stroke-[1.5]" />
        </div>
      </div>

      <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight sm:text-3xl">
        Acceso Restringido (403)
      </h1>
      
      <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed font-medium">
        El módulo que intentas acceder no se encuentra activo en la organización{' '}
        <span className="text-brand-500 font-bold">{activeOrganization?.name || 'actual'}</span>.
      </p>
      
      <p className="mt-2 text-xs text-muted-foreground/85 max-w-sm leading-relaxed">
        Si requieres habilitar esta funcionalidad, ponte en contacto con el administrador de tu cuenta o solicita una actualización de plan.
      </p>

      <div className="mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-5 h-10 text-xs font-semibold rounded-[11px] bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/15"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
