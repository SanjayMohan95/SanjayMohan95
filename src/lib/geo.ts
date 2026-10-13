import type { Coordinates } from '@/types';

const EARTH_RADIUS_MILES = 3958.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in miles. */
export function haversineMiles(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** Road distance is typically ~1.3× crow-flies in dense urban grids. */
export function roadMiles(a: Coordinates, b: Coordinates): number {
  return Math.round(haversineMiles(a, b) * 1.3 * 10) / 10;
}

/** Bounding box of the simulated London map used by map views. */
export const MAP_BOUNDS = {
  north: 51.565,
  south: 51.455,
  west: -0.235,
  east: -0.005,
} as const;

export const MAP_VIEWBOX = { width: 1000, height: 640 } as const;

/** Equirectangular projection into the map SVG viewBox. */
export function projectToMap({ lat, lng }: Coordinates): { x: number; y: number } {
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * MAP_VIEWBOX.width;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * MAP_VIEWBOX.height;
  return {
    x: Math.max(12, Math.min(MAP_VIEWBOX.width - 12, x)),
    y: Math.max(12, Math.min(MAP_VIEWBOX.height - 12, y)),
  };
}

/**
 * Builds a believable street-grid route between two map points: an
 * orthogonal-ish polyline with a couple of jogs, smoothed into a path.
 */
export function buildRoutePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rand: () => number,
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const j1 = 0.25 + rand() * 0.2;
  const j2 = 0.55 + rand() * 0.2;
  const points = [
    from,
    { x: from.x + dx * j1, y: from.y },
    { x: from.x + dx * j1, y: from.y + dy * j1 + (rand() - 0.5) * 30 },
    { x: from.x + dx * j2, y: from.y + dy * j1 + (rand() - 0.5) * 30 },
    { x: from.x + dx * j2, y: from.y + dy * j2 },
    { x: to.x, y: from.y + dy * j2 },
    to,
  ];
  const r = 14;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y) || 1;
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y) || 1;
    const rin = Math.min(r, inLen / 2);
    const rout = Math.min(r, outLen / 2);
    const p1 = { x: cur.x - ((cur.x - prev.x) / inLen) * rin, y: cur.y - ((cur.y - prev.y) / inLen) * rin };
    const p2 = { x: cur.x + ((next.x - cur.x) / outLen) * rout, y: cur.y + ((next.y - cur.y) / outLen) * rout };
    d += ` L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${cur.x.toFixed(1)} ${cur.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}
