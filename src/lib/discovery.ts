import type { DiscoveryState, PostcodeArea, Restaurant, RestaurantListing } from '@/types';
import { haversineMiles, roadMiles } from './geo';
import { getOpenState } from './hours';
import { deliveryFeeFor } from './pricing';

const roundTo5 = (n: number) => Math.round(n / 5) * 5;

export function etaFor(restaurant: Restaurant, distanceMiles: number, area: PostcodeArea | null): [number, number] {
  const transit = 4 + distanceMiles * 3.2;
  // Courier density shaves a couple of minutes off pickup waits.
  const densityBonus = area ? Math.min(4, area.activeCouriers / 15) : 0;
  const low = Math.max(15, roundTo5(restaurant.prepTimeMin + transit - densityBonus));
  return [low, low + 10];
}

export function toListing(restaurant: Restaurant, area: PostcodeArea, now: Date = new Date()): RestaurantListing {
  const distanceMiles = roadMiles(area.coordinates, restaurant.coordinates);
  const open = getOpenState(restaurant.openingHours, now);
  return {
    ...restaurant,
    distanceMiles,
    etaRange: etaFor(restaurant, distanceMiles, area),
    deliveryFee: deliveryFeeFor(restaurant, distanceMiles),
    isOpen: open.isOpen,
    opensAt: open.isOpen ? null : open.nextChange,
  };
}

export function isInDeliveryRadius(restaurant: Restaurant, area: PostcodeArea): boolean {
  return haversineMiles(area.coordinates, restaurant.coordinates) <= restaurant.deliveryRadiusMiles;
}

export function listingsForArea(restaurants: Restaurant[], area: PostcodeArea, now: Date = new Date()): RestaurantListing[] {
  return restaurants.filter((r) => isInDeliveryRadius(r, area)).map((r) => toListing(r, area, now));
}

export const DEFAULT_DISCOVERY: DiscoveryState = {
  cuisines: [],
  filters: [],
  priceTiers: [],
  sort: 'recommended',
  query: '',
};

function recommendedScore(r: RestaurantListing): number {
  return (
    r.rating * 20 +
    Math.log10(r.ratingCount + 1) * 6 -
    r.etaRange[0] * 0.6 -
    r.deliveryFee / 100 +
    (r.promoted ? 6 : 0) +
    (r.isOpen ? 25 : 0) +
    r.hygieneRating
  );
}

export function applyDiscovery(listings: RestaurantListing[], state: DiscoveryState): RestaurantListing[] {
  const q = state.query.trim().toLowerCase();
  const filtered = listings.filter((r) => {
    if (state.cuisines.length && !state.cuisines.includes(r.cuisine)) return false;
    if (state.priceTiers.length && !state.priceTiers.includes(r.priceTier)) return false;
    for (const f of state.filters) {
      if (f === 'halal' && !r.dietary.includes('halal')) return false;
      if (f === 'vegan' && !r.dietary.includes('vegan')) return false;
      if (f === 'gluten-free' && !r.dietary.includes('gluten-free')) return false;
      if (f === 'nut-free' && !r.dietary.includes('nut-free')) return false;
      if (f === 'top-rated' && r.rating < 4.8) return false;
      if (f === 'free-delivery' && r.deliveryFee > 0) return false;
      if (f === 'under-30' && r.etaRange[1] > 30) return false;
    }
    if (q) {
      const haystack = [r.name, r.tagline, r.cuisine, ...r.tags].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (state.sort) {
    case 'fastest':
      sorted.sort((a, b) => a.etaRange[0] - b.etaRange[0] || a.distanceMiles - b.distanceMiles);
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
      break;
    case 'min-order':
      sorted.sort((a, b) => a.minOrder - b.minOrder || a.deliveryFee - b.deliveryFee);
      break;
    default:
      sorted.sort((a, b) => recommendedScore(b) - recommendedScore(a));
  }
  // Closed restaurants always sink below open ones (they can still take scheduled orders).
  return sorted.sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
}

/** Serialise discovery state into URL search params (shareable filtered views). */
export function discoveryToParams(state: DiscoveryState): URLSearchParams {
  const p = new URLSearchParams();
  if (state.cuisines.length) p.set('cuisine', state.cuisines.join(','));
  if (state.filters.length) p.set('filter', state.filters.join(','));
  if (state.priceTiers.length) p.set('price', state.priceTiers.join(','));
  if (state.sort !== 'recommended') p.set('sort', state.sort);
  if (state.query) p.set('q', state.query);
  return p;
}

export function discoveryFromParams(params: URLSearchParams): DiscoveryState {
  const list = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean);
  const sort = params.get('sort');
  return {
    cuisines: list('cuisine') as DiscoveryState['cuisines'],
    filters: list('filter') as DiscoveryState['filters'],
    priceTiers: list('price').map(Number).filter((n) => n >= 1 && n <= 3) as DiscoveryState['priceTiers'],
    sort: sort === 'fastest' || sort === 'rating' || sort === 'min-order' ? sort : 'recommended',
    query: params.get('q') ?? '',
  };
}
