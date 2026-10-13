import { useMemo } from 'react';
import { useRouterStore } from './router';

export function usePathname(): string {
  return useRouterStore((s) => s.path);
}

export function useSearchParams(): URLSearchParams {
  const search = useRouterStore((s) => s.search);
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useRouter() {
  const navigate = useRouterStore((s) => s.navigate);
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, true),
      back: () => navigate('/'),
      refresh: () => undefined,
      prefetch: () => undefined,
    }),
    [navigate],
  );
}

export class NotFoundError extends Error {}

export function notFound(): never {
  throw new NotFoundError('NEXT_NOT_FOUND');
}
