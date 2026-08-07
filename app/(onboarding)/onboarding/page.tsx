import { Suspense } from 'react';
import { OnboardingView } from '@/features/onboarding/components/onboarding-view';
import { PageLoader } from '@/shared/components/ui/spinner';

// OnboardingView reads ?space=personal via useSearchParams, which Next cannot
// prerender without a Suspense boundary around it.
export default function OnboardingPage() {
  return (
    <Suspense fallback={<PageLoader label="Preparando tu espacio..." />}>
      <OnboardingView />
    </Suspense>
  );
}
