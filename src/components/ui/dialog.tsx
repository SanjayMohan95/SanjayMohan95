'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Placement = 'center' | 'right' | 'bottom-sheet';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  placement?: Placement;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideTitle?: boolean;
  /** Element to focus first; defaults to the first focusable element. */
  initialFocusRef?: React.RefObject<HTMLElement>;
  dismissible?: boolean;
  className?: string;
}

let openCount = 0;

/**
 * Accessible modal / slide-over:
 * - role="dialog" + aria-modal, labelled & described
 * - focus trap with Tab/Shift+Tab wrapping, Escape to close
 * - restores focus to the trigger on close
 * - locks body scroll (ref-counted for stacked dialogs)
 * - centred on desktop, bottom-sheet on mobile, or right-hand drawer
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  placement = 'center',
  size = 'md',
  hideTitle,
  initialFocusRef,
  dismissible = true,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openCount += 1;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const target = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
      target?.focus();
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (!panelRef.current) return;
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      openCount -= 1;
      if (openCount <= 0) {
        openCount = 0;
        document.body.style.overflow = '';
      }
      previouslyFocused?.focus?.();
    };
  }, [open, dismissible, initialFocusRef]);

  if (typeof document === 'undefined') return null;

  const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

  const panelMotion =
    placement === 'right'
      ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
      : placement === 'bottom-sheet'
        ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
        : { initial: { opacity: 0, y: 40, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 40, scale: 0.98 } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismissible && onClose()}
            aria-hidden
          />
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex',
              placement === 'right' && 'justify-end',
              placement === 'center' && 'items-end justify-center sm:items-center sm:p-6',
              placement === 'bottom-sheet' && 'items-end justify-center',
            )}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descId : undefined}
              tabIndex={-1}
              {...panelMotion}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              className={cn(
                'pointer-events-auto flex max-h-[100dvh] w-full flex-col bg-white shadow-lift focus:outline-none',
                placement === 'right' && 'h-full max-w-md',
                placement === 'center' && cn('max-h-[92dvh] rounded-t-3xl sm:rounded-3xl', sizes[size]),
                placement === 'bottom-sheet' && cn('max-h-[92dvh] rounded-t-3xl', sizes[size]),
                className,
              )}
            >
              <div className={cn('flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6', hideTitle && 'sr-only')}>
                <div className="min-w-0">
                  <h2 id={titleId} className="font-display text-lg font-bold text-ink-900 sm:text-xl">
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className="mt-0.5 text-sm text-ink-600">
                      {description}
                    </p>
                  )}
                </div>
                {dismissible && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="-mr-2 rounded-full p-2 text-ink-700 transition hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
              {footer && <div className="border-t border-ink-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
