'use client';

import { MotionConfig } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { useCartStore } from '@/store/cart-store';
import { useHydrationStore } from '@/store/hydration';
import { useMerchantStore } from '@/store/merchant-store';
import { useOrderStore } from '@/store/order-store';
import { usePostcodeStore } from '@/store/postcode-store';

const PERSISTED = [
  { key: 'craveos.postcode', store: usePostcodeStore },
  { key: 'craveos.cart', store: useCartStore },
  { key: 'craveos.orders', store: useOrderStore },
  { key: 'craveos.merchant', store: useMerchantStore },
] as const;

/**
 * Rehydrates persisted Zustand stores after mount (avoids SSR/CSR mismatch)
 * and keeps them in sync across browser tabs — so a kitchen tab accepting
 * an order updates the customer's tracking tab in real time.
 */
function StoreHydration() {
  const setHydrated = useHydrationStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;
    Promise.all(PERSISTED.map(({ store }) => store.persist.rehydrate())).then(() => {
      if (cancelled) return;
      useOrderStore.getState().ensureSeeded();
      setHydrated();
    });

    const onStorage = (e: StorageEvent) => {
      const match = PERSISTED.find((p) => p.key === e.key);
      if (match) void match.store.persist.rehydrate();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, [setHydrated]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <StoreHydration />
      {children}
    </MotionConfig>
  );
}
