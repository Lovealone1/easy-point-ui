import { Loader2 } from 'lucide-react';

export function TransitionCard() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
        Preparando tu código...
      </h2>
      <p className="text-muted-foreground text-center text-sm max-w-[280px]">
        Estamos enviando un código de acceso seguro a tu correo electrónico.
      </p>
    </div>
  );
}
