import type { Order, OrderStatus, TrackingStage } from '@/types';

/**
 * Demo-accelerated kitchen & courier timings (seconds of wall clock).
 * Real-world equivalents are shown to the customer via ETAs; the
 * simulation compresses ~35 minutes into ~2 minutes for the prototype.
 */
export const SIM = {
  autoAcceptAfter: 8,
  /** When a kitchen dashboard is open, staff get this long to accept before auto-accept. */
  kitchenAcceptWindow: 60,
  acceptedToPreparing: 4,
  preparingToReady: 22,
  readyToPickup: 8,
  enRouteDuration: 50,
  /** Courier is "arriving" once progress passes this. */
  arrivingThreshold: 0.92,
} as const;

export const TRACKING_STAGES: { id: TrackingStage; title: string; description: string }[] = [
  { id: 'received', title: 'Order received & sent to kitchen', description: 'The restaurant has your order and is confirming prep times.' },
  { id: 'preparing', title: 'Kitchen preparing & quality checking', description: 'Chefs are cooking, then every bag is checked and sealed.' },
  { id: 'en_route', title: 'Courier assigned & en route', description: 'Your courier has collected the food and is on the way.' },
  { id: 'arrived', title: 'Arrived at delivery address', description: 'Enjoy your meal! Don’t forget to rate your order.' },
];

export function stageForStatus(status: OrderStatus): TrackingStage {
  switch (status) {
    case 'placed':
    case 'accepted':
      return 'received';
    case 'preparing':
    case 'ready_for_pickup':
      return 'preparing';
    case 'en_route':
      return 'en_route';
    default:
      return 'arrived';
  }
}

export function stageIndex(status: OrderStatus): number {
  return TRACKING_STAGES.findIndex((s) => s.id === stageForStatus(status));
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Awaiting restaurant',
  accepted: 'Accepted by kitchen',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for pickup',
  en_route: 'On the way',
  delivered: 'Delivered',
  rejected: 'Rejected by restaurant',
  cancelled: 'Cancelled',
};

export function lastStatusAt(order: Order): number {
  const last = order.statusHistory[order.statusHistory.length - 1];
  return new Date(last?.at ?? order.createdAt).getTime();
}

/** Courier progress along the route, derived from when they set off. */
export function courierProgress(order: Order, now = Date.now()): number {
  if (order.status === 'delivered') return 1;
  if (order.status !== 'en_route') return 0;
  const elapsed = (now - lastStatusAt(order)) / 1000;
  return Math.min(1, elapsed / SIM.enRouteDuration);
}

/** Determines the next status the simulation should move to, if it is due. */
export function nextSimulatedStatus(order: Order, now = Date.now()): OrderStatus | null {
  if (order.schedule.type === 'scheduled') return null;
  const elapsed = (now - lastStatusAt(order)) / 1000;
  switch (order.status) {
    case 'placed':
      return elapsed >= SIM.autoAcceptAfter ? 'accepted' : null;
    case 'accepted':
      return elapsed >= SIM.acceptedToPreparing ? 'preparing' : null;
    case 'preparing':
      return elapsed >= SIM.preparingToReady ? 'ready_for_pickup' : null;
    case 'ready_for_pickup':
      // Collection orders wait for the customer to pick up.
      if (order.fulfilment === 'collection') return null;
      return elapsed >= SIM.readyToPickup ? 'en_route' : null;
    case 'en_route':
      return elapsed >= SIM.enRouteDuration ? 'delivered' : null;
    default:
      return null;
  }
}

export const ORDER_FLOW: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'en_route', 'delivered'];
