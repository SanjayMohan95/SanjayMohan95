'use client';

import { Heart } from 'lucide-react';
import { useId, useState } from 'react';
import { formatMoney } from '@/lib/format';
import { MAX_CUSTOM_TIP } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';

const PRESETS = [0, 10, 15] as const;

export function TipSelector({ subtotal }: { subtotal: number }) {
  const tip = useCartStore((s) => s.tip);
  const setTip = useCartStore((s) => s.setTip);
  const [custom, setCustom] = useState(tip.type === 'custom' ? (tip.amount / 100).toFixed(2) : '');
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const onCustom = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setCustom(cleaned);
    const pounds = Number(cleaned);
    if (!cleaned) {
      setError(null);
      return;
    }
    if (Number.isNaN(pounds) || !/^\d+(\.\d{0,2})?$/.test(cleaned)) {
      setError('Enter an amount like 2.50');
      return;
    }
    const pence = Math.round(pounds * 100);
    if (pence > MAX_CUSTOM_TIP) {
      setError(`Maximum tip is ${formatMoney(MAX_CUSTOM_TIP)}`);
      return;
    }
    setError(null);
    setTip({ type: 'custom', amount: pence });
  };

  return (
    <fieldset>
      <legend className="flex items-center gap-2 font-bold text-ink-900">
        <Heart className="h-4 w-4 text-brand-700" aria-hidden /> Tip your courier
      </legend>
      <p className="text-sm text-ink-600">100% of tips go directly to your courier.</p>
      <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Tip amount">
        {PRESETS.map((p) => {
          const active = tip.type === 'percent' && tip.value === p;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setTip({ type: 'percent', value: p });
                setCustom('');
                setError(null);
              }}
              className={cn(
                'flex flex-col items-center rounded-xl border px-2 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                active ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-900 hover:border-ink-400',
              )}
            >
              {p === 0 ? 'No tip' : `${p}%`}
              <span className={cn('text-xs font-medium', active ? 'text-ink-200' : 'text-ink-600')}>{formatMoney(Math.round((subtotal * p) / 100))}</span>
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={tip.type === 'custom'}
          onClick={() => {
            document.getElementById(id)?.focus();
            if (custom) onCustom(custom);
            else setTip({ type: 'custom', amount: 0 });
          }}
          className={cn(
            'rounded-xl border px-2 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
            tip.type === 'custom' ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-900 hover:border-ink-400',
          )}
        >
          Custom
        </button>
      </div>
      {tip.type === 'custom' && (
        <div className="mt-3">
          <label htmlFor={id} className="sr-only">
            Custom tip in pounds
          </label>
          <div className={cn('flex items-center rounded-xl border bg-white px-3', error ? 'border-red-600' : 'border-ink-200 focus-within:border-brand-600')}>
            <span className="text-ink-700" aria-hidden>
              £
            </span>
            <input
              id={id}
              inputMode="decimal"
              value={custom}
              onChange={(e) => onCustom(e.target.value)}
              placeholder="0.00"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `${id}-err` : undefined}
              className="h-11 w-full bg-transparent px-1 font-semibold text-ink-900 focus:outline-none"
            />
          </div>
          {error && (
            <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-semibold text-red-800">
              {error}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
