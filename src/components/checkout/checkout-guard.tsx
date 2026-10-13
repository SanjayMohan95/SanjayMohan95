'use client';

import { AlertTriangle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartIssues } from '@/hooks/use-cart-issues';
import { useCartStore } from '@/store/cart-store';
import { useHasHydrated } from '@/store/hydration';
import { useOrderStore } from '@/store/order-store';

/** Ensures checkout pages only render with a non-empty, valid basket. */
export function CheckoutGuard({ children }: { children: ReactNode }) {
  const hydrated = useHasHydrated();
  const count = useCartStore((s) => s.items.length);
  const { issues, blocking } = useCartIssues();
  const justPlaced = useOrderStore((s) => {
    const latest = s.orders.find((o) => o.id === s.activeOrderId);
    return !!latest && Date.now() - new Date(latest.createdAt).getTime() < 15_000;
  });

  if (!hydrated) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]" role="status" aria-label="Loading checkout">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!count && justPlaced) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6" role="status">
        <p className="font-display text-2xl font-bold text-ink-900">Order placed 🎉</p>
        <p className="mt-2 text-ink-600">Opening live tracking…</p>
      </div>
    );
  }

  if (!count) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Nothing to check out yet"
          description="Your basket is empty. Add a few dishes and come back."
          action={<Link href="/restaurants"><Button>Browse restaurants</Button></Link>}
        />
      </div>
    );
  }

  if (blocking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Let’s fix your basket first"
          description={
            <ul className="mt-2 space-y-1 text-left">
              {issues.filter((i) => i.severity === 'blocking').map((i) => (
                <li key={i.id}>• {i.message}</li>
              ))}
            </ul>
          }
          action={<Link href="/cart"><Button>Review basket</Button></Link>}
        />
      </div>
    );
  }

  return <>{children}</>;
}
