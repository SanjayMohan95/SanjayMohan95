# CraveOS

A multi-restaurant food ordering platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Zustand**, **Framer Motion** and **Lucide** icons. All data, payments, couriers and kitchens are simulated in the browser, so no backend is needed.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all 10 views prerender or SSG)
npm run typecheck  # tsc --noEmit
npm run lint
```

## The 10 views

| # | Route | What it does |
|---|-------|--------------|
| 1 | `/` | Hero with animated food collage. The UK postcode validator checks format, delivery radius and nearest kitchen hub, then saves the location to global state. Shows live delivery stats, trending local spots, and a cuisine carousel that unlocks once a valid postcode is typed. |
| 2 | `/cuisines` | Multi-select cuisine tiles. Filters: Halal, Vegan, GF, Nut-free, 4.8+, Free delivery, <30 min, plus £/££/£££. Sorts: Recommended, Fastest, Rating, Min order. Filter state lives in the URL, so views are shareable. |
| 3 | `/restaurants` | Vendor cards show hero image, fee, miles, ETA, FSA hygiene badge, rating and popular dishes. A sticky **Show on map** toggle opens an interactive SVG London map with keyboard-accessible pins. |
| 4 | `/restaurant/[id]` | Banner with hours, minimum order, allergy advisory and a delivery/collection toggle. Sticky scroll-spy category nav. Customisation modal with required/optional radios and checkboxes, live price deltas, max-selection enforcement and a 160-character instructions field. |
| 5 | `/cart` (+ slide-over drawer) | Multi-vendor conflict dialog (replace basket or start a multi-drop order). Inline quantity controls, modifier editing and remove with undo. "Complete your meal" upsell. Full fee breakdown with tip selector and promo validation. |
| 6 | `/checkout` | Three-step accordion: contact and delivery details (apartment, drop-off preference, safe-drop and courier notes), ASAP or a scheduled day and time slot, and cutlery/napkin opt-in. |
| 7 | `/checkout/payment` | Apple Pay, Google Pay, card, Klarna or Clearpay. Card form has auto-formatting, BIN brand detection, Luhn and dynamic CVV checks, and a flipping card preview. Includes a billing-address sync toggle and a simulated tokenise → fraud-score → 3-D Secure (OTP) → authorise flow. |
| 8 | `/order/[orderId]/tracking` | Four-stage timeline. Animated courier moves along an SVG route using `getPointAtLength`. Courier card shows vehicle and plate, with an in-app chat drawer that auto-replies. |
| 9 | `/account/orders` | Itemised receipts and a downloadable VAT invoice. **Order again** re-checks stock, the 86 list and modifier availability, and re-prices against today's menu. Dual 1–5 star review (food + courier). |
| 10 | `/merchant/dashboard` | Kanban board: Incoming (accept with prep time, or reject with a reason), In prep/KDS (per-line bumps, overdue timers), Ready for pickup. Visual and audible (Web Audio) alerts. **86 list** for dishes and individual ingredients. |

## Architecture

```
src/
├── app/                 # Routes (thin server components) + error / not-found / loading
├── components/
│   ├── ui/              # Button, Dialog (focus-trap), form fields, Toggle, Chip, Skeletons, Toaster…
│   ├── layout/          # Header, Footer, Providers (store hydration + cross-tab sync)
│   ├── postcode/        # PostcodeForm, PostcodeGate
│   ├── discovery/       # RestaurantCard, FilterBar, Cuisines/Restaurants views
│   ├── map/             # LondonMap (vector), RestaurantMap
│   ├── restaurant/      # Banner, CategoryNav, MenuItemCard, ItemCustomizer
│   ├── cart/            # Drawer, lines, upsell, tip, promo, breakdown, conflict dialog
│   ├── checkout/        # Steps, stepper, card preview, secure processing, payment
│   ├── tracking/        # Timeline, LiveMap, CourierCard, CourierChat
│   ├── orders/          # OrderCard, ReviewModule
│   └── merchant/        # KitchenTicket, EightySixPanel, MerchantDashboard
├── data/                # Mock catalogue: 16 restaurants, ~190 dishes, modifiers, postcodes, couriers, promos
├── hooks/               # useListings, useDiscoveryParams, useCartIssues, useOrderSimulation, useReorder…
├── lib/                 # Pure domain logic: pricing, postcode, card, discovery, schedule, geo, invoice
├── store/               # Zustand stores
└── types/               # Strict domain model
```

### State (Zustand)

| Store | Persisted | Responsibility |
|-------|-----------|----------------|
| `usePostcodeStore` | ✓ | Postcode, resolved `PostcodeArea`, hub distance, saved addresses |
| `useCartStore` | ✓ | Lines (hashed by item + modifiers + note), active/multi-drop vendors, fulfilment, tip, promo, conflict resolution, `getBreakdown()` |
| `useOrderStore` | ✓ | Orders, checkout draft, courier telemetry, chat, reviews, kitchen accept/reject |
| `useMerchantStore` | ✓ | Selected kitchen, 86 list, external orders, alert settings, KDS bumps |
| `useUiStore` | — | Toasts |

Persisted stores use `skipHydration` and are rehydrated after mount, which avoids SSR mismatches. A `storage` listener re-syncs them across tabs. For example, open `/merchant/dashboard` in one tab and an order's tracking page in another: accepting or 86-ing in the kitchen updates the customer's tab live.

### Pricing rules (`lib/pricing.ts`)

All money is held as **integer pence**.

- **Delivery:** base fee + 50p for every mile beyond 1.5 mi, free above each restaurant's threshold.
- **Multi-drop:** +£2.49 for each additional kitchen.
- **Small order fee:** charged when the subtotal is under £15, as the shortfall, capped at £3.
- **Service fee:** 7.5% of the subtotal, minimum 49p, maximum £2.99.
- **Tip:** 0%, 10%, 15% or a custom amount (up to £50).
- **Promo codes:** `CRAVE20`, `WELCOME5`, `FREEDEL`, `FEAST15`. `SUMMER24` is expired, to demonstrate the error message.
- **VAT:** 20% is included in the total. Tips are outside the scope of VAT.

### Demo cheatsheet

- **Postcodes:** `SW1A 1AA`, `EC1A 1BB`, `W1D 3QF`, `E1 6AN` are in range. `HA0 1AA` is outside the radius. `M1 1AE` is in an unserved city.
- **Test cards:** `4242 4242 4242 4242` succeeds. `4000 0000 0000 3220` triggers a 3-DS challenge (OTP `123456`). `4000 0000 0000 0002` is declined. Any order over £45 is also challenged.
- **Simulation speed:** the order lifecycle is compressed to about 1.5 minutes. With a kitchen dashboard open for that restaurant, staff get 60 s to accept manually before the order is auto-accepted.

### Accessibility

- Skip link and semantic landmarks.
- Visible focus rings everywhere.
- Dialogs trap focus, close on Escape and restore focus when they close.
- Radio-group semantics for every selector.
- `aria-live` announcements for basket changes, validation and order status.
- Respects `prefers-reduced-motion`.
- Brand colours were tuned so the primary button text contrast is ≥ 7:1 (white on `#a12506`), and secondary text uses `ink-600` (≈ 8.4:1).
