'use client';

import { motion, useSpring } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LondonMap } from '@/components/map/london-map';
import { buildRoutePath, projectToMap } from '@/lib/geo';
import { seededRandom } from '@/lib/utils';
import type { Order } from '@/types';

/**
 * Simulated live map: the courier pin travels along an SVG street route from
 * the kitchen to the customer, positioned via getPointAtLength on each tick and
 * spring-smoothed between telemetry updates.
 */
export function LiveMap({ order, progress }: { order: Order; progress: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  const [heading, setHeading] = useState(0);
  const x = useSpring(0, { damping: 30, stiffness: 120 });
  const y = useSpring(0, { damping: 30, stiffness: 120 });

  const origin = order.restaurants[order.restaurants.length - 1]?.coordinates ?? order.address.coordinates;
  const from = projectToMap(origin);
  const to = projectToMap(order.address.coordinates);
  const route = useMemo(() => buildRoutePath(from, to, seededRandom(order.id)), [from.x, from.y, to.x, to.y, order.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const extraStops = order.restaurants.slice(0, -1).map((r) => ({ ...r, p: projectToMap(r.coordinates) }));

  useEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());
  }, [route]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !length) return;
    const atStart = order.status !== 'en_route' && order.status !== 'delivered';
    const dist = (atStart ? 0 : progress) * length;
    const p = path.getPointAtLength(dist);
    const ahead = path.getPointAtLength(Math.min(length, dist + 4));
    if (ahead.x !== p.x || ahead.y !== p.y) setHeading((Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180) / Math.PI);
    x.set(p.x);
    y.set(p.y);
  }, [progress, length, order.status, x, y]);

  const moving = order.status === 'en_route';
  const label =
    order.status === 'en_route'
      ? `Live map: courier is ${Math.round(progress * 100)}% of the way from ${order.restaurants[0]?.name} to your address`
      : `Map showing ${order.restaurants.map((r) => r.name).join(' and ')} and your delivery address`;

  return (
    <div className="relative aspect-[16/11] w-full overflow-hidden rounded-3xl border border-ink-100 bg-[#f3efe7] shadow-card sm:aspect-[16/10]">
      <LondonMap label={label} showLabels>
        <path ref={pathRef} d={route} fill="none" stroke="#141519" strokeOpacity={0.15} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path
          d={route}
          fill="none"
          stroke="#a12506"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={length || 1}
          strokeDashoffset={length ? length * (1 - (moving || order.status === 'delivered' ? progress : 0)) : 0}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {extraStops.map((s) => (
          <g key={s.id} aria-hidden>
            <circle cx={s.p.x} cy={s.p.y} r={10} fill="#fff" stroke="#141519" strokeWidth={3} />
            <text x={s.p.x} y={s.p.y - 16} textAnchor="middle" fontSize="11" fontWeight="700" fill="#141519">{s.name}</text>
          </g>
        ))}
        <g aria-hidden>
          <rect x={from.x - 14} y={from.y - 14} width={28} height={28} rx={8} fill="#141519" />
          <text x={from.x} y={from.y + 5} textAnchor="middle" fontSize="14">🍳</text>
          <text x={from.x} y={from.y - 22} textAnchor="middle" fontSize="12" fontWeight="800" fill="#141519">
            {order.restaurants[order.restaurants.length - 1]?.name}
          </text>
        </g>
        <g aria-hidden>
          <circle cx={to.x} cy={to.y} r={22} fill="#0a7d3c" opacity={0.15}>
            <animate attributeName="r" values="14;30;14" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={to.x} cy={to.y} r={11} fill="#0a7d3c" stroke="#fff" strokeWidth={3} />
          <text x={to.x} y={to.y + 28} textAnchor="middle" fontSize="12" fontWeight="800" fill="#141519">
            You
          </text>
        </g>
        {order.fulfilment === 'delivery' && (
          <motion.g style={{ x, y }} aria-hidden>
            <circle r={20} fill="#a12506" opacity={moving ? 0.18 : 0}>
              {moving && <animate attributeName="r" values="16;26;16" dur="1.4s" repeatCount="indefinite" />}
            </circle>
            <g transform={`rotate(${heading})`}>
              <circle r={14} fill="#fff" stroke="#a12506" strokeWidth={3} />
              <path d="M -5 -4 L 7 0 L -5 4 Z" fill="#a12506" />
            </g>
          </motion.g>
        )}
      </LondonMap>
      {order.fulfilment === 'delivery' && order.status !== 'en_route' && order.status !== 'delivered' && (
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-ink-900 shadow">
          {order.courier ? `${order.courier.name.split(' ')[0]} is heading to the kitchen` : 'Assigning the nearest courier…'}
        </div>
      )}
    </div>
  );
}
