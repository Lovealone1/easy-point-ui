// ─────────────────────────────────────────────────────────────────────────────
// app/page.tsx
//
// Marketing landing page. Placeholder for now — the real one is a separate
// design effort. What matters here is that `/` is claimed and public: proxy.ts
// exempts it from the session gate, and no in-app redirect targets it, so an
// authenticated user is never dumped out of the product onto this page.
//
// It sits on the bare root layout, which mounts no providers, so it costs
// nothing in auth or query machinery.
// ─────────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'EasyPoint — Todo tu negocio desde un solo lugar',
  description:
    'Gestiona tu negocio y tus suscripciones personales desde una sola plataforma.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-foreground">
      <div className="w-full max-w-xl text-center space-y-8">
        <Image
          src="/global/easypoint-logo.png"
          alt="EasyPoint"
          width={200}
          height={56}
          className="object-contain w-auto h-14 mx-auto"
          priority
        />

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Todo tu negocio desde un solo lugar
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Inventario, ventas y finanzas para tu organización. Y un espacio personal para
            no perderle el rastro a tus suscripciones.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground font-semibold transition-transform active:scale-[0.98] hover:bg-primary/95"
          >
            Entrar
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-border font-semibold text-foreground transition-colors hover:bg-muted/60"
          >
            Crear una cuenta
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/70">
          7 días de prueba con acceso completo. Sin tarjeta.
        </p>
      </div>
    </main>
  );
}
