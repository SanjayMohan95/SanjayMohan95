'use client';

import { useEffect, useRef } from 'react';
import { useMerchantStore } from '@/store/merchant-store';
import { useOrderStore } from '@/store/order-store';
import { SIM, courierProgress, nextSimulatedStatus } from '@/lib/simulation';

/**
 * Drives the live order lifecycle (kitchen → courier → door) on a compressed
 * timeline. Status is derived from persisted timestamps, so refreshing the
 * page or opening it in another tab resumes exactly where it left off.
 * If the kitchen dashboard is open, its actions take precedence: the
 * auto-accept only fires when no kitchen has responded in time.
 */
export function useOrderSimulation(orderId: string) {
  const setStatus = useOrderStore((s) => s.setStatus);
  const tickTelemetry = useOrderStore((s) => s.tickTelemetry);
  const pushCourierMessage = useOrderStore((s) => s.pushCourierMessage);
  const sentMilestones = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = () => {
      const order = useOrderStore.getState().orders.find((o) => o.id === orderId);
      if (!order) return;
      // If this restaurant's kitchen dashboard is open, give staff time to accept manually.
      const merchant = useMerchantStore.getState();
      const kitchenWatching =
        !!merchant.dashboardHeartbeat &&
        Date.now() - new Date(merchant.dashboardHeartbeat).getTime() < 12_000 &&
        order.restaurants.some((r) => r.id === merchant.restaurantId);
      const next = nextSimulatedStatus(order);
      const waitingForKitchen = kitchenWatching && order.status === 'placed' && Date.now() - new Date(order.createdAt).getTime() < SIM.kitchenAcceptWindow * 1000;
      if (next && !waitingForKitchen) {
        setStatus(orderId, next, next === 'accepted' ? 'Auto-accepted by kitchen' : undefined);
      }
      tickTelemetry(orderId);

      const chats = useOrderStore.getState().chats[orderId] ?? [];
      const progress = courierProgress(order);
      const milestone = (key: string, cond: boolean, text?: string) => {
        if (!cond || sentMilestones.current.has(key)) return;
        sentMilestones.current.add(key);
        if (!chats.some((m) => m.text === text)) pushCourierMessage(orderId, text);
      };
      if (order.fulfilment === 'delivery') {
        milestone('pickup', order.status === 'en_route' && progress > 0.03);
        milestone('halfway', order.status === 'en_route' && progress > 0.5);
        milestone('arriving', order.status === 'en_route' && progress > SIM.arrivingThreshold);
      }
    };
    // Prevent duplicate courier scripts after a refresh.
    const existing = useOrderStore.getState().chats[orderId] ?? [];
    const courierCount = existing.filter((m) => m.from === 'courier').length;
    ['pickup', 'halfway', 'arriving'].slice(0, courierCount).forEach((k) => sentMilestones.current.add(k));

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [orderId, setStatus, tickTelemetry, pushCourierMessage]);
}
