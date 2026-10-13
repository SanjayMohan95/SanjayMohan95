'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Bike, Check, Clock, Smartphone, Store, Utensils } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useMerchantStore } from '@/store/merchant-store';
import type { KitchenOrder } from '@/hooks/use-kitchen-orders';

const PREP_OPTIONS = [10, 15, 20, 25, 30];

function minutesSince(iso: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

export function KitchenTicket({
  entry,
  now,
  onAccept,
  onReject,
  onReady,
  onHandOff,
}: {
  entry: KitchenOrder;
  now: number;
  onAccept: (prep: number) => void;
  onReject: () => void;
  onReady: () => void;
  onHandOff: () => void;
}) {
  const { order, column, source } = entry;
  const bumped = useMerchantStore((s) => s.bumped[order.id] ?? []);
  const toggleBump = useMerchantStore((s) => s.toggleBump);
  const [prep, setPrep] = useState(order.prepMinutes > 0 ? Math.min(30, Math.max(10, Math.round(order.prepMinutes / 5) * 5)) : 15);

  const age = minutesSince(order.createdAt, now);
  const prepStart = order.statusHistory.find((h) => h.status === 'accepted' || h.status === 'preparing')?.at ?? order.createdAt;
  const elapsedPrep = (now - new Date(prepStart).getTime()) / 60_000;
  const prepPct = Math.min(1, elapsedPrep / Math.max(1, order.prepMinutes));
  const overdue = column === 'in_prep' && elapsedPrep > order.prepMinutes;
  const urgent = column === 'incoming' && age >= 2;
  const allBumped = order.items.every((i) => bumped.includes(i.lineId));
  const collection = order.fulfilment === 'collection';
  const notes = order.items.filter((i) => i.specialInstructions);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={cn('rounded-2xl border-2 bg-white shadow-card', overdue ? 'border-red-600' : urgent ? 'border-amber-500' : 'border-transparent')}
      aria-label={`Order ${order.shortCode} for ${order.contact.fullName}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <div>
          <p className="font-mono text-lg font-black text-ink-900">{order.shortCode}</p>
          <p className="text-sm text-ink-600">{order.contact.fullName}</p>
        </div>
        <div className="text-right">
          <p className={cn('inline-flex items-center gap-1 text-sm font-bold', urgent || overdue ? 'text-red-800' : 'text-ink-800')}>
            <Clock className="h-4 w-4" aria-hidden /> {age}m
          </p>
          <p className="mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold text-ink-600">
            {collection ? <Store className="h-3.5 w-3.5" aria-hidden /> : <Bike className="h-3.5 w-3.5" aria-hidden />}
            {collection ? 'Collection' : 'Delivery'}
            {source === 'app' && (
              <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-brand-50 px-1 text-brand-800">
                <Smartphone className="h-3 w-3" aria-hidden /> App
              </span>
            )}
          </p>
        </div>
      </div>

      <ul className="space-y-1 px-4 py-3">
        {order.items.map((item) => {
          const done = bumped.includes(item.lineId);
          return (
            <li key={item.lineId}>
              {column === 'in_prep' ? (
                <label className="flex cursor-pointer items-start gap-2 rounded-lg p-1 hover:bg-ink-50">
                  <input type="checkbox" checked={done} onChange={() => toggleBump(order.id, item.lineId)} className="mt-1 h-5 w-5 rounded accent-herb-600" />
                  <span className={cn(done && 'text-ink-600 line-through')}>
                    <span className="font-bold">{item.quantity}×</span> {item.name}
                    {item.modifiers.length > 0 && <span className="block text-sm text-ink-600">{item.modifiers.map((m) => m.optionName).join(' · ')}</span>}
                  </span>
                </label>
              ) : (
                <p className="p-1">
                  <span className="font-bold">{item.quantity}×</span> {item.name}
                  {item.modifiers.length > 0 && <span className="block text-sm text-ink-600">{item.modifiers.map((m) => m.optionName).join(' · ')}</span>}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {notes.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl bg-amber-50 p-2.5 text-sm text-amber-900">
          {notes.map((n) => (
            <p key={n.lineId} className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                <strong>{n.name}:</strong> {n.specialInstructions}
              </span>
            </p>
          ))}
        </div>
      )}
      {order.cutlery && (
        <p className="mx-4 mb-3 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
          <Utensils className="h-3.5 w-3.5" aria-hidden /> Include cutlery
        </p>
      )}

      <div className="border-t border-ink-100 px-4 py-3">
        {column === 'incoming' && (
          <div className="space-y-3">
            <fieldset>
              <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-600">Prep time</legend>
              <div className="flex gap-1" role="radiogroup" aria-label={`Prep time for ${order.shortCode}`}>
                {PREP_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={prep === m}
                    onClick={() => setPrep(m)}
                    className={cn('flex-1 rounded-lg py-1.5 text-sm font-bold transition', prep === m ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-800 hover:bg-ink-100')}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Button variant="outline" onClick={onReject} className="text-red-800">
                Reject
              </Button>
              <Button variant="primary" onClick={() => onAccept(prep)} className="bg-herb-700 hover:bg-herb-600">
                <Check className="h-4 w-4" aria-hidden /> Accept · {prep} min
              </Button>
            </div>
          </div>
        )}
        {column === 'in_prep' && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-ink-700">
                <span>{Math.floor(elapsedPrep)} / {order.prepMinutes} min</span>
                {overdue && <span className="text-red-800">Overdue</span>}
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={Math.round(prepPct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Prep progress">
                <div className={cn('h-full rounded-full transition-all', overdue ? 'bg-red-600' : prepPct > 0.75 ? 'bg-amber-500' : 'bg-herb-600')} style={{ width: `${prepPct * 100}%` }} />
              </div>
            </div>
            <Button fullWidth variant={allBumped ? 'primary' : 'dark'} onClick={onReady}>
              {allBumped ? 'All items done — mark ready' : 'Mark ready for pickup'}
            </Button>
          </div>
        )}
        {column === 'ready' && (
          <div className="space-y-2">
            {!collection && (
              <p className="flex items-center gap-1.5 text-sm text-ink-700">
                <Bike className="h-4 w-4 text-brand-700" aria-hidden />
                {order.courier ? `${order.courier.name} · ${order.courier.vehicle.plate ?? order.courier.vehicle.type}` : 'Courier arriving in ~3 min'}
              </p>
            )}
            <Button fullWidth variant="dark" onClick={onHandOff}>
              {collection ? 'Collected by customer' : 'Handed to courier'}
            </Button>
          </div>
        )}
        <p className="mt-2 text-right text-xs text-ink-600">{formatMoney(order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0))}</p>
      </div>
    </motion.li>
  );
}
