'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { List, Map as MapIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RestaurantCard } from '@/components/discovery/restaurant-card';
import { FilterBar } from '@/components/discovery/filter-bar';
import { NoResults } from '@/components/discovery/no-results';
import { RestaurantMap } from '@/components/map/restaurant-map';
import { RestaurantGridSkeleton } from '@/components/ui/skeleton';
import { CUISINE_MAP } from '@/data';
import { useDiscoveryParams } from '@/hooks/use-discovery-params';
import { useDiscoveredListings } from '@/hooks/use-listings';
import { cn } from '@/lib/utils';
import { usePostcodeStore } from '@/store/postcode-store';

export function RestaurantsView() {
  const [state, update, reset] = useDiscoveryParams();
  const { results } = useDiscoveredListings(state);
  const area = usePostcodeStore((s) => s.area)!;
  const postcode = usePostcodeStore((s) => s.postcode);
  const [showMap, setShowMap] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate the vendor-availability fetch so the skeleton state is exercised.
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(t);
  }, [postcode]);

  const heading = state.cuisines.length === 1 ? `${CUISINE_MAP[state.cuisines[0]].name} near you` : 'Restaurants near you';
  const open = results.filter((r) => r.isOpen).length;

  const mapToggle = (
    <button
      type="button"
      onClick={() => setShowMap((v) => !v)}
      aria-pressed={showMap}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-ink-900 px-4 text-sm font-bold text-white shadow-card transition hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
    >
      {showMap ? <List className="h-4 w-4" aria-hidden /> : <MapIcon className="h-4 w-4" aria-hidden />}
      {showMap ? 'Show list' : 'Show on map'}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <header className="pb-4 pt-10">
        <p className="text-sm font-semibold text-brand-800">
          {postcode} · {area.district}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">{heading}</h1>
        <p className="mt-2 text-ink-600">
          {open} open now · sorted by {state.sort === 'recommended' ? 'what we think you’ll love' : state.sort.replace('-', ' ')}
        </p>
      </header>

      <FilterBar state={state} onChange={update} onReset={reset} resultCount={results.length} trailing={mapToggle} />

      <div className={cn('mt-6 grid gap-6', showMap && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]')}>
        <section aria-label="Restaurant results" className={cn(showMap && 'hidden lg:block')}>
          {loading ? (
            <RestaurantGridSkeleton count={6} />
          ) : results.length === 0 ? (
            <NoResults onReset={reset} query={state.query} />
          ) : (
            <motion.div layout className={cn('grid gap-5', showMap ? 'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3')}>
              <AnimatePresence mode="popLayout">
                {results.map((l, i) => (
                  <RestaurantCard key={l.id} listing={l} index={i} highlighted={showMap && highlighted === l.id} onHover={setHighlighted} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
        <AnimatePresence>
          {showMap && (
            <motion.aside
              aria-label="Restaurant map"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="lg:sticky lg:top-44 lg:h-[calc(100dvh-12rem)]"
            >
              <div className="h-[70dvh] lg:h-full">
                <RestaurantMap listings={results} area={area} highlightedId={highlighted} onHighlight={setHighlighted} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Floating map toggle for thumb reach on mobile */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center lg:hidden">
        <div className="pointer-events-auto">{mapToggle}</div>
      </div>
    </div>
  );
}
