"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/components/ui/input-otp";
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { verifyOtp } from '@/shared/services/auth.service';
import { VerifiedCard } from './verified-card';

export function OtpView() {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();

  const pendingVerificationEmail = useAuthStore((s) => s.pendingVerificationEmail);
  const pendingIntent = useAuthStore((s) => s.pendingIntent);
  const setUserFromLogin = useAuthStore((s) => s.setUserFromLogin);
  const setPendingVerification = useAuthStore((s) => s.setPendingVerification);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    if (!pendingVerificationEmail && !isSuccess) {
      router.replace('/auth');
    }
  }, [pendingVerificationEmail, isSuccess, router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (otp.length === 6 && pendingVerificationEmail && pendingIntent) {
      void handleVerify(otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleVerify = async (code: string) => {
    if (!pendingVerificationEmail || !pendingIntent || isVerifying) return;
    setError(null);
    setIsVerifying(true);

    try {
      const res = await verifyOtp(pendingVerificationEmail, code, pendingIntent);

      if (res.error) {
        setError(res.error.message);
        setOtp('');
        return;
      }

      setUserFromLogin(res.data.user);
      setIsSuccess(true);
      setPendingVerification('', pendingIntent);

      setTimeout(() => {
        router.replace('/dashboard');
      }, 800);
    } catch {
      setError('No se pudo verificar el código. Intenta de nuevo.');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    setTimeLeft(60);
    setOtp('');
    setError(null);
  };

  if (!pendingVerificationEmail && !isSuccess) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background text-foreground">
      <header className="absolute top-0 left-0 w-full p-6 sm:p-10 flex items-center justify-start z-10">
        <Image
          src="/global/easypoint-logo.png"
          alt="EasyPoint"
          width={140}
          height={40}
          className="object-contain w-auto h-auto"
          priority
        />
      </header>

      <div className="w-full max-w-[32rem] px-6 sm:px-0">
        <div className="bg-white dark:bg-card border border-border/60 shadow-[8px_8px_20px_-6px_rgba(0,0,0,0.12)] rounded-xl p-8 sm:p-10 relative">
          <div className="mb-6">
            <Link
              href="/auth"
              onClick={() => clearSession()}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a página de auth
            </Link>
          </div>

          <div className="flex flex-col items-center text-center mb-8">
            {isSuccess ? (
              <VerifiedCard />
            ) : (
              <>
                <Lock className="w-12 h-12 text-primary/80 mb-6" strokeWidth={1.5} />
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                  Verifica tu cuenta
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Por favor revisa tu correo electrónico, un código de 6 dígitos fue enviado a{' '}
                  <span className="font-semibold text-primary">{pendingVerificationEmail}</span>.
                </p>
              </>
            )}
          </div>

          {!isSuccess && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-full flex flex-col items-center gap-3">
                <label className="text-sm font-medium text-foreground">
                  Digita tu código de 6 dígitos
                </label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isVerifying || isSuccess}
                >
                  <InputOTPGroup className="gap-2 sm:gap-3">
                    <InputOTPSlot index={0} className="size-12 sm:size-14 text-lg sm:text-xl font-semibold bg-background rounded-md border border-border/70 focus:border-primary focus:ring-primary/20" />
                    <InputOTPSlot index={1} className="size-12 sm:size-14 text-lg sm:text-xl font-semibold bg-background rounded-md border border-border/70 focus:border-primary focus:ring-primary/20" />
                    <InputOTPSlot index={2} className="size-12 sm:size-14 text-lg sm:text-xl font-semibold bg-background rounded-md border border-border/70 focus:border-primary focus:ring-primary/20" />
                    <InputOTPSlot index={3} className="size-12 sm:size-14 text-lg sm:text-xl font-semibold bg-background rounded-md border border-border/70 focus:border-primary focus:ring-primary/20" />
                    <InputOTPSlot index={4} className="size-12 sm:size-14 text-lg sm:text-xl font-semibold bg-background rounded-md border border-border/70 focus:border-primary focus:ring-primary/20" />
                    <InputOTPSlot index={5} className="size-12 sm:size-14 text-lg sm:text-xl font-semibold bg-background rounded-md border border-border/70 focus:border-primary focus:ring-primary/20" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {isVerifying && (
                <div className="flex items-center gap-2 text-primary font-medium animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando código...
                </div>
              )}

              {error && (
                <div className="w-full px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 text-center">
                  {error}
                </div>
              )}

              <div className="w-full h-px bg-border/40" />

              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-sm text-muted-foreground text-center">
                  ¿No recibiste el código o expiró?
                </p>
                {timeLeft > 0 ? (
                  <span className="text-sm font-semibold text-foreground/80 bg-secondary/50 px-5 py-2.5 rounded-full tabular-nums">
                    Podrás solicitar otro en 00:{timeLeft.toString().padStart(2, '0')}
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    className="w-full sm:w-auto rounded-full px-8 h-11 font-semibold border-border hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    Reenviar código
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-sm font-medium text-muted-foreground">
          <Link href="/terms" className="hover:text-primary transition-colors">
            Términos de servicio
          </Link>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Política de privacidad
          </Link>
        </div>
      </div>
    </div>
  );
}
