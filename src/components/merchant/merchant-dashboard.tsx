'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, ChefHat, Eye, Inbox, PackageCheck, Plus, Timer, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { RESTAURANTS, getRestaurant } from '@/data';
import { useKitchenOrders, type KitchenOrder } from '@/hooks/use-kitchen-orders';
import { useNow } from '@/hooks/use-now';
import { playChime } from '@/lib/chime';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useHasHydrated } from '@/store/hydration';
import { useMerchantStore } from '@/store/merchant-store';
import { toast } from '@/store/ui-store';
import type { KdsColumn } from '@/types';
import { EightySixPanel } from './eighty-six-panel';
import { KitchenTicket } from './kitchen-ticket';

const COLUMNS: { id: KdsColumn; title: string; icon: typeof Inbox; empty: string }[] = [
  { id: 'incoming', title: 'Incoming orders', icon: Inbox, empty: 'No new orders. Quiet before the rush…' },
  { id: 'in_prep', title: 'In prep · KDS', icon: ChefHat, empty: 'Nothing on the pass.' },
  { id: 'ready', title: 'Ready for pickup', icon: PackageCheck, empty: 'No bags waiting.' },
];

const REJECT_REASONS = ['Kitchen too busy', 'Item(s) out of stock', 'Closing soon', 'Unable to meet dietary request', 'Other'];

