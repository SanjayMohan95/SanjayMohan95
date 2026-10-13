'use client';

import { create } from 'zustand';
import { uid } from '@/lib/utils';

export type ToastTone = 'success' | 'info' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
  durationMs: number;
}

interface UiState {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id' | 'durationMs' | 'tone'> & { tone?: ToastTone; durationMs?: number }) => string;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = uid('t_');
    set((s) => ({
      toasts: [...s.toasts.slice(-3), { tone: 'info', durationMs: 4500, ...toast, id }],
    }));
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (t: Parameters<UiState['pushToast']>[0]) => useUiStore.getState().pushToast(t);
