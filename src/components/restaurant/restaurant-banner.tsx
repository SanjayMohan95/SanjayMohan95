'use client';

import { AlertTriangle, Bike, ChevronDown, Clock, MapPin, ShoppingBag, Store, Wallet } from 'lucide-react';
import { useState } from 'react';
import { HygieneBadge } from '@/components/ui/hygiene-badge';
import { RatingPill } from '@/components/ui/stars';
import { SmartImage } from '@/components/ui/smart-image';
import { CUISINE_MAP } from '@/data';
import { formatEta, formatMiles, formatMoney, formatPriceTier } from '@/lib/format';
import { DAY_NAMES, formatWindow, getOpenState } from '@/lib/hours';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import type { FulfilmentMode, Restaurant, RestaurantListing } from '@/types';

export function RestaurantBanner({ restaurant, listing, now, inRadius }: { restaurant: Restaurant; listing: RestaurantListing | null; now: Date; inRadius: boolean }) {
  const fulfilment = useCartStore((s) => s.fulfilment);
  const setFulfilment = useCartStore((s) => s.setFulfilment);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [allergyOpen, setAllergyOpen] = useState(false);
  const cuisine = CUISINE_MAP[restaurant.cuisine];
  const open = getOpenState(restaurant.openingHours, now);
  const today = now.getDay();

  const modes: { id: FulfilmentMode; label: string; icon: typeof Bike; detail: string; disabled?: boolean }[] = [
    { id: 'delivery', label: 'Delivery', icon: Bike, detail: listing ? formatEta(listing.etaRange) : 'Set postcode' },
    { id: 'collection', label: 'Collection', icon: Store, detail: restaurant.offersCollection ? `Ready in ~${restaurant.prepTimeMin + 5} min` : 'Unavailable', disabled: !restaurant.offersCollection },
  ];

  return (
    <section aria-labelledby="restaurant-name">
      <div className="relative -mx-4 h-56 overflow-hidden bg-ink-100 sm:mx-0 sm:mt-6 sm:h-72 sm:rounded-3xl lg:h-80">
        <SmartImage src={restaurant.heroImage} alt={`${restaurant.name} signature dish`} fill priority sizes="(max-width: 1280px) 100vw, 1280px" fallbackEmoji={cuisine.emoji} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <p className="text-sm font-semibold text-white/90">
            {cuisine.emoji} {cuisine.name} · {formatPriceTier(restaurant.priceTier)}
          </p>
          <h1 id="restaurant-name" className="mt-1 font-display text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            {restaurant.name}
          </h1>
          <p className="mt-1 max-w-2xl text-white/90">{restaurant.tagline}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <RatingPill rating={restaurant.rating} count={restaurant.ratingCount} />
            <HygieneBadge rating={restaurant.hygieneRating} />
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', open.isOpen ? 'bg-herb-50 text-herb-700' : 'bg-ink-100 text-ink-800')}>
              <span className={cn('h-2 w-2 rounded-full', open.isOpen ? 'bg-herb-600' : 'bg-ink-500')} aria-hidden />
              {open.isOpen ? `Open · closes ${open.nextChange}` : `Closed · opens ${open.nextChange ?? 'tomorrow'}`}
            </span>
            {restaurant.tags.map((t) => (
              <span key={t} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-800">
                {t}
              </span>
            ))}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-2xl border border-ink-100 bg-white p-3">
              <dt className="flex items-center gap-1.5 text-ink-600"><Wallet className="h-4 w-4" aria-hidden /> Minimum order</dt>
              <dd className="mt-1 font-bold text-ink-900">{formatMoney(restaurant.minOrder)}</dd>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-3">
              <dt className="flex items-center gap-1.5 text-ink-600"><Bike className="h-4 w-4" aria-hidden /> Delivery fee</dt>
              <dd className="mt-1 font-bold text-ink-900">
                {listing ? (listing.deliveryFee === 0 ? 'Free' : formatMoney(listing.deliveryFee)) : `From ${formatMoney(restaurant.deliveryFeeBase)}`}
                {restaurant.freeDeliveryThreshold ? <span className="block text-xs font-normal text-ink-600">Free over {formatMoney(restaurant.freeDeliveryThreshold)}</span> : null}
              </dd>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-3">
              <dt className="flex items-center gap-1.5 text-ink-600"><MapPin className="h-4 w-4" aria-hidden /> Distance</dt>
              <dd className="mt-1 font-bold text-ink-900">{listing ? formatMiles(listing.distanceMiles) : '—'}</dd>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-3">
              <dt className="flex items-center gap-1.5 text-ink-600"><Clock className="h-4 w-4" aria-hidden /> Today</dt>
              <dd className="mt-1 font-bold text-ink-900">{open.todayLabel}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-expanded={hoursOpen}
              aria-controls="opening-hours"
              onClick={() => setHoursOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-800 hover:border-ink-400"
            >
              Opening hours <ChevronDown className={cn('h-4 w-4 transition-transform', hoursOpen && 'rotate-180')} aria-hidden />
            </button>
            <button
              type="button"
              aria-expanded={allergyOpen}
              aria-controls="allergy-advisory"
              onClick={() => setAllergyOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:border-amber-500"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden /> Allergy advisory <ChevronDown className={cn('h-4 w-4 transition-transform', allergyOpen && 'rotate-180')} aria-hidden />
            </button>
          </div>
          {hoursOpen && (
            <table id="opening-hours" className="w-full max-w-sm text-sm">
              <caption className="sr-only">Opening hours</caption>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const w = restaurant.openingHours.find((h) => h.day === d);
                  return (
                    <tr key={d} className={cn(d === today && 'font-bold text-ink-900', 'text-ink-700')}>
                      <th scope="row" className="py-1 text-left font-inherit">{DAY_NAMES[d]}</th>
                      <td className="py-1 text-right">{formatWindow(w)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {allergyOpen && (
            <p id="allergy-advisory" className="max-w-2xl rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              {restaurant.allergyAdvisory}
            </p>
          )}
          <p className="text-sm text-ink-600">{restaurant.address}</p>
        </div>

        <fieldset className="h-fit rounded-3xl border border-ink-100 bg-white p-2 shadow-card lg:w-80">
          <legend className="sr-only">How would you like your order?</legend>
          <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="Fulfilment method">
            {modes.map(({ id, label, icon: Icon, detail, disabled }) => {
              const active = fulfilment === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() => setFulfilment(id)}
                  className={cn(
                    'flex flex-col items-center rounded-2xl px-3 py-3 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60',
                    active ? 'bg-ink-900 text-white' : 'text-ink-900 hover:bg-ink-50',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="mt-1 text-sm font-bold">{label}</span>
                  <span className={cn('text-xs', active ? 'text-ink-200' : 'text-ink-600')}>{detail}</span>
                </button>
              );
            })}
          </div>
          {fulfilment === 'collection' && restaurant.offersCollection && (
            <p className="flex items-start gap-1.5 px-2 pb-1 pt-2 text-xs text-ink-600">
              <ShoppingBag className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> Collect from {restaurant.address.split(',')[0]}. No delivery fee.
            </p>
          )}
        </fieldset>
      </div>

      {!inRadius && listing === null && (
        <p role="status" className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {restaurant.name} doesn’t deliver to your current postcode. You can still order for collection{restaurant.offersCollection ? '' : ' (not offered here)'} or change your postcode.
        </p>
      )}
    </section>
  );
}
