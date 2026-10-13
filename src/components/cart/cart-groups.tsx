'use client';

import { AnimatePresence } from 'framer-motion';
import { Store } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ItemCustomizer } from '@/components/restaurant/item-customizer';
import { getMenuItem, getRestaurant } from '@/data';
import { formatMoney } from '@/lib/format';
import { cartSubtotal, groupByRestaurant } from '@/lib/pricing';
import { useCartStore } from '@/store/cart-store';
import { useStock } from '@/store/merchant-store';
import type { CartItem } from '@/types';
import { CartLine } from './cart-line';

/** Basket lines grouped per restaurant (multi-drop aware) with inline modifier editing. */
export function CartGroups({ onNavigate }: { onNavigate?: () => void }) {
  const items = useCartStore((s) => s.items);
  const { isItemAvailable } = useStock();
  const [editing, setEditing] = useState<CartItem | null>(null);
  const groups = useMemo(() => Array.from(groupByRestaurant(items).entries()), [items]);
  const editingItem = editing ? getMenuItem(editing.menuItemId) ?? null : null;

  return (
    <>
      <div className="space-y-6">
        {groups.map(([restaurantId, lines]) => {
          const restaurant = getRestaurant(restaurantId);
          const subtotal = cartSubtotal(lines);
          const short = restaurant ? restaurant.minOrder - subtotal : 0;
          return (
            <section key={restaurantId} aria-label={`Items from ${lines[0].restaurantName}`}>
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/restaurant/${restaurantId}`}
                  onClick={onNavigate}
                  className="inline-flex items-center gap-2 font-bold text-ink-900 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
                >
                  <Store className="h-4 w-4 text-brand-700" aria-hidden />
                  {lines[0].restaurantName}
                </Link>
                <span className="text-sm tabular-nums text-ink-600">{formatMoney(subtotal)}</span>
              </div>
              {short > 0 && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <strong>{formatMoney(short)}</strong> to reach the {formatMoney(restaurant!.minOrder)} minimum order.
                </p>
              )}
              <ul className="divide-y divide-ink-100">
                <AnimatePresence initial={false}>
                  {lines.map((line) => {
                    const menuItem = getMenuItem(line.menuItemId);
                    return (
                      <CartLine
                        key={line.lineId}
                        line={line}
                        onEdit={menuItem && menuItem.modifierGroups.length > 0 ? setEditing : undefined}
                        unavailable={menuItem ? !isItemAvailable(menuItem) : true}
                      />
                    );
                  })}
                </AnimatePresence>
              </ul>
            </section>
          );
        })}
      </div>
      <ItemCustomizer
        item={editingItem}
        restaurantName={editing?.restaurantName ?? ''}
        open={!!editing}
        onClose={() => setEditing(null)}
        editLine={editing}
      />
    </>
  );
}
