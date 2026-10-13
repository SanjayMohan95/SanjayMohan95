'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, LocateFixed, MapPin, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { SAMPLE_POSTCODES } from '@/data';
import { isValidUkPostcodeFormat, normalisePostcode, validatePostcode } from '@/lib/postcode';
import { cn } from '@/lib/utils';
import { usePostcodeStore } from '@/store/postcode-store';
import type { PostcodeValidationResult } from '@/types';

interface PostcodeFormProps {
  /** Where to go on submit; null keeps the user on the page. */
  redirectTo?: string | null;
  size?: 'md' | 'lg';
  onValid?: (result: PostcodeValidationResult) => void;
  showSamples?: boolean;
  autoFocus?: boolean;
  tone?: 'light' | 'dark';
}

/**
 * UK postcode capture with progressive validation:
 * 1. Format is checked as you type (BS 7666 pattern).
 * 2. As soon as a complete, deliverable postcode is recognised it is
 *    committed to global state — unlocking browsing instantly.
 * 3. Submitting navigates to the restaurant directory.
 */
export function PostcodeForm({ redirectTo = '/restaurants', size = 'lg', onValid, showSamples = true, autoFocus, tone = 'light' }: PostcodeFormProps) {
  const router = useRouter();
  const storedPostcode = usePostcodeStore((s) => s.postcode);
  const submitPostcode = usePostcodeStore((s) => s.submitPostcode);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<PostcodeValidationResult | null>(null);
  const [touched, setTouched] = useState(false);
  const [locating, setLocating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (storedPostcode && !value) setValue(storedPostcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedPostcode]);

  const commit = (raw: string, viaSubmit: boolean) => {
    const r = submitPostcode(raw);
    setResult(r);
    if (r.status === 'valid') {
      onValid?.(r);
      if (viaSubmit && redirectTo) router.push(redirectTo);
    }
    return r;
  };

  const onChange = (raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 8);
    setValue(cleaned);
    if (isValidUkPostcodeFormat(cleaned)) {
      // Complete postcode — validate radius and unlock immediately.
      commit(cleaned, false);
      setTouched(true);
    } else {
      setResult(touched && cleaned.length >= 5 ? validatePostcode(cleaned) : null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const r = commit(value, true);
    if (r.status !== 'valid') inputRef.current?.focus();
  };

  const useMyLocation = () => {
    // Simulated reverse-geocode — a production build would call a geocoding API.
    setLocating(true);
    window.setTimeout(() => {
      setLocating(false);
      onChange('W1D 3QF');
    }, 900);
  };

  const status = result?.status;
  const isError = status === 'invalid_format' || status === 'out_of_range' || status === 'unknown_area';
  const isValid = status === 'valid';
  const big = size === 'lg';

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={`${id}-feedback`} className="w-full">
      <label htmlFor={id} className={cn('mb-2 block text-sm font-semibold', tone === 'dark' ? 'text-white' : 'text-ink-900')}>
        Enter your delivery postcode
      </label>
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border-2 bg-white p-1.5 shadow-card transition focus-within:ring-4',
          isError ? 'border-red-600 focus-within:ring-red-200' : isValid ? 'border-herb-600 focus-within:ring-herb-100' : 'border-white focus-within:border-brand-600 focus-within:ring-brand-200',
        )}
      >
        <MapPin className={cn('ml-2 shrink-0', big ? 'h-6 w-6' : 'h-5 w-5', isValid ? 'text-herb-700' : 'text-brand-700')} aria-hidden />
        <input
          ref={inputRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => value.length >= 2 && setTouched(true)}
          placeholder="e.g. SW1A 1AA"
          autoComplete="postal-code"
          inputMode="text"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-invalid={isError || undefined}
          className={cn('min-w-0 flex-1 bg-transparent font-semibold uppercase tracking-wide text-ink-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-400 focus:outline-none', big ? 'h-12 text-lg' : 'h-10 text-base')}
        />
        <button
          type="button"
          onClick={useMyLocation}
          className="hidden shrink-0 rounded-xl p-2.5 text-ink-700 transition hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 sm:inline-flex"
          aria-label="Use my current location"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <LocateFixed className="h-5 w-5" aria-hidden />}
        </button>
        <button
          type="submit"
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-700 font-bold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
            big ? 'h-12 px-5 text-base' : 'h-10 px-4 text-sm',
          )}
        >
          <span className="hidden sm:inline">{redirectTo ? 'Find food' : 'Save'}</span>
          <ArrowRight className="h-5 w-5" aria-hidden />
          <span className="sr-only sm:hidden">{redirectTo ? 'Find food' : 'Save postcode'}</span>
        </button>
      </div>

      <div id={`${id}-feedback`} aria-live="polite" className="min-h-[1.75rem]">
        <AnimatePresence mode="wait">
          {result && result.status !== 'idle' && (
            <motion.p
              key={result.status + result.message}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'mt-2 flex items-start gap-1.5 text-sm font-semibold',
                isValid ? (tone === 'dark' ? 'text-emerald-200' : 'text-herb-700') : tone === 'dark' ? 'text-red-200' : 'text-red-800',
              )}
            >
              {isValid ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
              <span>
                {result.message}
                {isValid && result.distanceMiles !== null && (
                  <span className="font-normal"> ({result.distanceMiles} mi from our nearest kitchen hub)</span>
                )}
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {showSamples && (
        <div className={cn('mt-1 flex flex-wrap items-center gap-2 text-sm', tone === 'dark' ? 'text-ink-100' : 'text-ink-600')}>
          <span>Try:</span>
          {SAMPLE_POSTCODES.slice(0, 4).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                'rounded-full px-2.5 py-1 font-semibold underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                tone === 'dark' ? 'bg-white/10 text-white' : 'bg-ink-50 text-ink-800',
              )}
            >
              {normalisePostcode(p)}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
