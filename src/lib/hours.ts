import type { OpeningWindow } from '@/types';

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export interface OpenState {
  isOpen: boolean;
  /** "HH:MM" next opening time when closed, or closing time when open. */
  nextChange: string | null;
  todayLabel: string;
}

/** Handles windows that cross midnight (e.g. 12:00 → 02:00). */
export function getOpenState(hours: OpeningWindow[], now: Date = new Date()): OpenState {
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = hours.find((h) => h.day === day);
  const yesterday = hours.find((h) => h.day === (day + 6) % 7);

  if (yesterday) {
    const yOpen = toMinutes(yesterday.open);
    const yClose = toMinutes(yesterday.close);
    if (yClose <= yOpen && minutes < yClose) {
      return { isOpen: true, nextChange: yesterday.close, todayLabel: formatWindow(today) };
    }
  }

  if (today) {
    const open = toMinutes(today.open);
    let close = toMinutes(today.close);
    if (close <= open) close += 24 * 60;
    if (minutes >= open && minutes < close) {
      return { isOpen: true, nextChange: today.close, todayLabel: formatWindow(today) };
    }
    if (minutes < open) {
      return { isOpen: false, nextChange: today.open, todayLabel: formatWindow(today) };
    }
  }

  const tomorrow = hours.find((h) => h.day === (day + 1) % 7);
  return { isOpen: false, nextChange: tomorrow?.open ?? null, todayLabel: formatWindow(today) };
}

export function formatWindow(w?: OpeningWindow): string {
  if (!w) return 'Closed today';
  return `${w.open} – ${w.close === '24:00' ? 'midnight' : w.close}`;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
