'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { PriceBreakdownView } from '@/components/cart/price-breakdown';
import { formatMoney } from '@/lib/format';
import { useActivePromo, useCartBreakdown, useCartStore } from '@/store/cart-store';
import { usePostcodeStore } from '@/store/postcode-store';

export function CheckoutSummary() {
  const items = useCartStore((s) => s.items);
  const fulfilment = useCartStore((s) => s.fulfilment);
  const breakdown = useCartBreakdown();
  const promo = useActivePromo();
  const distance = usePostcodeStore((s) => s.distanceMiles);
  const [open, setOpen] = useState(false);
  const restaurants = Array.from(new Set(items.map((i) => i.restaurantName)));

  return (
    <aside aria-label="Order summary" className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
      <h2 className="font-display text-lg font-bold text-ink-900">Order summary</h2>
      <p className="text-sm text-ink-600">{restaurants.join(' + ')}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="summary-items"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-sm font-semibold text-ink-900"
      >
        {breakdown.itemCount} item{breakdown.itemCount === 1 ? '' : 's'}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul id="summary-items" className="mt-2 divide-y divide-ink-100 text-sm">
          {items.map((i) => (
            <li key={i.lineId} className="flex justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{i.quantity}×</span> {i.name}
                {i.modifiers.length > 0 && <span className="block text-xs text-ink-600">{i.modifiers.map((m) => m.optionName).join(', ')}</span>}
              </span>
              <span className="tabular-nums">{formatMoney(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <PriceBreakdownView breakdown={breakdown} promo={promo} fulfilment={fulfilment} distanceMiles={distance} />
      </div>
    </aside>
  );
}
