'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { ChefHat, ChevronDown, ClipboardList, MapPin, Menu, ShoppingBag, UtensilsCrossed, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PostcodeForm } from '@/components/postcode/postcode-form';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useCartCount, useCartStore } from '@/store/cart-store';
import { useHasHydrated } from '@/store/hydration';
import { usePostcodeStore } from '@/store/postcode-store';

const NAV = [
  { href: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { href: '/cuisines', label: 'Cuisines', icon: ChefHat },
  { href: '/account/orders', label: 'Orders', icon: ClipboardList },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('group inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300', className)} aria-label="CraveOS home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-card transition-transform group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
          <path d="M17 7.5A6 6 0 1 0 17 16.5" />
          <circle cx="17.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight text-ink-900">
        Crave<span className="text-brand-700">OS</span>
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const hydrated = useHasHydrated();
  const postcode = usePostcodeStore((s) => s.postcode);
  const area = usePostcodeStore((s) => s.area);
  const count = useCartCount();
  const pulse = useCartStore((s) => s.addPulse);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const controls = useAnimationControls();

  useEffect(() => {
    if (pulse > 0) void controls.start({ scale: [1, 1.25, 0.95, 1], transition: { duration: 0.45 } });
  }, [pulse, controls]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const isMerchant = pathname?.startsWith('/merchant');

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo />

        {!isMerchant && (
          <button
            type="button"
            onClick={() => setPostcodeOpen(true)}
            className="ml-1 hidden min-w-0 items-center gap-2 rounded-full border border-ink-200 px-3 py-1.5 text-sm transition hover:border-ink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 md:inline-flex"
            aria-label={postcode ? `Delivering to ${postcode}. Change postcode` : 'Set delivery postcode'}
          >
            <MapPin className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
            {hydrated && postcode ? (
              <span className="truncate">
                <span className="font-bold text-ink-900">{postcode}</span>
                {area && <span className="text-ink-600"> · {area.district}</span>}
              </span>
            ) : (
              <span className="font-semibold text-ink-800">Set postcode</span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-600" aria-hidden />
          </button>
        )}

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map(({ href, label }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                  active ? 'bg-ink-900 text-white' : 'text-ink-800 hover:bg-ink-50',
                )}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/merchant/dashboard"
            aria-current={isMerchant ? 'page' : undefined}
            className={cn(
              'ml-1 rounded-full border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
              isMerchant ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-800 hover:border-ink-400',
            )}
          >
            For restaurants
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <motion.button
            type="button"
            animate={controls}
            onClick={openDrawer}
            className="relative inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-4 text-sm font-bold text-white transition hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
            aria-label={`Open basket, ${hydrated ? count : 0} item${count === 1 ? '' : 's'}`}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <span className="tabular-nums" aria-hidden>
              {hydrated ? count : 0}
            </span>
          </motion.button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-900 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-ink-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <button
            type="button"
            onClick={() => setPostcodeOpen(true)}
            className="mb-2 flex w-full items-center gap-2 rounded-xl bg-ink-50 px-3 py-3 text-left text-sm"
          >
            <MapPin className="h-4 w-4 text-brand-700" aria-hidden />
            {hydrated && postcode ? (
              <span>
                Delivering to <strong>{postcode}</strong> — change
              </span>
            ) : (
              <strong>Set your postcode</strong>
            )}
          </button>
          <ul className="grid gap-1">
            {[...NAV, { href: '/merchant/dashboard', label: 'For restaurants', icon: ChefHat }].map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={pathname?.startsWith(href) ? 'page' : undefined}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ink-900 hover:bg-ink-50 aria-[current=page]:bg-ink-900 aria-[current=page]:text-white"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Dialog open={postcodeOpen} onClose={() => setPostcodeOpen(false)} title="Delivery location" description="We’ll show restaurants, fees and ETAs for this postcode.">
        <div className="p-5 sm:p-6">
          <PostcodeForm redirectTo={null} size="md" onValid={() => window.setTimeout(() => setPostcodeOpen(false), 650)} />
        </div>
      </Dialog>
    </header>
  );
}
