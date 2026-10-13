/**
 * CraveOS domain model.
 *
 * All monetary values are integer pence (GBP minor units) to avoid
 * floating-point drift in fee and tax calculations. Use `formatMoney`
 * from `@/lib/format` for display.
 */

export type Pence = number;
export type ISODateString = string;

/* ────────────────────────────── Geography ────────────────────────────── */

export interface Coordinates {
  lat: number;
  lng: number;
}

export type DeliveryZone = 'core' | 'extended' | 'unserved';

export interface PostcodeArea {
  /** Outward code, e.g. "SW1A". */
  outcode: string;
  district: string;
  city: string;
  coordinates: Coordinates;
  zone: DeliveryZone;
  /** Live courier density used to drive ETAs and the "active couriers" stat. */
  activeCouriers: number;
  /** Baseline door-to-door minutes before restaurant prep time. */
  baseTransitMin: number;
}

export type PostcodeValidationStatus =
  | 'idle'
  | 'valid'
  | 'invalid_format'
  | 'unknown_area'
  | 'out_of_range';

export interface PostcodeValidationResult {
  status: PostcodeValidationStatus;
  /** Normalised postcode, e.g. "SW1A 1AA". */
  normalised: string | null;
  area: PostcodeArea | null;
  /** Miles from the nearest CraveOS kitchen hub. */
  distanceMiles: number | null;
  message: string;
}

/* ────────────────────────────── Catalogue ────────────────────────────── */

export type CuisineId =
  | 'pizza'
  | 'burgers'
  | 'japanese'
  | 'indian'
  | 'mexican'
  | 'thai'
  | 'mediterranean'
  | 'desserts';

export interface Cuisine {
  id: CuisineId;
  name: string;
  shortName: string;
  description: string;
  image: string;
  emoji: string;
  /** Tailwind gradient classes for tile fallback / overlay. */
  accent: string;
}

export type DietaryTag = 'halal' | 'vegan' | 'vegetarian' | 'gluten-free' | 'nut-free';

export type Allergen =
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soya'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

export type PriceTier = 1 | 2 | 3;

/** UK Food Standards Agency Food Hygiene Rating (0–5). */
export type HygieneRating = 0 | 1 | 2 | 3 | 4 | 5;

export interface OpeningWindow {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** 24h "HH:MM" */
  open: string;
  /** 24h "HH:MM"; may be "24:00" or past midnight expressed as e.g. "01:30" */
  close: string;
}

export type MenuCategoryId = 'starters' | 'mains' | 'signature' | 'sides' | 'drinks' | 'desserts';

export interface MenuCategory {
  id: MenuCategoryId;
  name: string;
  description?: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  /** Price adjustment in pence (may be 0). */
  priceDelta: Pence;
  isDefault?: boolean;
  dietary?: DietaryTag[];
  available?: boolean;
}

export type ModifierSelection = 'single' | 'multiple';

export interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  selection: ModifierSelection;
  required: boolean;
  /** Minimum selections (1 for required single). */
  min: number;
  /** Maximum selections (1 for single). */
  max: number;
  options: ModifierOption[];
}

export type UpsellKind = 'drink' | 'dip' | 'dessert' | 'side';

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: MenuCategoryId;
  name: string;
  description: string;
  price: Pence;
  image?: string;
  dietary: DietaryTag[];
  allergens: Allergen[];
  calories: number;
  /** 0 = none … 3 = hot */
  spiceLevel?: 0 | 1 | 2 | 3;
  popular?: boolean;
  /** Default stock state from the catalogue (merchant "86" overrides live). */
  available: boolean;
  upsellKind?: UpsellKind;
  modifierGroups: ModifierGroup[];
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  cuisine: CuisineId;
  tags: string[];
  heroImage: string;
  rating: number;
  ratingCount: number;
  priceTier: PriceTier;
  hygieneRating: HygieneRating;
  /** Base delivery fee before distance surcharge. */
  deliveryFeeBase: Pence;
  /** Spend threshold above which delivery is free (null = never). */
  freeDeliveryThreshold: Pence | null;
  minOrder: Pence;
  prepTimeMin: number;
  deliveryRadiusMiles: number;
  coordinates: Coordinates;
  address: string;
  dietary: DietaryTag[];
  openingHours: OpeningWindow[];
  allergyAdvisory: string;
  offersCollection: boolean;
  isNew?: boolean;
  promoted?: boolean;
  popularDishIds: string[];
  categories: MenuCategory[];
}

