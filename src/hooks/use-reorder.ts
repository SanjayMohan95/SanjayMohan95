'use client';

import { getMenuItem, getRestaurant } from '@/data';
import { useCartStore } from '@/store/cart-store';
import { useStock } from '@/store/merchant-store';
import type { CartItem, CartItemInput, Order } from '@/types';

export interface ReorderCheck {
  available: CartItemInput[];
  unavailable: { item: CartItem; reason: string }[];
  priceChanged: boolean;
}

/** Validates a past order against the live menu & kitchen 86 list before refilling the basket. */
export function useReorder() {
  const { isItemAvailable, isOptionAvailable } = useStock();
  const replaceCart = useCartStore((s) => s.replaceCart);

  const check = (order: Order): ReorderCheck => {
    const available: CartItemInput[] = [];
    const unavailable: ReorderCheck['unavailable'] = [];
    let priceChanged = false;

    for (const line of order.items) {
      const menuItem = getMenuItem(line.menuItemId);
      const restaurant = getRestaurant(line.restaurantId);
      if (!menuItem || !restaurant) {
        unavailable.push({ item: line, reason: 'No longer on the menu' });
        continue;
      }
      if (!isItemAvailable(menuItem)) {
        unavailable.push({ item: line, reason: 'Sold out today' });
        continue;
      }
      const missingOption = line.modifiers.find((m) => {
        const group = menuItem.modifierGroups.find((g) => g.id === m.groupId);
        const option = group?.options.find((o) => o.id === m.optionId);
        return !option || option.available === false || !isOptionAvailable(line.restaurantId, m.groupId, m.optionId);
      });
      if (missingOption) {
        unavailable.push({ item: line, reason: `“${missingOption.optionName}” is unavailable` });
        continue;
      }
      // Re-price against today's menu so the basket is always accurate.
      const modifiers = line.modifiers.map((m) => {
        const option = menuItem.modifierGroups.find((g) => g.id === m.groupId)!.options.find((o) => o.id === m.optionId)!;
        if (option.priceDelta !== m.priceDelta) priceChanged = true;
        return { ...m, priceDelta: option.priceDelta, optionName: option.name };
      });
      if (menuItem.price !== line.basePrice) priceChanged = true;
      available.push({
        restaurantId: line.restaurantId,
        restaurantName: restaurant.name,
        menuItemId: menuItem.id,
        name: menuItem.name,
        image: menuItem.image,
        basePrice: menuItem.price,
        quantity: line.quantity,
        modifiers,
        specialInstructions: line.specialInstructions,
      });
    }
    return { available, unavailable, priceChanged };
  };

  return { check, apply: (items: CartItemInput[]) => replaceCart(items) };
}
