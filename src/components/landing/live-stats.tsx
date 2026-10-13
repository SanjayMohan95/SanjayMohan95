'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { Bike, Clock, Store, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAreaListings } from '@/hooks/use-listings';
import { useHasHydrated } from '@/store/hydration';
import { usePostcodeStore } from '@/store/postcode-store';

function Counter({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString('en-GB'));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.2, ease: 'easeOut' });
    return controls.stop;
  }, [mv, value]);
  return <motion.span className="tabular-nums">{rounded}</motion.span>;
}

/** Live delivery stats — localised once a postcode is set, London-wide otherwise. */
export function LiveStats() {
  const hydrated = useHasHydrated();
  const area = usePostcodeStore((s) => s.area);
  const listings = useAreaListings();
  const [jitter, setJitter] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setJitter(Math.round((Math.random() - 0.4) * 6)), 3500);
    return () => window.clearInterval(id);
  }, []);

  const open = listings.filter((l) => l.isOpen);
  const etaLow = open.length ? Math.min(...open.map((l) => l.etaRange[0])) : 25;
  const etaHigh = open.length ? Math.round(open.reduce((s, l) => s + l.etaRange[1], 0) / open.length / 5) * 5 : 35;
  const couriers = (area?.activeCouriers ?? 1284) + jitter;
  const kitchens = area ? listings.length : 16;

  const stats = [
    { icon: Clock, label: 'Estimated delivery', value: <>{etaLow}–{Math.max(etaHigh, etaLow + 10)} min</> },
    { icon: Bike, label: area ? `Couriers active in ${area.outcode}` : 'Couriers active now', value: <Counter value={couriers} />, live: true },
    { icon: Store, label: area ? 'Kitchens delivering to you' : 'Partner kitchens', value: <Counter value={kitchens} /> },
    { icon: Users, label: 'Orders this week', value: <Counter value={48210} /> },
  ];

  return (
    <section aria-label="Live delivery statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, live }) => (
        <div key={label} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <Icon className="h-5 w-5 text-brand-700" aria-hidden />
            {live && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-herb-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-herb-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-herb-600" />
                </span>
                LIVE
              </span>
            )}
          </div>
          <p className="mt-3 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">{hydrated ? value : '—'}</p>
          <p className="mt-0.5 text-sm text-ink-600">{label}</p>
        </div>
      ))}
    </section>
  );
}
