import type { Cuisine, CuisineId } from '@/types';
import { IMG } from './images';

export const CUISINES: Cuisine[] = [
  {
    id: 'pizza',
    name: 'Neapolitan Pizza',
    shortName: 'Pizza',
    description: '72-hour fermented dough, 485°C wood-fired, leopard-spotted crusts.',
    image: IMG.pizzaMargherita,
    emoji: '🍕',
    accent: 'from-red-900/80 to-orange-800/40',
  },
  {
    id: 'burgers',
    name: 'Smash Burgers',
    shortName: 'Burgers',
    description: 'Lacy-edged dry-aged patties, potato buns, American cheese melt.',
    image: IMG.burgerClassic,
    emoji: '🍔',
    accent: 'from-amber-900/80 to-yellow-800/40',
  },
  {
    id: 'japanese',
    name: 'Japanese & Sushi',
    shortName: 'Sushi',
    description: 'Omakase-grade nigiri, hand rolls and slow-simmered tonkotsu.',
    image: IMG.sushiBoat,
    emoji: '🍣',
    accent: 'from-rose-900/80 to-pink-800/40',
  },
  {
    id: 'indian',
    name: 'Authentic Indian',
    shortName: 'Indian',
    description: 'Charcoal tandoor, dum biryani and regional curries from Delhi to Kerala.',
    image: IMG.curries,
    emoji: '🍛',
    accent: 'from-orange-900/80 to-amber-700/40',
  },
  {
    id: 'mexican',
    name: 'Mexican Birria',
    shortName: 'Mexican',
    description: 'Slow-braised birria, crispy quesatacos and dunkable consommé.',
    image: IMG.tacosRow,
    emoji: '🌮',
    accent: 'from-lime-900/80 to-emerald-800/40',
  },
  {
    id: 'thai',
    name: 'Thai Street Food',
    shortName: 'Thai',
    description: 'Wok-hei noodles, fiery som tam and Bangkok night-market classics.',
    image: IMG.padThai,
    emoji: '🍜',
    accent: 'from-emerald-900/80 to-teal-800/40',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    shortName: 'Mezze',
    description: 'Charcoal grills, whipped hummus, warm pide and bright mezze.',
    image: IMG.mixedGrill,
    emoji: '🥙',
    accent: 'from-sky-900/80 to-cyan-800/40',
  },
  {
    id: 'desserts',
    name: 'Artisan Desserts',
    shortName: 'Desserts',
    description: 'Small-batch gelato, patisserie and late-night sweet fixes.',
    image: IMG.doughnuts,
    emoji: '🍰',
    accent: 'from-fuchsia-900/80 to-pink-800/40',
  },
];

export const CUISINE_MAP: Record<CuisineId, Cuisine> = Object.fromEntries(
  CUISINES.map((c) => [c.id, c]),
) as Record<CuisineId, Cuisine>;
