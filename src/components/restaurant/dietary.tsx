import { Flame, Leaf, Sprout, WheatOff } from 'lucide-react';
import type { DietaryTag } from '@/types';
import { cn } from '@/lib/utils';

const META: Record<DietaryTag, { label: string; short: string; className: string }> = {
  vegan: { label: 'Vegan', short: 'VG', className: 'bg-herb-50 text-herb-700 ring-herb-100' },
  vegetarian: { label: 'Vegetarian', short: 'V', className: 'bg-lime-50 text-lime-900 ring-lime-200' },
  halal: { label: 'Halal', short: 'H', className: 'bg-sky-50 text-sky-900 ring-sky-200' },
  'gluten-free': { label: 'Gluten-free', short: 'GF', className: 'bg-amber-50 text-amber-900 ring-amber-200' },
  'nut-free': { label: 'Nut-free', short: 'NF', className: 'bg-violet-50 text-violet-900 ring-violet-200' },
};

export function DietaryTags({ tags, compact, className }: { tags: DietaryTag[]; compact?: boolean; className?: string }) {
  if (!tags.length) return null;
  // Vegan implies vegetarian — avoid redundant chips.
  const shown = tags.includes('vegan') ? tags.filter((t) => t !== 'vegetarian') : tags;
  return (
    <ul className={cn('flex flex-wrap gap-1', className)} aria-label="Dietary information">
      {shown.map((t) => (
        <li key={t} className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ring-1 ring-inset', META[t].className)} title={META[t].label}>
          {t === 'vegan' ? <Sprout className="h-3 w-3" aria-hidden /> : t === 'vegetarian' ? <Leaf className="h-3 w-3" aria-hidden /> : t === 'gluten-free' ? <WheatOff className="h-3 w-3" aria-hidden /> : null}
          {compact ? <><span aria-hidden>{META[t].short}</span><span className="sr-only">{META[t].label}</span></> : META[t].label}
        </li>
      ))}
    </ul>
  );
}

export function SpiceIndicator({ level }: { level?: 0 | 1 | 2 | 3 }) {
  if (!level) return null;
  const label = ['', 'Mild', 'Medium', 'Hot'][level];
  return (
    <span className="inline-flex items-center text-red-700" title={`${label} spice`}>
      {Array.from({ length: level }, (_, i) => (
        <Flame key={i} className="h-3.5 w-3.5 fill-red-600" aria-hidden />
      ))}
      <span className="sr-only">{label} spice</span>
    </span>
  );
}

export const ALLERGEN_LABEL: Record<string, string> = {
  gluten: 'Gluten',
  crustaceans: 'Crustaceans',
  eggs: 'Eggs',
  fish: 'Fish',
  peanuts: 'Peanuts',
  soya: 'Soya',
  milk: 'Milk',
  nuts: 'Tree nuts',
  celery: 'Celery',
  mustard: 'Mustard',
  sesame: 'Sesame',
  sulphites: 'Sulphites',
  lupin: 'Lupin',
  molluscs: 'Molluscs',
};
