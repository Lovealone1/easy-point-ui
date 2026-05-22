import { Mail } from 'lucide-react';

export function TransitionCard() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8 animate-in fade-in zoom-in duration-500">
      {/* Decorative Sending Email Scene */}
      <div className="relative flex items-center justify-center w-24 h-24 mb-2">
        {/* Pulsing radar rings */}
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping duration-[2000ms] scale-150" />
        <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse duration-[1500ms]" />
        
        {/* Glowing glass center */}
        <div className="relative bg-gradient-to-tr from-primary/20 to-primary/5 rounded-full p-5 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
          <Mail className="w-10 h-10 text-primary animate-bounce duration-[2000ms]" strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Preparando tu código...
        </h2>
        <p className="text-muted-foreground text-sm max-w-[290px] mx-auto leading-relaxed">
          Estamos enviando un código de acceso seguro a tu correo electrónico.
        </p>
      </div>

      {/* Infinite scanning/loading bar */}
      <div className="w-full max-w-[240px] h-1.5 bg-muted dark:bg-muted/20 rounded-full overflow-hidden relative border border-border/20">
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-loading-scanner" />
      </div>
    </div>
  );
}

