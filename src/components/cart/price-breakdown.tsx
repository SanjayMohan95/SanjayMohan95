'use client';

import { Info } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { SERVICE_FEE_RATE, SMALL_ORDER_THRESHOLD } from '@/lib/pricing';
import type { PriceBreakdown, PromoCode } from '@/types';

function Row({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'discount' | 'muted' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="text-[15px] text-ink-700">
        {label}
        {hint && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-600">
            <Info className="h-3 w-3 shrink-0" aria-hidden />
            {hint}
          </span>
        )}
      </dt>
      <dd className={tone === 'discount' ? 'font-semibold tabular-nums text-herb-700' : 'tabular-nums text-ink-900'}>{value}</dd>
    </div>
  );
}

export function PriceBreakdownView({
  breakdown,
  promo,
  fulfilment = 'delivery',
  distanceMiles,
}: {
  breakdown: PriceBreakdown;
  promo?: PromoCode | null;
  fulfilment?: 'delivery' | 'collection';
  distanceMiles?: number | null;
}) {
  const b = breakdown;
  return (
    <div>
      <dl className="divide-y divide-transparent">
        <Row label={`Subtotal (${b.itemCount} item${b.itemCount === 1 ? '' : 's'})`} value={formatMoney(b.subtotal)} />
        {fulfilment === 'delivery' ? (
          <Row
            label="Delivery fee"
            value={b.deliveryFee === 0 ? 'Free' : formatMoney(b.deliveryFee)}
            hint={distanceMiles != null ? `Based on ${distanceMiles.toFixed(1)} mi distance` : undefined}
          />
        ) : (
          <Row label="Collection" value="Free" />
        )}
        {b.multiDropFee > 0 && <Row label={`Multi-drop (${b.restaurantCount} restaurants)`} value={formatMoney(b.multiDropFee)} hint="Courier collects from each kitchen" />}
        {b.smallOrderFee > 0 && (
          <Row label="Small order fee" value={formatMoney(b.smallOrderFee)} hint={`Spend ${formatMoney(SMALL_ORDER_THRESHOLD - b.subtotal)} more to remove`} />
        )}
        <Row label="Service fee" value={formatMoney(b.serviceFee)} hint={`${(SERVICE_FEE_RATE * 100).toFixed(1)}% — keeps CraveOS running`} />
        {b.tip > 0 && <Row label="Courier tip" value={formatMoney(b.tip)} hint="100% goes to your courier" />}
        {b.discount > 0 && <Row label={`Promo${promo ? ` (${promo.code})` : ''}`} value={`−${formatMoney(b.discount)}`} tone="discount" />}
      </dl>
      <div className="mt-3 flex items-baseline justify-between border-t border-ink-200 pt-3">
        <span className="text-lg font-bold text-ink-900">Total</span>
        <span className="text-xl font-extrabold tabular-nums text-ink-900">{formatMoney(b.total)}</span>
      </div>
      <p className="mt-1 text-right text-xs text-ink-600">Includes {formatMoney(b.vatIncluded)} VAT</p>
    </div>
  );
}
