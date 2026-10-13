'use client';

import { useMemo } from 'react';
import { useMerchantStore } from '@/store/merchant-store';
import { useOrderStore } from '@/store/order-store';
import type { KdsColumn, Order, OrderStatus } from '@/types';

export interface KitchenOrder {
  order: Order;
  source: 'app' | 'external';
  column: KdsColumn;
}

export function columnFor(status: OrderStatus): KdsColumn | null {
  if (status === 'placed') return 'incoming';
  if (status === 'accepted' || status === 'preparing') return 'in_prep';
  if (status === 'ready_for_pickup') return 'ready';
  return null;
}

/**
 * Unifies orders placed through this app (customer store) with simulated
 * third-party orders, restricted to the selected kitchen. Actions route to
 * whichever store owns the order, so accepting an app order updates the
 * customer's live tracker instantly (and across tabs).
 */
export function useKitchenOrders() {
  const restaurantId = useMerchantStore((s) => s.restaurantId);
  const external = useMerchantStore((s) => s.externalOrders);
  const appOrders = useOrderStore((s) => s.orders);
  const setExternalStatus = useMerchantStore((s) => s.setExternalStatus);
  const setAppStatus = useOrderStore((s) => s.setStatus);
  const acceptApp = useOrderStore((s) => s.acceptOrder);
  const rejectApp = useOrderStore((s) => s.rejectOrder);

  const orders = useMemo<KitchenOrder[]>(() => {
    const list: KitchenOrder[] = [];
    for (const o of appOrders) {
      if (!o.restaurants.some((r) => r.id === restaurantId)) continue;
      const column = columnFor(o.status);
      if (!column) continue;
      // Multi-drop: the kitchen only sees its own lines.
      list.push({ order: { ...o, items: o.items.filter((i) => i.restaurantId === restaurantId) }, source: 'app', column });
    }
    for (const o of external) {
      if (!o.restaurants.some((r) => r.id === restaurantId)) continue;
      const column = columnFor(o.status);
      if (column) list.push({ order: o, source: 'external', column });
    }
    return list.sort((a, b) => a.order.createdAt.localeCompare(b.order.createdAt));
  }, [appOrders, external, restaurantId]);

  const isApp = (id: string) => orders.find((o) => o.order.id === id)?.source === 'app';

  return {
    restaurantId,
    orders,
    accept: (id: string, prepMinutes: number) => {
      if (isApp(id)) {
        acceptApp(id, prepMinutes);
        window.setTimeout(() => setAppStatus(id, 'preparing'), 600);
      } else {
        setExternalStatus(id, 'accepted', `Prep ${prepMinutes} min`, prepMinutes);
        window.setTimeout(() => setExternalStatus(id, 'preparing'), 600);
      }
    },
    reject: (id: string, reason: string) => (isApp(id) ? rejectApp(id, reason) : setExternalStatus(id, 'rejected', reason)),
    markReady: (id: string) => (isApp(id) ? setAppStatus(id, 'ready_for_pickup', 'Marked ready by kitchen') : setExternalStatus(id, 'ready_for_pickup')),
    handOff: (id: string, collection: boolean) =>
      isApp(id)
        ? setAppStatus(id, collection ? 'delivered' : 'en_route', collection ? 'Collected at counter' : 'Handed to courier')
        : setExternalStatus(id, collection ? 'delivered' : 'en_route'),
  };
}