/* ──────────────────────────────── Cart ──────────────────────────────── */

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: Pence;
}

export interface CartItem {
  /** Deterministic hash of item + modifiers + instructions — identical lines merge. */
  lineId: string;
  restaurantId: string;
  restaurantName: string;
  menuItemId: string;
  name: string;
  image?: string;
  basePrice: Pence;
  /** basePrice + Σ modifier deltas */
  unitPrice: Pence;
  quantity: number;
  modifiers: SelectedModifier[];
  specialInstructions: string;
  addedAt: ISODateString;
}

export type CartItemInput = Omit<CartItem, 'lineId' | 'unitPrice' | 'addedAt'>;

export type FulfilmentMode = 'delivery' | 'collection';

export type TipSelection =
  | { type: 'percent'; value: 0 | 10 | 15 }
  | { type: 'custom'; amount: Pence };

export type PromoKind = 'percent' | 'fixed' | 'free_delivery';

export interface PromoCode {
  code: string;
  kind: PromoKind;
  /** Percent (0–100) for `percent`, pence for `fixed`, ignored for `free_delivery`. */
  value: number;
  minSubtotal: Pence;
  maxDiscount?: Pence;
  description: string;
  expiresAt: ISODateString;
  firstOrderOnly?: boolean;
}

export interface PromoValidationResult {
  ok: boolean;
  promo?: PromoCode;
  message: string;
}

export interface PriceBreakdown {
  subtotal: Pence;
  deliveryFee: Pence;
  /** Additional drop fee per extra restaurant on a multi-drop order. */
  multiDropFee: Pence;
  smallOrderFee: Pence;
  serviceFee: Pence;
  tip: Pence;
  discount: Pence;
  total: Pence;
  /** VAT included within total (20% standard rate on hot food & fees). */
  vatIncluded: Pence;
  itemCount: number;
  restaurantCount: number;
  meetsMinimumOrder: boolean;
  amountToMinimum: Pence;
}

export type AddToCartResult =
  | { status: 'added'; lineId: string }
  | { status: 'conflict'; currentRestaurantName: string; incomingRestaurantName: string };

/* ────────────────────────────── Addresses ───────────────────────────── */

export type DropOffPreference = 'ring_doorbell' | 'leave_at_door' | 'hand_to_me';

export interface UserAddress {
  id: string;
  label: string;
  line1: string;
  /** Apartment / suite / floor */
  line2: string;
  city: string;
  postcode: string;
  coordinates: Coordinates;
  dropOff: DropOffPreference;
  safeDropInstructions: string;
  courierNote: string;
}

export interface ContactDetails {
  fullName: string;
  email: string;
  phone: string;
}

export type DeliverySchedule =
  | { type: 'asap'; etaRange: [number, number] }
  | { type: 'scheduled'; date: string; slot: string };

export interface CheckoutDraft {
  contact: ContactDetails;
  address: UserAddress;
  schedule: DeliverySchedule;
  cutlery: boolean;
  napkins: boolean;
  completedSteps: number[];
}

/* ────────────────────────────── Payments ────────────────────────────── */

export type PaymentMethodType = 'apple_pay' | 'google_pay' | 'card' | 'klarna' | 'clearpay';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'maestro' | 'diners' | 'jcb' | 'unknown';

