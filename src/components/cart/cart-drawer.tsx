'use client';

import { ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/format';
import { useCartBreakdown, useCartStore } from '@/store/cart-store';
import { CartGroups } from './cart-groups';
import { UpsellCarousel } from './upsell-carousel';

export function CartDrawer() {
  const open = useCartStore((s) => s.drawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const multiDrop = useCartStore((s) => s.multiDrop);
  const breakdown = useCartBreakdown();
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <Dialog
      open={open}
      onClose={close}
      placement="right"
      title="Your basket"
      description={items.length ? `${breakdown.itemCount} item${breakdown.itemCount === 1 ? '' : 's'}${multiDrop ? ` · multi-drop from ${breakdown.restaurantCount} restaurants` : ''}` : undefined}
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-ink-700">Subtotal</span>
              <span className="text-lg font-bold tabular-nums text-ink-900">{formatMoney(breakdown.subtotal)}</span>
            </div>
            {!breakdown.meetsMinimumOrder && (
              <p className="text-sm font-medium text-amber-900">Add {formatMoney(breakdown.amountToMinimum)} more to meet the minimum order.</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cart" className="inline-flex h-12 items-center justify-center rounded-xl border border-ink-200 font-semibold text-ink-900 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300">
                View basket
              </Link>
              <Link
                href={breakdown.meetsMinimumOrder ? '/checkout' : '/cart'}
                aria-disabled={!breakdown.meetsMinimumOrder}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 font-bold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 aria-disabled:bg-ink-200 aria-disabled:text-ink-600"
              >
                Checkout <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Your basket is empty"
            description="Hungry? Browse hundreds of dishes from London’s best local kitchens."
            action={
              <Link href="/restaurants" onClick={close}>
                <Button>Browse restaurants</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-6 px-5 py-4">
          <CartGroups onNavigate={close} />
          <UpsellCarousel />
        </div>
      )}
    </Dialog>
  );
}
