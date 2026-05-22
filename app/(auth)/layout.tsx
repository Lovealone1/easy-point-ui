import { Toaster } from '@/shared/components/ui/sonner';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Left Panel: Floating Frame Marketing/Brand */}
      <div className="hidden lg:flex lg:w-[50%] p-2 lg:p-4">
        <div className="w-full h-full relative bg-[#090014] rounded-2xl overflow-hidden shadow-2xl p-10 xl:p-14">
          <Image
            src="/assets/abstract-erp-wallpaper.png"
            alt="EasyPoint"
            fill
            sizes="50vw"
            className="object-cover object-center"
            priority
          />
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-0" />
          
          {/* Text Content */}
          <div className="relative z-10 flex flex-col h-full justify-end">
            <div className="mb-12 max-w-lg">
              <h2 className="text-4xl xl:text-5xl font-bold leading-[1.15] text-white tracking-tight mb-5">
                Todo tu negocio desde un solo lugar
              </h2>
              <p className="text-lg text-white/80 leading-relaxed font-medium">
                El sistema ERP inteligente diseñado para centralizar, automatizar y escalar todas las operaciones de tu empresa.
              </p>
            </div>
            
            <p className="text-sm font-bold tracking-widest text-white/60 uppercase flex items-center gap-4">
              <span className="w-12 h-px bg-white/30" />
              Hecho por emprendedores para emprendedores
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Form Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Ambient background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 w-[380px] h-[380px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse-slow" />

        <header className="absolute top-0 left-0 w-full p-8 sm:px-12 lg:px-16 flex items-center z-10">
          <Image
            src="/global/easypoint-logo.png"
            alt="EasyPoint"
            width={180}
            height={50}
            className="object-contain"
            priority
          />
        </header>
        <main className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </main>

        {/* Footer Area */}
        <footer className="py-6 px-8 flex flex-col sm:flex-row items-center justify-end gap-6 text-muted-foreground text-sm border-t border-border/40">
          <p>© 2026 Easypoint Saas</p>
          <a href="#" className="hover:text-foreground transition-colors">Contact Us</a>
        </footer>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
