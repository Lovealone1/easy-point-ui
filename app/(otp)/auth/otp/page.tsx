import { Suspense } from 'react';
import { OtpView } from '@/features/auth/components/otp-view';

export default function OTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground">Cargando...</div>}>
      <OtpView />
    </Suspense>
  );
}
