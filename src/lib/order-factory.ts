import { COURIERS, getMenu, getRestaurant } from '@/data';
import type {
  CartItem,
  ContactDetails,
  Courier,
  DeliverySchedule,
  FulfilmentMode,
  ModifierGroup,
  Order,
  OrderStatus,
  OrderStatusEvent,
  PaymentSummary,
  PriceBreakdown,
  SelectedModifier,
  TipSelection,
  UserAddress,
} from '@/types';
import { computeBreakdown, computeLineId, computeUnitPrice } from './cart';
import { seededRandom, uid } from './utils';

export function shortCode(rand: () => number = Math.random): string {
  return `C-${Math.floor(1000 + rand() * 9000)}`;
}

export function invoiceNumber(date: Date, rand: () => number = Math.random): string {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `CRV-${ymd}-${Math.floor(10000 + rand() * 90000)}`;
}

export function pickCourier(seed: string): Courier {
  const rand = seededRandom(seed);
  return COURIERS[Math.floor(rand() * COURIERS.length)];
}

export const DEMO_ADDRESS: UserAddress = {
  id: 'addr_demo',
  label: 'Home',
  line1: '14 Marsham Street',
  line2: 'Flat 6, 2nd floor',
  city: 'London',
  postcode: 'SW1P 4DF',
  coordinates: { lat: 51.4953, lng: -0.1306 },
  dropOff: 'ring_doorbell',
  safeDropInstructions: '',
  courierNote: 'Buzzer 6 — the door sticks, give it a push!',
};

export const DEMO_CONTACT: ContactDetails = {
  fullName: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '07700 900123',
};

interface BuildOrderParams {
  items: CartItem[];
  breakdown: PriceBreakdown;
  fulfilment: FulfilmentMode;
  contact: ContactDetails;
  address: UserAddress;
  schedule: DeliverySchedule;
  cutlery: boolean;
  napkins: boolean;
  payment: PaymentSummary;
  promoCode: string | null;
  createdAt?: Date;
  status?: OrderStatus;
  statusHistory?: OrderStatusEvent[];
  id?: string;
}

export function buildOrder(p: BuildOrderParams): Order {
  const createdAt = p.createdAt ?? new Date();
  const id = p.id ?? uid('ord_');
  const rand = seededRandom(id);
  const restaurantIds = Array.from(new Set(p.items.map((i) => i.restaurantId)));
  const restaurants = restaurantIds
    .map((rid) => getRestaurant(rid))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({ id: r.id, name: r.name, address: r.address, coordinates: r.coordinates }));
  const maxPrep = Math.max(...restaurantIds.map((rid) => getRestaurant(rid)?.prepTimeMin ?? 15));
  const etaMinutes = p.schedule.type === 'asap' ? p.schedule.etaRange[1] : 0;
  const estimatedDeliveryAt =
    p.schedule.type === 'scheduled'
      ? new Date(`${p.schedule.date}T${p.schedule.slot.split('–')[1] ?? p.schedule.slot.slice(-5)}:00`).toISOString()
      : new Date(createdAt.getTime() + etaMinutes * 60_000).toISOString();

  return {
    id,
    shortCode: shortCode(rand),
    createdAt: createdAt.toISOString(),
    restaurants,
    items: p.items,
    status: p.status ?? 'placed',
    statusHistory: p.statusHistory ?? [{ status: 'placed', at: createdAt.toISOString() }],
    breakdown: p.breakdown,
    fulfilment: p.fulfilment,
    contact: p.contact,
    address: p.address,
    schedule: p.schedule,
    cutlery: p.cutlery,
    napkins: p.napkins,
    payment: p.payment,
    promoCode: p.promoCode,
    courier: null,
    prepMinutes: maxPrep,
    estimatedDeliveryAt,
    deliveredAt: null,
    review: null,
    vatInvoiceNumber: invoiceNumber(createdAt, rand),
  };
}

/** Chooses each group's defaults (or first N options for required multi-selects). */
export function defaultModifiers(groups: ModifierGroup[]): SelectedModifier[] {
  const out: SelectedModifier[] = [];
  for (const g of groups) {
    const defaults = g.options.filter((o) => o.isDefault);
    const chosen = defaults.length ? defaults : g.required ? g.options.slice(0, g.min) : [];
    for (const o of chosen) {
      out.push({ groupId: g.id, groupName: g.name, optionId: o.id, optionName: o.name, priceDelta: o.priceDelta });
    }
  }
  return out;
}

