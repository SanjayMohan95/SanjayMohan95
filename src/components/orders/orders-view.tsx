'use client';

import { AlertTriangle, ClipboardList, PackageX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Chip } from '@/components/ui/form';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useReorder, type ReorderCheck } from '@/hooks/use-reorder';
import { formatMoney } from '@/lib/format';
import { useCartStore } from '@/store/cart-store';
import { useHasHydrated } from '@/store/hydration';
import { useOrderStore } from '@/store/order-store';
import { toast } from '@/store/ui-store';
import type { Order } from '@/types';
import { OrderCard } from './order-card';

type Tab = 'all' | 'active' | 'past';
const ACTIVE = new Set(['placed', 'accepted', 'preparing', 'ready_for_pickup', 'en_route']);

export function OrdersView() {
  const hydrated = useHasHydrated();
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const cartCount = useCartStore((s) => s.items.length);
  const { check, apply } = useReorder();
  const [tab, setTab] = useState<Tab>('all');
  const [pending, setPending] = useState<{ order: Order; result: ReorderCheck } | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h) {
      setHash(h);
      window.setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [hydrated]);

  const sorted = useMemo(() => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [orders]);
  const visible = sorted.filter((o) => (tab === 'all' ? true : tab === 'active' ? ACTIVE.has(o.status) : !ACTIVE.has(o.status)));
  const activeCount = sorted.filter((o) => ACTIVE.has(o.status)).length;
  const lifetime = sorted.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.breakdown.total, 0);

  const commit = (result: ReorderCheck, order: Order) => {
    apply(result.available);
    setPending(null);
    toast({
      title: 'Basket ready',
      description: `${result.available.length} item${result.available.length === 1 ? '' : 's'} from ${order.restaurants.map((r) => r.name).join(' + ')}${result.priceChanged ? ' · prices updated to today’s menu' : ''}`,
      tone: 'success',
    });
    router.push('/cart');
  };

  const onReorder = (order: Order) => {
    const result = check(order);
    if (result.unavailable.length || cartCount > 0) {
      setPending({ order, result });
      return;
    }
    commit(result, order);
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6" role="status" aria-label="Loading orders">
        <Skeleton className="h-10 w-1/3" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">Your orders</h1>
          <p className="mt-1 text-ink-600">
            {sorted.length} orders · {formatMoney(lifetime)} spent with local kitchens
          </p>
        </div>
      </header>

      <div role="group" aria-label="Filter orders" className="mt-6 flex gap-2">
        <Chip pressed={tab === 'all'} onClick={() => setTab('all')}>All</Chip>
        <Chip pressed={tab === 'active'} onClick={() => setTab('active')}>Active{activeCount ? ` (${activeCount})` : ''}</Chip>
        <Chip pressed={tab === 'past'} onClick={() => setTab('past')}>Past</Chip>
      </div>

      <div className="mt-6 space-y-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title={tab === 'active' ? 'No active orders' : 'No orders yet'}
            description={tab === 'active' ? 'When you place an order, you can track it live from here.' : 'Your receipts, invoices and one-tap reorders will live here.'}
            action={<Link href="/restaurants"><Button>Start an order</Button></Link>}
          />
        ) : (
          visible.map((o) => <OrderCard key={o.id} order={o} onReorder={onReorder} defaultOpen={hash === o.id} />)
        )}
      </div>

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.result.unavailable.length ? 'Some items aren’t available' : 'Replace your basket?'}
        description={pending ? pending.order.restaurants.map((r) => r.name).join(' + ') : undefined}
        size="sm"
        footer={
          pending && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button disabled={!pending.result.available.length} onClick={() => commit(pending.result, pending.order)}>
                {pending.result.unavailable.length ? `Add ${pending.result.available.length} available` : 'Replace basket'}
              </Button>
            </div>
          )
        }
      >
        {pending && (
          <div className="space-y-4 p-5 sm:p-6">
            {pending.result.unavailable.length > 0 && (
              <ul className="space-y-2">
                {pending.result.unavailable.map(({ item, reason }) => (
                  <li key={item.lineId} className="flex items-start gap-3 rounded-xl bg-red-50 p-3 text-sm">
                    <PackageX className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden />
                    <span>
                      <span className="font-semibold text-ink-900">{item.quantity}× {item.name}</span>
                      <span className="block text-red-800">{reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {pending.result.available.length > 0 ? (
              <p className="text-sm text-ink-700">
                We’ll add the {pending.result.available.length} available item{pending.result.available.length === 1 ? '' : 's'} with your exact previous selections.
              </p>
            ) : (
              <p className="text-sm font-semibold text-red-800">Nothing from this order is available right now.</p>
            )}
            {cartCount > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                This will replace the {cartCount} item{cartCount === 1 ? '' : 's'} currently in your basket.
              </p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
