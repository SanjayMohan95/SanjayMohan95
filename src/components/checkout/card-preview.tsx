'use client';

import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { brandLabel } from '@/lib/card';
import { cn } from '@/lib/utils';
import type { CardBrand } from '@/types';

const BRAND_STYLE: Record<CardBrand, string> = {
  visa: 'from-[#1a1f71] via-[#2a3a9e] to-[#0f1445]',
  mastercard: 'from-[#1d1d1f] via-[#3b2a1a] to-[#1d1d1f]',
  amex: 'from-[#0b6e99] via-[#1189b8] to-[#064a68]',
  discover: 'from-[#3a3a3a] via-[#5b4a3a] to-[#1f1f1f]',
  maestro: 'from-[#0a3a7a] via-[#1d5ab8] to-[#08305f]',
  diners: 'from-[#2c3e50] via-[#4a6074] to-[#1b2836]',
  jcb: 'from-[#0b5d2c] via-[#137a3c] to-[#063d1c]',
  unknown: 'from-ink-800 via-ink-700 to-ink-900',
};

function BrandMark({ brand }: { brand: CardBrand }) {
  if (brand === 'mastercard' || brand === 'maestro') {
    return (
      <span className="flex items-center" aria-hidden>
        <span className="h-7 w-7 rounded-full bg-[#eb001b]" />
        <span className="-ml-3 h-7 w-7 rounded-full bg-[#f79e1b] mix-blend-screen" />
      </span>
    );
  }
  return <span className="text-lg font-black italic tracking-wide text-white" aria-hidden>{brand === 'unknown' ? '' : brandLabel(brand).toUpperCase().split(' ')[0]}</span>;
}

/** Live card preview that flips to show the CVV when the security field is focused. */
export function CardPreview({ number, name, expiry, cvv, brand, flipped }: { number: string; name: string; expiry: string; cvv: string; brand: CardBrand; flipped: boolean }) {
  const placeholder = brand === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••';
  const display = placeholder
    .split('')
    .map((ch, i) => (number[i] && ch !== ' ' ? number[i] : ch))
    .join('');

  return (
    <div className="mx-auto w-full max-w-sm [perspective:1200px]" aria-hidden>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 180 }}
        className="relative aspect-[1.586] w-full [transform-style:preserve-3d]"
      >
        <div className={cn('absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-br p-5 text-white shadow-lift [backface-visibility:hidden]', BRAND_STYLE[brand])}>
          <div className="flex items-start justify-between">
            <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" />
            <Wifi className="h-6 w-6 rotate-90 opacity-80" />
          </div>
          <p className="font-mono text-xl tracking-[0.12em] sm:text-2xl">{display}</p>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-white/70">Card holder</p>
              <p className="truncate font-semibold uppercase tracking-wide">{name || 'Your name'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/70">Expires</p>
              <p className="font-mono font-semibold">{expiry || 'MM / YY'}</p>
            </div>
            <BrandMark brand={brand} />
          </div>
        </div>
        <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br shadow-lift [backface-visibility:hidden] [transform:rotateY(180deg)]', BRAND_STYLE[brand])}>
          <div className="mt-6 h-11 w-full bg-ink-950/80" />
          <div className="mx-5 mt-5 flex items-center gap-3">
            <div className="h-9 flex-1 rounded bg-white/90" />
            <div className="flex h-9 w-16 items-center justify-center rounded bg-white font-mono font-bold text-ink-900">{cvv || (brand === 'amex' ? '••••' : '•••')}</div>
          </div>
          <p className="mx-5 mt-3 text-[10px] text-white/70">{brand === 'amex' ? 'Amex: 4-digit code is printed on the front' : 'Security code (CVV)'}</p>
        </div>
      </motion.div>
    </div>
  );
}
