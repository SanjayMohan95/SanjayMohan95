'use client';

import { Leaf, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/form';
import { useOrderStore } from '@/store/order-store';

export function StepCutlery({ onComplete }: { onComplete: () => void }) {
  const cutlery = useOrderStore((s) => s.checkout.cutlery);
  const napkins = useOrderStore((s) => s.checkout.napkins);
  const updateCheckout = useOrderStore((s) => s.updateCheckout);
  const plasticSaved = (cutlery ? 0 : 14) + (napkins ? 0 : 4);

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-2xl border border-ink-100 p-4">
        <Toggle
          checked={cutlery}
          onChange={(v) => updateCheckout({ cutlery: v })}
          label="Include cutlery"
          description="Wooden & compostable where available. Plastic only if the kitchen has nothing else."
          icon={<Utensils className="h-5 w-5" />}
        />
        <Toggle checked={napkins} onChange={(v) => updateCheckout({ napkins: v })} label="Include napkins" description="Recycled paper napkins." icon={<span aria-hidden>🧻</span>} />
      </div>
      <div className="flex items-start gap-3 rounded-2xl bg-herb-50 p-4 text-herb-700" aria-live="polite">
        <Leaf className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p className="text-sm">
          {plasticSaved > 0 ? (
            <>
              <strong>Nice one!</strong> Skipping extras saves about <strong>{plasticSaved}g</strong> of single-use waste on this order. CraveOS customers opted out
              of 2.1 million cutlery sets last year.
            </>
          ) : (
            <>Cutlery and napkins will be included. UK law requires single-use plastic cutlery to be on request only — thanks for choosing consciously.</>
          )}
        </p>
      </div>
      <Button size="lg" fullWidth onClick={onComplete}>
        Continue to payment
      </Button>
    </div>
  );
}
