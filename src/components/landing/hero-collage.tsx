'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { SmartImage } from '@/components/ui/smart-image';
import { IMG } from '@/data';

const TILES = [
  { src: IMG.pizzaMargherita, alt: 'Wood-fired margherita pizza', className: 'left-[6%] top-[4%] h-44 w-44 sm:h-56 sm:w-56', rotate: -6, delay: 0 },
  { src: IMG.sushiBoat, alt: 'Sushi boat platter', className: 'right-[2%] top-[0%] h-36 w-36 sm:h-44 sm:w-44', rotate: 5, delay: 0.15 },
  { src: IMG.burgerStacked, alt: 'Stacked smash burger', className: 'right-[8%] bottom-[6%] h-44 w-44 sm:h-56 sm:w-56', rotate: -3, delay: 0.3 },
  { src: IMG.tacosRow, alt: 'Birria tacos', className: 'left-[0%] bottom-[2%] h-32 w-32 sm:h-40 sm:w-40', rotate: 7, delay: 0.45 },
];

/** Floating food photography with gentle parallax drift. */
export function HeroCollage() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden>
      <div className="absolute inset-[12%] rounded-full bg-gradient-to-br from-brand-200 via-amber-100 to-rose-100 blur-2xl" />
      {TILES.map((t) => (
        <motion.div
          key={t.src}
          className={`absolute overflow-hidden rounded-[2rem] border-4 border-white bg-ink-100 shadow-lift ${t.className}`}
          initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: t.rotate, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: t.delay, duration: 0.5 },
            scale: { delay: t.delay, type: 'spring', damping: 14 },
            rotate: { delay: t.delay, type: 'spring', damping: 14 },
            y: { delay: t.delay + 0.6, duration: 5 + t.delay * 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <SmartImage src={t.src} alt="" fill sizes="240px" priority />
        </motion.div>
      ))}
      <motion.div
        className="absolute left-1/2 top-1/2 w-56 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/95 p-4 shadow-lift backdrop-blur"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-herb-50 text-xl">
            🛵
            <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-herb-500" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">Amara is 4 min away</p>
            <p className="text-xs text-ink-600">Smash Republic · 2 items</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-ink-700">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          ))}
          <span className="ml-1">4.97 courier</span>
        </div>
      </motion.div>
    </div>
  );
}
