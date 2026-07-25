import { create } from 'zustand';

type Phase = 'idle' | 'confirming' | 'transitioning';

interface EnvironmentSwitchState {
  phase: Phase;
  href: string | null;
  /** Timestamp (ms) the transition step started — persists across the
   *  source/destination layout unmount+remount boundary so the gate can
   *  enforce a minimum splash duration regardless of which shell renders it. */
  transitionStartedAt: number | null;

  /** Opens the confirmation step for leaving admin, landing on `href`. */
  request: (href: string) => void;

  /** User confirmed — move to the transition (splash) step. */
  confirm: () => void;

  /** User backed out of the confirmation step. */
  cancel: () => void;

  /** The new shell has settled — close the gate. */
  finish: () => void;
}

export const useEnvironmentSwitchStore = create<EnvironmentSwitchState>()((set) => ({
  phase: 'idle',
  href: null,
  transitionStartedAt: null,

  request: (href) => set({ phase: 'confirming', href }),

  confirm: () =>
    set((state) =>
      state.phase === 'confirming'
        ? { phase: 'transitioning', transitionStartedAt: Date.now() }
        : state
    ),

  cancel: () => set({ phase: 'idle', href: null, transitionStartedAt: null }),

  finish: () => set({ phase: 'idle', href: null, transitionStartedAt: null }),
}));
