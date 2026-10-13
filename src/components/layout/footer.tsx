import Link from 'next/link';
import { Logo } from './header';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-100 bg-ink-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-600">
            The operating system for cravings. Hand-picked London kitchens, live courier telemetry and one-tap reorders.
          </p>
          <p className="mt-4 text-xs text-ink-600">
            Demo platform — all restaurants, couriers and payments are simulated. No real orders are placed or charged.
          </p>
        </div>
        <nav aria-label="Discover">
          <h2 className="text-sm font-bold text-ink-900">Discover</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li><Link className="hover:underline" href="/restaurants">All restaurants</Link></li>
            <li><Link className="hover:underline" href="/cuisines">Browse cuisines</Link></li>
            <li><Link className="hover:underline" href="/restaurants?filter=free-delivery">Free delivery</Link></li>
            <li><Link className="hover:underline" href="/restaurants?filter=halal">Halal</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account and partners">
          <h2 className="text-sm font-bold text-ink-900">Account & partners</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li><Link className="hover:underline" href="/account/orders">Order history</Link></li>
            <li><Link className="hover:underline" href="/cart">Basket</Link></li>
            <li><Link className="hover:underline" href="/merchant/dashboard">Kitchen dashboard</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-ink-100">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-ink-600 sm:px-6">© {new Date().getFullYear()} CraveOS Ltd. Prices include VAT at 20%.</p>
      </div>
    </footer>
  );
}
