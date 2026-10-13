'use client';

import { Layers, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { MULTI_DROP_FEE } from '@/lib/pricing';
import { formatMoney } from '@/lib/format';
import { MAX_MULTI_DROP_RESTAURANTS, useCartStore } from '@/store/cart-store';
import { toast } from '@/store/ui-store';

/** Multi-vendor safety: shown whenever an item from a different restaurant is added. */
export function CartConflictDialog() {
  const pending = useCartStore((s) => s.pendingConflict);
  const resolve = useCartStore((s) => s.resolveConflict);
  const vendorCount = useCartStore((s) => new Set(s.items.map((i) => i.restaurantId)).size);
  const atLimit = vendorCount >= MAX_MULTI_DROP_RESTAURANTS;

  return (
    <Dialog
      open={!!pending}
      onClose={() => resolve('cancel')}
      title="Start a new basket?"
      description={pending ? `Your basket has items from ${pending.currentRestaurantName}.` : undefined}
      size="sm"
    >
      {pending && (
        <div className="space-y-3 p-5 sm:p-6">
          <p className="text-[15px] text-ink-700">
            You’re adding <strong>{pending.input.name}</strong> from <strong>{pending.incomingRestaurantName}</strong>. How would you like to continue?
          </p>
          <button
            type="button"
            onClick={() => {
              resolve('replace');
              toast({ title: 'New basket started', description: pending.incomingRestaurantName, tone: 'success' });
            }}
            className="flex w-full items-start gap-3 rounded-2xl border-2 border-ink-200 p-4 text-left transition hover:border-ink-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
          >
            <RefreshCcw className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <span>
              <span className="block font-bold text-ink-900">Replace basket</span>
              <span className="block text-sm text-ink-600">Clear {pending.currentRestaurantName} and start fresh.</span>
            </span>
          </button>
          <button
            type="button"
            disabled={atLimit}
            onClick={() => {
              resolve('multi_drop');
              toast({ title: 'Multi-drop order', description: `One courier will collect from ${vendorCount + 1} restaurants.`, tone: 'success' });
            }}
            className="flex w-full items-start gap-3 rounded-2xl border-2 border-ink-200 p-4 text-left transition hover:border-ink-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-ink-200"
          >
            <Layers className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <span>
              <span className="block font-bold text-ink-900">Start a multi-drop order</span>
              <span className="block text-sm text-ink-600">
                {atLimit
                  ? `Multi-drop is limited to ${MAX_MULTI_DROP_RESTAURANTS} restaurants.`
                  : `Keep both — one courier collects from each kitchen. +${formatMoney(MULTI_DROP_FEE)} per extra stop; ETA may increase by ~10 min.`}
              </span>
            </span>
          </button>
          <Button variant="ghost" fullWidth onClick={() => resolve('cancel')}>
            Cancel
          </Button>
        </div>
      )}
    </Dialog>
  );
}
