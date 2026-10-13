'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { discoveryFromParams, discoveryToParams } from '@/lib/discovery';
import type { DiscoveryState } from '@/types';

/** Discovery filters live in the URL so filtered views are shareable and survive refresh. */
export function useDiscoveryParams(): [DiscoveryState, (patch: Partial<DiscoveryState>) => void, () => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const state = useMemo(() => discoveryFromParams(new URLSearchParams(params.toString())), [params]);

  const update = useCallback(
    (patch: Partial<DiscoveryState>) => {
      const next = discoveryToParams({ ...state, ...patch }).toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [state, router, pathname],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);
  return [state, update, reset];
}