export interface BillingAddress {
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

export type ThreeDSecureOutcome = 'frictionless' | 'challenge_passed' | 'not_required';

export interface PaymentPayload {
  idempotencyKey: string;
  method: PaymentMethodType;
  amount: Pence;
  currency: 'GBP';
  card?: {
    brand: CardBrand;
    last4: string;
    expMonth: number;
    expYear: number;
    holderName: string;
    /** Simulated tokenised PAN — raw card data never leaves the form. */
    token: string;
  };
  billingAddress: BillingAddress;
  billingSameAsDelivery: boolean;
  threeDSecure: ThreeDSecureOutcome;
  riskScore: number;
  /** Instalments for BNPL providers. */
  instalments?: number;
}

export interface PaymentSummary {
  method: PaymentMethodType;
  label: string;
  last4?: string;
  brand?: CardBrand;
}

/* ─────────────────────────────── Orders ─────────────────────────────── */

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'en_route'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

/** Customer-facing 4-stage tracker. */
export type TrackingStage = 'received' | 'preparing' | 'en_route' | 'arrived';

export interface OrderStatusEvent {
  status: OrderStatus;
  at: ISODateString;
  note?: string;
}

export type VehicleType = 'e-bike' | 'scooter' | 'motorbike' | 'car';

export interface Courier {
  id: string;
  name: string;
  initials: string;
  rating: number;
  deliveries: number;
  vehicle: {
    type: VehicleType;
    make: string;
    model: string;
    colour: string;
    plate: string | null;
  };
  phoneMasked: string;
  languages: string[];
}

export interface ChatMessage {
  id: string;
  from: 'customer' | 'courier' | 'system';
  text: string;
  at: ISODateString;
}

export interface OrderReview {
  foodRating: number;
  driverRating: number;
  comment: string;
  createdAt: ISODateString;
}

export interface OrderRestaurantRef {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface Order {
  id: string;
  /** Human-friendly short code shown to the kitchen, e.g. "#C-4821". */
  shortCode: string;
  createdAt: ISODateString;
  restaurants: OrderRestaurantRef[];
  items: CartItem[];
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  breakdown: PriceBreakdown;
  fulfilment: FulfilmentMode;
  contact: ContactDetails;
  address: UserAddress;
  schedule: DeliverySchedule;
  cutlery: boolean;
  napkins: boolean;
  payment: PaymentSummary;
  promoCode: string | null;
  courier: Courier | null;
  /** Minutes quoted by the kitchen on acceptance. */
  prepMinutes: number;
  estimatedDeliveryAt: ISODateString;
  deliveredAt: ISODateString | null;
  rejectionReason?: string;
  review: OrderReview | null;
  vatInvoiceNumber: string;
}

export interface CourierTelemetry {
  /** 0 → 1 progress along the route path. */
  progress: number;
  headingDeg: number;
  speedMph: number;
  updatedAt: ISODateString;
}

/* ──────────────────────────── Discovery ─────────────────────────────── */

export type DiscoveryFilter =
  | 'halal'
  | 'vegan'
  | 'gluten-free'
  | 'nut-free'
  | 'top-rated'
  | 'free-delivery'
  | 'under-30';

export type SortOption = 'recommended' | 'fastest' | 'rating' | 'min-order';

export interface DiscoveryState {
  cuisines: CuisineId[];
  filters: DiscoveryFilter[];
  priceTiers: PriceTier[];
  sort: SortOption;
  query: string;
}

/** Restaurant enriched with location-aware values for the active postcode. */
export interface RestaurantListing extends Restaurant {
  distanceMiles: number;
  etaRange: [number, number];
  deliveryFee: Pence;
  isOpen: boolean;
  opensAt: string | null;
}

/* ───────────────────────────── Merchant ─────────────────────────────── */

export type KdsColumn = 'incoming' | 'in_prep' | 'ready';

export interface MerchantTicket {
  orderId: string;
  column: KdsColumn;
  acceptedAt: ISODateString | null;
  prepMinutes: number;
  bumpedItems: string[];
}
