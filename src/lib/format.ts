import type { Pence, PriceTier } from '@/types';

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export function formatMoney(pence: Pence): string {
  return gbp.format(pence / 100);
}

/** "+£2.50" / "−£1.00" / "" for zero — used on modifier options. */
export function formatDelta(pence: Pence): string {
  if (pence === 0) return '';
  const sign = pence > 0 ? '+' : '−';
  return `${sign}${gbp.format(Math.abs(pence) / 100)}`;
}

export function formatPriceTier(tier: PriceTier): string {
  return '£'.repeat(tier);
}

export function formatMiles(miles: number): string {
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

export function formatEta([min, max]: [number, number]): string {
  return `${min}–${max} min`;
}

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const longDateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatTime(iso: string | Date): string {
  return timeFmt.format(typeof iso === 'string' ? new Date(iso) : iso);
}

export function formatDate(iso: string | Date): string {
  return dateFmt.format(typeof iso === 'string' ? new Date(iso) : iso);
}

export function formatLongDate(iso: string | Date): string {
  return longDateFmt.format(typeof iso === 'string' ? new Date(iso) : iso);
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diffSec = Math.round((now - new Date(iso).getTime()) / 1000);
  if (diffSec < 45) return 'just now';
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}
