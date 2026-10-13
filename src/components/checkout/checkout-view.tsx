'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, Leaf, MapPin, Pencil, Store, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { formatEta } from '@/lib/format';
import { useCartIssues } from '@/hooks/use-cart-issues';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useOrderStore } from '@/store/order-store';
import { CheckoutSummary } from './checkout-summary';
import { CheckoutStepper } from './stepper';
import { StepContact } from './step-contact';
import { StepCutlery } from './step-cutlery';
import { StepSchedule } from './step-schedule';

const STEPS = ['Contact & delivery', 'Delivery time', 'Cutlery', 'Payment'];

function StepCard({
  index,
  current,
  title,
  icon,
  summary,
  onEdit,
  children,
}: {
  index: number;
  current: number;
  title: string;
  icon: ReactNode;
  summary: ReactNode;
  onEdit: () => void;
  children: ReactNode;
}) {
  const open = index === current;
  const done = index < current;
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (open && index > 0) headingRef.current?.focus();
  }, [open, index]);

  return (
    <section aria-labelledby={`step-${index}`} className={cn('rounded-3xl border bg-white shadow-card transition-colors', open ? 'border-ink-900' : 'border-ink-100')}>
      <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', done ? 'bg-herb-50 text-herb-700' : open ? 'bg-brand-50 text-brand-700' : 'bg-ink-50 text-ink-600')} aria-hidden>
            {done ? <CheckCircle2 className="h-5 w-5" /> : icon}
          </span>
          <div className="min-w-0">
            <h2 id={`step-${index}`} ref={headingRef} tabIndex={-1} className="font-display text-lg font-bold text-ink-900 focus:outline-none">
              <span className="sr-only">Step {index + 1}: </span>
              {title}
            </h2>
            {done && <div className="truncate text-sm text-ink-600">{summary}</div>}
          </div>
        </div>
        {done && (
          <button type="button" onClick={onEdit} className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300">
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit<span className="sr-only"> {title}</span>
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-ink-100 p-5 sm:p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const fulfilment = useCartStore((s) => s.fulfilment);
  const checkout = useOrderStore((s) => s.checkout);
  const completeStep = useOrderStore((s) => s.completeStep);
  const { closedRestaurants } = useCartIssues();
  const [current, setCurrent] = useState(() => {
    const done = checkout.completedSteps;
    return done.includes(1) ? 2 : done.includes(0) ? 1 : 0;
  });

  const advance = (step: number) => {
    completeStep(step);
    if (step === 2) router.push('/checkout/payment');
    else setCurrent(step + 1);
  };

  const { contact, address, schedule } = checkout;
  const scheduleLabel = schedule.type === 'asap' ? `ASAP · ${formatEta(schedule.etaRange)}` : `${new Date(`${schedule.date}T12:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${schedule.slot}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">Checkout</h1>
      <div className="mt-6 max-w-2xl">
        <CheckoutStepper steps={STEPS} current={current} />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <StepCard
            index={0}
            current={current}
            title={fulfilment === 'delivery' ? 'Contact & delivery details' : 'Contact details'}
            icon={fulfilment === 'delivery' ? <MapPin className="h-5 w-5" /> : <User className="h-5 w-5" />}
            summary={fulfilment === 'delivery' ? `${contact.fullName} · ${[address.line2, address.line1, address.postcode].filter(Boolean).join(', ')}` : `${contact.fullName} · Collection`}
            onEdit={() => setCurrent(0)}
          >
            {fulfilment === 'collection' && (
              <p className="mb-4 flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-800">
                <Store className="h-4 w-4" aria-hidden /> You’re collecting this order — no delivery address needed.
              </p>
            )}
            <StepContact fulfilment={fulfilment} onComplete={() => advance(0)} />
          </StepCard>
          <StepCard index={1} current={current} title="Delivery schedule" icon={<CalendarClock className="h-5 w-5" />} summary={scheduleLabel} onEdit={() => setCurrent(1)}>
            <StepSchedule fulfilment={fulfilment} closedRestaurants={closedRestaurants} onComplete={() => advance(1)} />
          </StepCard>
          <StepCard
            index={2}
            current={current}
            title="Cutlery & sustainability"
            icon={<Leaf className="h-5 w-5" />}
            summary={checkout.cutlery ? 'Cutlery included' : 'No cutlery'}
            onEdit={() => setCurrent(2)}
          >
            <StepCutlery onComplete={() => advance(2)} />
          </StepCard>
        </div>
        <CheckoutSummary />
      </div>
    </div>
  );
}
