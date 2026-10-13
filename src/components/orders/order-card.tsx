'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Download, MapPin, Navigation, RefreshCcw, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PriceBreakdownView } from '@/components/cart/price-breakdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SmartImage } from '@/components/ui/smart-image';
import { getRestaurant } from '@/data';
import { formatDate, formatMoney, formatTime } from '@/lib/format';
import { downloadVatInvoice } from '@/lib/invoice';
import { STATUS_LABEL } from '@/lib/simulation';
import { cn } from '@/lib/utils';
import { toast } from '@/store/ui-store';
import type { Order } from '@/types';
import { ReviewModule } from './review-module';

const ACTIVE = new Set(['placed', 'accepted', 'preparing', 'ready_for_pickup', 'en_route']);

export function OrderCard({ order, onReorder, defaultOpen }: { order: Order; onReorder: (order: Order) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const active = ACTIVE.has(order.status);
  const hero = getRestaurant(order.restaurants[0]?.id ?? '')?.heroImage;
  const tone = order.status === 'delivered' ? 'success' : order.status === 'rejected' || order.status === 'cancelled' ? 'danger' : 'brand';

  return (
    <motion.article id={order.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="scroll-mt-28 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card" aria-labelledby={`${order.id}-title`}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-ink-100">
          <SmartImage src={hero} alt="" fill sizes="64px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`${order.id}-title`} className="font-display text-lg font-bold text-ink-900">
              {order.restaurants.map((r) => r.name).join(' + ')}
            </h2>
            <Badge tone={tone}>{STATUS_LABEL[order.status]}</Badge>
            {order.review && (
              <Badge tone="neutral">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden /> {order.review.foodRating}/5
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink-600">
            {formatDate(order.createdAt)} · {formatTime(order.createdAt)} · {order.shortCode} · {order.items.reduce((n, i) => n + i.quantity, 0)} items ·{' '}
            <span className="font-semibold text-ink-900">{formatMoney(order.breakdown.total)}</span>
          </p>
          <p className="mt-1 line-clamp-1 text-sm text-ink-700">{order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
          {active ? (
            <Link href={`/order/${order.id}/tracking`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800">
              <Navigation className="h-4 w-4" aria-hidden /> Track order
            </Link>
          ) : (
            <Button onClick={() => onReorder(order)}>
              <RefreshCcw className="h-4 w-4" aria-hidden /> Order again
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={`${order.id}-receipt`}>
            Receipt <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
          </Button>
        </div>
      </div>

      {open && (
        <div id={`${order.id}-receipt`} className="grid gap-6 border-t border-ink-100 p-5 lg:grid-cols-2">
          <div>
            <h3 className="font-bold text-ink-900">Itemised receipt</h3>
            <ul className="mt-2 divide-y divide-ink-100 text-sm">
              {order.items.map((i) => (
                <li key={i.lineId} className="flex justify-between gap-3 py-2">
                  <span>
                    <span className="font-semibold">{i.quantity}×</span> {i.name}
                    {i.modifiers.length > 0 && <span className="block text-xs text-ink-600">{i.modifiers.map((m) => `${m.optionName}${m.priceDelta ? ` (+${formatMoney(m.priceDelta)})` : ''}`).join(', ')}</span>}
                    {i.specialInstructions && <span className="block text-xs italic text-ink-600">“{i.specialInstructions}”</span>}
                  </span>
                  <span className="tabular-nums">{formatMoney(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 text-sm text-ink-700">
              <div className="flex justify-between"><dt>Ordered</dt><dd>{formatDate(order.createdAt)}, {formatTime(order.createdAt)}</dd></div>
              {order.deliveredAt && <div className="flex justify-between"><dt>{order.fulfilment === 'collection' ? 'Collected' : 'Delivered'}</dt><dd>{formatDate(order.deliveredAt)}, {formatTime(order.deliveredAt)}</dd></div>}
              <div className="flex justify-between"><dt>Payment</dt><dd>{order.payment.label}</dd></div>
              <div className="flex justify-between"><dt>Invoice no.</dt><dd className="font-mono text-xs">{order.vatInvoiceNumber}</dd></div>
            </dl>
            {order.fulfilment === 'delivery' && (
              <p className="mt-3 flex items-start gap-2 text-sm text-ink-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {[order.address.line2, order.address.line1, order.address.postcode].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="space-y-4">
            <PriceBreakdownView breakdown={order.breakdown} fulfilment={order.fulfilment} />
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                downloadVatInvoice(order);
                toast({ title: 'VAT invoice downloaded', description: `${order.vatInvoiceNumber}.html — open and print to PDF.`, tone: 'success' });
              }}
            >
              <Download className="h-4 w-4" aria-hidden /> Download VAT invoice
            </Button>
          </div>
        </div>
      )}

      {order.status === 'delivered' && (
        <div className="border-t border-ink-100 p-5">
          {!order.review && <h3 className="mb-3 font-bold text-ink-900">How was your order?</h3>}
          <ReviewModule order={order} />
        </div>
      )}
    </motion.article>
  );
}
