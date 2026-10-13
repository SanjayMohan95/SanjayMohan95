import type { Restaurant } from '@/types';

export interface ScheduleDay {
  date: string; // YYYY-MM-DD (local)
  label: string;
  slots: string[]; // "HH:MM–HH:MM"
}

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (mins: number) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;

/**
 * 30-minute delivery windows over the next `days` days, restricted to the
 * intersection of every basket restaurant's opening hours, starting no
 * sooner than `leadMinutes` from now.
 */
export function buildScheduleDays(restaurants: Restaurant[], now = new Date(), days = 7, leadMinutes = 45): ScheduleDay[] {
  const out: ScheduleDay[] = [];
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    day.setHours(0, 0, 0, 0);
    const weekday = day.getDay();

    let open = 0;
    let close = 24 * 60;
    for (const r of restaurants) {
      const w = r.openingHours.find((h) => h.day === weekday);
      if (!w) {
        close = -1;
        break;
      }
      const o = toMinutes(w.open);
      let c = toMinutes(w.close);
      if (c <= o) c = 24 * 60; // overnight windows: deliver up to midnight for scheduling simplicity
      open = Math.max(open, o + 30); // first slot once kitchen has warmed up
      close = Math.min(close, c - 15);
    }
    if (close <= open) continue;

    const earliest = offset === 0 ? now.getHours() * 60 + now.getMinutes() + leadMinutes : 0;
    const start = Math.ceil(Math.max(open, earliest) / 30) * 30;
    const slots: string[] = [];
    for (let m = start; m + 30 <= close; m += 30) slots.push(`${fmt(m)}–${fmt(m + 30)}`);
    if (!slots.length) continue;

    const label =
      offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    out.push({ date: toLocalDate(day), label, slots });
  }
  return out;
}
