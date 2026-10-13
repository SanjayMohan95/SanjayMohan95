import type { Metadata } from 'next';
import { CheckoutGuard } from '@/components/checkout/checkout-guard';
import { PaymentView } from '@/components/checkout/payment-view';

export const metadata: Metadata = { title: 'Payment' };

export default function PaymentPage() {
  return (
    <CheckoutGuard>
      <PaymentView />
    </CheckoutGuard>
  );
}
