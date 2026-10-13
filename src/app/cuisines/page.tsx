import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CuisinesView } from '@/components/discovery/cuisines-view';
import { PostcodeGate } from '@/components/postcode/postcode-gate';
import { PageSkeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Discover cuisines' };

export default function CuisinesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PostcodeGate>
        <CuisinesView />
      </PostcodeGate>
    </Suspense>
  );
}
