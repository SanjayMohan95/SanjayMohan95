import type { ModifierGroup, ModifierOption } from '@/types';

/**
 * Reusable modifier group factories. Each returns a fresh object so
 * individual items can safely tweak options without shared mutation.
 */

const opt = (id: string, name: string, priceDelta = 0, extra: Partial<ModifierOption> = {}): ModifierOption => ({
  id,
  name,
  priceDelta,
  ...extra,
});

const single = (
  id: string,
  name: string,
  options: ModifierOption[],
  required = true,
  description?: string,
): ModifierGroup => ({
  id,
  name,
  description,
  selection: 'single',
  required,
  min: required ? 1 : 0,
  max: 1,
  options,
});

const multi = (
  id: string,
  name: string,
  options: ModifierOption[],
  max: number,
  description?: string,
  min = 0,
): ModifierGroup => ({
  id,
  name,
  description,
  selection: 'multiple',
  required: min > 0,
  min,
  max,
  options,
});

/* ── Pizza ── */
export const pizzaSize = () =>
  single('pizza-size', 'Choose your size', [
    opt('10', '10" Individual', 0, { isDefault: true }),
    opt('12', '12" Medium', 300),
    opt('14', '14" Sharing', 550),
  ]);

export const pizzaBase = () =>
  single('pizza-base', 'Dough', [
    opt('classic', 'Classic 72-hr sourdough', 0, { isDefault: true }),
    opt('wholemeal', 'Stoneground wholemeal', 100),
    opt('gf', 'Gluten-free base', 250, { dietary: ['gluten-free'] }),
  ]);

export const pizzaExtras = () =>
  multi(
    'pizza-extras',
    'Extra toppings',
    [
      opt('buffalo', 'Buffalo mozzarella', 250),
      opt('nduja', 'Spicy ’nduja', 200),
      opt('prosciutto', 'Prosciutto di Parma', 300),
      opt('truffle', 'Black truffle oil', 180),
      opt('hot-honey', 'Hot honey drizzle', 120),
      opt('olives', 'Gaeta olives', 90, { dietary: ['vegan'] }),
      opt('vegan-cheese', 'Cashew mozzarella', 200, { dietary: ['vegan'] }),
    ],
    5,
    'Up to 5',
  );

export const pizzaDips = () =>
  multi(
    'pizza-dips',
    'Crust dippers',
    [
      opt('garlic', 'Roasted garlic & herb', 95),
      opt('chilli-jam', 'Calabrian chilli jam', 95, { dietary: ['vegan'] }),
      opt('truffle-mayo', 'Truffle mayo', 120),
    ],
    3,
  );

/* ── Burgers ── */
export const burgerPatty = () =>
  single('burger-patty', 'Patty stack', [
    opt('single', 'Single smash', 0, { isDefault: true }),
    opt('double', 'Double smash', 300),
    opt('triple', 'Triple threat', 550),
  ]);

export const burgerTemp = () =>
  single(
    'burger-temp',
    'Patty temperature',
    [
      opt('medium', 'Medium (blushing pink)', 0, { isDefault: true }),
      opt('medium-well', 'Medium-well', 0),
      opt('well', 'Well done', 0),
    ],
    true,
    'Our dry-aged beef is minced in-house daily',
  );

export const burgerExtras = () =>
  multi(
    'burger-extras',
    'Load it up',
    [
      opt('halloumi', 'Extra halloumi', 250),
      opt('bacon', 'Smoked streaky bacon', 200),
      opt('cheese', 'Extra American cheese', 100),
      opt('jalapenos', 'Pickled jalapeños', 70, { dietary: ['vegan'] }),
      opt('egg', 'Fried free-range egg', 120),
      opt('onions', 'Crispy shallots', 80, { dietary: ['vegan'] }),
      opt('avocado', 'Smashed avocado', 150, { dietary: ['vegan'] }),
    ],
    6,
  );

export const burgerRemove = () =>
  multi(
    'burger-remove',
    'Hold the…',
    [opt('no-pickles', 'No pickles'), opt('no-onion', 'No onion'), opt('no-sauce', 'No house sauce'), opt('no-bun', 'Lettuce wrap (no bun)')],
    4,
  );

export const burgerMealSide = () =>
  single('meal-side', 'Make it a meal?', [
    opt('none', 'Just the burger', 0, { isDefault: true }),
    opt('fries', 'Meal: skin-on fries + drink', 450),
    opt('sweet', 'Meal: sweet potato fries + drink', 550),
    opt('rings', 'Meal: beer-battered onion rings + drink', 520),
  ]);