/** Build a cart line from a menu item id with optional modifier overrides (by option id). */
export function lineFromMenu(
  itemId: string,
  quantity = 1,
  pick: Record<string, string[]> = {},
  specialInstructions = '',
  addedAt = new Date(),
): CartItem | null {
  const restaurantId = itemId.split('__')[0];
  const item = getMenu(restaurantId).find((i) => i.id === itemId);
  const restaurant = getRestaurant(restaurantId);
  if (!item || !restaurant) return null;
  let modifiers = defaultModifiers(item.modifierGroups);
  for (const [groupId, optionIds] of Object.entries(pick)) {
    const group = item.modifierGroups.find((g) => g.id === groupId);
    if (!group) continue;
    modifiers = modifiers.filter((m) => m.groupId !== groupId);
    for (const oid of optionIds) {
      const o = group.options.find((x) => x.id === oid);
      if (o) modifiers.push({ groupId, groupName: group.name, optionId: o.id, optionName: o.name, priceDelta: o.priceDelta });
    }
  }
  const input = {
    restaurantId,
    restaurantName: restaurant.name,
    menuItemId: item.id,
    name: item.name,
    image: item.image,
    basePrice: item.price,
    quantity,
    modifiers,
    specialInstructions,
  };
  return {
    ...input,
    lineId: computeLineId(input),
    unitPrice: computeUnitPrice(item.price, modifiers),
    addedAt: addedAt.toISOString(),
  };
}

const TIP_10: TipSelection = { type: 'percent', value: 10 };

function historyFor(createdAt: Date, prepMin: number, travelMin: number): OrderStatusEvent[] {
  const t = (mins: number) => new Date(createdAt.getTime() + mins * 60_000).toISOString();
  return [
    { status: 'placed', at: t(0) },
    { status: 'accepted', at: t(1) },
    { status: 'preparing', at: t(2) },
    { status: 'ready_for_pickup', at: t(2 + prepMin) },
    { status: 'en_route', at: t(4 + prepMin) },
    { status: 'delivered', at: t(4 + prepMin + travelMin) },
  ];
}

/** Realistic past orders so Order History has content on first visit. */
export function createSeedHistory(now = new Date()): Order[] {
  const day = 24 * 60 * 60_000;
  const specs: {
    id: string;
    daysAgo: number;
    hour: number;
    lines: (CartItem | null)[];
    payment: PaymentSummary;
    promo?: string;
    review?: Order['review'];
  }[] = [
    {
      id: 'ord_seed_smash',
      daysAgo: 2,
      hour: 19,
      lines: [
        lineFromMenu('smash-republic__og-smash', 2, { 'burger-patty': ['double'], 'burger-extras': ['halloumi', 'jalapenos'], 'meal-side': ['fries'] }),
        lineFromMenu('smash-republic__loaded-fries', 1),
        lineFromMenu('smash-republic__chipotle-mayo', 2),
      ],
      payment: { method: 'apple_pay', label: 'Apple Pay' },
    },
    {
      id: 'ord_seed_dilli',
      daysAgo: 6,
      hour: 20,
      lines: [
        lineFromMenu('dilli-darbar__butter-chicken', 1, { 'spice-level': ['medium'], accompaniment: ['garlic-naan', 'pilau'] }),
        lineFromMenu('dilli-darbar__samosa', 1),
        lineFromMenu('dilli-darbar__kulfi', 2),
        lineFromMenu('dilli-darbar__lassi', 2),
      ],
      payment: { method: 'card', label: 'Visa •••• 4242', last4: '4242', brand: 'visa' },
      promo: 'CRAVE20',
      review: { foodRating: 5, driverRating: 5, comment: 'Butter chicken was unreal. Courier was lovely.', createdAt: new Date(now.getTime() - 6 * day + 3 * 3600_000).toISOString() },
    },
    {
      id: 'ord_seed_sushi',
      daysAgo: 13,
      hour: 13,
      lines: [
        lineFromMenu('kintsugi-sushi__omakase', 1, { condiments: ['wasabi', 'tamari'] }),
        lineFromMenu('kintsugi-sushi__gyoza', 1),
        lineFromMenu('kintsugi-sushi__matcha', 1),
      ],
      payment: { method: 'card', label: 'Mastercard •••• 4444', last4: '4444', brand: 'mastercard' },
    },
    {
      id: 'ord_seed_pizza',
      daysAgo: 27,
      hour: 21,
      lines: [
        lineFromMenu('forno-vesuvio__diavola', 1, { 'pizza-size': ['12'], 'pizza-extras': ['buffalo', 'hot-honey'] }, 'Extra crispy please'),
        lineFromMenu('forno-vesuvio__margherita', 1, { 'pizza-base': ['gf'] }),
        lineFromMenu('forno-vesuvio__tiramisu', 1),
      ],
      payment: { method: 'klarna', label: 'Klarna — Pay in 3' },
      review: { foodRating: 4, driverRating: 5, comment: '', createdAt: new Date(now.getTime() - 27 * day + 2 * 3600_000).toISOString() },
    },
  ];

  return specs.map((s) => {
    const createdAt = new Date(now.getTime() - s.daysAgo * day);
    createdAt.setHours(s.hour, 12 + s.daysAgo, 0, 0);
    const items = s.lines.filter((l): l is CartItem => !!l).map((l) => ({ ...l, addedAt: createdAt.toISOString() }));
    const breakdown = computeBreakdown(items, 'delivery', TIP_10, s.promo ?? null, DEMO_ADDRESS.coordinates);
    const restaurant = getRestaurant(items[0].restaurantId);
    const history = historyFor(createdAt, restaurant?.prepTimeMin ?? 15, 14);
    const order = buildOrder({
      id: s.id,
      items,
      breakdown,
      fulfilment: 'delivery',
      contact: DEMO_CONTACT,
      address: DEMO_ADDRESS,
      schedule: { type: 'asap', etaRange: [25, 35] },
      cutlery: false,
      napkins: true,
      payment: s.payment,
      promoCode: s.promo ?? null,
      createdAt,
      status: 'delivered',
      statusHistory: history,
    });
    return {
      ...order,
      courier: pickCourier(s.id),
      deliveredAt: history[history.length - 1].at,
      review: s.review ?? null,
    };
  });
}

