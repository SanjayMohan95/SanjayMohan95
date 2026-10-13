import { MenuSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <MenuSkeleton />
    </div>
  );
}
