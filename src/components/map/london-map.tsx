'use client';

import { useMemo, type ReactNode } from 'react';
import { MAP_VIEWBOX, projectToMap } from '@/lib/geo';
import { cn } from '@/lib/utils';

const THAMES: [number, number][] = [
  [51.47, -0.24], [51.468, -0.21], [51.474, -0.195], [51.481, -0.18], [51.483, -0.165], [51.484, -0.15],
  [51.486, -0.135], [51.492, -0.124], [51.501, -0.122], [51.508, -0.117], [51.509, -0.1], [51.508, -0.085],
  [51.505, -0.07], [51.503, -0.055], [51.507, -0.04], [51.502, -0.025], [51.49, -0.015], [51.495, 0],
];

const PARKS: { name: string; lat: number; lng: number; rx: number; ry: number; rot?: number }[] = [
  { name: 'Hyde Park', lat: 51.508, lng: -0.165, rx: 48, ry: 26, rot: -8 },
  { name: 'Regent’s Park', lat: 51.527, lng: -0.153, rx: 34, ry: 30 },
  { name: 'Battersea Park', lat: 51.479, lng: -0.157, rx: 24, ry: 14 },
  { name: 'Victoria Park', lat: 51.536, lng: -0.04, rx: 30, ry: 16, rot: -20 },
  { name: 'Hampstead Heath', lat: 51.56, lng: -0.165, rx: 44, ry: 24 },
  { name: 'Clapham Common', lat: 51.46, lng: -0.146, rx: 22, ry: 14 },
];

const LABELS: { name: string; lat: number; lng: number }[] = [
  { name: 'SOHO', lat: 51.5138, lng: -0.1335 },
  { name: 'THE CITY', lat: 51.5145, lng: -0.09 },
  { name: 'SHOREDITCH', lat: 51.527, lng: -0.078 },
  { name: 'CAMDEN', lat: 51.541, lng: -0.143 },
  { name: 'ISLINGTON', lat: 51.538, lng: -0.103 },
  { name: 'HACKNEY', lat: 51.547, lng: -0.055 },
  { name: 'KENSINGTON', lat: 51.499, lng: -0.193 },
  { name: 'CHELSEA', lat: 51.487, lng: -0.168 },
  { name: 'SOUTHWARK', lat: 51.499, lng: -0.09 },
  { name: 'BATTERSEA', lat: 51.47, lng: -0.17 },
  { name: 'BRIXTON', lat: 51.462, lng: -0.115 },
  { name: 'CANARY WHARF', lat: 51.505, lng: -0.02 },
];

function polyline(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

/** Stylised, dependency-free vector map of central London. Children render in map coordinates. */
export function LondonMap({ children, className, label, showLabels = true }: { children?: ReactNode; className?: string; label: string; showLabels?: boolean }) {
  const river = useMemo(() => polyline(THAMES.map(([lat, lng]) => projectToMap({ lat, lng }))), []);
  const roads = useMemo(() => {
    const lines: string[] = [];
    for (let i = 1; i < 12; i++) {
      const x = (MAP_VIEWBOX.width / 12) * i + (i % 3) * 9;
      lines.push(`M ${x} 0 C ${x + 30} ${MAP_VIEWBOX.height * 0.3}, ${x - 30} ${MAP_VIEWBOX.height * 0.7}, ${x + 10} ${MAP_VIEWBOX.height}`);
    }
    for (let j = 1; j < 8; j++) {
      const y = (MAP_VIEWBOX.height / 8) * j + (j % 2) * 11;
      lines.push(`M 0 ${y} C ${MAP_VIEWBOX.width * 0.3} ${y - 24}, ${MAP_VIEWBOX.width * 0.7} ${y + 24}, ${MAP_VIEWBOX.width} ${y - 6}`);
    }
    return lines;
  }, []);

  return (
    <svg viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`} role="img" aria-label={label} className={cn('h-full w-full', className)} preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e7e2d8" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f3efe7" />
      <rect width="100%" height="100%" fill="url(#map-grid)" />
      {PARKS.map((p) => {
        const c = projectToMap(p);
        return <ellipse key={p.name} cx={c.x} cy={c.y} rx={p.rx} ry={p.ry} transform={`rotate(${p.rot ?? 0} ${c.x} ${c.y})`} fill="#cfe8c6" />;
      })}
      {roads.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#ffffff" strokeWidth={i % 4 === 0 ? 7 : 4} strokeLinecap="round" />
      ))}
      <path d={river} fill="none" stroke="#a9d2ec" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      <path d={river} fill="none" stroke="#bfe0f4" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      {showLabels &&
        LABELS.map((l) => {
          const p = projectToMap(l);
          return (
            <text key={l.name} x={p.x} y={p.y} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2" fill="#8a8578" aria-hidden>
              {l.name}
            </text>
          );
        })}
      {children}
    </svg>
  );
}
