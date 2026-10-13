'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SmartImage } from '@/components/ui/smart-image';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/types';
import { DietaryTags, SpiceIndicator } from './dietary';

export function MenuItemCard({
  item,
  available,
  quantityInCart,
  onSelect,
  emoji,
}: {
  item: MenuItem;
  available: boolean;
  quantityInCart: number;
  onSelect: (item: MenuItem) => void;
  emoji: string;
}) {
  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}>
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-disabled={!available || undefined}
        className={cn(
          'group flex h-full w-full gap-4 rounded-2xl border bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
          quantityInCart > 0 ? 'border-brand-600' : 'border-ink-100',
          !available && 'opacity-75',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {quantityInCart > 0 && (
              <span className="rounded-md bg-brand-700 px-1.5 py-0.5 text-xs font-bold text-white">
                {quantityInCart}×<span className="sr-only"> in basket</span>
              </span>
            )}
            <h3 className="font-bold text-ink-900">{item.name}</h3>
            <SpiceIndicator level={item.spiceLevel} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-ink-600">{item.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-semibold tabular-nums text-ink-900">{formatMoney(item.price)}</span>
            {item.calories > 0 && <span className="text-xs text-ink-600">{item.calories} kcal</span>}
            {item.popular && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">🔥 Popular</span>}
            {!available && <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-bold uppercase text-red-800">Sold out</span>}
          </div>
          <DietaryTags tags={item.dietary} compact className="mt-2" />
        </div>
        <div className="relative h-28 w-28 shrink-0">
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-ink-50">
            {item.image ? (
              <SmartImage src={item.image} alt="" fill sizes="112px" className={cn('transition-transform duration-500 group-hover:scale-105', !available && 'grayscale')} fallbackEmoji={emoji} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
                {emoji}
              </div>
            )}
          </div>
          {available && (
            <span
              aria-hidden
              className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-ink-900 text-white shadow-lift transition group-hover:scale-110 group-hover:bg-brand-700"
            >
              <Plus className="h-5 w-5" />
            </span>
          )}
        </div>
        <span className="sr-only">{available ? `Customise and add ${item.name}` : `${item.name} is sold out`}</span>
      </button>
    </motion.li>
  );
}
