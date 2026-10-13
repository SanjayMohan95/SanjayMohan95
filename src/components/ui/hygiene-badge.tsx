import { ShieldCheck } from 'lucide-react';
import type { HygieneRating } from '@/types';
import { cn } from '@/lib/utils';

const LABEL: Record<HygieneRating, string> = {
  5: 'Very good',
  4: 'Good',
  3: 'Generally satisfactory',
  2: 'Improvement necessary',
  1: 'Major improvement necessary',
  0: 'Urgent improvement necessary',
};

/** FSA Food Hygiene Rating Scheme badge (UK). */
export function HygieneBadge({ rating, compact, className }: { rating: HygieneRating; compact?: boolean; className?: string }) {
  const good = rating >= 4;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold ring-1 ring-inset',
        good ? 'bg-herb-50 text-herb-700 ring-herb-100' : rating === 3 ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-red-50 text-red-800 ring-red-200',
        className,
      )}
      title={`Food Hygiene Rating ${rating}: ${LABEL[rating]}`}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded-sm text-[10px] leading-none text-white',
          good ? 'bg-herb-700' : rating === 3 ? 'bg-amber-800' : 'bg-red-800',
        )}
      >
        {rating}
      </span>
      {compact ? <span className="sr-only">Food hygiene rating {rating} of 5</span> : <span>Hygiene: {LABEL[rating]}<span className="sr-only"> (rated {rating} of 5)</span></span>}
    </span>
  );
}
