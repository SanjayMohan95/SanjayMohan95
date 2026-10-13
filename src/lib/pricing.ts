import { PROMO_CODES } from '@/data';
import type { CartItem, FulfilmentMode, Pence, PriceBreakdown, PromoCode, PromoValidationResult, Restaurant, TipSelection } from '@/types';

export const SMALL_ORDER_THRESHOLD: Pence = 1500;
export const SMALL_ORDER_FEE_CAP: Pence = 300;
export const SERVICE_FEE_RATE = 0.075;
export const SERVICE_FEE_MIN: Pence = 49;
export const SERVICE_FEE_MAX: Pence = 299;
export const MULTI_DROP_FEE: Pence = 249;
export const DISTANCE_FREE_MILES = 1.5;
export const PER_MILE_SURCHARGE: Pence = 50;
export const MAX_CUSTOM_TIP: Pence = 5000;

/** Distance-aware delivery fee for a single restaurant. */
export function deliveryFeeFor(restaurant: Restaurant, distanceMiles: number, restaurantSubtotal: Pence = 0): Pence {
  if (restaurant.freeDeliveryThreshold !== null && restaurantSubtotal >= restaurant.freeDeliveryThreshold && restaurantSubtotal > 0) {
    return 0;
  }
  if (restaurant.freeDeliveryThreshold === 0) return 0;
  const extraMiles = Math.max(0, distanceMiles - DISTANCE_FREE_MILES);
  const surcharge = Math.ceil((extraMiles * PER_MILE_SURCHARGE) / 10) * 10;
  return restaurant.deliveryFeeBase + surcharge;
}

export function lineTotal(item: Pick<CartItem, 'unitPrice' | 'quantity'>): Pence {
  return item.unitPrice * item.quantity;
}

export function cartSubtotal(items: CartItem[]): Pence {
  return items.reduce((sum, i) => sum + lineTotal(i), 0);
}

export function groupByRestaurant(items: CartItem[]): Map<string, CartItem[]> {
  const map = new Map<string, CartItem[]>();
  for (const item of items) {
    const list = map.get(item.restaurantId) ?? [];
    list.push(item);
    map.set(item.restaurantId, list);
  }
  return map;
}

export function calculateTip(tip: TipSelection, subtotal: Pence): Pence {
  if (tip.type === 'custom') return Math.max(0, Math.min(MAX_CUSTOM_TIP, Math.round(tip.amount)));
  return Math.round((subtotal * tip.value) / 100);
}

export function validatePromo(
  rawCode: string,
  subtotal: Pence,
  options: { now?: Date; isFirstOrder?: boolean } = {},
): PromoValidationResult {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, message: 'Enter a promo code.' };
  const promo = PROMO_CODES.find((p) => p.code === code);
  if (!promo) return { ok: false, message: `“${code}” isn’t a valid code.` };
  const now = options.now ?? new Date();
  if (new Date(promo.expiresAt) < now) return { ok: false, message: `“${code}” has expired.` };
  if (promo.firstOrderOnly && !options.isFirstOrder) {
    return { ok: false, message: `“${code}” is for first orders only.` };
  }
  if (subtotal < promo.minSubtotal) {
    const short = ((promo.minSubtotal - subtotal) / 100).toFixed(2);
    return { ok: false, promo, message: `Add £${short} more to use ${code}.` };
  }
  return { ok: true, promo, message: promo.description };
}

export interface BreakdownContext {
  items: CartItem[];
  restaurants: Restaurant[];
  /** Returns road miles from the delivery address to a restaurant. */
  distanceTo: (restaurant: Restaurant) => number;
  fulfilment: FulfilmentMode;
  tip: TipSelection;
  promo: PromoCode | null;
}

export function calculateBreakdown(ctx: BreakdownContext): PriceBreakdown {
  const { items, restaurants, distanceTo, fulfilment, tip, promo } = ctx;
  const subtotal = cartSubtotal(items);
  const groups = groupByRestaurant(items);
  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const restaurantCount = groups.size;
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  let deliveryFee = 0;
  let amountToMinimum = 0;
  for (const [restaurantId, group] of groups) {
    const restaurant = byId.get(restaurantId);
    if (!restaurant) continue;
    const groupSubtotal = cartSubtotal(group);
    if (fulfilment === 'delivery') {
      deliveryFee = Math.max(deliveryFee, deliveryFeeFor(restaurant, distanceTo(restaurant), groupSubtotal));
    }
    amountToMinimum = Math.max(amountToMinimum, restaurant.minOrder - groupSubtotal);
  }

  const multiDropFee = fulfilment === 'delivery' ? Math.max(0, restaurantCount - 1) * MULTI_DROP_FEE : 0;
  const smallOrderFee =
    subtotal > 0 && subtotal < SMALL_ORDER_THRESHOLD ? Math.min(SMALL_ORDER_THRESHOLD - subtotal, SMALL_ORDER_FEE_CAP) : 0;
  const serviceFee =
    subtotal > 0 ? Math.min(SERVICE_FEE_MAX, Math.max(SERVICE_FEE_MIN, Math.round(subtotal * SERVICE_FEE_RATE))) : 0;
  const tipAmount = subtotal > 0 ? calculateTip(tip, subtotal) : 0;

  let discount = 0;
  if (promo && subtotal >= promo.minSubtotal) {
    if (promo.kind === 'percent') {
      discount = Math.round((subtotal * promo.value) / 100);
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    } else if (promo.kind === 'fixed') {
      discount = Math.min(promo.value, subtotal);
    } else {
      discount = deliveryFee + multiDropFee;
    }
  }

  const total = Math.max(0, subtotal + deliveryFee + multiDropFee + smallOrderFee + serviceFee + tipAmount - discount);
  // UK VAT: 20% standard rate on hot food & fees; tips are outside the scope of VAT.
  const vatIncluded = Math.round((total - tipAmount) / 6);

  return {
    subtotal,
    deliveryFee,
    multiDropFee,
    smallOrderFee,
    serviceFee,
    tip: tipAmount,
    discount,
    total,
    vatIncluded,
    itemCount,
    restaurantCount,
    meetsMinimumOrder: amountToMinimum <= 0,
    amountToMinimum: Math.max(0, amountToMinimum),
  };
}
