'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { SmartImage } from '@/components/ui/smart-image';
import { CUISINES } from '@/data';
import { useAreaListings } from '@/hooks/use-listings';
import { cn } from '@/lib/utils';
import { useHasHydrated } from '@/store/hydration';
import { usePostcodeStore } from '@/store/postcode-store';

/** Cuisine carousel teaser — locked until a valid postcode is typed, then springs open. */
export function CuisineTeaser() {
  const hydrated = useHasHydrated();
  const postcode = usePostcodeStore((s) => s.postcode);
  const listings = useAreaListings();
  const unlocked = hydrated && !!postcode;

  return (
    <section aria-labelledby="teaser-title" className="relative">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="teaser-title" className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
            What are you craving?
          </h2>
          <p className="mt-1 text-ink-600">{unlocked ? `Cuisines delivering to ${postcode}` : 'Enter your postcode to unlock local cuisines.'}</p>
        </div>
        {unlocked && (
          <Link href="/cuisines" className="hidden items-center gap-1 font-semibold text-brand-800 hover:underline sm:inline-flex">
            All cuisines <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      <div className="relative">
        <ul
          className={cn('no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6', !unlocked && 'pointer-events-none select-none')}
          aria-hidden={!unlocked}
        >
          {CUISINES.map((c, i) => {
            const count = listings.filter((l) => l.cuisine === c.id).length;
            return (
              <motion.li
                key={c.id}
                className="w-40 shrink-0 snap-start sm:w-48"
                initial={false}
                animate={unlocked ? { filter: 'blur(0px)', opacity: 1, y: 0 } : { filter: 'blur(6px)', opacity: 0.55, y: 6 }}
                transition={{ delay: unlocked ? i * 0.05 : 0, type: 'spring', damping: 20 }}
              >
                <Link
                  href={`/restaurants?cuisine=${c.id}`}
                  tabIndex={unlocked ? 0 : -1}
                  className="group block overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
                >
                  <div className="relative aspect-[4/5] bg-ink-100">
                    <SmartImage src={c.image} alt="" fill sizes="192px" className="transition-transform duration-500 group-hover:scale-110" fallbackEmoji={c.emoji} />
                    <div className={cn('absolute inset-0 bg-gradient-to-t', c.accent)} aria-hidden />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                      <p className="text-2xl" aria-hidden>
                        {c.emoji}
                      </p>
                      <p className="font-display text-lg font-bold leading-tight">{c.shortName}</p>
                      {unlocked && <p className="text-xs font-semibold text-white/90">{count} nearby</p>}
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
        <AnimatePresence>
          {!unlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <a href="#postcode-hero" className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-3 font-bold text-white shadow-lift hover:bg-ink-800">
                <Lock className="h-4 w-4" aria-hidden /> Add your postcode to unlock
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
