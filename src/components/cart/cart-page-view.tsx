'use client';

import { AlertTriangle, ArrowRight, Bike, Info, ShoppingBag, Store, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartIssues } from '@/hooks/use-cart-issues';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useActivePromo, useCartBreakdown, useCartStore } from '@/store/cart-store';
import { useHasHydrated } from '@/store/hydration';
import { usePostcodeStore } from '@/store/postcode-store';
import { toast } from '@/store/ui-store';
import { CartGroups } from './cart-groups';
import { PriceBreakdownView } from './price-breakdown';
import { PromoBox } from './promo-box';
import { TipSelector } from './tip-selector';
import { UpsellCarousel } from './upsell-carousel';

export function CartPageView() {
  const hydrated = useHasHydrated();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const multiDrop = useCartStore((s) => s.multiDrop);
  const fulfilment = useCartStore((s) => s.fulfilment);
  const setFulfilment = useCartStore((s) => s.setFulfilment);
  const clearCart = useCartStore((s) => s.clearCart);
  const breakdown = useCartBreakdown();
  const promo = useActivePromo();
  const distanceMiles = usePostcodeStore((s) => s.distanceMiles);
  const postcode = usePostcodeStore((s) => s.postcode);
  const { issues, blocking } = useCartIssues();

  if (!hydrated) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_400px]" role="status" aria-label="Loading basket">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[480px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Your basket is empty"
          description="Find something delicious — or reorder a favourite from your order history."
          action={
            <>
              <Link href="/restaurants"><Button>Browse restaurants</Button></Link>
              <Link href="/account/orders"><Button variant="outline">Order again</Button></Link>
            </>
          }
        />
      </div>
    );
  }

  const onClear = () => {
    const snapshot = useCartStore.getState().items;
    clearCart();
    toast({
      title: 'Basket cleared',
      action: { label: 'Undo', onClick: () => snapshot.forEach((l) => useCartStore.getState().restoreItem(l)) },
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">Your basket</h1>
          <p className="mt-1 text-ink-600">
            {breakdown.itemCount} item{breakdown.itemCount === 1 ? '' : 's'}
            {multiDrop && ` · Multi-drop from ${breakdown.restaurantCount} restaurants`}
            {postcode && fulfilment === 'delivery' && ` · Delivering to ${postcode}`}
          </p>
        </div>
        <Button variant="ghost" onClick={onClear} className="text-red-800 hover:bg-red-50">
          <Trash2 className="h-4 w-4" aria-hidden /> Clear basket
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-8">
          {multiDrop && (
            <p className="flex items-start gap-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Multi-drop order: one courier will collect from each kitchen in turn. Expect ~10 extra minutes and a small per-stop fee.
            </p>
          )}
          <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
            <CartGroups />
          </div>
          <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
            <UpsellCarousel />
          </div>
        </div>

        <aside aria-label="Order summary" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-ink-50 p-1" role="radiogroup" aria-label="Fulfilment method">
              {(['delivery', 'collection'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={fulfilment === mode}
                  onClick={() => setFulfilment(mode)}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold capitalize transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                    fulfilment === mode ? 'bg-white text-ink-900 shadow' : 'text-ink-700 hover:text-ink-900',
                  )}
                >
                  {mode === 'delivery' ? <Bike className="h-4 w-4" aria-hidden /> : <Store className="h-4 w-4" aria-hidden />}
                  {mode}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-6">
              {fulfilment === 'delivery' && <TipSelector subtotal={breakdown.subtotal} />}
              <PromoBox subtotal={breakdown.subtotal} />
              <PriceBreakdownView breakdown={breakdown} promo={promo} fulfilment={fulfilment} distanceMiles={distanceMiles} />
            </div>

            {issues.length > 0 && (
              <ul className="mt-5 space-y-2" aria-label="Basket issues">
                {issues.map((issue) => (
                  <li
                    key={issue.id}
                    className={cn('flex items-start gap-2 rounded-xl p-3 text-sm font-medium', issue.severity === 'blocking' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900')}
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}

            <Button size="lg" fullWidth className="mt-5 justify-between" disabled={blocking} onClick={() => router.push('/checkout')}>
              <span>Go to checkout</span>
              <span className="flex items-center gap-2 tabular-nums">
                {formatMoney(breakdown.total)} <ArrowRight className="h-5 w-5" aria-hidden />
              </span>
            </Button>
            {!postcode && fulfilment === 'delivery' && (
              <Link href="/" className="mt-3 block text-center text-sm font-semibold text-brand-800 underline">
                Set your delivery postcode
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
