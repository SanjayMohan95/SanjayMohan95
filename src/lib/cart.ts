import { PROMO_CODES, getRestaurant } from '@/data';
import type { CartItem, CartItemInput, FulfilmentMode, PriceBreakdown, PromoCode, SelectedModifier, TipSelection } from '@/types';
import { roadMiles } from './geo';
import { calculateBreakdown } from './pricing';
import { hashString } from './utils';

/**
 * Line identity: same item + same modifier set + same instructions → same line.
 * Modifiers are sorted so selection order never creates duplicates.
 */
export function computeLineId(input: Pick<CartItemInput, 'menuItemId' | 'modifiers' | 'specialInstructions'>): string {
  const mods = [...input.modifiers]
    .map((m) => `${m.groupId}:${m.optionId}`)
    .sort()
    .join('|');
  const note = input.specialInstructions.trim().toLowerCase().replace(/\s+/g, ' ');
  return `ln_${hashString(`${input.menuItemId}#${mods}#${note}`)}`;
}

export function computeUnitPrice(basePrice: number, modifiers: SelectedModifier[]): number {
  return basePrice + modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
}

export function resolvePromo(code: string | null): PromoCode | null {
  return code ? PROMO_CODES.find((p) => p.code === code) ?? null : null;
}

export function computeBreakdown(
  items: CartItem[],
  fulfilment: FulfilmentMode,
  tip: TipSelection,
  promoCode: string | null,
  origin: { lat: number; lng: number } | null,
): PriceBreakdown {
  const restaurantIds = Array.from(new Set(items.map((i) => i.restaurantId)));
  const restaurants = restaurantIds.map((id) => getRestaurant(id)).filter((r): r is NonNullable<typeof r> => !!r);
  return calculateBreakdown({
    items,
    restaurants,
    distanceTo: (r) => (origin ? roadMiles(origin, r.coordinates) : 2),
    fulfilment,
    tip,
    promo: resolvePromo(promoCode),
  });
}
