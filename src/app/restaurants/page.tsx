import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RestaurantsView } from '@/components/discovery/restaurants-view';
import { PostcodeGate } from '@/components/postcode/postcode-gate';
import { PageSkeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Restaurants near you' };

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PostcodeGate>
        <RestaurantsView />
      </PostcodeGate>
    </Suspense>
  );
}
