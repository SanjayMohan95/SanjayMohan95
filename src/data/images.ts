/** Curated, verified Unsplash photography. Sizes are requested via query params. */
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const IMG = {
  // Pizza
  pizzaRustic: u('1513104890138-7c749659a591'),
  pizzaMargherita: u('1574071318508-1cdbab80d002'),
  pizzaLoaded: u('1565299624946-b28f40a0ae38'),
  pizzaSlices: u('1590947132387-155cc02f3212'),
  pizzaCheesePull: u('1593504049359-74330189a345'),
  // Burgers
  burgerClassic: u('1568901346375-23c9450c58cd'),
  burgerDuo: u('1550547660-d9450f859349'),
  burgerStacked: u('1571091718767-18b5b1457add'),
  burgerAndFries: u('1594212699903-ec8a3eca50f5'),
  burgerBacon: u('1586190848861-99aa4a171e90'),
  burgerChicken: u('1606755962773-d324e0a13086'),
  fries: u('1576107232684-1279f390859f'),
  chickenTenders: u('1562967914-608f82629710'),
  // Japanese
  sushiRolls: u('1579871494447-9811cf80d66c'),
  sushiBoat: u('1553621042-f6e147245754'),
  sushiNigiriPlate: u('1617196034796-73dfa7b1fd56'),
  sushiPlatter: u('1611143669185-af224c5e3252'),
  nigiriSalmon: u('1615361200141-f45040f367be'),
  noodles: u('1585032226651-759b368d7246'),
  gyoza: u('1534422298391-e4f8c172dddb'),
  ramenBowl: u('1617093727343-374698b1b08d'),
  // Indian
  curries: u('1585937421612-70a008356fbe'),
  curryNaan: u('1565557623262-b51c2513a641'),
  biryani: u('1631515243349-e0cb75fb8d3a'),
  samosas: u('1601050690597-df0568f70950'),
  tandooriChicken: u('1626074353765-517a681e40be'),
  tandooriPlatter: u('1617692855027-33b14f061079'),
  paneerTikka: u('1604908176997-125f25cc6f3d'),
  paneerCurryRice: u('1588166524941-3bf61a9c41db'),
  // Mexican
  tacosRow: u('1565299585323-38d6b0865b47'),
  tacosPlate: u('1551504734-5ee1c4a1479b'),
  // Thai
  padThai: u('1559314809-0d155014e29e'),
  thaiSpread: u('1562565652-a0d8f0c59eb4'),
  laksa: u('1607330289024-1535c6b4e1c1'),
  prawnCurry: u('1559847844-5315695dadae'),
  friedRice: u('1603133872878-684f208fb84b'),
  // Mediterranean
  shawarma: u('1529006557810-274b9b2fc783'),
  mixedGrill: u('1555939594-58d7cb561ad1'),
  skewers: u('1599487488170-d11ec9c172f0'),
  kofta: u('1529042410759-befb1204b468'),
  greekSalad: u('1625944230945-1b7dd3b949ab'),
  wraps: u('1626700051175-6818013e1d4f'),
  ribs: u('1544025162-d76694265947'),
  // Bowls & salads
  saladBowl: u('1546069901-ba9599a7e63c'),
  buddhaBowl: u('1512621776951-a57141f2eefd'),
  greenSalad: u('1540189549336-e6e99c3679fe'),
  berrySalad: u('1505253716362-afaea1d3d1af'),
  // Desserts
  doughnuts: u('1551024601-bec78aea704b'),
  pannaCotta: u('1488477181946-6428a0291777'),
  freakshake: u('1563805042-7684c019e1cb'),
  brownie: u('1606313564200-e75d5e30476c'),
  cupcakes: u('1563729784474-d77dbb933a9e'),
  cookies: u('1499636136210-6f4ee915583e'),
  figDessert: u('1544510808-91bcbee1df55'),
  pancakes: u('1567620905732-2d1ec7ab7445'),
  // Drinks
  orangeJuice: u('1600271886742-f049cd451bba'),
  pinkLemonade: u('1497534446932-c925b458314e'),
  cocktails: u('1544145945-f90425340c7e'),
  // Scenes
  tableSpread: u('1504674900247-0877df9cc836'),
  restaurantInterior: u('1414235077428-338989a2e8c0'),
} as const;

export function sized(src: string, width: number, height?: number): string {
  const params = new URLSearchParams({ w: String(width), q: '75', auto: 'format' });
  if (height) {
    params.set('h', String(height));
    params.set('fit', 'crop');
  }
  return `${src}?${params.toString()}`;
}