export function MerchantDashboard() {
  const hydrated = useHasHydrated();
  const restaurantId = useMerchantStore((s) => s.restaurantId);
  const setRestaurant = useMerchantStore((s) => s.setRestaurant);
  const ensureSeeded = useMerchantStore((s) => s.ensureSeeded);
  const alertsVisual = useMerchantStore((s) => s.alertsVisual);
  const alertsAudible = useMerchantStore((s) => s.alertsAudible);
  const autoSimulate = useMerchantStore((s) => s.autoSimulate);
  const setAlerts = useMerchantStore((s) => s.setAlerts);
  const spawnIncoming = useMerchantStore((s) => s.spawnIncoming);
  const heartbeat = useMerchantStore((s) => s.heartbeat);
  const { orders, accept, reject, markReady, handOff } = useKitchenOrders();
  const now = useNow(15_000).getTime();
  const [flash, setFlash] = useState(false);
  const [rejecting, setRejecting] = useState<KitchenOrder | null>(null);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const seenIncoming = useRef<Set<string> | null>(null);
  const restaurant = getRestaurant(restaurantId)!;

  useEffect(() => {
    if (hydrated) ensureSeeded(restaurantId);
  }, [hydrated, restaurantId, ensureSeeded]);

  // Heartbeat lets customer tracking tabs know a kitchen is actively watching.
  useEffect(() => {
    if (!hydrated) return;
    heartbeat();
    const id = window.setInterval(heartbeat, 5000);
    return () => window.clearInterval(id);
  }, [hydrated, heartbeat]);

  // Simulated rush: a new third-party order every ~35–55s.
  useEffect(() => {
    if (!hydrated || !autoSimulate) return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        spawnIncoming();
        schedule();
      }, 35_000 + Math.random() * 20_000);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [hydrated, autoSimulate, spawnIncoming, restaurantId]);

  // Alerting on newly arrived incoming tickets.
  const incomingIds = orders.filter((o) => o.column === 'incoming').map((o) => o.order.id);
  const incomingKey = incomingIds.join('|');
  useEffect(() => {
    if (!hydrated) return;
    if (seenIncoming.current === null) {
      seenIncoming.current = new Set(incomingIds);
      return;
    }
    const fresh = incomingIds.filter((id) => !seenIncoming.current!.has(id));
    incomingIds.forEach((id) => seenIncoming.current!.add(id));
    if (!fresh.length) return;
    if (alertsAudible) playChime();
    if (alertsVisual) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 2400);
      toast({ title: `New order${fresh.length > 1 ? 's' : ''}!`, description: `${fresh.length} ticket${fresh.length > 1 ? 's' : ''} waiting to be accepted`, tone: 'info' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingKey, hydrated]);

  useEffect(() => {
    seenIncoming.current = null;
  }, [restaurantId]);

  // Tab title badge for background tabs.
  useEffect(() => {
    const base = 'Kitchen dashboard · CraveOS';
    document.title = incomingIds.length && alertsVisual ? `(${incomingIds.length}) New orders · ${base}` : base;
    return () => {
      document.title = 'CraveOS';
    };
  }, [incomingIds.length, alertsVisual]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6" role="status" aria-label="Loading dashboard">
        <Skeleton className="h-12 w-1/3" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_320px]">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[520px] rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const byColumn = (c: KdsColumn) => orders.filter((o) => o.column === c);
  const inPrep = byColumn('in_prep');
  const avgPrep = inPrep.length ? Math.round(inPrep.reduce((s, o) => s + o.order.prepMinutes, 0) / inPrep.length) : restaurant.prepTimeMin;
  const liveValue = orders.reduce((s, o) => s + o.order.items.reduce((t, i) => t + i.unitPrice * i.quantity, 0), 0);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-800">Kitchen live dispatch</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-ink-900">{restaurant.name}</h1>
            <label htmlFor="kitchen-select" className="sr-only">Switch kitchen</label>
            <select
              id="kitchen-select"
              value={restaurantId}
              onChange={(e) => setRestaurant(e.target.value)}
              className="h-10 rounded-full border border-ink-200 bg-white px-3 text-sm font-semibold focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
            >
              {RESTAURANTS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { spawnIncoming(); }}>
            <Plus className="h-4 w-4" aria-hidden /> Simulate order
          </Button>
          <Button variant="outline" size="sm" onClick={() => { if (alertsAudible) playChime(); setFlash(true); window.setTimeout(() => setFlash(false), 1500); }}>
            <BellRing className="h-4 w-4" aria-hidden /> Test alert
          </Button>
        </div>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.6fr)]">
        {[
          { label: 'Incoming', value: byColumn('incoming').length, icon: Inbox },
          { label: 'In prep', value: inPrep.length, icon: ChefHat },
          { label: 'Avg quoted prep', value: `${avgPrep} min`, icon: Timer },
          { label: 'Live ticket value', value: formatMoney(liveValue), icon: PackageCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
            <Icon className="h-5 w-5 text-brand-700" aria-hidden />
            <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-ink-900">{value}</p>
            <p className="text-sm text-ink-600">{label}</p>
          </div>
        ))}
        <div className="space-y-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:col-span-2 xl:col-span-1">
          <Toggle checked={alertsVisual} onChange={(v) => setAlerts({ alertsVisual: v })} label="Visual alerts" description="Flash the board & tab title" icon={<Eye className="h-5 w-5" />} />
          <Toggle
            checked={alertsAudible}
            onChange={(v) => {
              setAlerts({ alertsAudible: v });
              if (v) playChime();
            }}
            label="Audible alerts"
            description="Chime on every new ticket"
            icon={alertsAudible ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          />
          <Toggle checked={autoSimulate} onChange={(v) => setAlerts({ autoSimulate: v })} label="Simulate rush" description="Auto-generate third-party orders" icon={<Plus className="h-5 w-5" />} />
        </div>
      </div>

      <AnimatePresence>
        {flash && alertsVisual && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-3 rounded-2xl bg-brand-700 px-4 py-3 font-bold text-white shadow-lift"
          >
            <BellRing className="h-5 w-5 animate-bounce" aria-hidden /> New order received — accept within 2 minutes to protect your ranking.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 grid gap-4 lg:grid-cols-3 2xl:grid-cols-[repeat(3,minmax(0,1fr))_340px]">
        {COLUMNS.map(({ id, title, icon: Icon, empty }) => {
          const entries = byColumn(id);
          return (
            <section
              key={id}
              aria-labelledby={`col-${id}`}
              className={cn(
                'flex min-h-[420px] flex-col rounded-3xl bg-ink-50 p-3 transition-colors',
                id === 'incoming' && flash && alertsVisual && 'bg-brand-100 ring-4 ring-brand-600',
              )}
            >
              <h2 id={`col-${id}`} className="flex items-center justify-between px-2 py-2 font-display font-bold text-ink-900">
                <span className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-brand-700" aria-hidden /> {title}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-sm tabular-nums">{entries.length}</span>
              </h2>
              <ul className="mt-2 flex-1 space-y-3" aria-live={id === 'incoming' ? 'polite' : undefined}>
                <AnimatePresence initial={false}>
                  {entries.map((entry) => (
                    <KitchenTicket
                      key={entry.order.id}
                      entry={entry}
                      now={now}
                      onAccept={(prep) => {
                        accept(entry.order.id, prep);
                        toast({ title: `${entry.order.shortCode} accepted`, description: `Quoted ${prep} min`, tone: 'success', durationMs: 2000 });
                      }}
                      onReject={() => {
                        setReason(REJECT_REASONS[0]);
                        setRejecting(entry);
                      }}
                      onReady={() => markReady(entry.order.id)}
                      onHandOff={() => handOff(entry.order.id, entry.order.fulfilment === 'collection')}
                    />
                  ))}
                </AnimatePresence>
                {entries.length === 0 && <li className="rounded-2xl border-2 border-dashed border-ink-200 p-6 text-center text-sm text-ink-600">{empty}</li>}
              </ul>
            </section>
          );
        })}
        <div className="h-[640px] lg:col-span-3 2xl:col-span-1 2xl:h-auto">
          <EightySixPanel restaurantId={restaurantId} />
        </div>
      </div>

      <Dialog
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={`Reject ${rejecting?.order.shortCode ?? ''}?`}
        description="The customer is refunded in full and notified immediately."
        size="sm"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Keep order
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (rejecting) {
                  reject(rejecting.order.id, reason);
                  toast({ title: `${rejecting.order.shortCode} rejected`, description: reason, tone: 'error' });
                }
                setRejecting(null);
              }}
            >
              Reject order
            </Button>
          </div>
        }
      >
        <fieldset className="space-y-2 p-5 sm:p-6">
          <legend className="mb-2 font-semibold text-ink-900">Reason</legend>
          {REJECT_REASONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 p-3 has-[:checked]:border-ink-900 has-[:checked]:bg-ink-50">
              <input type="radio" name="reject-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="h-4 w-4 accent-brand-700" />
              <span className="text-sm font-medium text-ink-900">{r}</span>
            </label>
          ))}
        </fieldset>
      </Dialog>
    </div>
  );
}
