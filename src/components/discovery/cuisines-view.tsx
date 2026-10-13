'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { RestaurantCard } from '@/components/discovery/restaurant-card';
import { FilterBar } from '@/components/discovery/filter-bar';
import { NoResults } from '@/components/discovery/no-results';
import { SmartImage } from '@/components/ui/smart-image';
import { CUISINES } from '@/data';
import { useDiscoveryParams } from '@/hooks/use-discovery-params';
import { useDiscoveredListings } from '@/hooks/use-listings';
import { cn } from '@/lib/utils';
import { usePostcodeStore } from '@/store/postcode-store';
import type { CuisineId } from '@/types';

export function CuisinesView() {
  const [state, update, reset] = useDiscoveryParams();
  const { all, results } = useDiscoveredListings(state);
  const area = usePostcodeStore((s) => s.area);

  const toggleCuisine = (id: CuisineId) =>
    update({ cuisines: state.cuisines.includes(id) ? state.cuisines.filter((c) => c !== id) : [...state.cuisines, id] });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <header className="pb-6 pt-10">
        <p className="text-sm font-semibold text-brand-800">Delivering to {area?.district}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">Discover cuisines</h1>
        <p className="mt-2 max-w-2xl text-ink-600">Pick one or more cuisines, layer on dietary needs, and we’ll surface the best kitchens near you.</p>
      </header>

      <section aria-label="Choose cuisines">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CUISINES.map((c) => {
            const selected = state.cuisines.includes(c.id);
            const count = all.filter((l) => l.cuisine === c.id).length;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCuisine(c.id)}
                  className={cn(
                    'group relative block w-full overflow-hidden rounded-2xl text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                    selected ? 'ring-4 ring-ink-900' : 'ring-1 ring-ink-100',
                  )}
                >
                  <div className="relative aspect-square bg-ink-100">
                    <SmartImage src={c.image} alt="" fill sizes="(max-width: 640px) 50vw, 12vw" className="transition-transform duration-500 group-hover:scale-110" fallbackEmoji={c.emoji} />
                    <div className={cn('absolute inset-0 bg-gradient-to-t', c.accent)} aria-hidden />
                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-900"
                          aria-hidden
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                      <p className="font-display font-bold leading-tight">{c.name}</p>
                      <p className="text-xs font-semibold text-white/90">
                        {count} {count === 1 ? 'kitchen' : 'kitchens'}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        {state.cuisines.length === 1 && (
          <p className="mt-3 text-sm text-ink-600">{CUISINES.find((c) => c.id === state.cuisines[0])?.description}</p>
        )}
      </section>

      <div className="mt-6">
        <FilterBar state={state} onChange={update} onReset={reset} resultCount={results.length} />
      </div>

      <section aria-label="Matching restaurants" className="mt-6">
        {results.length === 0 ? (
          <NoResults onReset={reset} query={state.query} />
        ) : (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {results.map((l, i) => (
                <RestaurantCard key={l.id} listing={l} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}
