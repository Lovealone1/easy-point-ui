'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

const EXIT_X = '-100%';

interface EnvironmentSplashProps {
  label?: string;
}

export default function EnvironmentSplash({ label = 'Preparando tu entorno' }: EnvironmentSplashProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-background"
      initial={false}
      exit={
        shouldReduceMotion
          ? { opacity: 0 }
          : { x: EXIT_X, transition: { duration: 0.75, ease: [0.83, 0, 0.17, 1] } }
      }
    >
      {/* Ambient brand glow — color-only, never transformed by Motion */}
      <div className="brand-fade pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-primary/10 blur-[100px]" />

      <motion.div
        className="relative flex flex-col items-center px-6"
        initial={false}
        exit={shouldReduceMotion ? undefined : { x: '-25%', opacity: 0, transition: { duration: 0.5, ease: [0.83, 0, 0.17, 1] } }}
      >
        <Image
          src="/global/easypoint-logo.png"
          alt="EasyPoint"
          width={180}
          height={50}
          className="mb-8 object-contain"
          priority
        />

        <p className="mb-6 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>

        <div className="relative h-[3px] w-[85vw] max-w-[760px] overflow-hidden rounded-full bg-foreground/10 sm:w-[70vw]">
          <motion.div
            className="brand-fade absolute inset-y-0 w-1/3 rounded-full bg-primary"
            animate={
              shouldReduceMotion
                ? undefined
                : { x: ['-100%', '300%'] }
            }
            transition={
              shouldReduceMotion
                ? undefined
                : { duration: 1.6, ease: 'easeInOut', repeat: Infinity }
            }
            style={shouldReduceMotion ? { width: '100%' } : undefined}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
