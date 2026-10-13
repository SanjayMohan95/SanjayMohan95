'use client';

import { CheckCircle2, Star } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/form';
import { StarInput } from '@/components/ui/stars';
import { useOrderStore } from '@/store/order-store';
import { toast } from '@/store/ui-store';
import type { Order } from '@/types';

/** Post-order dual review: rate the food and the courier independently. */
export function ReviewModule({ order }: { order: Order }) {
  const submitReview = useOrderStore((s) => s.submitReview);
  const [food, setFood] = useState(0);
  const [driver, setDriver] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasCourier = order.fulfilment === 'delivery';

  if (order.review) {
    return (
      <div className="rounded-2xl bg-herb-50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-herb-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Thanks for your review
        </p>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-800">
          <div className="flex items-center gap-1">
            <dt>Food:</dt>
            <dd className="flex items-center gap-0.5" aria-label={`${order.review.foodRating} out of 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={i < order.review!.foodRating ? 'h-4 w-4 fill-amber-500 text-amber-500' : 'h-4 w-4 text-ink-300'} aria-hidden />
              ))}
            </dd>
          </div>
          {hasCourier && (
            <div className="flex items-center gap-1">
              <dt>Courier:</dt>
              <dd className="flex items-center gap-0.5" aria-label={`${order.review.driverRating} out of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={i < order.review!.driverRating ? 'h-4 w-4 fill-amber-500 text-amber-500' : 'h-4 w-4 text-ink-300'} aria-hidden />
                ))}
              </dd>
            </div>
          )}
        </dl>
        {order.review.comment && <p className="mt-2 text-sm italic text-ink-700">“{order.review.comment}”</p>}
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!food || (hasCourier && !driver)) {
      setError(hasCourier ? 'Please rate both the food and your courier.' : 'Please rate the food.');
      return;
    }
    submitReview(order.id, { foodRating: food, driverRating: hasCourier ? driver : 0, comment: comment.trim() });
    toast({ title: 'Review submitted', description: 'Thanks — it helps kitchens and couriers improve.', tone: 'success' });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-ink-100 bg-ink-50/60 p-4" aria-label={`Review order ${order.shortCode}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <StarInput label={`Rate the food from ${order.restaurants.map((r) => r.name).join(' & ')}`} value={food} onChange={(v) => { setFood(v); setError(null); }} />
        {hasCourier && <StarInput label={`Rate ${order.courier?.name.split(' ')[0] ?? 'your courier'}’s delivery`} value={driver} onChange={(v) => { setDriver(v); setError(null); }} />}
      </div>
      <TextArea label="Anything to add?" optional maxLength={280} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you love? What could be better?" />
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
      <Button type="submit" variant="dark">
        Submit review
      </Button>
    </form>
  );
}
