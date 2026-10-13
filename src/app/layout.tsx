import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { CartAnnouncer } from '@/components/cart/cart-announcer';
import { CartConflictDialog } from '@/components/cart/conflict-dialog';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Providers } from '@/components/layout/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CraveOS — London’s best food, delivered', template: '%s · CraveOS' },
  description:
    'Order from hand-picked London restaurants with live courier tracking, multi-drop baskets and one-tap reorders.',
  applicationName: 'CraveOS',
};

export const viewport: Viewport = {
  themeColor: '#a12506',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-[100] rounded-lg bg-ink-900 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <Providers>
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <CartConflictDialog />
          <CartAnnouncer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
