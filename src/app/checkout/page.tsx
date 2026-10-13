import type { Metadata } from 'next';
import { CheckoutGuard } from '@/components/checkout/checkout-guard';
import { CheckoutView } from '@/components/checkout/checkout-view';

export const metadata: Metadata = { title: 'Checkout' };

export default function CheckoutPage() {
  return (
    <CheckoutGuard>
      <CheckoutView />
    </CheckoutGuard>
  );
}
