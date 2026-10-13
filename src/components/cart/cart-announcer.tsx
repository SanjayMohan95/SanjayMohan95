'use client';

import { useCartStore } from '@/store/cart-store';

/** Screen-reader live region announcing basket changes. */
export function CartAnnouncer() {
  const announcement = useCartStore((s) => s.announcement);
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
}
