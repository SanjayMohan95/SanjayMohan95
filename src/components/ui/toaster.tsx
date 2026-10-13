'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import { useUiStore, type Toast } from '@/store/ui-store';
import { cn } from '@/lib/utils';

function ToastView({ toast }: { toast: Toast }) {
  const dismiss = useUiStore((s) => s.dismissToast);
  useEffect(() => {
    const t = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(t);
  }, [toast.id, toast.durationMs, dismiss]);

  const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertTriangle : Info;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.15 } }}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink-900 px-4 py-3 text-white shadow-lift"
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 shrink-0', toast.tone === 'success' ? 'text-emerald-300' : toast.tone === 'error' ? 'text-red-300' : 'text-sky-300')}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-ink-200">{toast.description}</p>}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              dismiss(toast.id);
            }}
            className="mt-1.5 text-sm font-bold text-brand-200 underline underline-offset-2 hover:text-white"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="rounded-full p-1 text-ink-200 hover:bg-white/10 hover:text-white">
        <X className="h-4 w-4" aria-hidden />
      </button>
    </motion.li>
  );
}

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-6">
      <ol className="flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastView key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
