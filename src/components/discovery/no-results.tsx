import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export function NoResults({ onReset, query }: { onReset: () => void; query?: string }) {
  return (
    <EmptyState
      icon={<SearchX className="h-8 w-8" />}
      title={query ? `No matches for “${query}”` : 'No restaurants match those filters'}
      description="Try removing a filter or two — or widen your price range. New kitchens join CraveOS every week."
      action={<Button onClick={onReset}>Clear filters</Button>}
    />
  );
}
