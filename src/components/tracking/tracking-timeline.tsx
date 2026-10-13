'use client';

import { motion } from 'framer-motion';
import { Bike, CheckCircle2, ChefHat, Home, ReceiptText, Store } from 'lucide-react';
import { formatTime } from '@/lib/format';
import { TRACKING_STAGES, stageIndex } from '@/lib/simulation';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const ICONS = [ReceiptText, ChefHat, Bike, Home];

const FIRST_STATUS_FOR_STAGE: OrderStatus[][] = [['placed', 'accepted'], ['preparing', 'ready_for_pickup'], ['en_route'], ['delivered']];

export function TrackingTimeline({ order }: { order: Order }) {
  const current = order.status === 'delivered' ? 4 : stageIndex(order.status);
  const collection = order.fulfilment === 'collection';

  const stages = TRACKING_STAGES.map((s, i) =>
    collection && i === 2
      ? { ...s, title: 'Ready for collection', description: `Head to ${order.restaurants[0]?.name} and show code ${order.shortCode}.` }
      : collection && i === 3
        ? { ...s, title: 'Collected', description: 'Enjoy your meal!' }
        : s,
  );

  return (
    <ol className="relative space-y-1" aria-label="Order progress">
      {stages.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = collection && i === 2 ? Store : ICONS[i];
        const at = order.statusHistory.find((h) => FIRST_STATUS_FOR_STAGE[i].includes(h.status))?.at;
        const subNote = i === 0 && order.status === 'placed' ? 'Waiting for the restaurant to accept…' : i === 1 && order.status === 'ready_for_pickup' ? (collection ? 'Packed and ready!' : 'Packed — courier on the way to the kitchen') : null;
        return (
          <li key={stage.id} className="relative flex gap-4 pb-6 last:pb-0" aria-current={active ? 'step' : undefined}>
            {i < stages.length - 1 && (
              <span className="absolute left-5 top-11 h-[calc(100%-2.5rem)] w-0.5 bg-ink-100" aria-hidden>
                <motion.span className="block w-full bg-herb-600" initial={false} animate={{ height: done ? '100%' : '0%' }} transition={{ duration: 0.6 }} />
              </span>
            )}
            <span
              className={cn(
                'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                done ? 'bg-herb-700 text-white' : active ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-600',
              )}
              aria-hidden
            >
              {active && <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-brand-600" />}
              {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <div className="min-w-0 pt-1.5">
              <p className={cn('font-bold', done || active ? 'text-ink-900' : 'text-ink-600')}>
                {stage.title}
                <span className="sr-only">{done ? ' — completed' : active ? ' — in progress' : ' — upcoming'}</span>
              </p>
              {(active || done) && <p className="text-sm text-ink-600">{subNote ?? stage.description}</p>}
              {at && (done || active) && <p className="mt-0.5 text-xs font-semibold text-ink-600">{formatTime(at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
