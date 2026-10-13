'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { COURIER_CHAT_SCRIPTS } from '@/data';
import { DEMO_ADDRESS, DEMO_CONTACT, buildOrder, createSeedHistory, pickCourier } from '@/lib/order-factory';
import { courierProgress } from '@/lib/simulation';
import { uid } from '@/lib/utils';
import type {
  CartItem,
  ChatMessage,
  CheckoutDraft,
  CourierTelemetry,
  FulfilmentMode,
  Order,
  OrderReview,
  OrderStatus,
  PaymentSummary,
  PriceBreakdown,
} from '@/types';

export const EMPTY_CHECKOUT: CheckoutDraft = {
  contact: { fullName: '', email: '', phone: '' },
  address: {
    id: 'addr_draft',
    label: 'Home',
    line1: '',
    line2: '',
    city: 'London',
    postcode: '',
    coordinates: DEMO_ADDRESS.coordinates,
    dropOff: 'ring_doorbell',
    safeDropInstructions: '',
    courierNote: '',
  },
  schedule: { type: 'asap', etaRange: [25, 35] },
  cutlery: false,
  napkins: false,
  completedSteps: [],
};

interface PlaceOrderInput {
  items: CartItem[];
  breakdown: PriceBreakdown;
  fulfilment: FulfilmentMode;
  payment: PaymentSummary;
  promoCode: string | null;
}

interface OrderState {
  orders: Order[];
  activeOrderId: string | null;
  checkout: CheckoutDraft;
  telemetry: Record<string, CourierTelemetry>;
  chats: Record<string, ChatMessage[]>;
  seeded: boolean;

  ensureSeeded: () => void;
  updateCheckout: (patch: Partial<CheckoutDraft>) => void;
  completeStep: (step: number) => void;
  resetCheckout: () => void;
  prefillDemoCheckout: () => void;

  placeOrder: (input: PlaceOrderInput) => Order;
  getOrder: (orderId: string) => Order | undefined;
  setStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  acceptOrder: (orderId: string, prepMinutes: number) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  tickTelemetry: (orderId: string) => void;
  sendChat: (orderId: string, text: string) => void;
  pushCourierMessage: (orderId: string, text?: string) => void;
  submitReview: (orderId: string, review: Omit<OrderReview, 'createdAt'>) => void;
  /** Demo helper: move a scheduled order into the live ASAP flow. */
  startScheduledNow: (orderId: string) => void;
}

function stamp(order: Order, status: OrderStatus, note?: string): Order {
  if (order.status === status) return order;
  const at = new Date().toISOString();
  const next: Order = {
    ...order,
    status,
    statusHistory: [...order.statusHistory, { status, at, note }],
  };
  if ((status === 'en_route' || status === 'ready_for_pickup') && !next.courier && order.fulfilment === 'delivery') {
    next.courier = pickCourier(order.id);
  }
  if (status === 'delivered') next.deliveredAt = at;
  return next;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      activeOrderId: null,
      checkout: EMPTY_CHECKOUT,
      telemetry: {},
      chats: {},
      seeded: false,

      ensureSeeded: () => {
        if (get().seeded) return;
        set((s) => ({ orders: [...s.orders, ...createSeedHistory()], seeded: true }));
      },

      updateCheckout: (patch) => set((s) => ({ checkout: { ...s.checkout, ...patch } })),
      completeStep: (step) =>
        set((s) => ({
          checkout: { ...s.checkout, completedSteps: Array.from(new Set([...s.checkout.completedSteps, step])) },
        })),
      resetCheckout: () => set((s) => ({ checkout: { ...EMPTY_CHECKOUT, contact: s.checkout.contact } })),
      prefillDemoCheckout: () =>
        set((s) => ({
          checkout: { ...s.checkout, contact: DEMO_CONTACT, address: { ...DEMO_ADDRESS, postcode: s.checkout.address.postcode || DEMO_ADDRESS.postcode } },
        })),

      placeOrder: ({ items, breakdown, fulfilment, payment, promoCode }) => {
        const { checkout } = get();
        const order = buildOrder({
          items,
          breakdown,
          fulfilment,
          contact: checkout.contact,
          address: checkout.address,
          schedule: checkout.schedule,
          cutlery: checkout.cutlery,
          napkins: checkout.napkins,
          payment,
          promoCode,
        });
        set((s) => ({
          orders: [order, ...s.orders],
          activeOrderId: order.id,
          chats: {
            ...s.chats,
            [order.id]: [
              { id: uid('msg_'), from: 'system', text: `Order ${order.shortCode} placed. We’ll connect you with your courier once they’re assigned.`, at: order.createdAt },
            ],
          },
        }));
        return order;
      },

      getOrder: (orderId) => get().orders.find((o) => o.id === orderId),

      setStatus: (orderId, status, note) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? stamp(o, status, note) : o)) })),

      acceptOrder: (orderId, prepMinutes) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const accepted = stamp({ ...o, prepMinutes }, 'accepted', `Prep time quoted: ${prepMinutes} min`);
            return {
              ...accepted,
              estimatedDeliveryAt: new Date(Date.now() + (prepMinutes + 12) * 60_000).toISOString(),
            };
          }),
        })),

      rejectOrder: (orderId, reason) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...stamp(o, 'rejected', reason), rejectionReason: reason } : o)),
        })),

      tickTelemetry: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;
        const progress = courierProgress(order);
        const prev = get().telemetry[orderId];
        const speed = order.status === 'en_route' ? 9 + Math.round(Math.sin(Date.now() / 4000) * 4 + 4) : 0;
        set((s) => ({
          telemetry: {
            ...s.telemetry,
            [orderId]: {
              progress,
              headingDeg: prev?.headingDeg ?? 0,
              speedMph: speed,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      sendChat: (orderId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          chats: {
            ...s.chats,
            [orderId]: [...(s.chats[orderId] ?? []), { id: uid('msg_'), from: 'customer', text: trimmed, at: new Date().toISOString() }],
          },
        }));
      },

      pushCourierMessage: (orderId, text) => {
        const existing = get().chats[orderId] ?? [];
        const courierCount = existing.filter((m) => m.from === 'courier').length;
        const message = text ?? COURIER_CHAT_SCRIPTS[Math.min(courierCount, COURIER_CHAT_SCRIPTS.length - 1)];
        set((s) => ({
          chats: {
            ...s.chats,
            [orderId]: [...(s.chats[orderId] ?? []), { id: uid('msg_'), from: 'courier', text: message, at: new Date().toISOString() }],
          },
        }));
      },

      startScheduledNow: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  schedule: { type: 'asap', etaRange: [25, 35] },
                  estimatedDeliveryAt: new Date(Date.now() + 35 * 60_000).toISOString(),
                  statusHistory: [...o.statusHistory, { status: o.status, at: new Date().toISOString(), note: 'Kitchen started scheduled order' }],
                }
              : o,
          ),
        })),

      submitReview: (orderId, review) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, review: { ...review, createdAt: new Date().toISOString() } } : o)),
        })),
    }),
    {
      name: 'craveos.orders',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        orders: s.orders,
        activeOrderId: s.activeOrderId,
        checkout: s.checkout,
        chats: s.chats,
        seeded: s.seeded,
      }),
    },
  ),
);
