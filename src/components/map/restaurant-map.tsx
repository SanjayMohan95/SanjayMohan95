'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { CUISINE_MAP } from '@/data';
import { formatEta, formatMoney } from '@/lib/format';
import { MAP_VIEWBOX, projectToMap } from '@/lib/geo';
import type { PostcodeArea, RestaurantListing } from '@/types';
import { LondonMap } from './london-map';

/** Interactive pin map of restaurants delivering to the active postcode. */
export function RestaurantMap({
  listings,
  area,
  highlightedId,
  onHighlight,
}: {
  listings: RestaurantListing[];
  area: PostcodeArea;
  highlightedId: string | null;
  onHighlight: (id: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const home = projectToMap(area.coordinates);
  const active = listings.find((l) => l.id === (selected ?? highlightedId));
  const activePos = active ? projectToMap(active.coordinates) : null;

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-3xl border border-ink-100 bg-[#f3efe7] shadow-card">
      <LondonMap label={`Map of ${listings.length} restaurants delivering to ${area.district}`}>
        <g aria-hidden>
          <circle cx={home.x} cy={home.y} r={30} fill="#a12506" opacity={0.08}>
            <animate attributeName="r" values="18;42;18" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx={home.x} cy={home.y} r={9} fill="#141519" stroke="#fff" strokeWidth={3} />
          <text x={home.x} y={home.y + 26} textAnchor="middle" fontSize="12" fontWeight="800" fill="#141519">
            You · {area.outcode}
          </text>
        </g>
        {listings.map((l) => {
          const p = projectToMap(l.coordinates);
          const isActive = l.id === (selected ?? highlightedId);
          return (
            <g
              key={l.id}
              role="button"
              tabIndex={0}
              aria-label={`${l.name}, ${formatEta(l.etaRange)}, ${l.deliveryFee === 0 ? 'free delivery' : `${formatMoney(l.deliveryFee)} delivery`}`}
              aria-pressed={isActive}
              onClick={() => setSelected(l.id === selected ? null : l.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(l.id === selected ? null : l.id);
                }
              }}
              onMouseEnter={() => onHighlight(l.id)}
              onMouseLeave={() => onHighlight(null)}
              className="cursor-pointer focus:outline-none [&:focus-visible>circle:first-child]:stroke-brand-300"
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            >
              <circle cx={p.x} cy={p.y - 18} r={isActive ? 24 : 19} fill="transparent" stroke="transparent" strokeWidth={6} />
              <motion.g animate={{ scale: isActive ? 1.2 : 1, y: isActive ? -4 : 0 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
                <path
                  d={`M ${p.x} ${p.y} C ${p.x - 4} ${p.y - 8}, ${p.x - 16} ${p.y - 14}, ${p.x - 16} ${p.y - 24} A 16 16 0 1 1 ${p.x + 16} ${p.y - 24} C ${p.x + 16} ${p.y - 14}, ${p.x + 4} ${p.y - 8}, ${p.x} ${p.y} Z`}
                  fill={isActive ? '#a12506' : l.isOpen ? '#141519' : '#7b7f8a'}
                  stroke="#fff"
                  strokeWidth={2}
                />
                <text x={p.x} y={p.y - 19} textAnchor="middle" fontSize="15" aria-hidden>
                  {CUISINE_MAP[l.cuisine].emoji}
                </text>
              </motion.g>
            </g>
          );
        })}
      </LondonMap>

      {active && activePos && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 w-60 -translate-x-1/2 rounded-2xl bg-white p-3 shadow-lift"
          style={{
            left: `${Math.min(85, Math.max(15, (activePos.x / MAP_VIEWBOX.width) * 100))}%`,
            top: `${Math.min(70, (activePos.y / MAP_VIEWBOX.height) * 100 + 3)}%`,
          }}
        >
          <p className="font-bold text-ink-900">{active.name}</p>
          <p className="text-sm text-ink-600">
            ★ {active.rating.toFixed(1)} · {formatEta(active.etaRange)} · {active.distanceMiles.toFixed(1)} mi
          </p>
          <Link href={`/restaurant/${active.id}`} className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white hover:bg-brand-800">
            View menu
          </Link>
        </motion.div>
      )}
      <div className="absolute bottom-3 left-3 flex gap-3 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-ink-800 shadow">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-ink-900" aria-hidden /> Open</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-ink-400" aria-hidden /> Closed</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand-700" aria-hidden /> Selected</span>
      </div>
    </div>
  );
}
