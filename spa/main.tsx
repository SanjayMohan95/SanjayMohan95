import { Component, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import AccountOrdersPage from '@/app/account/orders/page';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import PaymentPage from '@/app/checkout/payment/page';
import CuisinesPage from '@/app/cuisines/page';
import MerchantDashboardPage from '@/app/merchant/dashboard/page';
import NotFound from '@/app/not-found';
import TrackingPage from '@/app/order/[orderId]/tracking/page';
import LandingPage from '@/app/page';
import RestaurantPage from '@/app/restaurant/[id]/page';
import RestaurantsPage from '@/app/restaurants/page';
import GlobalError from '@/app/error';
import { CartAnnouncer } from '@/components/cart/cart-announcer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { CartConflictDialog } from '@/components/cart/conflict-dialog';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Providers } from '@/components/layout/providers';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';
import { NotFoundError } from './shims/next-navigation';
import { useRouterStore } from './shims/router';

type Route = { pattern: RegExp; render: (m: RegExpMatchArray) => ReactNode };

const ROUTES: Route[] = [
  { pattern: /^\/$/, render: () => <LandingPage /> },
  { pattern: /^\/cuisines\/?$/, render: () => <CuisinesPage /> },
  { pattern: /^\/restaurants\/?$/, render: () => <RestaurantsPage /> },
  { pattern: /^\/restaurant\/([^/]+)\/?$/, render: (m) => <RestaurantPage params={{ id: decodeURIComponent(m[1]) }} /> },
  { pattern: /^\/cart\/?$/, render: () => <CartPage /> },
  { pattern: /^\/checkout\/?$/, render: () => <CheckoutPage /> },
  { pattern: /^\/checkout\/payment\/?$/, render: () => <PaymentPage /> },
  { pattern: /^\/order\/([^/]+)\/tracking\/?$/, render: (m) => <TrackingPage params={{ orderId: decodeURIComponent(m[1]) }} /> },
  { pattern: /^\/account\/orders\/?$/, render: () => <AccountOrdersPage /> },
  { pattern: /^\/merchant\/dashboard\/?$/, render: () => <MerchantDashboardPage /> },
];

class RouteBoundary extends Component<{ children: ReactNode; routeKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { routeKey: string }) {
    if (prev.routeKey !== this.props.routeKey && this.state.error) this.setState({ error: null });
  }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (error instanceof NotFoundError) return <NotFound />;
    return <GlobalError error={error} reset={() => this.setState({ error: null })} />;
  }
}

function Router() {
  const path = useRouterStore((s) => s.path);
  const route = ROUTES.map((r) => ({ r, m: path.match(r.pattern) })).find((x) => x.m);
  return (
    <RouteBoundary routeKey={path}>
      <Suspense fallback={<PageSkeleton />}>{route ? route.r.render(route.m!) : <NotFound />}</Suspense>
    </RouteBoundary>
  );
}

function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-ink-900 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to main content
      </a>
      <Providers>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            <Router />
          </main>
          <Footer />
        </div>
        <CartDrawer />
        <CartConflictDialog />
        <CartAnnouncer />
        <Toaster />
      </Providers>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
