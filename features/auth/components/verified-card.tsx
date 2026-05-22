export function VerifiedCard() {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Premium success SVG checkmark scene */}
      <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
        {/* Soft emerald radial ripple layers */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 animate-ping duration-[1800ms] scale-150" />
        <div className="absolute inset-2 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 animate-pulse duration-[1200ms]" />
        
        {/* Self-drawing checkmark SVG */}
        <svg className="w-16 h-16 text-emerald-500 relative z-10" viewBox="0 0 52 52">
          <circle 
            className="success-checkmark__circle" 
            cx="26" 
            cy="26" 
            r="25" 
            fill="none" 
          />
          <path 
            className="success-checkmark__check" 
            fill="none" 
            d="M14.1 27.2l7.1 7.2 16.7-16.8" 
          />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300 fill-mode-both">
        ¡Verificado!
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-[240px] mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500 delay-500 fill-mode-both">
        Redirigiendo a tu panel...
      </p>
    </div>
  );
}

