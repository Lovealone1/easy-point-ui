'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { requestAdminOtp, verifyAdminOtp } from '@/features/auth/services/admin-auth.service';
import { useAdminAuthStore } from '@/shared/store/use-admin-auth-store';

/**
 * Sign-in for the administration console.
 *
 * A separate sign-in from the dashboard's, not a confirmation step on top of
 * it: being signed into an organization grants nothing here, and the code that
 * arrives by email is minted under its own intent, so a dashboard code will
 * not open the console.
 *
 * The form asks for an email and a code and nothing else. There is no
 * registration path — a console operator is a global administrator who already
 * exists.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearSession = useAdminAuthStore((s) => s.clearSession);

  // Arriving here means the console session is gone or was never opened.
  // Drop whatever the store still holds so the shell cannot flash stale chrome
  // on the way back in.
  useEffect(() => {
    clearSession();
  }, [clearSession]);

  const handleRequestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const response = await requestAdminOtp(email.trim().toLowerCase());
      if (response.error) {
        toast.error(response.error.message);
        return;
      }
      // Says "if the address can access the console" rather than "sent",
      // because the API answers identically either way — it will not confirm
      // who holds admin rights.
      toast.success('Si la dirección tiene acceso al panel, recibirás un código.');
      setStep('code');
    } catch {
      toast.error('No se pudo contactar el servicio de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (code.trim().length < 6) return;

    setIsLoading(true);
    try {
      const response = await verifyAdminOtp(email.trim().toLowerCase(), code.trim());
      if (response.error) {
        toast.error(response.error.message);
        return;
      }
      // A full navigation, not router.push: the console cookies were just set
      // and the shell must boot against them from scratch.
      window.location.assign('/admin');
    } catch {
      toast.error('No se pudo contactar el servicio de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 shadow-xl">
      <div className="flex flex-col items-center text-center mb-8">
        <Image
          src="/global/easypoint-logo.png"
          alt="EasyPoint"
          width={150}
          height={42}
          className="object-contain w-auto h-auto mb-6"
          priority
        />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Shield className="h-3 w-3" />
          Panel de administración
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {step === 'email' ? 'Acceso de administrador' : 'Ingresa tu código'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {step === 'email'
            ? 'Esta es una sesión aparte de la de tu organización. Iniciar sesión aquí no cierra la otra, ni al revés.'
            : `Enviamos un código a ${email}. Vence en pocos minutos.`}
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-sm font-medium">
              Correo electrónico
            </label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar código'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-code" className="text-sm font-medium">
              Código de verificación
            </label>
            <Input
              id="admin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || code.length < 6}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar al panel'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setCode('');
            }}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Usar otro correo
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-border/40 text-center">
        <button
          type="button"
          onClick={() => router.push('/workspace')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Volver a mis espacios de trabajo
        </button>
      </div>
    </div>
  );
}
