'use client';

import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { SmartImage } from '@/components/ui/smart-image';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { formatMoney } from '@/lib/format';
import { useCartStore } from '@/store/cart-store';
import { toast } from '@/store/ui-store';
import type { CartItem } from '@/types';
import { cn } from '@/lib/utils';

export function CartLine({ line, onEdit, compact, unavailable }: { line: CartItem; onEdit?: (line: CartItem) => void; compact?: boolean; unavailable?: boolean }) {
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const restoreItem = useCartStore((s) => s.restoreItem);

  const remove = () => {
    removeItem(line.lineId);
    toast({ title: `Removed ${line.name}`, action: { label: 'Undo', onClick: () => restoreItem(line) } });
  };

  const onDecrement = () => {
    if (line.quantity <= 1) remove();
    else decrement(line.lineId);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
      className={cn('flex gap-3 py-4', unavailable && 'opacity-70')}
    >
      {!compact && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:h-20 sm:w-20">
          <SmartImage src={line.image} alt="" fill sizes="80px" fallbackEmoji="🍽️" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-ink-900">{line.name}</p>
          <p className="shrink-0 font-semibold tabular-nums text-ink-900">{formatMoney(line.unitPrice * line.quantity)}</p>
        </div>
        {line.modifiers.length > 0 && (
          <p className="mt-0.5 text-sm text-ink-600">{line.modifiers.map((m) => m.optionName).join(' · ')}</p>
        )}
        {line.specialInstructions && <p className="mt-0.5 text-sm italic text-ink-600">“{line.specialInstructions}”</p>}
        {unavailable && <p className="mt-1 text-sm font-semibold text-red-800">Sold out — remove to continue</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <QuantityStepper size="sm" label={line.name} value={line.quantity} onIncrement={() => increment(line.lineId)} onDecrement={onDecrement} removeAtMin />
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(line)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit<span className="sr-only"> {line.name}</span>
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold text-red-800 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove<span className="sr-only"> {line.name}</span>
          </button>
        </div>
      </div>
    </motion.li>
  );
}
