'use client';

import { create } from 'zustand';

interface HydrationState {
  hydrated: boolean;
  setHydrated: () => void;
}

/** Flips once all persisted stores have rehydrated from localStorage on the client. */
export const useHydrationStore = create<HydrationState>((set) => ({
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),
}));

export const useHasHydrated = () => useHydrationStore((s) => s.hydrated);
