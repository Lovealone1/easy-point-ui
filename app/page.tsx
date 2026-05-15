'use client';

import { Button } from "@/shared/components/ui/button";
import { LayoutDashboard, Users, Settings, LogOut, Package, CreditCard, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/use-auth-store";

export default function Home() {
  const { logout } = useAuthStore();

  const handleTestToast = () => {
    toast.success("¡Stack configurado correctamente!", {
      description: "Axios, TanStack Query, Zustand y Shadcn están listos.",
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-slate-50 dark:bg-slate-950">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-12">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Easy Point ERP - Base Productiva Inicializada
        </p>
      </div>

      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
          Bienvenido a tu <span className="text-primary">ERP SaaS</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Hemos configurado todo lo necesario: Autenticación con Zustand, Cliente API con Refresh Tokens, TanStack Query y componentes UI modernos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <Card title="Inventario" icon={<Package className="w-6 h-6 text-blue-500" />} description="Gestión de productos y stock." />
        <Card title="Ventas" icon={<CreditCard className="w-6 h-6 text-green-500" />} description="Control de transacciones y cobros." />
        <Card title="Reportes" icon={<BarChart3 className="w-6 h-6 text-purple-500" />} description="Análisis detallado de tu negocio." />
      </div>

      <div className="mt-12 flex flex-wrap gap-4 justify-center">
        <Button
          size="lg"
          onClick={handleTestToast}
          className="shadow-lg shadow-primary/20"
        >
          Verificar Configuración
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => toast.info("Redirigiendo a documentación...")}
        >
          Guía de Arquitectura
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={logout}
          className="text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Salir
        </Button>
      </div>

      <footer className="mt-24 text-slate-400 text-sm">
        Next.js 15+ & Tailwind v4 & Shadcn UI & TanStack Query
      </footer>
    </main>
  );
}

function Card({ title, icon, description }: { title: string; icon: React.ReactNode, description: string }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-primary/5 transition-colors">
          {icon}
        </div>
        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-primary transition-colors" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{description}</p>
    </div>
  );
}
