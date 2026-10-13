'use client';

import { CalendarClock, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getRestaurant } from '@/data';
import { useAreaListings } from '@/hooks/use-listings';
import { formatEta } from '@/lib/format';
import { buildScheduleDays } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useOrderStore } from '@/store/order-store';
import type { FulfilmentMode } from '@/types';

export function StepSchedule({ fulfilment, closedRestaurants, onComplete }: { fulfilment: FulfilmentMode; closedRestaurants: string[]; onComplete: () => void }) {
  const items = useCartStore((s) => s.items);
  const multiDrop = useCartStore((s) => s.multiDrop);
  const schedule = useOrderStore((s) => s.checkout.schedule);
  const updateCheckout = useOrderStore((s) => s.updateCheckout);
  const listings = useAreaListings();
  const [error, setError] = useState<string | null>(null);

  const restaurants = useMemo(
    () => Array.from(new Set(items.map((i) => i.restaurantId))).map((id) => getRestaurant(id)).filter((r): r is NonNullable<typeof r> => !!r),
    [items],
  );
  const days = useMemo(() => buildScheduleDays(restaurants), [restaurants]);
  const asapAllowed = closedRestaurants.length === 0;

  const etaRange = useMemo<[number, number]>(() => {
    const relevant = listings.filter((l) => restaurants.some((r) => r.id === l.id));
    const base: [number, number] = relevant.length
      ? [Math.max(...relevant.map((l) => l.etaRange[0])), Math.max(...relevant.map((l) => l.etaRange[1]))]
      : [25, 35];
    if (fulfilment === 'collection') return [Math.max(...restaurants.map((r) => r.prepTimeMin)) + 5, Math.max(...restaurants.map((r) => r.prepTimeMin)) + 15];
    return multiDrop ? [base[0] + 10, base[1] + 10] : base;
  }, [listings, restaurants, multiDrop, fulfilment]);

  const [selectedDate, setSelectedDate] = useState(schedule.type === 'scheduled' ? schedule.date : days[0]?.date);

  useEffect(() => {
    if (!asapAllowed && schedule.type === 'asap') {
      const first = days[0];
      if (first) updateCheckout({ schedule: { type: 'scheduled', date: first.date, slot: first.slots[0] } });
    } else if (schedule.type === 'asap') {
      updateCheckout({ schedule: { type: 'asap', etaRange } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asapAllowed, etaRange[0], etaRange[1]]);

  const day = days.find((d) => d.date === selectedDate) ?? days[0];

  const submit = () => {
    if (schedule.type === 'scheduled' && !schedule.slot) {
      setError('Choose a delivery time slot.');
      return;
    }
    if (schedule.type === 'asap' && !asapAllowed) {
      setError('ASAP isn’t available while a restaurant is closed.');
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery timing">
        <button
          type="button"
          role="radio"
          aria-checked={schedule.type === 'asap'}
          disabled={!asapAllowed}
          onClick={() => {
            updateCheckout({ schedule: { type: 'asap', etaRange } });
            setError(null);
          }}
          className={cn(
            'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60',
            schedule.type === 'asap' ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400',
          )}
        >
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
          <span>
            <span className="block font-bold text-ink-900">ASAP: {formatEta(etaRange)}</span>
            <span className="block text-sm text-ink-600">
              {asapAllowed ? (fulfilment === 'collection' ? 'Ready for collection soon' : 'Fastest available courier') : `${closedRestaurants.join(', ')} closed right now`}
            </span>
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={schedule.type === 'scheduled'}
          disabled={!days.length}
          onClick={() => {
            if (day) updateCheckout({ schedule: { type: 'scheduled', date: day.date, slot: schedule.type === 'scheduled' ? schedule.slot : day.slots[0] } });
            setError(null);
          }}
          className={cn(
            'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60',
            schedule.type === 'scheduled' ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400',
          )}
        >
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
          <span>
            <span className="block font-bold text-ink-900">Schedule for later</span>
            <span className="block text-sm text-ink-600">Up to 7 days ahead, 30-min windows</span>
          </span>
        </button>
      </div>

      {schedule.type === 'scheduled' && day && (
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink-900">Day</legend>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Delivery day">
              {days.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  role="radio"
                  aria-checked={d.date === day.date}
                  onClick={() => {
                    setSelectedDate(d.date);
                    updateCheckout({ schedule: { type: 'scheduled', date: d.date, slot: d.slots[0] } });
                  }}
                  className={cn(
                    'shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                    d.date === day.date ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-900 hover:border-ink-400',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink-900">Time slot</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Delivery time slot">
              {day.slots.map((slot) => {
                const active = schedule.type === 'scheduled' && schedule.date === day.date && schedule.slot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      updateCheckout({ schedule: { type: 'scheduled', date: day.date, slot } });
                      setError(null);
                    }}
                    className={cn(
                      'rounded-xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                      active ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-900 hover:border-ink-400',
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
      <Button size="lg" fullWidth onClick={submit}>
        Continue
      </Button>
    </div>
  );
}
