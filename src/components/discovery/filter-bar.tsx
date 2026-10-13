'use client';

import { ArrowDownUp, Bike, Clock, Leaf, Search, ShieldCheck, Star, WheatOff, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Chip } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import type { DiscoveryFilter, DiscoveryState, PriceTier, SortOption } from '@/types';

const FILTERS: { id: DiscoveryFilter; label: string; icon: ReactNode }[] = [
  { id: 'halal', label: 'Halal', icon: <ShieldCheck className="h-4 w-4" aria-hidden /> },
  { id: 'vegan', label: 'Vegan', icon: <Leaf className="h-4 w-4" aria-hidden /> },
  { id: 'gluten-free', label: 'Gluten-free', icon: <WheatOff className="h-4 w-4" aria-hidden /> },
  { id: 'nut-free', label: 'Nut-free', icon: <span aria-hidden>🥜</span> },
  { id: 'top-rated', label: 'Top rated 4.8+', icon: <Star className="h-4 w-4" aria-hidden /> },
  { id: 'free-delivery', label: 'Free delivery', icon: <Bike className="h-4 w-4" aria-hidden /> },
  { id: 'under-30', label: 'Under 30 min', icon: <Clock className="h-4 w-4" aria-hidden /> },
];

export const SORTS: { id: SortOption; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'fastest', label: 'Fastest delivery' },
  { id: 'rating', label: 'Customer rating' },
  { id: 'min-order', label: 'Lowest minimum order' },
];

export function FilterBar({
  state,
  onChange,
  onReset,
  resultCount,
  sticky = true,
  trailing,
}: {
  state: DiscoveryState;
  onChange: (patch: Partial<DiscoveryState>) => void;
  onReset: () => void;
  resultCount: number;
  sticky?: boolean;
  trailing?: ReactNode;
}) {
  const [query, setQuery] = useState(state.query);
  useEffect(() => setQuery(state.query), [state.query]);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (query !== state.query) onChange({ query });
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, state.query, onChange]);

  const toggleFilter = (f: DiscoveryFilter) =>
    onChange({ filters: state.filters.includes(f) ? state.filters.filter((x) => x !== f) : [...state.filters, f] });
  const toggleTier = (t: PriceTier) =>
    onChange({ priceTiers: state.priceTiers.includes(t) ? state.priceTiers.filter((x) => x !== t) : [...state.priceTiers, t].sort() as PriceTier[] });

  const activeCount = state.filters.length + state.priceTiers.length + state.cuisines.length + (state.query ? 1 : 0);

  return (
    <div className={cn('z-30 -mx-4 border-b border-ink-100 bg-[#fbfaf8]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6', sticky && 'sticky top-16')}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <label htmlFor="discover-search" className="sr-only">
            Search restaurants or cuisines
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" aria-hidden />
          <input
            id="discover-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ‘ramen’, ‘halal’, ‘birria’…"
            className="h-10 w-full rounded-full border border-ink-200 bg-white pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-600 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="discover-sort" className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
            <ArrowDownUp className="h-4 w-4" aria-hidden /> Sort
          </label>
          <select
            id="discover-sort"
            value={state.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortOption })}
            className="h-10 rounded-full border border-ink-200 bg-white px-3 pr-8 text-sm font-semibold text-ink-900 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {trailing && <div className="ml-auto lg:ml-2">{trailing}</div>}
        </div>
        <p className="text-sm text-ink-600 lg:ml-auto" aria-live="polite">
          <strong className="text-ink-900">{resultCount}</strong> {resultCount === 1 ? 'restaurant' : 'restaurants'}
        </p>
      </div>
      <div role="group" aria-label="Filters" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        {FILTERS.map((f) => (
          <Chip key={f.id} pressed={state.filters.includes(f.id)} onClick={() => toggleFilter(f.id)} icon={f.icon}>
            {f.label}
          </Chip>
        ))}
        <span className="mx-1 w-px shrink-0 bg-ink-200" aria-hidden />
        {([1, 2, 3] as PriceTier[]).map((t) => (
          <Chip key={t} pressed={state.priceTiers.includes(t)} onClick={() => toggleTier(t)} aria-label={`Price tier ${'£'.repeat(t)}`}>
            {'£'.repeat(t)}
          </Chip>
        ))}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
          >
            <X className="h-4 w-4" aria-hidden /> Clear all ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
