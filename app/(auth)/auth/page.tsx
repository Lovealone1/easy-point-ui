"use client";

import { useState } from 'react';
import { Mail, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import es from 'react-phone-number-input/locale/es.json';
import 'react-phone-number-input/style.css';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command';

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

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState<string | undefined>();

  return (
    <div className="w-full flex flex-col relative h-full justify-center">

      {/* Switcher (Login / Register) */}
      <div className="flex bg-muted/40 p-1 rounded-xl mb-10 border border-border/50">
        <button
          onClick={() => setView('login')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${view === 'login'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Login
        </button>
        <button
          onClick={() => setView('register')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${view === 'register'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Sign Up
        </button>
      </div>

      {view === 'login' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-[2.75rem] font-bold tracking-tight text-foreground mb-3">
              Bienvenido de vuelta!
            </h1>
            <p className="text-muted-foreground text-[1.05rem] leading-relaxed">
              Inicia sesión para acceder a tu panel administrativo y continuar manejando tu negocio de forma eficiente.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="w-5 h-5" />
                </div>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 pl-12 pr-4 rounded-lg bg-background border-border/70 focus-visible:ring-primary/20"
                />
              </div>
            </div>



            {/* Submit Button */}
            <Button
              type="button"
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold"
            >
              Iniciar sesión
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center justify-center">
            <div className="h-px bg-border/60 flex-1" />
            <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">or</span>
            <div className="h-px bg-border/60 flex-1" />
          </div>

          {/* Social Login */}
          <Button
            variant="outline"
            className="w-full h-12 rounded-lg border-border/70 bg-card hover:bg-accent text-foreground font-semibold flex items-center justify-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-[2.75rem] font-bold tracking-tight text-foreground mb-3">
              Create an Account
            </h1>
            <p className="text-muted-foreground text-[1.05rem] leading-relaxed">
              Únete a EasyPoint y transforma la forma en que administras tu negocio. Completa tus datos para comenzar.
            </p>
          </div>

          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {/* Nombres */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nombres</label>
                <div className="relative">
                  <Input type="text" placeholder="Tus nombres" className="h-12 px-4 rounded-lg bg-background border-border/70" />
                </div>
              </div>

              {/* Apellidos */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Apellidos</label>
                <div className="relative">
                  <Input type="text" placeholder="Tus apellidos" className="h-12 px-4 rounded-lg bg-background border-border/70" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="w-5 h-5" />
                </div>
                <Input type="email" placeholder="ejemplo@empresa.com" className="h-12 pl-12 pr-4 rounded-lg bg-background border-border/70 focus-visible:ring-primary/20" />
              </div>
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Celular</label>
              <div className="relative w-full h-12 flex items-center px-3 rounded-lg bg-background border border-border/70 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors">
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
                    placeholder: "Tu número de celular"
                  }}
                />
              </div>
            </div>

            <Button type="button" className="w-full h-12 mt-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold">
              Crear cuenta
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
