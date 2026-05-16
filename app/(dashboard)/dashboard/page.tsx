"use client";

import { Button } from '@/shared/components/ui/button';

export default function Home() {
  const brandShades = [
    { shade: '50', bg: 'bg-brand-50' },
    { shade: '100', bg: 'bg-brand-100' },
    { shade: '200', bg: 'bg-brand-200' },
    { shade: '300', bg: 'bg-brand-300' },
    { shade: '400', bg: 'bg-brand-400' },
    { shade: '500', bg: 'bg-brand-500' },
    { shade: '600', bg: 'bg-brand-600' },
    { shade: '700', bg: 'bg-brand-700' },
    { shade: '800', bg: 'bg-brand-800' },
    { shade: '900', bg: 'bg-brand-900' },
    { shade: '950', bg: 'bg-brand-950' },
  ];

  return (
    <div className="min-h-screen p-8 md:p-12 lg:p-24 bg-background text-foreground transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
            <p className="text-xl text-muted-foreground">
              Exploración de la colorimetría global. Tema principal basado en <span className="font-mono text-primary font-semibold">#571777</span>.
            </p>
          </div>
        </header>

        {/* Brand Shades Palette */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Brand Palette</h2>
            <p className="text-sm text-muted-foreground mt-1">Escala de colores extraídos automáticamente (50 - 950).</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-11 gap-4">
            {brandShades.map(({ shade, bg }) => (
              <div key={shade} className="flex flex-col gap-2">
                <div 
                  className={`h-24 w-full rounded-xl border border-border shadow-sm ${bg}`}
                  title={bg}
                />
                <div className="text-center">
                  <span className="text-xs font-medium">{shade}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Surface Colors & Cards */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Surfaces & Containers</h2>
            
            <div className="grid gap-6">
              {/* Card Surface */}
              <div className="p-6 rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                <h3 className="font-semibold text-lg">Card Component</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Usando bg-card y text-card-foreground. En dark mode será negro con tinte morado.
                </p>
              </div>

              {/* Secondary Surface */}
              <div className="p-6 rounded-xl border border-border bg-secondary text-secondary-foreground">
                <h3 className="font-semibold text-lg">Secondary Surface</h3>
                <p className="text-sm opacity-80 mt-2">
                  Usando bg-secondary. Ideal para contenedores secundarios o paneles laterales.
                </p>
              </div>

              {/* Muted Surface */}
              <div className="p-6 rounded-xl bg-muted text-muted-foreground">
                <h3 className="font-semibold text-lg">Muted Surface</h3>
                <p className="text-sm mt-2">
                  Ideal para estados inactivos, fondos de código o placeholders.
                </p>
              </div>
              
              {/* Accent Surface */}
              <div className="p-6 rounded-xl border border-border bg-accent text-accent-foreground">
                <h3 className="font-semibold text-lg">Accent Surface</h3>
                <p className="text-sm opacity-80 mt-2">
                  Para destacar algo de manera sutil o estados hover.
                </p>
              </div>
            </div>
          </section>

          {/* Interactive Elements & Buttons */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Interactive Elements</h2>
            
            <div className="p-8 rounded-xl border border-border bg-card shadow-sm space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Primary</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="default">Primary Button</Button>
                  <Button variant="default" disabled>Disabled</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Secondary</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Destructive</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="destructive">Delete Action</Button>
                </div>
              </div>

              {/* Form Input Simulation */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Inputs</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email address</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="text-[0.8rem] text-muted-foreground">Focus en el input para ver el ring morado.</p>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
