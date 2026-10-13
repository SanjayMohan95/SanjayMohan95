import type { Metadata } from 'next';
import { MerchantDashboard } from '@/components/merchant/merchant-dashboard';

export const metadata: Metadata = { title: 'Kitchen dashboard' };

export default function MerchantDashboardPage() {
  return <MerchantDashboard />;
}
