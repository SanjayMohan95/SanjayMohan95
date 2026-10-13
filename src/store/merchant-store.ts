'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createExternalOrder } from '@/lib/order-factory';
import type { MenuItem, Order, OrderStatus } from '@/types';

/** Keys: `item:<menuItemId>` for dishes, `opt:<restaurantId>:<groupId>:<optionId>` for ingredients. */
export const itemStockKey = (menuItemId: string) => `item:${menuItemId}`;
export const optionStockKey = (restaurantId: string, groupId: string, optionId: string) =>
  `opt:${restaurantId}:${groupId}:${optionId}`;

interface MerchantState {
  restaurantId: string;
  /** 86'd dishes & ingredients — shared live with the customer menu. */
  eightySixed: Record<string, { since: string; by: string }>;
  externalOrders: Order[];
  seededFor: string[];
  alertsVisual: boolean;
  alertsAudible: boolean;
  autoSimulate: boolean;
  bumped: Record<string, string[]>;
  /** ISO timestamp refreshed while a kitchen dashboard is open (cross-tab via storage sync). */
  dashboardHeartbeat: string | null;

  setRestaurant: (id: string) => void;
  ensureSeeded: (restaurantId: string) => void;
  toggle86: (key: string) => void;
  clear86: (restaurantId: string) => void;
  setAlerts: (patch: Partial<Pick<MerchantState, 'alertsVisual' | 'alertsAudible' | 'autoSimulate'>>) => void;
  spawnIncoming: () => Order | null;
  setExternalStatus: (orderId: string, status: OrderStatus, note?: string, prepMinutes?: number) => void;
  toggleBump: (orderId: string, lineId: string) => void;
  archiveCompleted: () => void;
  heartbeat: () => void;
}

export const useMerchantStore = create<MerchantState>()(
  persist(
    (set, get) => ({
      restaurantId: 'smash-republic',
      eightySixed: {},
      externalOrders: [],
      seededFor: [],
      alertsVisual: true,
      alertsAudible: false,
      autoSimulate: true,
      bumped: {},
      dashboardHeartbeat: null,

      setRestaurant: (id) => {
        set({ restaurantId: id });
        get().ensureSeeded(id);
      },

      ensureSeeded: (restaurantId) => {
        if (get().seededFor.includes(restaurantId)) return;
        const now = Date.now();
        const plan: { minsAgo: number; status: OrderStatus }[] = [
          { minsAgo: 1, status: 'placed' },
          { minsAgo: 3, status: 'placed' },
          { minsAgo: 9, status: 'preparing' },
          { minsAgo: 12, status: 'preparing' },
          { minsAgo: 18, status: 'ready_for_pickup' },
        ];
        const orders = plan
          .map((p, i) => createExternalOrder(restaurantId, `${restaurantId}-seed-${i}`, new Date(now - p.minsAgo * 60_000), p.status))
          .filter((o): o is Order => !!o);
        set((s) => ({ externalOrders: [...orders, ...s.externalOrders], seededFor: [...s.seededFor, restaurantId] }));
      },

      toggle86: (key) =>
        set((s) => {
          const next = { ...s.eightySixed };
          if (next[key]) delete next[key];
          else next[key] = { since: new Date().toISOString(), by: 'Kitchen' };
          return { eightySixed: next };
        }),

      clear86: (restaurantId) =>
        set((s) => ({
          eightySixed: Object.fromEntries(
            Object.entries(s.eightySixed).filter(
              ([k]) => !k.startsWith(`item:${restaurantId}__`) && !k.startsWith(`opt:${restaurantId}:`),
            ),
          ),
        })),

      setAlerts: (patch) => set(patch),

      spawnIncoming: () => {
        const { restaurantId } = get();
        const order = createExternalOrder(restaurantId, `${restaurantId}-${Date.now().toString(36)}`, new Date(), 'placed');
        if (order) set((s) => ({ externalOrders: [order, ...s.externalOrders] }));
        return order;
      },

      setExternalStatus: (orderId, status, note, prepMinutes) =>
        set((s) => ({
          externalOrders: s.externalOrders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  prepMinutes: prepMinutes ?? o.prepMinutes,
                  rejectionReason: status === 'rejected' ? note : o.rejectionReason,
                  statusHistory: [...o.statusHistory, { status, at: new Date().toISOString(), note }],
                }
              : o,
          ),
        })),

      toggleBump: (orderId, lineId) =>
        set((s) => {
          const current = s.bumped[orderId] ?? [];
          return {
            bumped: {
              ...s.bumped,
              [orderId]: current.includes(lineId) ? current.filter((l) => l !== lineId) : [...current, lineId],
            },
          };
        }),

      archiveCompleted: () =>
        set((s) => ({
          externalOrders: s.externalOrders.filter((o) => !['en_route', 'delivered', 'rejected', 'cancelled'].includes(o.status)),
        })),

      heartbeat: () => set({ dashboardHeartbeat: new Date().toISOString() }),
    }),
    {
      name: 'craveos.merchant',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

/** Live stock helpers combining catalogue defaults with the kitchen's 86 list. */
export function useStock() {
  const eightySixed = useMerchantStore((s) => s.eightySixed);
  return {
    isItemAvailable: (item: Pick<MenuItem, 'id' | 'available'>) => item.available && !eightySixed[itemStockKey(item.id)],
    isOptionAvailable: (restaurantId: string, groupId: string, optionId: string) =>
      !eightySixed[optionStockKey(restaurantId, groupId, optionId)],
    eightySixed,
  };
}
