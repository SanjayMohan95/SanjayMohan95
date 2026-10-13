'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { computeBreakdown, computeLineId, computeUnitPrice, resolvePromo } from '@/lib/cart';
import { cartSubtotal, validatePromo } from '@/lib/pricing';
import type {
  AddToCartResult,
  CartItem,
  CartItemInput,
  FulfilmentMode,
  PriceBreakdown,
  PromoCode,
  PromoValidationResult,
  SelectedModifier,
  TipSelection,
} from '@/types';
import { usePostcodeStore } from './postcode-store';

export { computeBreakdown, computeLineId, computeUnitPrice };

export const MAX_MULTI_DROP_RESTAURANTS = 3;
export const MAX_LINE_QUANTITY = 25;

function materialise(input: CartItemInput): CartItem {
  return {
    ...input,
    specialInstructions: input.specialInstructions.trim(),
    lineId: computeLineId(input),
    unitPrice: computeUnitPrice(input.basePrice, input.modifiers),
    addedAt: new Date().toISOString(),
  };
}

function mergeLine(items: CartItem[], line: CartItem): CartItem[] {
  const existing = items.find((i) => i.lineId === line.lineId);
  if (existing) {
    return items.map((i) =>
      i.lineId === line.lineId ? { ...i, quantity: Math.min(MAX_LINE_QUANTITY, i.quantity + line.quantity) } : i,
    );
  }
  return [...items, line];
}

export type ConflictChoice = 'replace' | 'multi_drop' | 'cancel';

interface CartState {
  items: CartItem[];
  /** Primary restaurant — the first vendor added. */
  activeRestaurantId: string | null;
  multiDrop: boolean;
  fulfilment: FulfilmentMode;
  tip: TipSelection;
  promoCode: string | null;
  /** Item awaiting a decision because it comes from a different restaurant. */
  pendingConflict: { input: CartItemInput; currentRestaurantName: string; incomingRestaurantName: string } | null;
  drawerOpen: boolean;
  /** Bumps on every add — drives the header badge micro-interaction. */
  addPulse: number;
  announcement: string;

  addItem: (input: CartItemInput) => AddToCartResult;
  resolveConflict: (choice: ConflictChoice) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  removeItem: (lineId: string) => void;
  restoreItem: (item: CartItem) => void;
  updateLine: (lineId: string, patch: { modifiers: SelectedModifier[]; specialInstructions: string; quantity?: number }) => void;
  replaceCart: (items: CartItemInput[]) => void;
  clearCart: () => void;
  setFulfilment: (mode: FulfilmentMode) => void;
  setTip: (tip: TipSelection) => void;
  applyPromo: (code: string) => PromoValidationResult;
  removePromo: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  getBreakdown: () => PriceBreakdown;
}

