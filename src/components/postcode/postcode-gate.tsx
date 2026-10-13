'use client';

import { MapPinned } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useHasHydrated } from '@/store/hydration';
import { usePostcodeStore } from '@/store/postcode-store';
import { PostcodeForm } from './postcode-form';

/**
 * Browsing is location-dependent (radius, fees, ETAs), so discovery pages
 * render only once a deliverable postcode is in global state.
 */
export function PostcodeGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useHasHydrated();
  const postcode = usePostcodeStore((s) => s.postcode);

  if (!hydrated) return <>{fallback ?? <PageSkeleton />}</>;
  if (postcode) return <>{children}</>;

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6" aria-labelledby="gate-title">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden>
        <MapPinned className="h-8 w-8" />
      </div>
      <h1 id="gate-title" className="font-display text-3xl font-extrabold text-ink-900">
        Where should we deliver?
      </h1>
      <p className="mt-2 text-ink-600">
        Restaurants, delivery fees and ETAs depend on your location. Add your postcode to unlock local spots.
      </p>
      <div className="mt-8 w-full text-left">
        <PostcodeForm redirectTo={null} autoFocus />
      </div>
    </section>
  );
}
