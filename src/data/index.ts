import type { Courier, MenuItem, PromoCode, Restaurant } from '@/types';
import { MENU_ITEMS } from './menus';
import { RESTAURANT_SEEDS } from './restaurants';

export { CUISINES, CUISINE_MAP } from './cuisines';
export { IMG } from './images';
export { KITCHEN_HUBS, POSTCODE_AREAS, SAMPLE_POSTCODES } from './postcodes';

const itemsByRestaurant = new Map<string, MenuItem[]>();
for (const item of MENU_ITEMS) {
  const list = itemsByRestaurant.get(item.restaurantId) ?? [];
  list.push(item);
  itemsByRestaurant.set(item.restaurantId, list);
}

export const RESTAURANTS: Restaurant[] = RESTAURANT_SEEDS.map((seed) => {
  const items = itemsByRestaurant.get(seed.id) ?? [];
  const usedCategories = new Set(items.map((i) => i.categoryId));
  return {
    ...seed,
    categories: seed.categories.filter((c) => usedCategories.has(c.id)),
    popularDishIds: items.filter((i) => i.popular).map((i) => i.id),
  };
});

const restaurantById = new Map(RESTAURANTS.map((r) => [r.id, r]));
const itemById = new Map(MENU_ITEMS.map((i) => [i.id, i]));

export function getRestaurant(id: string): Restaurant | undefined {
  return restaurantById.get(id);
}

export function getMenu(restaurantId: string): MenuItem[] {
  return itemsByRestaurant.get(restaurantId) ?? [];
}

export function getMenuItem(id: string): MenuItem | undefined {
  return itemById.get(id);
}

export { MENU_ITEMS };

const farFuture = '2027-12-31T23:59:59.000Z';

export const PROMO_CODES: PromoCode[] = [
  { code: 'CRAVE20', kind: 'percent', value: 20, minSubtotal: 1500, maxDiscount: 1000, description: '20% off orders over £15 (max £10)', expiresAt: farFuture },
  { code: 'WELCOME5', kind: 'fixed', value: 500, minSubtotal: 2000, description: '£5 off your order over £20', expiresAt: farFuture },
  { code: 'FREEDEL', kind: 'free_delivery', value: 0, minSubtotal: 1000, description: 'Free delivery on orders over £10', expiresAt: farFuture },
  { code: 'FEAST15', kind: 'percent', value: 15, minSubtotal: 4000, maxDiscount: 1500, description: '15% off feasts over £40', expiresAt: farFuture },
  { code: 'SUMMER24', kind: 'percent', value: 25, minSubtotal: 0, description: 'Summer 2024 — expired', expiresAt: '2024-09-01T00:00:00.000Z' },
];

export const COURIERS: Courier[] = [
  { id: 'c-amara', name: 'Amara Okafor', initials: 'AO', rating: 4.97, deliveries: 3412, vehicle: { type: 'e-bike', make: 'Cowboy', model: 'Classic 4', colour: 'Matte black', plate: null }, phoneMasked: '+44 7••• •••412', languages: ['English', 'Yoruba'] },
  { id: 'c-tomasz', name: 'Tomasz Nowak', initials: 'TN', rating: 4.92, deliveries: 5120, vehicle: { type: 'scooter', make: 'Honda', model: 'PCX 125', colour: 'Pearl white', plate: 'LK72 XRF' }, phoneMasked: '+44 7••• •••088', languages: ['English', 'Polish'] },
  { id: 'c-priya', name: 'Priya Raman', initials: 'PR', rating: 4.99, deliveries: 2287, vehicle: { type: 'motorbike', make: 'Yamaha', model: 'MT-125', colour: 'Icon blue', plate: 'LB23 KVT' }, phoneMasked: '+44 7••• •••761', languages: ['English', 'Tamil', 'Hindi'] },
  { id: 'c-jordan', name: 'Jordan Mensah', initials: 'JM', rating: 4.88, deliveries: 1904, vehicle: { type: 'car', make: 'Toyota', model: 'Prius Hybrid', colour: 'Silver', plate: 'YG21 PLM' }, phoneMasked: '+44 7••• •••235', languages: ['English', 'Twi'] },
  { id: 'c-lucia', name: 'Lucía Fernández', initials: 'LF', rating: 4.95, deliveries: 2760, vehicle: { type: 'e-bike', make: 'VanMoof', model: 'S5', colour: 'Light grey', plate: null }, phoneMasked: '+44 7••• •••519', languages: ['English', 'Spanish'] },
];

export const COURIER_CHAT_SCRIPTS: string[] = [
  'Hi! I’ve just picked up your order — heading your way now 🚴',
  'Traffic’s light, should be with you a little early.',
  'Just turning onto your street now.',
  'I’m outside! See you in a sec.',
];
