'use client';

import { CheckCircle2, Tag, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useActivePromo, useCartStore } from '@/store/cart-store';

export function PromoBox({ subtotal }: { subtotal: number }) {
  const promo = useActivePromo();
  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulated network validation latency.
    window.setTimeout(() => {
      const res = applyPromo(code);
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok) setCode('');
      setLoading(false);
    }, 450);
  };

  if (promo) {
    const belowMin = subtotal < promo.minSubtotal;
    return (
      <div className={cn('rounded-xl border px-3 py-3', belowMin ? 'border-amber-300 bg-amber-50' : 'border-herb-100 bg-herb-50')}>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-herb-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> {promo.code} applied
          </p>
          <button
            type="button"
            onClick={() => {
              removePromo();
              setMessage(null);
            }}
            className="rounded-full p-1 text-ink-700 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
            aria-label={`Remove promo code ${promo.code}`}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-0.5 text-sm text-ink-700">{promo.description}</p>
        {belowMin && (
          <p role="alert" className="mt-1 text-sm font-semibold text-amber-900">
            Add {formatMoney(promo.minSubtotal - subtotal)} more to reactivate this code.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="promo" className="mb-1.5 flex items-center gap-2 font-bold text-ink-900">
        <Tag className="h-4 w-4 text-brand-700" aria-hidden /> Promo code
      </label>
      <div className="flex gap-2">
        <input
          id="promo"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setMessage(null);
          }}
          placeholder="e.g. CRAVE20"
          autoComplete="off"
          aria-invalid={message && !message.ok ? true : undefined}
          aria-describedby="promo-msg"
          className={cn(
            'h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 font-semibold uppercase tracking-wide text-ink-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-400 focus:outline-none focus:ring-4',
            message && !message.ok ? 'border-red-600 focus:ring-red-200' : 'border-ink-200 focus:border-brand-600 focus:ring-brand-100',
          )}
        />
        <Button type="submit" variant="dark" loading={loading} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      <p id="promo-msg" aria-live="polite" className={cn('mt-1.5 min-h-[1.25rem] text-sm font-medium', message?.ok ? 'text-herb-700' : 'text-red-800')}>
        {message?.text ?? <span className="text-ink-600">Try CRAVE20, WELCOME5 or FREEDEL</span>}
      </p>
    </form>
  );
}