/* ── Spice / protein (pan-Asian & Indian) ── */
export const spiceLevel = (levels: 3 | 4 = 4) =>
  single(
    'spice-level',
    'Spice level',
    [
      opt('mild', 'Mild 🌶', 0, { isDefault: true }),
      opt('medium', 'Medium 🌶🌶', 0),
      opt('hot', 'Hot 🌶🌶🌶', 0),
      ...(levels === 4 ? [opt('fire', 'Desi fire 🔥 (we warned you)', 0)] : []),
    ],
  );

export const curryProtein = () =>
  single('protein', 'Choice of protein', [
    opt('chicken', 'Free-range chicken thigh', 0, { isDefault: true, dietary: ['halal'] }),
    opt('lamb', 'Welsh lamb shoulder', 200, { dietary: ['halal'] }),
    opt('paneer', 'Hand-pressed paneer', 0, { dietary: ['vegetarian'] }),
    opt('prawn', 'Tiger king prawns', 300),
    opt('veg', 'Seasonal vegetables', -100, { dietary: ['vegan'] }),
  ]);

export const curryAccompaniment = () =>
  multi(
    'accompaniment',
    'Rice & breads',
    [
      opt('pilau', 'Saffron pilau rice', 350, { dietary: ['vegan'] }),
      opt('basmati', 'Steamed basmati', 300, { dietary: ['vegan'] }),
      opt('naan', 'Butter naan', 325, { dietary: ['vegetarian'] }),
      opt('garlic-naan', 'Garlic & coriander naan', 375, { dietary: ['vegetarian'] }),
      opt('roti', 'Tandoori roti', 250, { dietary: ['vegan'] }),
    ],
    3,
  );

export const thaiProtein = () =>
  single('protein', 'Choice of protein', [
    opt('chicken', 'Chicken', 0, { isDefault: true }),
    opt('tofu', 'Crispy tofu', 0, { dietary: ['vegan'] }),
    opt('beef', 'Wok-seared beef', 150),
    opt('prawn', 'King prawns', 250),
    opt('duck', 'Crispy duck', 350),
  ]);

export const thaiSpice = () =>
  single('spice-level', 'Spice level', [
    opt('none', 'No chilli', 0),
    opt('mild', 'Mild 🌶', 0, { isDefault: true }),
    opt('medium', 'Medium 🌶🌶', 0),
    opt('thai-hot', 'Thai hot 🌶🌶🌶', 0),
  ]);

export const thaiExtras = () =>
  multi(
    'thai-extras',
    'Extras',
    [
      opt('egg', 'Crispy fried egg (kai dao)', 150),
      opt('peanuts', 'Extra crushed peanuts', 50),
      opt('jasmine', 'Jasmine rice', 300, { dietary: ['vegan'] }),
      opt('sticky', 'Sticky rice', 320, { dietary: ['vegan'] }),
    ],
    4,
  );

/* ── Japanese ── */
export const sushiPieces = () =>
  single('pieces', 'Portion', [
    opt('6', '6 pieces', 0, { isDefault: true }),
    opt('12', '12 pieces', 650),
  ]);

export const sushiCondiments = () =>
  multi(
    'condiments',
    'Condiments',
    [
      opt('wasabi', 'Fresh grated wasabi', 150),
      opt('ginger', 'Extra pickled ginger', 0),
      opt('spicy-mayo', 'Spicy kewpie mayo', 60),
      opt('unagi', 'Unagi glaze', 60),
      opt('tamari', 'Tamari (gluten-free soy)', 0, { dietary: ['gluten-free'] }),
    ],
    5,
  );

export const ramenBroth = () =>
  single('broth', 'Broth richness', [
    opt('light', 'Light', 0),
    opt('regular', 'Regular', 0, { isDefault: true }),
    opt('rich', 'Extra rich (kotteri)', 0),
  ]);

export const ramenNoodle = () =>
  single('noodle', 'Noodle firmness', [
    opt('soft', 'Soft (yawa)', 0),
    opt('regular', 'Regular (futsu)', 0, { isDefault: true }),
    opt('firm', 'Firm (kata)', 0),
  ]);

export const ramenToppings = () =>
  multi(
    'toppings',
    'Toppings',
    [
      opt('ajitama', 'Ajitama soy-marinated egg', 150),
      opt('chashu', 'Extra chashu pork belly', 300),
      opt('menma', 'Bamboo shoots', 100, { dietary: ['vegan'] }),
      opt('nori', 'Nori sheets', 60, { dietary: ['vegan'] }),
      opt('kaedama', 'Extra noodles (kaedama)', 200),
      opt('chilli-oil', 'Rayu chilli oil', 80, { dietary: ['vegan'] }),
    ],
    6,
  );

