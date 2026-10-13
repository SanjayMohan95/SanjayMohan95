import { SearchX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden>
        <SearchX className="h-8 w-8" />
      </div>
      <h1 className="font-display text-3xl font-extrabold text-ink-900">We couldn’t find that page</h1>
      <p className="mt-3 text-ink-600">The restaurant or order may have moved, or the link might be mistyped.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/restaurants" className="inline-flex h-11 items-center rounded-xl bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800">
          Browse restaurants
        </Link>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl border border-ink-200 px-4 font-semibold text-ink-900 hover:bg-ink-50">
          Home
        </Link>
      </div>
    </section>
  );
}
