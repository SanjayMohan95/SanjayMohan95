'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  success?: string | null;
  optional?: boolean;
  className?: string;
}

const inputBase =
  'block w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 transition focus:outline-none focus:ring-4 disabled:bg-ink-50';

function stateClasses(error?: string | null, success?: string | null) {
  if (error) return 'border-red-600 focus:border-red-700 focus:ring-red-200';
  if (success) return 'border-herb-600 focus:border-herb-700 focus:ring-herb-100';
  return 'border-ink-200 focus:border-brand-600 focus:ring-brand-100';
}

function Messages({ id, error, success, hint }: { id: string; error?: string | null; success?: string | null; hint?: ReactNode }) {
  return (
    <>
      {error ? (
        <p id={`${id}-msg`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : success ? (
        <p id={`${id}-msg`} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-herb-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {success}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="mt-1.5 text-sm text-ink-600">
          {hint}
        </p>
      ) : null}
    </>
  );
}

export const TextField = forwardRef<
  HTMLInputElement,
  FieldShellProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & { inputClassName?: string; trailing?: ReactNode }
>(function TextField({ label, hint, error, success, optional, className, inputClassName, trailing, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hasMsg = !!(error || success || hint);
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-ink-900">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-600">Optional</span>}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={hasMsg ? `${id}-msg` : undefined}
          className={cn(inputBase, stateClasses(error, success), trailing && 'pr-12', inputClassName)}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>}
      </div>
      <Messages id={id} error={error} success={success} hint={hint} />
    </div>
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  FieldShellProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & { maxLength: number; value: string }
>(function TextArea({ label, hint, error, success, optional, className, maxLength, value, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const remaining = maxLength - value.length;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-ink-900">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-600">Optional</span>}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={!!error || undefined}
        aria-describedby={`${id}-count ${hint || error ? `${id}-msg` : ''}`.trim()}
        className={cn(inputBase, stateClasses(error, success), 'min-h-[92px] resize-y')}
        {...props}
      />
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Messages id={id} error={error} success={success} hint={hint} />
        </div>
        <p
          id={`${id}-count`}
          aria-live={remaining <= 20 ? 'polite' : 'off'}
          className={cn('mt-1.5 shrink-0 text-xs tabular-nums', remaining <= 20 ? 'font-semibold text-brand-800' : 'text-ink-600')}
        >
          {value.length}/{maxLength}
          <span className="sr-only"> characters used</span>
        </p>
      </div>
    </div>
  );
});

export function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
  id: idProp,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  id?: string;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 gap-3">
        {icon && <div className="mt-0.5 shrink-0 text-ink-700">{icon}</div>}
        <div>
          <label htmlFor={id} className="cursor-pointer text-[15px] font-semibold text-ink-900">
            {label}
          </label>
          {description && (
            <p id={`${id}-desc`} className="text-sm text-ink-600">
              {description}
            </p>
          )}
        </div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
          checked ? 'bg-herb-600' : 'bg-ink-300',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}

export function Chip({
  pressed,
  onClick,
  children,
  icon,
  className,
  ...rest
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
        pressed ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-800 hover:border-ink-400',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
