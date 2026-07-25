'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface SmoothScrollMainProps {
  children: React.ReactNode;
  className?: string;
}

export default function SmoothScrollMain({ children, className }: SmoothScrollMainProps) {
  const wrapperRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (!wrapperRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    if (!lenisRef.current) {
      wrapperRef.current?.scrollTo({ top: 0 });
    }
  }, [pathname]);

  return (
    <main ref={wrapperRef} className={className}>
      <div ref={contentRef}>
        <AnimatePresence mode="wait" initial={false}>
          {shouldReduceMotion ? (
            <div key={pathname}>{children}</div>
          ) : (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
