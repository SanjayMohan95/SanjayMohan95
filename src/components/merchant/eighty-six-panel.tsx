'use client';

import { Ban, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Chip } from '@/components/ui/form';
import { getMenu } from '@/data';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { itemStockKey, optionStockKey, useMerchantStore } from '@/store/merchant-store';
import { toast } from '@/store/ui-store';

/**
 * The "86 list": instantly mark dishes or ingredients (modifier options) out of
 * stock. Changes propagate live to customer menus, baskets and reorders.
 */
export function EightySixPanel({ restaurantId }: { restaurantId: string }) {
  const eightySixed = useMerchantStore((s) => s.eightySixed);
  const toggle86 = useMerchantStore((s) => s.toggle86);
  const clear86 = useMerchantStore((s) => s.clear86);
  const [mode, setMode] = useState<'dishes' | 'ingredients'>('dishes');
  const [query, setQuery] = useState('');

  const menu = useMemo(() => getMenu(restaurantId), [restaurantId]);
  const ingredients = useMemo(() => {
    const map = new Map<string, { key: string; name: string; group: string; usedIn: number }>();
    for (const item of menu) {
      for (const g of item.modifierGroups) {
        for (const o of g.options) {
          if (o.priceDelta <= 0 && g.selection === 'multiple' && /no |hold/i.test(o.name)) continue;
          const key = optionStockKey(restaurantId, g.id, o.id);
          const existing = map.get(key);
          if (existing) existing.usedIn += 1;
          else map.set(key, { key, name: o.name, group: g.name, usedIn: 1 });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [menu, restaurantId]);

  const q = query.trim().toLowerCase();
  const dishes = menu.filter((m) => !q || m.name.toLowerCase().includes(q));
  const filteredIngredients = ingredients.filter((i) => !q || `${i.name} ${i.group}`.toLowerCase().includes(q));
  const activeCount = Object.keys(eightySixed).filter((k) => k.startsWith(`item:${restaurantId}__`) || k.startsWith(`opt:${restaurantId}:`)).length;

  const flip = (key: string, label: string) => {
    const was = !!eightySixed[key];
    toggle86(key);
    toast({ title: was ? `${label} back in stock` : `${label} 86’d`, description: was ? 'Customers can order it again.' : 'Hidden from new orders immediately.', tone: was ? 'success' : 'info', durationMs: 2500 });
  };

  return (
    <section aria-labelledby="eighty-six-title" className="flex h-full flex-col rounded-3xl border border-ink-800 bg-ink-900 text-white">
      <div className="border-b border-ink-800 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id="eighty-six-title" className="flex items-center gap-2 font-display text-lg font-bold">
            <Ban className="h-5 w-5 text-red-300" aria-hidden /> 86 list
            {activeCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold">{activeCount}</span>}
          </h2>
          {activeCount > 0 && (
            <button type="button" onClick={() => clear86(restaurantId)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-ink-200 hover:bg-white/10 hover:text-white">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Restore all
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Chip pressed={mode === 'dishes'} onClick={() => setMode('dishes')} className={cn(mode !== 'dishes' && 'border-ink-700 bg-ink-800 text-ink-100', mode === 'dishes' && 'border-white bg-white text-ink-900')}>
            Dishes
          </Chip>
          <Chip pressed={mode === 'ingredients'} onClick={() => setMode('ingredients')} className={cn(mode !== 'ingredients' && 'border-ink-700 bg-ink-800 text-ink-100', mode === 'ingredients' && 'border-white bg-white text-ink-900')}>
            Ingredients
          </Chip>
        </div>
        <div className="relative mt-3">
          <label htmlFor="eighty-six-search" className="sr-only">Search {mode}</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-hidden />
          <input
            id="eighty-six-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${mode}…`}
            className="h-10 w-full rounded-xl border border-ink-700 bg-ink-800 pl-9 pr-3 text-sm text-white placeholder:text-ink-300 focus:border-white focus:outline-none"
          />
        </div>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-ink-800 overflow-y-auto">
        {(mode === 'dishes'
          ? dishes.map((d) => ({ key: itemStockKey(d.id), name: d.name, sub: d.available ? d.categoryId : 'Unavailable in catalogue', locked: !d.available }))
          : filteredIngredients.map((i) => ({ key: i.key, name: i.name, sub: `${i.group} · ${i.usedIn} dish${i.usedIn === 1 ? '' : 'es'}`, locked: false }))
        ).map((row) => {
          const out = !!eightySixed[row.key] || row.locked;
          return (
            <li key={row.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className={cn('truncate text-sm font-semibold', out ? 'text-red-300 line-through' : 'text-white')}>{row.name}</p>
                <p className="truncate text-xs capitalize text-ink-300">
                  {eightySixed[row.key] ? `86’d ${formatRelative(eightySixed[row.key].since)}` : row.sub}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!out}
                aria-label={`${row.name} ${out ? 'out of stock' : 'in stock'}`}
                disabled={row.locked}
                onClick={() => flip(row.key, row.name)}
                className={cn(
                  'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:opacity-50',
                  out ? 'bg-red-600' : 'bg-herb-600',
                )}
              >
                <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', out ? 'translate-x-1' : 'translate-x-6')} />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-ink-800 p-3 text-xs text-ink-300">Changes sync instantly to customer menus — try it with the menu open in another tab.</p>
    </section>
  );
}
