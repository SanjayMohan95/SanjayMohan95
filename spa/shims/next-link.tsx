import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { useRouterStore } from './router';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; scroll?: boolean; replace?: boolean };

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, onClick, prefetch: _p, scroll: _s, replace, ...rest }, ref) {
  const navigate = useRouterStore((s) => s.navigate);
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href, replace);
  };
  return <a ref={ref} href={`#${href}`} onClick={handle} {...rest} />;
});

export default Link;
