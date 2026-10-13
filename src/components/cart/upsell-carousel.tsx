'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { SmartImage } from '@/components/ui/smart-image';
import { getMenu } from '@/data';
import { formatMoney } from '@/lib/format';
import { defaultModifiers } from '@/lib/order-factory';
import { useCartStore } from '@/store/cart-store';
import { useStock } from '@/store/merchant-store';
import { toast } from '@/store/ui-store';
import type { MenuItem, UpsellKind } from '@/types';

const KIND_LABEL: Record<UpsellKind, string> = { drink: 'Add a drink', dip: 'Grab a dip', dessert: 'Something sweet', side: 'On the side' };
const KIND_EMOJI: Record<UpsellKind, string> = { drink: '🥤', dip: '🫙', dessert: '🍨', side: '🍟' };

/**
 * "Complete your meal" — recommends drinks, dips, sides and desserts from
 * restaurants already in the basket, prioritising the kinds the basket lacks.
 */
export function UpsellCarousel({ title = 'Complete your meal' }: { title?: string }) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const { isItemAvailable } = useStock();
  const scroller = useRef<HTMLUListElement>(null);

  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((i) => i.menuItemId));
    const restaurantIds = Array.from(new Set(items.map((i) => i.restaurantId)));
    const presentKinds = new Set<UpsellKind>();
    for (const line of items) {
      const kind = getMenu(line.restaurantId).find((m) => m.id === line.menuItemId)?.upsellKind;
      if (kind) presentKinds.add(kind);
    }
    const priority: UpsellKind[] = ['drink', 'dip', 'dessert', 'side'];
    const candidates: MenuItem[] = restaurantIds.flatMap((rid) =>
      getMenu(rid).filter((m) => m.upsellKind && !inCart.has(m.id) && isItemAvailable(m) && m.price <= 1200),
    );
    return candidates
      .sort((a, b) => {
        const aMissing = presentKinds.has(a.upsellKind!) ? 1 : 0;
        const bMissing = presentKinds.has(b.upsellKind!) ? 1 : 0;
        return aMissing - bMissing || priority.indexOf(a.upsellKind!) - priority.indexOf(b.upsellKind!) || a.price - b.price;
      })
      .slice(0, 10);
  }, [items, isItemAvailable]);

  if (!items.length || !suggestions.length) return null;

  const quickAdd = (item: MenuItem) => {
    const restaurantName = items.find((i) => i.restaurantId === item.restaurantId)?.restaurantName ?? '';
    addItem({
      restaurantId: item.restaurantId,
      restaurantName,
      menuItemId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      quantity: 1,
      modifiers: defaultModifiers(item.modifierGroups),
      specialInstructions: '',
    });
    toast({ title: `Added ${item.name}`, tone: 'success', durationMs: 2500 });
  };

  const scroll = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });

  return (
    <section aria-labelledby="upsell-title">
      <div className="mb-3 flex items-center justify-between">
        <h3 id="upsell-title" className="font-bold text-ink-900">
          {title}
        </h3>
        <div className="flex gap-1">
          <button type="button" onClick={() => scroll(-1)} className="rounded-full border border-ink-200 p-1.5 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300" aria-label="Scroll suggestions left">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => scroll(1)} className="rounded-full border border-ink-200 p-1.5 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300" aria-label="Scroll suggestions right">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <ul ref={scroller} className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {suggestions.map((item) => (
          <motion.li key={item.id} layout className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <div className="relative h-24 bg-ink-50">
              <SmartImage src={item.image} alt="" fill sizes="160px" fallbackEmoji={KIND_EMOJI[item.upsellKind!]} />
              <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-ink-900">{KIND_LABEL[item.upsellKind!]}</span>
            </div>
            <div className="p-2.5">
              <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-ink-900">{item.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold tabular-nums text-ink-900">{formatMoney(item.price)}</span>
                <button
                  type="button"
                  onClick={() => quickAdd(item)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 active:scale-90"
                  aria-label={`Add ${item.name} for ${formatMoney(item.price)}`}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
