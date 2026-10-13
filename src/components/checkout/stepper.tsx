import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CheckoutStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Checkout progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                done ? 'bg-herb-700 text-white' : active ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700',
              )}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              <span className="sr-only">{done ? ' (completed)' : active ? ' (current)' : ''}</span>
            </span>
            <span className={cn('hidden text-sm font-semibold sm:inline', active ? 'text-ink-900' : 'text-ink-600')}>{label}</span>
            {i < steps.length - 1 && <span className={cn('h-0.5 flex-1 rounded', done ? 'bg-herb-600' : 'bg-ink-200')} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
