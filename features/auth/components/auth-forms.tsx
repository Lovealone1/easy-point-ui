"use client";

import { useState } from 'react';
import { Mail, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import es from 'react-phone-number-input/locale/es.json';
import 'react-phone-number-input/style.css';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { requestOtp } from '@/features/auth/services/auth.service';
import { TransitionCard } from './transition-card';
import { useAuthBrandingReset } from '@/shared/components/providers/branding-provider';

const CountrySelect = ({ value, onChange, labels, options, iconComponent: Icon }: any) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-1 px-2 text-sm font-medium focus:outline-none focus:ring-0">
        {value ? <Icon country={value} label={labels?.[value] || (es as any)[value] || value} /> : <span className="text-muted-foreground">🌍</span>}
        <ChevronsUpDown className="w-3 h-3 text-muted-foreground ml-1" />
      </PopoverTrigger>
      <PopoverContent side="top" className="w-[320px] p-0" align="start" alignOffset={-12} sideOffset={25}>
        <Command>
          <CommandInput placeholder="Buscar país..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((option: any) => (
                <CommandItem
                  key={option.value || 'ZZ'}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value || '');
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon country={option.value} label={option.label} />
                    <span className="text-sm flex-1 truncate">{option.label}</span>
                    {option.value && (
                      <span className="text-muted-foreground text-xs font-mono">
                        +{getCountryCallingCode(option.value)}
                      </span>
                    )}
                  </div>
                  <Check
                    className={`ml-auto h-4 w-4 ${value === option.value ? "opacity-100" : "opacity-0"}`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export function AuthForms() {
  useAuthBrandingReset();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [emailLogin, setEmailLogin] = useState('');

  // Register fields
  const [emailRegister, setEmailRegister] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const router = useRouter();
  const setPendingVerification = useAuthStore((state) => state.setPendingVerification);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await requestOtp(emailLogin, 'login');
      if (res.error) {
        setError(res.error.message);
        return;
      }
      setPendingVerification(emailLogin, 'login');
      setIsTransitioning(true);
      setTimeout(() => {
        router.push('/auth/otp');
      }, 2000);
    } catch {
      setError('No se pudo conectar con el servicio. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegister || !firstName || !lastName || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await requestOtp(emailRegister, 'register');
      if (res.error) {
        setError(res.error.message);
        return;
      }
      setPendingVerification(emailRegister, 'register', { firstName, lastName, phoneNumber: phone });
      setIsTransitioning(true);
      setTimeout(() => {
        router.push('/auth/otp');
      }, 2000);
    } catch {
      setError('No se pudo conectar con el servicio. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col relative h-full justify-center">
      {isTransitioning ? (
        <TransitionCard />
      ) : (
        <div className="w-full glassy-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-300">
          {/* Switcher (Login / Register) */}
          <div className="relative flex bg-muted/30 dark:bg-muted/10 p-1 rounded-xl mb-8 border border-border/40 backdrop-blur-md">
            {/* Sliding background pill */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background dark:bg-card border border-border/20 shadow-sm rounded-lg transition-transform duration-300 ease-out ${
                view === 'register' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              onClick={() => { setView('login'); setError(null); }}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-300 ${
                view === 'login' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setView('register'); setError(null); }}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-300 ${
                view === 'register' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Registrarse
            </button>
          </div>

          <div className="relative overflow-hidden w-full -mx-1.5 px-1.5">
            <div
              className="flex transition-transform duration-500 ease-in-out w-[200%]"
              style={{
                transform: view === 'login' ? 'translateX(0%)' : 'translateX(-50%)',
              }}
            >
              {/* Login Form Panel */}
              <div className="w-1/2 shrink-0 pr-2 transition-opacity duration-300" style={{ opacity: view === 'login' ? 1 : 0, pointerEvents: view === 'login' ? 'auto' : 'none' }}>
                {/* Heading */}
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
                    ¡Bienvenido de vuelta!
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-[0.95rem] leading-relaxed">
                    Inicia sesión para acceder a tu panel administrativo y continuar manejando tu negocio.
                  </p>
                </div>

                {/* Error banner */}
                {error && view === 'login' && (
                  <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in fade-in zoom-in duration-300">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <Input
                        type="email"
                        required
                        value={emailLogin}
                        onChange={(e) => setEmailLogin(e.target.value)}
                        placeholder="tu@email.com"
                        className="h-12 pl-12 pr-4 rounded-lg bg-background border-border/70 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-base font-semibold transition-transform active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando código...</>
                    ) : 'Iniciar sesión'}
                  </Button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center justify-center">
                  <div className="h-px bg-border/60 flex-1" />
                  <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">o</span>
                  <div className="h-px bg-border/60 flex-1" />
                </div>

                {/* Social Login */}
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-12 rounded-lg border-border/70 bg-card hover:bg-accent text-foreground font-semibold flex items-center justify-center gap-3 transition-all hover:border-primary/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
              </div>

              {/* Register Form Panel */}
              <div className="w-1/2 shrink-0 pl-2 transition-opacity duration-300" style={{ opacity: view === 'register' ? 1 : 0, pointerEvents: view === 'register' ? 'auto' : 'none' }}>
                {/* Heading */}
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
                    Crea tu cuenta
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-[0.95rem] leading-relaxed">
                    Únete a EasyPoint y transforma la forma en que administras tu negocio.
                  </p>
                </div>

                {/* Error banner */}
                {error && view === 'register' && (
                  <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in fade-in zoom-in duration-300">
                    {error}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Nombres */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Nombres</label>
                      <Input
                        required
                        type="text"
                        placeholder="Tus nombres"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-12 px-4 rounded-lg bg-background border-border/70 focus-visible:border-primary transition-all duration-200"
                      />
                    </div>

                    {/* Apellidos */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Apellidos</label>
                      <Input
                        required
                        type="text"
                        placeholder="Tus apellidos"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-12 px-4 rounded-lg bg-background border-border/70 focus-visible:border-primary transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <Input
                        type="email"
                        required
                        value={emailRegister}
                        onChange={(e) => setEmailRegister(e.target.value)}
                        placeholder="ejemplo@empresa.com"
                        className="h-12 pl-12 pr-4 rounded-lg bg-background border-border/70 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Celular */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Celular</label>
                    <div className="relative w-full h-12 flex items-center px-3 rounded-lg bg-background border border-border/70 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
                      <PhoneInput
                        international
                        defaultCountry="CO"
                        value={phone}
                        onChange={setPhone}
                        labels={es}
                        countrySelectComponent={CountrySelect}
                        className="w-full flex"
                        numberInputProps={{
                          className: "flex-1 bg-transparent border-none outline-none focus:ring-0 text-foreground ml-1 text-sm",
                          placeholder: "Número de celular"
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-base font-semibold transition-transform active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando código...</>
                    ) : 'Crear cuenta'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
