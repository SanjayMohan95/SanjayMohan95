'use client';

import { Bike, Car, MessageCircle, Phone, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/store/ui-store';
import { useOrderStore } from '@/store/order-store';
import type { Courier } from '@/types';
import { CourierChat } from './courier-chat';

export function CourierCard({ courier, orderId, speedMph }: { courier: Courier; orderId: string; speedMph: number }) {
  const [chatOpen, setChatOpen] = useState(false);
  const unread = useOrderStore((s) => {
    const msgs = s.chats[orderId] ?? [];
    const lastCustomer = [...msgs].reverse().findIndex((m) => m.from === 'customer');
    const tail = lastCustomer === -1 ? msgs : msgs.slice(msgs.length - lastCustomer);
    return tail.filter((m) => m.from === 'courier').length;
  });
  const VehicleIcon = courier.vehicle.type === 'car' ? Car : Bike;

  return (
    <section aria-labelledby="courier-title" className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
      <h2 id="courier-title" className="sr-only">
        Your courier
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-lg font-bold text-white" aria-hidden>
            {courier.initials}
          </span>
          <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-ink-900 shadow">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
            {courier.rating.toFixed(2)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink-900">{courier.name}</p>
          <p className="text-sm text-ink-600">
            {courier.deliveries.toLocaleString('en-GB')} deliveries · Speaks {courier.languages.join(', ')}
          </p>
          <p className="sr-only">Rated {courier.rating} out of 5</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-ink-50 p-3 text-sm">
        <div>
          <dt className="text-ink-600">Vehicle</dt>
          <dd className="flex items-center gap-1.5 font-semibold text-ink-900">
            <VehicleIcon className="h-4 w-4" aria-hidden />
            {courier.vehicle.colour} {courier.vehicle.make} {courier.vehicle.model}
          </dd>
        </div>
        <div>
          <dt className="text-ink-600">{courier.vehicle.plate ? 'Licence plate' : 'Type'}</dt>
          <dd>
            {courier.vehicle.plate ? (
              <span className="inline-block rounded border border-ink-900 bg-amber-300 px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-ink-900">{courier.vehicle.plate}</span>
            ) : (
              <span className="font-semibold capitalize text-ink-900">{courier.vehicle.type}</span>
            )}
          </dd>
        </div>
        {speedMph > 0 && (
          <div className="col-span-2 text-xs text-ink-600" aria-live="off">
            Moving at ~{speedMph} mph
          </div>
        )}
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => toast({ title: `Calling ${courier.name.split(' ')[0]}…`, description: `Connecting via masked line ${courier.phoneMasked}`, tone: 'info' })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 font-semibold text-ink-900 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
        >
          <Phone className="h-4 w-4" aria-hidden /> Call
        </button>
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="relative inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink-900 font-semibold text-white hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> Chat
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-700 px-1 text-xs font-bold text-white">
              {unread}
              <span className="sr-only"> new messages</span>
            </span>
          )}
        </button>
      </div>
      <CourierChat open={chatOpen} onClose={() => setChatOpen(false)} orderId={orderId} courier={courier} />
    </section>
  );
}
