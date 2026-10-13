'use client';

import { useMemo } from 'react';
import { RESTAURANTS } from '@/data';
import { applyDiscovery, listingsForArea } from '@/lib/discovery';
import { usePostcodeStore } from '@/store/postcode-store';
import type { DiscoveryState, RestaurantListing } from '@/types';
import { useNow } from './use-now';

/** All restaurants that deliver to the active postcode, enriched with distance/ETA/fees. */
export function useAreaListings(): RestaurantListing[] {
  const area = usePostcodeStore((s) => s.area);
  const now = useNow();
  return useMemo(() => (area ? listingsForArea(RESTAURANTS, area, now) : []), [area, now]);
}

export function useDiscoveredListings(state: DiscoveryState): { all: RestaurantListing[]; results: RestaurantListing[] } {
  const all = useAreaListings();
  const results = useMemo(() => applyDiscovery(all, state), [all, state]);
  return { all, results };
}