/* ── Mexican ── */
export const tacoProtein = () =>
  single('protein', 'Filling', [
    opt('birria', 'Birria de res (14-hr braised beef)', 0, { isDefault: true }),
    opt('tinga', 'Chicken tinga', 0, { dietary: ['halal'] }),
    opt('pastor', 'Mushroom al pastor', 0, { dietary: ['vegan'] }),
    opt('carnitas', 'Pork carnitas', 100),
  ]);

export const consommeSize = () =>
  single('consomme', 'Consommé for dunking', [
    opt('regular', 'Regular 4oz', 0, { isDefault: true }),
    opt('large', 'Large 8oz', 150),
    opt('none', 'No consommé', 0),
  ]);

export const salsas = () =>
  multi(
    'salsas',
    'Salsas',
    [
      opt('verde', 'Salsa verde', 0, { dietary: ['vegan'] }),
      opt('roja', 'Salsa roja', 0, { dietary: ['vegan'] }),
      opt('habanero', 'Habanero & mango 🔥', 50, { dietary: ['vegan'] }),
      opt('crema', 'Lime crema', 50),
      opt('guac', 'Guacamole', 150, { dietary: ['vegan'] }),
    ],
    3,
    'Choose up to 3',
  );

/* ── Mediterranean ── */
export const medProtein = () =>
  single('protein', 'Choice of protein', [
    opt('shawarma', 'Chicken shawarma', 0, { isDefault: true, dietary: ['halal'] }),
    opt('kofta', 'Lamb kofta', 150, { dietary: ['halal'] }),
    opt('falafel', 'Green falafel', -100, { dietary: ['vegan'] }),
    opt('halloumi', 'Grilled halloumi', 50, { dietary: ['vegetarian'] }),
  ]);

export const medBase = () =>
  single('base', 'Base', [
    opt('rice', 'Vermicelli rice', 0, { isDefault: true }),
    opt('salad', 'Fattoush salad', 0, { dietary: ['vegan'] }),
    opt('wrap', 'Warm saj wrap', 0),
    opt('bulgur', 'Herby bulgur', 0, { dietary: ['vegan'] }),
  ]);

export const medExtras = () =>
  multi(
    'med-extras',
    'Add mezze',
    [
      opt('halloumi', 'Extra halloumi', 250, { dietary: ['vegetarian'] }),
      opt('hummus', 'Whipped hummus', 150, { dietary: ['vegan'] }),
      opt('baba', 'Smoky baba ghanoush', 150, { dietary: ['vegan'] }),
      opt('toum', 'Toum garlic sauce', 80, { dietary: ['vegan'] }),
      opt('pickles', 'Pink pickled turnips', 50, { dietary: ['vegan'] }),
      opt('feta', 'Barrel-aged feta', 120, { dietary: ['vegetarian'] }),
    ],
    4,
  );

/* ── Desserts & drinks ── */
export const scoops = () =>
  single('scoops', 'Scoops', [
    opt('1', 'Single scoop', 0, { isDefault: true }),
    opt('2', 'Double scoop', 250),
    opt('3', 'Triple scoop', 450),
  ]);

export const gelatoFlavours = () =>
  multi(
    'flavours',
    'Flavours',
    [
      opt('pistachio', 'Sicilian pistachio', 0),
      opt('fior', 'Fior di latte', 0),
      opt('choc', '70% dark chocolate sorbet', 0, { dietary: ['vegan'] }),
      opt('hazelnut', 'Piedmont hazelnut', 0),
      opt('mango', 'Alphonso mango sorbet', 0, { dietary: ['vegan'] }),
      opt('caramel', 'Salted caramel', 0),
    ],
    3,
    'Pick 1–3',
    1,
  );

export const dessertToppings = () =>
  multi(
    'toppings',
    'Toppings',
    [
      opt('fudge', 'Hot fudge sauce', 80),
      opt('caramel', 'Salted caramel', 80),
      opt('pistachio', 'Pistachio crumb', 120),
      opt('berries', 'Fresh berries', 150, { dietary: ['vegan'] }),
      opt('cream', 'Chantilly cream', 90),
    ],
    3,
  );

export const drinkSize = () =>
  single('size', 'Size', [
    opt('can', '330ml', 0, { isDefault: true }),
    opt('bottle', '500ml', 70),
  ]);

export const drinkIce = () =>
  single('ice', 'Ice', [opt('ice', 'With ice', 0, { isDefault: true }), opt('no-ice', 'No ice', 0)], false);
