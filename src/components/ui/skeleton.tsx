import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-xl bg-ink-100 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent motion-reduce:before:hidden',
        className,
      )}
    />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RestaurantGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading restaurants" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <RestaurantCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading restaurants…</span>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-28 w-28 shrink-0" />
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div role="status" aria-label="Loading menu" className="space-y-6">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <MenuItemSkeleton key={i} />
        ))}
      </div>
      <span className="sr-only">Loading menu…</span>
    </div>
  );
}

export function TrackingSkeleton() {
  return (
    <div role="status" aria-label="Loading live tracking" className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      <span className="sr-only">Loading live tracking…</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-5 w-1/2" />
      <RestaurantGridSkeleton />
    </div>
  );
}