const initialCart = {
  items: [] as CartItem[],
  activeRestaurantId: null as string | null,
  multiDrop: false,
  promoCode: null as string | null,
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...initialCart,
      fulfilment: 'delivery',
      tip: { type: 'percent', value: 10 },
      pendingConflict: null,
      drawerOpen: false,
      addPulse: 0,
      announcement: '',

      addItem: (input) => {
        const { items, multiDrop } = get();
        const restaurantIds = new Set(items.map((i) => i.restaurantId));
        const isNewVendor = items.length > 0 && !restaurantIds.has(input.restaurantId);

        if (isNewVendor && (!multiDrop || restaurantIds.size >= MAX_MULTI_DROP_RESTAURANTS)) {
          const currentRestaurantName = items[0].restaurantName;
          set({
            pendingConflict: { input, currentRestaurantName, incomingRestaurantName: input.restaurantName },
          });
          return { status: 'conflict', currentRestaurantName, incomingRestaurantName: input.restaurantName };
        }

        const line = materialise(input);
        set((s) => ({
          items: mergeLine(s.items, line),
          activeRestaurantId: s.activeRestaurantId ?? input.restaurantId,
          addPulse: s.addPulse + 1,
          announcement: `Added ${input.quantity} × ${input.name} to your basket.`,
        }));
        return { status: 'added', lineId: line.lineId };
      },

      resolveConflict: (choice) => {
        const pending = get().pendingConflict;
        if (!pending) return;
        if (choice === 'cancel') {
          set({ pendingConflict: null });
          return;
        }
        const line = materialise(pending.input);
        if (choice === 'replace') {
          set((s) => ({
            items: [line],
            activeRestaurantId: line.restaurantId,
            multiDrop: false,
            promoCode: null,
            pendingConflict: null,
            addPulse: s.addPulse + 1,
            announcement: `Basket replaced with items from ${line.restaurantName}.`,
          }));
          return;
        }
        set((s) => ({
          items: mergeLine(s.items, line),
          multiDrop: true,
          pendingConflict: null,
          addPulse: s.addPulse + 1,
          announcement: `Multi-drop order started — added ${line.name} from ${line.restaurantName}.`,
        }));
      },

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) => (i.lineId === lineId ? { ...i, quantity: Math.min(MAX_LINE_QUANTITY, quantity) } : i)),
        }));
      },

      increment: (lineId) => {
        const line = get().items.find((i) => i.lineId === lineId);
        if (line) get().updateQuantity(lineId, line.quantity + 1);
      },

      decrement: (lineId) => {
        const line = get().items.find((i) => i.lineId === lineId);
        if (line) get().updateQuantity(lineId, line.quantity - 1);
      },

      removeItem: (lineId) => {
        set((s) => {
          const removed = s.items.find((i) => i.lineId === lineId);
          const items = s.items.filter((i) => i.lineId !== lineId);
          const remainingVendors = new Set(items.map((i) => i.restaurantId));
          return {
            items,
            activeRestaurantId: items.length
              ? remainingVendors.has(s.activeRestaurantId ?? '')
                ? s.activeRestaurantId
                : items[0].restaurantId
              : null,
            multiDrop: remainingVendors.size > 1 ? s.multiDrop : false,
            promoCode: items.length ? s.promoCode : null,
            announcement: removed ? `Removed ${removed.name} from your basket.` : s.announcement,
          };
        });
      },

      restoreItem: (item) =>
        set((s) => ({
          items: mergeLine(s.items, item),
          activeRestaurantId: s.activeRestaurantId ?? item.restaurantId,
          multiDrop: s.items.length > 0 && !s.items.some((i) => i.restaurantId === item.restaurantId) ? true : s.multiDrop,
          announcement: `Restored ${item.name}.`,
        })),

      updateLine: (lineId, patch) => {
        set((s) => {
          const current = s.items.find((i) => i.lineId === lineId);
          if (!current) return s;
          const updated = materialise({
            ...current,
            modifiers: patch.modifiers,
            specialInstructions: patch.specialInstructions,
            quantity: patch.quantity ?? current.quantity,
          });
          const without = s.items.filter((i) => i.lineId !== lineId);
          // If the edit makes it identical to another line, the two merge.
          const index = s.items.findIndex((i) => i.lineId === lineId);
          const collision = without.find((i) => i.lineId === updated.lineId);
          const items = collision
            ? without.map((i) => (i.lineId === updated.lineId ? { ...i, quantity: Math.min(MAX_LINE_QUANTITY, i.quantity + updated.quantity) } : i))
            : [...without.slice(0, index), updated, ...without.slice(index)];
          return { items, announcement: `Updated ${current.name}.` };
        });
      },

      replaceCart: (inputs) => {
        const items = inputs.reduce<CartItem[]>((acc, input) => mergeLine(acc, materialise(input)), []);
        const vendors = new Set(items.map((i) => i.restaurantId));
        set((s) => ({
          items,
          activeRestaurantId: items[0]?.restaurantId ?? null,
          multiDrop: vendors.size > 1,
          promoCode: null,
          pendingConflict: null,
          addPulse: s.addPulse + 1,
          announcement: `Basket filled with ${items.length} item${items.length === 1 ? '' : 's'} from your previous order.`,
        }));
      },

      clearCart: () => set({ ...initialCart, pendingConflict: null, announcement: 'Basket cleared.' }),

      setFulfilment: (fulfilment) => set({ fulfilment }),
      setTip: (tip) => set({ tip }),

      applyPromo: (code) => {
        const result = validatePromo(code, cartSubtotal(get().items));
        if (result.ok && result.promo) set({ promoCode: result.promo.code });
        return result;
      },
      removePromo: () => set({ promoCode: null }),

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),

      getBreakdown: () => {
        const { items, fulfilment, tip, promoCode } = get();
        const area = usePostcodeStore.getState().area;
        return computeBreakdown(items, fulfilment, tip, promoCode, area?.coordinates ?? null);
      },
    }),
    {
      name: 'craveos.cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        items: s.items,
        activeRestaurantId: s.activeRestaurantId,
        multiDrop: s.multiDrop,
        fulfilment: s.fulfilment,
        tip: s.tip,
        promoCode: s.promoCode,
      }),
    },
  ),
);

/** Reactive, memoised price breakdown that re-computes when the cart or postcode changes. */
export function useCartBreakdown(): PriceBreakdown {
  const items = useCartStore((s) => s.items);
  const fulfilment = useCartStore((s) => s.fulfilment);
  const tip = useCartStore((s) => s.tip);
  const promoCode = useCartStore((s) => s.promoCode);
  const area = usePostcodeStore((s) => s.area);
  return useMemo(
    () => computeBreakdown(items, fulfilment, tip, promoCode, area?.coordinates ?? null),
    [items, fulfilment, tip, promoCode, area],
  );
}

export function useCartCount(): number {
  return useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
}

export function useActivePromo(): PromoCode | null {
  const code = useCartStore((s) => s.promoCode);
  return resolvePromo(code);
}
