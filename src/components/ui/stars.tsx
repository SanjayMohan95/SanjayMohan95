'use client';

import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

export function RatingPill({ rating, count, className }: { rating: number; count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-semibold text-ink-900', className)}>
      <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden />
      <span>{rating.toFixed(1)}</span>
      {count !== undefined && <span className="font-normal text-ink-600">({count.toLocaleString('en-GB')})</span>}
      <span className="sr-only">out of 5 stars{count !== undefined ? ` from ${count} reviews` : ''}</span>
    </span>
  );
}

const LABELS = ['Terrible', 'Poor', 'Okay', 'Great', 'Outstanding'];

/** Accessible 1–5 star input implemented as a radio group (arrow keys supported natively). */
export function StarInput({
  label,
  value,
  onChange,
  size = 'md',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  size?: 'md' | 'lg';
}) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink-900">{label}</legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer rounded-md p-0.5 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-300"
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <Star
              aria-hidden
              className={cn(
                'transition-transform duration-100',
                size === 'lg' ? 'h-9 w-9' : 'h-7 w-7',
                n <= shown ? 'scale-105 fill-amber-500 text-amber-500' : 'fill-transparent text-ink-300',
              )}
            />
            <span className="sr-only">
              {n} star{n > 1 ? 's' : ''} — {LABELS[n - 1]}
            </span>
          </label>
        ))}
        <span className="ml-2 min-w-[6rem] text-sm font-medium text-ink-700" aria-hidden>
          {shown ? LABELS[shown - 1] : ''}
        </span>
      </div>
    </fieldset>
  );
}
