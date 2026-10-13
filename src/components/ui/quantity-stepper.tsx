'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  min = 1,
  max = 25,
  label,
  size = 'md',
  removeAtMin,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  /** Item name for screen reader context. */
  label: string;
  size?: 'sm' | 'md';
  /** Show a trash icon instead of minus when at 1 (decrement removes). */
  removeAtMin?: boolean;
}) {
  const btn = cn(
    'inline-flex items-center justify-center rounded-full text-ink-900 transition hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:text-ink-300',
    size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
  );
  const atMin = value <= min;
  const showTrash = removeAtMin && value <= 1;
  return (
    <div role="group" aria-label={`Quantity for ${label}`} className="inline-flex items-center rounded-full border border-ink-200 bg-white p-0.5">
      <button
        type="button"
        className={btn}
        onClick={onDecrement}
        disabled={atMin && !removeAtMin}
        aria-label={showTrash ? `Remove ${label}` : `Decrease quantity of ${label}`}
      >
        {showTrash ? <Trash2 className="h-4 w-4 text-red-700" aria-hidden /> : <Minus className="h-4 w-4" aria-hidden />}
      </button>
      <output aria-live="polite" className={cn('min-w-[2ch] text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')}>
        {value}
      </output>
      <button type="button" className={btn} onClick={onIncrement} disabled={value >= max} aria-label={`Increase quantity of ${label}`}>
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
