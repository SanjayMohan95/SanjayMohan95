import type { Metadata } from 'next';
import { TrackingView } from '@/components/tracking/tracking-view';

export const metadata: Metadata = { title: 'Live order tracking' };

export default function TrackingPage({ params }: { params: { orderId: string } }) {
  return <TrackingView orderId={params.orderId} />;
}
