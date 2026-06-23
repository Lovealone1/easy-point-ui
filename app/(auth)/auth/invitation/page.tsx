"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Check, ChevronsUpDown, Loader2, AlertCircle, Sparkles, Building2, UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import es from 'react-phone-number-input/locale/es.json';
import 'react-phone-number-input/style.css';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { requestOtp, getMe } from '@/features/auth/services/auth.service';
import { invitationsService } from '@/features/invitations/services/invitations.service';
import { toast } from 'sonner';
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

function InvitationAcceptContent() {
  useAuthBrandingReset();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<{
    email: string;
    role: string;
    organizationName: string;
  } | null>(null);

  // Auth Store state
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setPendingVerification = useAuthStore((s) => s.setPendingVerification);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setUserFromLogin = useAuthStore((s) => s.setUserFromLogin);
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile);
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization);
  const setOrganizationConfig = useAuthStore((s) => s.setOrganizationConfig);

  // Forms state
  const [view, setView] = useState<'register' | 'login'>('register');
  const [phone, setPhone] = useState<string | undefined>();
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // 1. Verify invitation token and recover session on mount
  useEffect(() => {
    if (!token) {
      setErrorMsg('El token de invitación no está presente en la URL.');
      setLoading(false);
      return;
    }

    async function verifyAndRecover() {
      try {
        const data = await invitationsService.verify(token!);
        setInvitationData(data);

        // Try to recover user session if store shows not authenticated
        if (!isAuthenticated) {
          try {
            const me = await getMe();
            if (me && me.id) {
              setUserFromLogin({ id: me.id, email: me.email });
              hydrateProfile({
                firstName: me.firstName || null,
                lastName: me.lastName || null,
                fullName: me.firstName && me.lastName ? `${me.firstName} ${me.lastName}` : null,
                avatarUrl: undefined,
                globalRole: me.globalRole || null,
              });
            }
          } catch {
            // Silently ignore session recovery failures (user is not logged in)
          }
        }
      } catch (err: any) {
        setErrorMsg(
          err?.response?.data?.message ||
          'La invitación no es válida, ha expirado o ya fue utilizada.'
        );
      } finally {
        setLoading(false);
      }
    }

    void verifyAndRecover();
  }, [token, isAuthenticated, setUserFromLogin, hydrateProfile]);

  // Translate Role keys
  const getRoleLabel = (roleName: string) => {
    switch (roleName) {
      case 'ADMINISTRATOR':
        return 'Administrador';
      case 'COLLABORATOR':
        return 'Colaborador';
      case 'USER':
        return 'Usuario Regular';
      default:
        return roleName;
    }
  };

  // Direct Accept if logged in with matching email
  const handleDirectAccept = async () => {
    if (!token || !invitationData) return;
    setIsLoadingForm(true);
    setErrorForm(null);
    try {
      await invitationsService.accept(token);
      toast.success('¡Invitación aceptada exitosamente!');
      
      // Show loader message while preloading organization configurations
      toast.loading('Cargando configuraciones de la organización...', { id: 'loading-configs' });
      
      const data = await getMe();
      if (data && data.id) {
        setUserFromLogin({ id: data.id, email: data.email });
        hydrateProfile({
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          fullName: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null,
          avatarUrl: undefined,
          globalRole: data.globalRole || null,
        });

        if (data.organizations && data.organizations.length > 0) {
          const firstOrg = data.organizations[0];
          setActiveOrganization(
            { id: firstOrg.id, name: firstOrg.name, slug: firstOrg.slug },
            { orgRoles: [firstOrg.role], permissions: firstOrg.permissions ?? [] }
          );
          if (firstOrg.config) {
            setOrganizationConfig(firstOrg.config);
          }
        }
      }
      
      toast.success('Configuraciones cargadas.', { id: 'loading-configs' });
      router.replace('/dashboard');
    } catch (err: any) {
      toast.dismiss('loading-configs');
      setErrorForm(
        err?.response?.data?.message ||
        'Error al aceptar la invitación.'
      );
    } finally {
      setIsLoadingForm(false);
    }
  };

  // Handle registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationData || !firstName || !lastName || isLoadingForm) return;
    setErrorForm(null);
    setIsLoadingForm(true);
    try {
      const res = await requestOtp(invitationData.email, 'register');
      if (res.error) {
        setErrorForm(res.error.message);
        return;
      }
      setPendingVerification(invitationData.email, 'register', { firstName, lastName, phoneNumber: phone });
      toast.info('Código de verificación enviado a tu correo');
      router.push(`/auth/otp?intent=register&token=${token}`);
    } catch {
      setErrorForm('No se pudo conectar con el servicio. Intenta de nuevo.');
    } finally {
      setIsLoadingForm(false);
    }
  };

  // Handle login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationData || isLoadingForm) return;
    setErrorForm(null);
    setIsLoadingForm(true);
    try {
      const res = await requestOtp(invitationData.email, 'login');
      if (res.error) {
        setErrorForm(res.error.message);
        return;
      }
      setPendingVerification(invitationData.email, 'login');
      toast.info('Código de verificación enviado a tu correo');
      router.push(`/auth/otp?intent=login&token=${token}`);
    } catch {
      setErrorForm('No se pudo conectar con el servicio. Intenta de nuevo.');
    } finally {
      setIsLoadingForm(false);
    }
  };

  // Loading state render
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm font-medium">
          Verificando tu invitación...
        </p>
      </div>
    );
  }

  // Error state render
  if (errorMsg || !invitationData) {
    return (
      <div className="w-full glassy-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md border border-destructive/20 text-center animate-in fade-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="bg-destructive/10 rounded-full p-4 border border-destructive/25 text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Enlace de Invitación Inválido
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed">
          {errorMsg || 'El enlace que seguiste no es válido o ha caducado.'}
        </p>
        <Button
          onClick={() => router.replace('/auth')}
          className="w-full h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
        >
          Ir al Inicio de Sesión
        </Button>
      </div>
    );
  }

  // Check matching email
  const isMatchingEmail = isAuthenticated && user?.email?.toLowerCase() === invitationData.email.toLowerCase();

  return (
    <div className="w-full flex flex-col relative h-full justify-center">
      {/* ── Match/Already Logged In View ────────────────────────────────────────── */}
      {isMatchingEmail ? (
        <div className="w-full glassy-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md border border-border/40 text-center animate-in fade-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse duration-[1500ms]" />
              <div className="relative bg-gradient-to-tr from-primary/20 to-primary/5 rounded-full p-4 border border-primary/25 shadow-md">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Invitación Recibida
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed">
            Has sido invitado a unirte a <span className="font-semibold text-primary">{invitationData.organizationName}</span> con el rol de <span className="font-semibold text-primary">{getRoleLabel(invitationData.role)}</span>.
          </p>
          
          {errorForm && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 text-left">
              {errorForm}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleDirectAccept}
              disabled={isLoadingForm}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-base font-semibold transition-transform active:scale-[0.98]"
            >
              {isLoadingForm ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Aceptando...</>
              ) : 'Aceptar Invitación y Entrar'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Estás conectado como <span className="font-semibold text-foreground">{user?.email}</span>
            </p>
          </div>
        </div>
      ) : isAuthenticated ? (
        /* ── Logged In with Different Email View ─────────────────────────────────── */
        <div className="w-full glassy-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md border border-yellow-500/20 text-center animate-in fade-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-500/10 rounded-full p-4 border border-yellow-500/25 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Conflicto de Cuentas
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed">
            Esta invitación está dirigida a <span className="font-semibold text-foreground">{invitationData.email}</span>, pero actualmente has iniciado sesión como <span className="font-semibold text-foreground">{user?.email}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                clearSession();
                router.refresh();
              }}
              className="w-full h-11 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
            >
              Cerrar sesión actual
            </Button>
            <Button
              variant="outline"
              onClick={() => router.replace('/dashboard')}
              className="w-full h-11 rounded-lg border-border"
            >
              Ir a mi panel
            </Button>
          </div>
        </div>
      ) : (
        /* ── Not Authenticated: Register or Login Prefilled ──────────────────────── */
        <div className="w-full glassy-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md border border-border/40 transition-all duration-300">
          {/* Organization Badge Header */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6">
            <Building2 className="w-8 h-8 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Te invitaron a unirte a</p>
              <h2 className="text-base font-bold text-foreground truncate">{invitationData.organizationName}</h2>
              <p className="text-xs text-muted-foreground truncate">Como: {getRoleLabel(invitationData.role)}</p>
            </div>
          </div>

          {/* Switcher */}
          <div className="relative flex bg-muted/30 dark:bg-muted/10 p-1 rounded-xl mb-6 border border-border/40">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background dark:bg-card border border-border/20 shadow-sm rounded-lg transition-transform duration-300 ease-out ${
                view === 'login' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              onClick={() => { setView('register'); setErrorForm(null); }}
              className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-300 ${
                view === 'register' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> Registrarse</span>
            </button>
            <button
              type="button"
              onClick={() => { setView('login'); setErrorForm(null); }}
              className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-300 ${
                view === 'login' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5"><LogIn className="w-3.5 h-3.5" /> Iniciar sesión</span>
            </button>
          </div>

          {/* Form Error Banner */}
          {errorForm && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
              {errorForm}
            </div>
          )}

          <div className="relative overflow-hidden w-full -mx-1.5 px-1.5">
            <div
              className="flex transition-transform duration-500 ease-in-out w-[200%]"
              style={{
                transform: view === 'register' ? 'translateX(0%)' : 'translateX(-50%)',
              }}
            >
              {/* Register Form */}
              <form className="w-1/2 shrink-0 pr-2 space-y-4" onSubmit={handleRegisterSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Nombres</label>
                    <Input
                      required
                      type="text"
                      placeholder="Tus nombres"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 px-4 rounded-lg bg-background border-border/70 focus-visible:border-primary transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Apellidos</label>
                    <Input
                      required
                      type="text"
                      placeholder="Tus apellidos"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 px-4 rounded-lg bg-background border-border/70 focus-visible:border-primary transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email (Invitado)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                    </div>
                    <Input
                      type="email"
                      readOnly
                      value={invitationData.email}
                      className="h-11 pl-10 pr-4 rounded-lg bg-muted/40 border-border/50 text-muted-foreground cursor-not-allowed focus-visible:ring-0 focus-visible:border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Celular</label>
                  <div className="relative w-full h-11 flex items-center px-3 rounded-lg bg-background border border-border/70 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
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
                  disabled={isLoadingForm}
                  className="w-full h-12 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-base font-semibold transition-transform active:scale-[0.98]"
                >
                  {isLoadingForm ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando código...</>
                  ) : 'Crear cuenta y unirme'}
                </Button>
              </form>

              {/* Login Form */}
              <form className="w-1/2 shrink-0 pl-2 space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                    </div>
                    <Input
                      type="email"
                      readOnly
                      value={invitationData.email}
                      className="h-11 pl-10 pr-4 rounded-lg bg-muted/40 border-border/50 text-muted-foreground cursor-not-allowed focus-visible:ring-0 focus-visible:border-border"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoadingForm}
                  className="w-full h-12 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-base font-semibold transition-transform active:scale-[0.98]"
                >
                  {isLoadingForm ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando código...</>
                  ) : 'Iniciar sesión y unirme'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvitationAcceptPage() {
  return (
    <Suspense fallback={
      <div className="w-full flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Cargando...</p>
      </div>
    }>
      <InvitationAcceptContent />
    </Suspense>
  );
}
