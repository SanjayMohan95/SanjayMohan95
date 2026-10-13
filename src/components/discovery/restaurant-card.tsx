'use client';

import { motion } from 'framer-motion';
import { Bike, Clock, MapPin, Moon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { HygieneBadge } from '@/components/ui/hygiene-badge';
import { RatingPill } from '@/components/ui/stars';
import { SmartImage } from '@/components/ui/smart-image';
import { CUISINE_MAP, getMenuItem } from '@/data';
import { formatEta, formatMiles, formatMoney, formatPriceTier } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RestaurantListing } from '@/types';

export function RestaurantCard({ listing, index = 0, highlighted, onHover }: { listing: RestaurantListing; index?: number; highlighted?: boolean; onHover?: (id: string | null) => void }) {
  const cuisine = CUISINE_MAP[listing.cuisine];
  const popular = listing.popularDishIds.slice(0, 2).map((id) => getMenuItem(id)).filter(Boolean);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), type: 'spring', damping: 26, stiffness: 260 }}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'group relative overflow-hidden rounded-3xl border bg-white shadow-card transition-shadow hover:shadow-lift',
        highlighted ? 'border-brand-600 ring-2 ring-brand-600' : 'border-ink-100',
        !listing.isOpen && 'opacity-90',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
        <SmartImage
          src={listing.heroImage}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="transition-transform duration-700 group-hover:scale-105"
          fallbackEmoji={cuisine.emoji}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/0 to-transparent" aria-hidden />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {listing.promoted && <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink-900">Featured</span>}
          {listing.isNew && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-xs font-bold text-white">
              <Sparkles className="h-3 w-3" aria-hidden /> New
            </span>
          )}
          {listing.deliveryFee === 0 && <span className="rounded-full bg-herb-700 px-2.5 py-1 text-xs font-bold text-white">Free delivery</span>}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink-900 shadow">
            <Clock className="h-4 w-4 text-brand-700" aria-hidden />
            {formatEta(listing.etaRange)}
          </span>
          <HygieneBadge rating={listing.hygieneRating} compact className="bg-white" />
        </div>
        {!listing.isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-900">
              <Moon className="h-4 w-4" aria-hidden /> Opens {listing.opensAt ?? 'later'} · Schedule ahead
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-tight text-ink-900">
            <Link href={`/restaurant/${listing.id}`} className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:rounded-3xl after:focus-visible:ring-4 after:focus-visible:ring-brand-300">
              {listing.name}
            </Link>
          </h3>
          <RatingPill rating={listing.rating} count={listing.ratingCount} className="shrink-0" />
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-ink-600">
          {cuisine.shortName} · {formatPriceTier(listing.priceTier)} · {listing.tagline}
        </p>
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-700">
          <div className="flex items-center gap-1">
            <dt className="sr-only">Delivery fee</dt>
            <Bike className="h-4 w-4" aria-hidden />
            <dd className={listing.deliveryFee === 0 ? 'font-semibold text-herb-700' : ''}>{listing.deliveryFee === 0 ? 'Free delivery' : `${formatMoney(listing.deliveryFee)} delivery`}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Distance</dt>
            <MapPin className="h-4 w-4" aria-hidden />
            <dd>{formatMiles(listing.distanceMiles)}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Minimum order</dt>
            <dd>Min {formatMoney(listing.minOrder)}</dd>
          </div>
        </dl>
        {popular.length > 0 && (
          <div className="mt-3 border-t border-ink-100 pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-600">Popular</p>
            <ul className="mt-2 flex gap-2">
              {popular.map((dish) => (
                <li key={dish!.id} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-ink-50 p-1.5 pr-2">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <SmartImage src={dish!.image} alt="" fill sizes="36px" fallbackEmoji={cuisine.emoji} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink-900">{dish!.name}</p>
                    <p className="text-xs text-ink-600">{formatMoney(dish!.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.article>
  );
}
