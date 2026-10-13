'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type { CardScenario } from '@/lib/card';
import { formatMoney } from '@/lib/format';
import { sleep } from '@/lib/utils';
import type { ThreeDSecureOutcome } from '@/types';

export type ProcessingResult = { ok: true; threeDS: ThreeDSecureOutcome; riskScore: number } | { ok: false; reason: string };

type StageStatus = 'pending' | 'active' | 'done' | 'failed';
const OTP = '123456';

/**
 * Simulated PSP pipeline: tokenisation → fraud scoring → 3-D Secure (frictionless
 * or OTP challenge) → bank authorisation. Mirrors the UX of Stripe/Adyen SCA flows.
 */
export function SecureProcessing({
  open,
  amount,
  scenario,
  methodLabel,
  bankName,
  onDone,
}: {
  open: boolean;
  amount: number;
  scenario: CardScenario | 'wallet' | 'bnpl';
  methodLabel: string;
  bankName: string;
  onDone: (result: ProcessingResult) => void;
}) {
  const [stages, setStages] = useState<{ label: string; status: StageStatus; detail?: string }[]>([]);
  const [challenge, setChallenge] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const challengeResolver = useRef<((ok: boolean) => void) | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const riskScore = useRef(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const set = (i: number, status: StageStatus, detail?: string) =>
      !cancelled && setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, status, detail: detail ?? s.detail } : s)));

    const labels =
      scenario === 'wallet'
        ? ['Verifying device biometrics', 'Running fraud checks', 'Authorising payment']
        : scenario === 'bnpl'
          ? ['Connecting to provider', 'Soft credit check (no impact on score)', 'Confirming instalment plan']
          : ['Encrypting & tokenising card', 'Running fraud checks', '3-D Secure authentication', `Authorising with ${bankName}`];
    setStages(labels.map((label) => ({ label, status: 'pending' })));
    setChallenge(false);
    setOtp('');
    setOtpError(null);
    setAttempts(0);

    (async () => {
      set(0, 'active');
      await sleep(900);
      set(0, 'done');
      set(1, 'active');
      await sleep(1100);
      riskScore.current = Math.round(Math.random() * 18 + (scenario === 'challenge' ? 35 : 4));
      set(1, 'done', `Risk score ${riskScore.current}/100 · ${riskScore.current < 30 ? 'low' : 'elevated'}`);
      if (cancelled) return;

      if (scenario === 'wallet' || scenario === 'bnpl') {
        set(2, 'active');
        await sleep(900);
        set(2, 'done');
        await sleep(400);
        if (!cancelled) onDone({ ok: true, threeDS: 'not_required', riskScore: riskScore.current });
        return;
      }

      set(2, 'active');
      let threeDS: ThreeDSecureOutcome = 'frictionless';
      if (scenario === 'challenge') {
        await sleep(500);
        setChallenge(true);
        const passed = await new Promise<boolean>((resolve) => (challengeResolver.current = resolve));
        setChallenge(false);
        if (!passed) {
          set(2, 'failed', 'Authentication cancelled');
          await sleep(700);
          if (!cancelled) onDone({ ok: false, reason: 'Authentication was cancelled. You have not been charged.' });
          return;
        }
        threeDS = 'challenge_passed';
        set(2, 'done', 'Verified by your bank');
      } else {
        await sleep(800);
        set(2, 'done', 'Frictionless — no action needed');
      }

      set(3, 'active');
      await sleep(1000);
      if (scenario === 'declined') {
        set(3, 'failed', 'Do not honour (05)');
        await sleep(700);
        if (!cancelled) onDone({ ok: false, reason: `${bankName} declined this payment. Try another card or payment method — you have not been charged.` });
        return;
      }
      set(3, 'done', 'Approved');
      await sleep(500);
      if (!cancelled) onDone({ ok: true, threeDS, riskScore: riskScore.current });
    })();

    return () => {
      cancelled = true;
      challengeResolver.current?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (challenge) window.setTimeout(() => otpRef.current?.focus(), 50);
  }, [challenge]);

  const submitOtp = (e: FormEvent) => {
    e.preventDefault();
    if (otp === OTP) {
      challengeResolver.current?.(true);
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 3) {
      challengeResolver.current?.(false);
      return;
    }
    setOtpError(`Incorrect code. ${3 - next} attempt${3 - next === 1 ? '' : 's'} remaining.`);
    setOtp('');
  };

  return (
    <Dialog open={open} onClose={() => undefined} dismissible={false} title={challenge ? `${bankName} Secure` : 'Processing payment'} description={`${formatMoney(amount)} · ${methodLabel}`} size="sm">
      <div className="p-5 sm:p-6">
        {challenge ? (
          <form onSubmit={submitOtp} className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>
                Your bank needs to confirm it’s you. We’ve sent a one-time passcode to your phone ending <strong>••23</strong>.
                <span className="mt-1 block font-semibold">Demo code: {OTP}</span>
              </p>
            </div>
            <div>
              <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-ink-900">
                One-time passcode
              </label>
              <input
                ref={otpRef}
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setOtpError(null);
                }}
                aria-invalid={!!otpError || undefined}
                aria-describedby={otpError ? 'otp-err' : undefined}
                className="h-14 w-full rounded-xl border-2 border-ink-200 text-center font-mono text-2xl tracking-[0.5em] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
              {otpError && (
                <p id="otp-err" role="alert" className="mt-1.5 text-sm font-semibold text-red-800">
                  {otpError}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => challengeResolver.current?.(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={otp.length !== 6}>
                Verify
              </Button>
            </div>
          </form>
        ) : (
          <ol className="space-y-4" aria-live="polite">
            {stages.map((s) => (
              <motion.li key={s.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3">
                <span className="mt-0.5" aria-hidden>
                  {s.status === 'done' ? (
                    <CheckCircle2 className="h-5 w-5 text-herb-700" />
                  ) : s.status === 'failed' ? (
                    <XCircle className="h-5 w-5 text-red-700" />
                  ) : s.status === 'active' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand-700" />
                  ) : (
                    <span className="block h-5 w-5 rounded-full border-2 border-ink-200" />
                  )}
                </span>
                <span>
                  <span className={s.status === 'pending' ? 'text-ink-600' : 'font-semibold text-ink-900'}>{s.label}</span>
                  <span className="sr-only"> — {s.status}</span>
                  {s.detail && <span className="block text-sm text-ink-600">{s.detail}</span>}
                </span>
              </motion.li>
            ))}
          </ol>
        )}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-600">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> PCI-DSS Level 1 · 256-bit TLS · Strong Customer Authentication
        </p>
      </div>
    </Dialog>
  );
}
