'use client';

import { Flame } from 'lucide-react';
import Link from 'next/link';
import { RestaurantCard } from '@/components/discovery/restaurant-card';
import { RestaurantGridSkeleton } from '@/components/ui/skeleton';
import { useAreaListings } from '@/hooks/use-listings';
import { applyDiscovery, DEFAULT_DISCOVERY } from '@/lib/discovery';
import { useHasHydrated } from '@/store/hydration';
import { usePostcodeStore } from '@/store/postcode-store';

export function TrendingSpots() {
  const hydrated = useHasHydrated();
  const area = usePostcodeStore((s) => s.area);
  const listings = useAreaListings();

  if (!hydrated) return <RestaurantGridSkeleton count={3} />;
  if (!area) return null;

  const trending = applyDiscovery(listings, { ...DEFAULT_DISCOVERY, sort: 'rating' }).slice(0, 3);

  return (
    <section aria-labelledby="trending-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id="trending-title" className="flex items-center gap-2 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
          <Flame className="h-7 w-7 text-brand-700" aria-hidden /> Trending in {area.district}
        </h2>
        <Link href="/restaurants" className="shrink-0 font-semibold text-brand-800 hover:underline">
          See all {listings.length}
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {trending.map((l, i) => (
          <RestaurantCard key={l.id} listing={l} index={i} />
        ))}
      </div>
    </section>
  );
}
