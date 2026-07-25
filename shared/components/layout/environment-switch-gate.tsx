'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { useEnvironmentSwitchStore } from '@/shared/store/use-environment-switch-store';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { ConfirmModal } from '@/shared/components/ui/confirm-modal';
import EnvironmentSplash from '@/shared/components/ui/environment-splash';

const MIN_TRANSITION_MS = 700;

/**
 * Toll gate for leaving the admin panel back to the tenant dashboard.
 * There is no dashboard → admin direction — the dashboard never links
 * into admin (see UserMenu).
 */
export default function EnvironmentSwitchGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { phase, href, transitionStartedAt, confirm, cancel, finish } =
    useEnvironmentSwitchStore();
  const activeOrganization = useAuthStore((s) => s.activeOrganization);

  // Runs in whichever gate instance is currently mounted — the admin shell's
  // while navigation is in flight, the dashboard's once it lands.
  // transitionStartedAt lives in the store, so the minimum-duration floor
  // survives that unmount/remount boundary.
  useEffect(() => {
    if (phase !== 'transitioning') return;
    if (pathname?.startsWith('/admin')) return;

    const elapsed = transitionStartedAt ? Date.now() - transitionStartedAt : MIN_TRANSITION_MS;
    const remaining = Math.max(0, MIN_TRANSITION_MS - elapsed);
    const timer = setTimeout(() => finish(), remaining);
    return () => clearTimeout(timer);
  }, [phase, pathname, transitionStartedAt, finish]);

  return (
    <>
      <ConfirmModal
        isOpen={phase === 'confirming'}
        onClose={cancel}
        onConfirm={() => {
          confirm();
          if (href) router.push(href);
        }}
        variant="warning"
        title="Volver a tu organización"
        description={`Vas a volver al entorno de «${activeOrganization?.name || 'tu organización'}».`}
        confirmLabel="Continuar"
      />
      <AnimatePresence>
        {phase === 'transitioning' && (
          <EnvironmentSplash key="environment-switch-splash" label="Volviendo a tu organización" />
        )}
      </AnimatePresence>
    </>
  );
}
