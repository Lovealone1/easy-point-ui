import { CheckCircle2 } from 'lucide-react';

export function VerifiedCard() {
  return (
    <div className="flex flex-col items-center text-center">
      <CheckCircle2 className="w-12 h-12 text-green-500 mb-6 animate-in zoom-in duration-300" />
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
        ¡Verificado!
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        Redirigiendo a tu panel...
      </p>
    </div>
  );
}
