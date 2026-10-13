'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Hook for observability (Sentry, Datadog…) in production.
    console.error('[CraveOS] Unhandled UI error', error);
  }, [error]);

  return (
    <section role="alert" className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700" aria-hidden>
        <TriangleAlert className="h-8 w-8" />
      </div>
      <h1 className="font-display text-3xl font-extrabold text-ink-900">Something went wrong in the kitchen</h1>
      <p className="mt-3 text-ink-600">
        We hit an unexpected error loading this page. Your basket is safe — it’s saved on this device.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-600">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Try again
        </Button>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl border border-ink-200 px-4 font-semibold text-ink-900 hover:bg-ink-50">
          Back to home
        </Link>
      </div>
    </section>
  );
}
