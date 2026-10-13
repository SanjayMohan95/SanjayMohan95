'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { MenuCategory } from '@/types';

/** Sticky category tabs with scroll-spy: highlights the section in view and scrolls to it on click. */
export function CategoryNav({ categories, counts }: { categories: MenuCategory[]; counts: Record<string, number> }) {
  const [active, setActive] = useState(categories[0]?.id);
  const navRef = useRef<HTMLDivElement>(null);
  const clickLock = useRef(false);

  useEffect(() => {
    const sections = categories.map((c) => document.getElementById(`cat-${c.id}`)).filter((s): s is HTMLElement => !!s);
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickLock.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace('cat-', '') as MenuCategory['id']);
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    const btn = navRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const go = (id: MenuCategory['id']) => {
    setActive(id);
    clickLock.current = true;
    const el = document.getElementById(`cat-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    window.setTimeout(() => (clickLock.current = false), 800);
  };

  return (
    <nav aria-label="Menu categories" className="sticky top-16 z-30 -mx-4 border-b border-ink-100 bg-[#fbfaf8]/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div ref={navRef} className="no-scrollbar flex gap-1 overflow-x-auto py-2.5">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            data-cat={c.id}
            aria-current={active === c.id ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go(c.id);
            }}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
              active === c.id ? 'bg-ink-900 text-white' : 'text-ink-800 hover:bg-ink-100',
            )}
          >
            {c.name}
            <span className={cn('text-xs', active === c.id ? 'text-ink-200' : 'text-ink-600')}>{counts[c.id]}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
