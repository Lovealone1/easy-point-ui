import { Suspense } from 'react';
import { AuthForms } from '@/features/auth/components/auth-forms';

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForms />
    </Suspense>
  );
}
