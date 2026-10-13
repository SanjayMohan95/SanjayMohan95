'use client';

import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, ChevronRight, FastForward, MapPin, PackageCheck, ReceiptText, Store, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TrackingSkeleton } from '@/components/ui/skeleton';
import { useNow } from '@/hooks/use-now';
import { useOrderSimulation } from '@/hooks/use-order-simulation';
import { formatMoney, formatTime } from '@/lib/format';
import { SIM, STATUS_LABEL, courierProgress } from '@/lib/simulation';
import { useHasHydrated } from '@/store/hydration';
import { useOrderStore } from '@/store/order-store';
import { CourierCard } from './courier-card';
import { LiveMap } from './live-map';
import { TrackingTimeline } from './tracking-timeline';

const DROP_LABEL = { ring_doorbell: 'Ring doorbell', leave_at_door: 'Leave at door', hand_to_me: 'Hand to me' } as const;

export function TrackingView({ orderId }: { orderId: string }) {
  const hydrated = useHasHydrated();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId));
  const telemetry = useOrderStore((s) => s.telemetry[orderId]);
  const setStatus = useOrderStore((s) => s.setStatus);
  const startScheduledNow = useOrderStore((s) => s.startScheduledNow);
  const now = useNow(1000);
  useOrderSimulation(orderId);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <TrackingSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<ReceiptText className="h-8 w-8" />}
          title="We can’t find that order"
          description="It may have been placed on another device. Orders are stored locally in this demo."
          action={<Link href="/account/orders"><Button>View your orders</Button></Link>}
        />
      </div>
    );
  }

  const progress = telemetry?.progress ?? courierProgress(order, now.getTime());
  const delivered = order.status === 'delivered';
  const rejected = order.status === 'rejected' || order.status === 'cancelled';
  const scheduled = order.schedule.type === 'scheduled';
  const transitMinutes = 14;
  const minutesLeft = (() => {
    if (delivered) return 0;
    if (order.status === 'en_route') return Math.max(1, Math.round((1 - progress) * transitMinutes));
    return Math.max(1, Math.round((new Date(order.estimatedDeliveryAt).getTime() - now.getTime()) / 60_000));
  })();
  const arriving = order.status === 'en_route' && progress > SIM.arrivingThreshold;

  const headline = rejected
    ? 'Order not accepted'
    : delivered
      ? order.fulfilment === 'collection'
        ? 'Collected — enjoy!'
        : 'Delivered — enjoy!'
      : scheduled
        ? 'Scheduled order confirmed'
        : arriving
          ? 'Your courier is arriving'
          : order.status === 'en_route'
            ? `Arriving in ~${minutesLeft} min`
            : order.fulfilment === 'collection' && order.status === 'ready_for_pickup'
              ? 'Ready for collection'
              : `Estimated arrival ${formatTime(order.estimatedDeliveryAt)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-600">
        <Link href="/account/orders" className="hover:underline">Orders</Link>
        <ChevronRight className="mx-1 inline h-3.5 w-3.5" aria-hidden />
        <span aria-current="page">{order.shortCode}</span>
      </nav>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-800">
            {order.restaurants.map((r) => r.name).join(' + ')} · {STATUS_LABEL[order.status]}
          </p>
          <motion.h1 key={headline} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-1 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl" aria-live="polite">
            {headline}
          </motion.h1>
          {!rejected && !delivered && !scheduled && (
            <p className="mt-1 text-ink-600">
              Placed at {formatTime(order.createdAt)} · {order.fulfilment === 'delivery' ? `Delivering to ${order.address.postcode}` : 'Collection'}
            </p>
          )}
        </div>
        {!rejected && !delivered && order.status !== 'en_route' && (
          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">ETA</p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-ink-900">{scheduled && order.schedule.type === 'scheduled' ? order.schedule.slot : formatTime(order.estimatedDeliveryAt)}</p>
          </div>
        )}
      </header>

      {scheduled && order.schedule.type === 'scheduled' && !delivered && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sky-50 p-4 text-sky-900">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-5 w-5" aria-hidden />
            Scheduled for {new Date(`${order.schedule.date}T12:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}, {order.schedule.slot}. The kitchen starts ~30 min before.
          </p>
          <Button size="sm" variant="dark" onClick={() => startScheduledNow(order.id)}>
            <FastForward className="h-4 w-4" aria-hidden /> Demo: start now
          </Button>
        </div>
      )}

      {rejected ? (
        <div className="mt-8 max-w-2xl">
          <EmptyState
            icon={<XCircle className="h-8 w-8" />}
            title={`${order.restaurants[0]?.name} couldn’t take this order`}
            description={
              <>
                Reason: <strong>{order.rejectionReason ?? 'Kitchen unavailable'}</strong>. A full refund of {formatMoney(order.breakdown.total)} has been issued to {order.payment.label} — it usually appears within 3–5 working days.
              </>
            }
            action={<Link href="/restaurants"><Button>Find another restaurant</Button></Link>}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <LiveMap order={order} progress={progress} />
            {order.status === 'en_route' && (
              <div>
                <div className="flex justify-between text-sm font-semibold text-ink-700">
                  <span>{order.restaurants[order.restaurants.length - 1]?.name}</span>
                  <span>{Math.round(progress * 100)}%</span>
                  <span>You</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Delivery progress">
                  <motion.div className="h-full rounded-full bg-brand-700" animate={{ width: `${progress * 100}%` }} transition={{ ease: 'linear', duration: 1 }} />
                </div>
              </div>
            )}
            {delivered && (
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-herb-50 p-5">
                <p className="flex items-center gap-3 font-semibold text-herb-700">
                  <CheckCircle2 className="h-6 w-6" aria-hidden />
                  {order.deliveredAt && `${order.fulfilment === 'collection' ? 'Collected' : 'Delivered'} at ${formatTime(order.deliveredAt)}.`} How was it?
                </p>
                <Link href={`/account/orders#${order.id}`} className="inline-flex h-11 items-center rounded-xl bg-ink-900 px-4 font-semibold text-white hover:bg-ink-800">
                  Rate your order
                </Link>
              </motion.div>
            )}
            {order.fulfilment === 'collection' && order.status === 'ready_for_pickup' && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
                <p className="flex items-center gap-3 text-ink-900">
                  <Store className="h-6 w-6 text-brand-700" aria-hidden />
                  <span>
                    Show code <strong className="font-mono text-lg">{order.shortCode}</strong> at {order.restaurants[0]?.address}
                  </span>
                </p>
                <Button onClick={() => setStatus(order.id, 'delivered', 'Collected by customer')}>
                  <PackageCheck className="h-4 w-4" aria-hidden /> I’ve collected it
                </Button>
              </div>
            )}
          </div>

          <aside className="space-y-6" aria-label="Order status and details">
            <section aria-labelledby="timeline-title" className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
              <h2 id="timeline-title" className="mb-4 font-display text-lg font-bold text-ink-900">
                Order status
              </h2>
              <TrackingTimeline order={order} />
            </section>

            {order.courier && order.fulfilment === 'delivery' && !delivered && <CourierCard courier={order.courier} orderId={order.id} speedMph={telemetry?.speedMph ?? 0} />}

            <section aria-labelledby="details-title" className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
              <h2 id="details-title" className="font-display text-lg font-bold text-ink-900">
                Order details
              </h2>
              <ul className="mt-3 divide-y divide-ink-100 text-sm">
                {order.items.map((i) => (
                  <li key={i.lineId} className="flex justify-between gap-3 py-2">
                    <span>
                      <span className="font-semibold">{i.quantity}×</span> {i.name}
                      {i.modifiers.length > 0 && <span className="block text-xs text-ink-600">{i.modifiers.map((m) => m.optionName).join(', ')}</span>}
                    </span>
                    <span className="tabular-nums">{formatMoney(i.unitPrice * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-ink-200 pt-3 font-bold">
                <span>Total paid</span>
                <span className="tabular-nums">{formatMoney(order.breakdown.total)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-600">{order.payment.label}</p>
              {order.fulfilment === 'delivery' && (
                <div className="mt-4 rounded-2xl bg-ink-50 p-3 text-sm text-ink-800">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      {[order.address.line2, order.address.line1, order.address.city, order.address.postcode].filter(Boolean).join(', ')}
                      <span className="block text-ink-600">
                        {DROP_LABEL[order.address.dropOff]}
                        {order.address.courierNote && ` · “${order.address.courierNote}”`}
                      </span>
                    </span>
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
