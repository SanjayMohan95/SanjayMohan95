'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Search, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Chip } from '@/components/ui/form';
import { EmptyState } from '@/components/ui/empty-state';
import { MenuSkeleton } from '@/components/ui/skeleton';
import { CUISINE_MAP, getMenu, getRestaurant } from '@/data';
import { useNow } from '@/hooks/use-now';
import { isInDeliveryRadius, toListing } from '@/lib/discovery';
import { formatMoney } from '@/lib/format';
import { cartSubtotal } from '@/lib/pricing';
import { useCartStore } from '@/store/cart-store';
import { useHasHydrated } from '@/store/hydration';
import { useStock } from '@/store/merchant-store';
import { usePostcodeStore } from '@/store/postcode-store';
import type { DietaryTag, MenuItem } from '@/types';
import { CategoryNav } from './category-nav';
import { ItemCustomizer } from './item-customizer';
import { MenuItemCard } from './menu-item-card';
import { RestaurantBanner } from './restaurant-banner';

const MENU_FILTERS: { id: DietaryTag; label: string }[] = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'halal', label: 'Halal' },
];

export function RestaurantMenuView({ restaurantId }: { restaurantId: string }) {
  const restaurant = getRestaurant(restaurantId)!;
  const menu = useMemo(() => getMenu(restaurantId), [restaurantId]);
  const hydrated = useHasHydrated();
  const area = usePostcodeStore((s) => s.area);
  const cartItems = useCartStore((s) => s.items);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { isItemAvailable } = useStock();
  const now = useNow();
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [query, setQuery] = useState('');
  const [diet, setDiet] = useState<DietaryTag[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setMenuLoading(false), 350);
    return () => window.clearTimeout(t);
  }, []);

  const inRadius = area ? isInDeliveryRadius(restaurant, area) : true;
  const listing = area && inRadius ? toListing(restaurant, area, now) : null;
  const cuisine = CUISINE_MAP[restaurant.cuisine];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter(
      (i) =>
        (!q || `${i.name} ${i.description}`.toLowerCase().includes(q)) &&
        diet.every((d) => i.dietary.includes(d) || (d === 'vegetarian' && i.dietary.includes('vegan'))),
    );
  }, [menu, query, diet]);

  const categories = restaurant.categories.filter((c) => filtered.some((i) => i.categoryId === c.id));
  const counts = Object.fromEntries(categories.map((c) => [c.id, filtered.filter((i) => i.categoryId === c.id).length]));
  const qtyByItem = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of cartItems) map[line.menuItemId] = (map[line.menuItemId] ?? 0) + line.quantity;
    return map;
  }, [cartItems]);
  const restaurantLines = cartItems.filter((i) => i.restaurantId === restaurantId);
  const restaurantSubtotal = cartSubtotal(restaurantLines);
  const restaurantCount = restaurantLines.reduce((n, l) => n + l.quantity, 0);
  const popular = menu.filter((i) => i.popular && isItemAvailable(i)).slice(0, 4);

  if (!hydrated || menuLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <MenuSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 sm:px-6">
      <RestaurantBanner restaurant={restaurant} listing={listing} now={now} inRadius={inRadius} />

      {popular.length > 0 && !query && diet.length === 0 && (
        <section aria-labelledby="popular-title" className="mt-10">
          <h2 id="popular-title" className="font-display text-xl font-extrabold text-ink-900">
            Most ordered
          </h2>
          <ul className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {popular.map((item) => (
              <li key={item.id} className="w-64 shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 text-left shadow-card transition hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
                >
                  <span className="text-3xl" aria-hidden>{cuisine.emoji}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink-900">{item.name}</span>
                    <span className="block text-sm text-ink-600">{formatMoney(item.price)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <label htmlFor="menu-search" className="sr-only">Search the menu</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" aria-hidden />
            <input
              id="menu-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${restaurant.name}`}
              className="h-10 w-full rounded-full border border-ink-200 bg-white pl-10 pr-4 text-sm focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div role="group" aria-label="Dietary filters" className="no-scrollbar flex gap-2 overflow-x-auto">
            {MENU_FILTERS.map((f) => (
              <Chip key={f.id} pressed={diet.includes(f.id)} onClick={() => setDiet((d) => (d.includes(f.id) ? d.filter((x) => x !== f.id) : [...d, f.id]))}>
                {f.label}
              </Chip>
            ))}
          </div>
        </div>
        {categories.length > 0 && <CategoryNav categories={categories} counts={counts} />}
      </div>

      {categories.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Search className="h-8 w-8" />}
          title="No dishes match"
          description="Try a different search or remove a dietary filter."
          action={<button type="button" className="font-semibold text-brand-800 underline" onClick={() => { setQuery(''); setDiet([]); }}>Reset menu filters</button>}
        />
      ) : (
        <div className="mt-6 space-y-10">
          {categories.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} aria-labelledby={`cat-${cat.id}-title`} className="scroll-mt-36">
              <h2 id={`cat-${cat.id}-title`} tabIndex={-1} className="font-display text-2xl font-extrabold text-ink-900 focus:outline-none">
                {cat.name}
              </h2>
              {cat.description && <p className="mt-1 text-sm text-ink-600">{cat.description}</p>}
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {filtered
                  .filter((i) => i.categoryId === cat.id)
                  .map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      available={isItemAvailable(item)}
                      quantityInCart={qtyByItem[item.id] ?? 0}
                      onSelect={setSelected}
                      emoji={cuisine.emoji}
                    />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {restaurantCount > 0 && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:bottom-6 md:left-auto md:right-6 md:rounded-2xl md:border md:shadow-lift">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="hidden min-w-0 md:block">
              {restaurantSubtotal < restaurant.minOrder ? (
                <p className="text-sm font-semibold text-amber-900">{formatMoney(restaurant.minOrder - restaurantSubtotal)} to minimum order</p>
              ) : (
                <p className="text-sm font-semibold text-herb-700">Minimum order reached</p>
              )}
            </div>
            <button
              type="button"
              onClick={openDrawer}
              className="flex h-12 flex-1 items-center justify-between gap-4 rounded-xl bg-brand-700 px-4 font-bold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 md:flex-none"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" aria-hidden />
                View basket ({restaurantCount})
              </span>
              <span className="tabular-nums">{formatMoney(restaurantSubtotal)}</span>
            </button>
            <Link href="/checkout" className="hidden h-12 items-center gap-1 rounded-xl bg-ink-900 px-4 font-bold text-white hover:bg-ink-800 md:inline-flex">
              Checkout <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </motion.div>
      )}

      <ItemCustomizer item={selected} restaurantName={restaurant.name} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