const CUSTOMER_NAMES = ['Sophie T.', 'Mohammed A.', 'Hannah K.', 'Oliver P.', 'Aisha R.', 'Daniel W.', 'Grace L.', 'Kwame O.', 'Isabella M.', 'Ravi S.', 'Chloe B.', 'Yusuf H.'];
const NOTES = ['', '', 'No onions please', 'Allergic to sesame — please be careful', 'Extra napkins', '', 'Sauce on the side', ''];

/** Generates a plausible external (non-app-user) order for the kitchen dashboard. */
export function createExternalOrder(restaurantId: string, seed: string, createdAt = new Date(), status: OrderStatus = 'placed'): Order | null {
  const rand = seededRandom(seed);
  const menu = getMenu(restaurantId).filter((i) => i.categoryId !== 'drinks');
  const drinks = getMenu(restaurantId).filter((i) => i.categoryId === 'drinks');
  if (!menu.length) return null;
  const count = 1 + Math.floor(rand() * 3);
  const lines: CartItem[] = [];
  for (let i = 0; i < count; i++) {
    const item = menu[Math.floor(rand() * menu.length)];
    const pick: Record<string, string[]> = {};
    for (const g of item.modifierGroups) {
      if (g.selection === 'single' && rand() > 0.5) pick[g.id] = [g.options[Math.floor(rand() * g.options.length)].id];
      if (g.selection === 'multiple' && rand() > 0.6) pick[g.id] = [g.options[Math.floor(rand() * g.options.length)].id];
    }
    const note = i === 0 ? NOTES[Math.floor(rand() * NOTES.length)] : '';
    const line = lineFromMenu(item.id, 1 + Math.floor(rand() * 2), pick, note, createdAt);
    if (line) lines.push(line);
  }
  if (drinks.length && rand() > 0.4) {
    const d = lineFromMenu(drinks[Math.floor(rand() * drinks.length)].id, 1 + Math.floor(rand() * 2), {}, '', createdAt);
    if (d) lines.push(d);
  }
  const items = lines.reduce<CartItem[]>((acc, l) => {
    const existing = acc.find((x) => x.lineId === l.lineId);
    return existing ? acc.map((x) => (x.lineId === l.lineId ? { ...x, quantity: x.quantity + l.quantity } : x)) : [...acc, l];
  }, []);
  const breakdown = computeBreakdown(items, 'delivery', TIP_10, null, DEMO_ADDRESS.coordinates);
  const name = CUSTOMER_NAMES[Math.floor(rand() * CUSTOMER_NAMES.length)];
  const history: OrderStatusEvent[] = [{ status: 'placed', at: createdAt.toISOString() }];
  if (status !== 'placed') {
    history.push({ status: 'accepted', at: new Date(createdAt.getTime() + 60_000).toISOString() });
    history.push({ status: 'preparing', at: new Date(createdAt.getTime() + 90_000).toISOString() });
  }
  if (status === 'ready_for_pickup') history.push({ status: 'ready_for_pickup', at: new Date(createdAt.getTime() + 8 * 60_000).toISOString() });
  return buildOrder({
    id: `ext_${seed}`,
    items,
    breakdown,
    fulfilment: rand() > 0.85 ? 'collection' : 'delivery',
    contact: { fullName: name, email: '', phone: '' },
    address: { ...DEMO_ADDRESS, id: `addr_${seed}`, line2: '', courierNote: '' },
    schedule: { type: 'asap', etaRange: [25, 35] },
    cutlery: rand() > 0.5,
    napkins: true,
    payment: { method: 'card', label: 'Card' },
    promoCode: null,
    createdAt,
    status,
    statusHistory: history,
  });
}
