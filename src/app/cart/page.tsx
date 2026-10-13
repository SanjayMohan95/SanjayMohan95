import type { Metadata } from 'next';
import { CartPageView } from '@/components/cart/cart-page-view';

export const metadata: Metadata = { title: 'Your basket' };

export default function CartPage() {
  return <CartPageView />;
}
