'use client';

import { useMemo } from 'react';
import { getMenuItem, getRestaurant } from '@/data';
import { isInDeliveryRadius } from '@/lib/discovery';
import { getOpenState } from '@/lib/hours';
import { useCartBreakdown, useCartStore } from '@/store/cart-store';
import { useStock } from '@/store/merchant-store';
import { usePostcodeStore } from '@/store/postcode-store';
import { formatMoney } from '@/lib/format';

export interface CartIssue {
  id: string;
  severity: 'blocking' | 'warning';
  message: string;
}

/** Centralised basket validation shared by the cart page, checkout and payment. */
export function useCartIssues(): { issues: CartIssue[]; blocking: boolean; closedRestaurants: string[] } {
  const items = useCartStore((s) => s.items);
  const fulfilment = useCartStore((s) => s.fulfilment);
  const area = usePostcodeStore((s) => s.area);
  const breakdown = useCartBreakdown();
  const { isItemAvailable } = useStock();

  return useMemo(() => {
    const issues: CartIssue[] = [];
    const closedRestaurants: string[] = [];
    const restaurantIds = Array.from(new Set(items.map((i) => i.restaurantId)));

    for (const line of items) {
      const menuItem = getMenuItem(line.menuItemId);
      if (!menuItem || !isItemAvailable(menuItem)) {
        issues.push({ id: `oos-${line.lineId}`, severity: 'blocking', message: `${line.name} is sold out — please remove it.` });
      }
    }
    for (const rid of restaurantIds) {
      const r = getRestaurant(rid);
      if (!r) continue;
      if (fulfilment === 'delivery' && area && !isInDeliveryRadius(r, area)) {
        issues.push({ id: `radius-${rid}`, severity: 'blocking', message: `${r.name} doesn’t deliver to ${area.outcode}. Switch to collection or change postcode.` });
      }
      if (fulfilment === 'collection' && !r.offersCollection) {
        issues.push({ id: `collect-${rid}`, severity: 'blocking', message: `${r.name} doesn’t offer collection.` });
      }
      if (!getOpenState(r.openingHours).isOpen) {
        closedRestaurants.push(r.name);
        issues.push({ id: `closed-${rid}`, severity: 'warning', message: `${r.name} is closed right now — you’ll need to schedule delivery at checkout.` });
      }
    }
    if (fulfilment === 'delivery' && !area) {
      issues.push({ id: 'postcode', severity: 'blocking', message: 'Add a delivery postcode to continue.' });
    }
    if (!breakdown.meetsMinimumOrder) {
      issues.push({ id: 'min', severity: 'blocking', message: `Add ${formatMoney(breakdown.amountToMinimum)} more to reach the restaurant’s minimum order.` });
    }
    return { issues, blocking: issues.some((i) => i.severity === 'blocking'), closedRestaurants };
  }, [items, fulfilment, area, breakdown, isItemAvailable]);
}
