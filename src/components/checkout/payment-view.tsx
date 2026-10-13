'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { TextField, Toggle } from '@/components/ui/form';
import {
  TEST_CARDS,
  brandLabel,
  detectBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  getBrandRule,
  parseExpiry,
  scenarioForCard,
  validateCardNumber,
  validateCvv,
  validateExpiry,
} from '@/lib/card';
import { formatMoney } from '@/lib/format';
import { validatePostcode } from '@/lib/postcode';
import { cn, uid } from '@/lib/utils';
import { required, validateName } from '@/lib/validation';
import { useActivePromo, useCartBreakdown, useCartStore } from '@/store/cart-store';
import { useOrderStore } from '@/store/order-store';
import { toast } from '@/store/ui-store';
import type { BillingAddress, PaymentMethodType, PaymentPayload, PaymentSummary } from '@/types';
import { CardPreview } from './card-preview';
import { CheckoutSummary } from './checkout-summary';
import { CheckoutStepper } from './stepper';
import { SecureProcessing, type ProcessingResult } from './secure-processing';

const METHODS: { id: PaymentMethodType; label: string; sub: string; icon: ReactNode }[] = [
  { id: 'apple_pay', label: 'Apple Pay', sub: 'Face ID / Touch ID', icon: <span className="rounded bg-ink-900 px-1 text-[10px] font-bold text-white" aria-hidden>Pay</span> },
  { id: 'google_pay', label: 'Google Pay', sub: 'Saved cards in Google', icon: <span className="font-black text-[#4285f4]" aria-hidden>G</span> },
  { id: 'card', label: 'Credit / debit card', sub: 'Visa, Mastercard, Amex, Maestro', icon: <CreditCard className="h-5 w-5" aria-hidden /> },
  { id: 'klarna', label: 'Klarna', sub: 'Pay in 3 interest-free', icon: <span className="rounded bg-[#ffb3c7] px-1 text-xs font-black text-ink-900" aria-hidden>K.</span> },
  { id: 'clearpay', label: 'Clearpay', sub: 'Pay in 4 interest-free', icon: <span className="rounded bg-[#b2fce4] px-1 text-xs font-black text-ink-900" aria-hidden>CP</span> },
];

const BANK_BY_BRAND: Record<string, string> = {
  visa: 'Barclays',
  mastercard: 'Monzo',
  amex: 'American Express',
  maestro: 'NatWest',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unknown: 'your bank',
};

type CardErrors = Partial<Record<'number' | 'expiry' | 'cvv' | 'name' | 'billingLine1' | 'billingPostcode', string | null>>;

export function PaymentView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const fulfilment = useCartStore((s) => s.fulfilment);
  const promoCode = useCartStore((s) => s.promoCode);
  const clearCart = useCartStore((s) => s.clearCart);
  const breakdown = useCartBreakdown();
  const promo = useActivePromo();
  const checkout = useOrderStore((s) => s.checkout);
  const placeOrder = useOrderStore((s) => s.placeOrder);
  const resetCheckout = useOrderStore((s) => s.resetCheckout);

  const [method, setMethod] = useState<PaymentMethodType>('card');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState(checkout.contact.fullName);
  const [cvvFocused, setCvvFocused] = useState(false);
  const [errors, setErrors] = useState<CardErrors>({});
  const [sameAsDelivery, setSameAsDelivery] = useState(fulfilment === 'delivery');
  const [billing, setBilling] = useState<BillingAddress>({ line1: '', line2: '', city: 'London', postcode: '', country: 'United Kingdom' });
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const ready = [0, 1, 2].every((s) => checkout.completedSteps.includes(s));
  useEffect(() => {
    if (!ready) router.replace('/checkout');
  }, [ready, router]);

  const brand = detectBrand(number);
  const rule = getBrandRule(number);
  const bankName = BANK_BY_BRAND[brand];
  const instalments = method === 'klarna' ? 3 : method === 'clearpay' ? 4 : 0;
  const scenario = useMemo(() => {
    if (method === 'apple_pay' || method === 'google_pay') return 'wallet' as const;
    if (method === 'klarna' || method === 'clearpay') return 'bnpl' as const;
    return scenarioForCard(number, breakdown.total);
  }, [method, number, breakdown.total]);

  const bnplUnavailable = instalments > 0 && (breakdown.total < 1000 || breakdown.total > 100000);

  const validateCard = (): CardErrors => {
    const e: CardErrors = {
      number: validateCardNumber(number),
      expiry: validateExpiry(expiry),
      cvv: validateCvv(cvv, number),
      name: validateName(name),
    };
    if (!sameAsDelivery) {
      e.billingLine1 = required(billing.line1, 'the billing address');
      const pc = validatePostcode(billing.postcode);
      e.billingPostcode = pc.status === 'invalid_format' || pc.status === 'idle' ? pc.message || 'Enter a postcode.' : null;
    }
    return e;
  };

  const blur = (key: keyof CardErrors) => {
    if (errors[key] === undefined && !(key === 'number' && number.length > 4)) return;
    setErrors((p) => ({ ...p, [key]: validateCard()[key] }));
  };

  const pay = (e?: FormEvent) => {
    e?.preventDefault();
    setPaymentError(null);
    if (method === 'card') {
      const errs = validateCard();
      setErrors(errs);
      const first = (Object.keys(errs) as (keyof CardErrors)[]).find((k) => errs[k]);
      if (first) {
        document.getElementById(`pay-${first}`)?.focus();
        return;
      }
    }
    if (bnplUnavailable) {
      setPaymentError(`${method === 'klarna' ? 'Klarna' : 'Clearpay'} is available on orders between £10 and £1,000.`);
      return;
    }
    setProcessing(true);
  };

  const onProcessed = (result: ProcessingResult) => {
    setProcessing(false);
    if (!result.ok) {
      setPaymentError(result.reason);
      return;
    }
    const delivery = checkout.address;
    const billingAddress: BillingAddress = sameAsDelivery
      ? { line1: delivery.line1, line2: delivery.line2, city: delivery.city, postcode: delivery.postcode, country: 'United Kingdom' }
      : billing;
    const exp = parseExpiry(expiry);
    // The payload a real integration would POST to the payments API. Raw PAN/CVV never leave the form.
    const payload: PaymentPayload = {
      idempotencyKey: uid('idem_'),
      method,
      amount: breakdown.total,
      currency: 'GBP',
      card:
        method === 'card' && exp
          ? { brand, last4: digitsOnly(number).slice(-4), expMonth: exp.month, expYear: exp.year, holderName: name.trim(), token: uid('tok_') }
          : undefined,
      billingAddress,
      billingSameAsDelivery: sameAsDelivery,
      threeDSecure: result.threeDS,
      riskScore: result.riskScore,
      instalments: instalments || undefined,
    };
    const summary: PaymentSummary =
      payload.method === 'card' && payload.card
        ? { method: 'card', label: `${brandLabel(payload.card.brand)} •••• ${payload.card.last4}`, last4: payload.card.last4, brand: payload.card.brand }
        : { method: payload.method, label: METHODS.find((m) => m.id === payload.method)!.label + (instalments ? ` — Pay in ${instalments}` : '') };

    const order = placeOrder({ items, breakdown, fulfilment, payment: summary, promoCode });
    clearCart();
    resetCheckout();
    toast({ title: 'Order confirmed!', description: `${order.shortCode} · ${formatMoney(order.breakdown.total)} paid`, tone: 'success' });
    router.push(`/order/${order.id}/tracking`);
  };

  if (!ready) return null;

  const methodLabel = method === 'card' ? `${brandLabel(brand)}${digitsOnly(number).length >= 4 ? ` •••• ${digitsOnly(number).slice(-4)}` : ''}` : METHODS.find((m) => m.id === method)!.label;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/checkout" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to details
      </Link>
      <h1 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">Payment</h1>
      <div className="mt-6 max-w-2xl">
        <CheckoutStepper steps={['Contact & delivery', 'Delivery time', 'Cutlery', 'Payment']} current={3} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={pay} noValidate className="space-y-6">
          <fieldset className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
            <legend className="sr-only">Payment method</legend>
            <h2 className="font-display text-lg font-bold text-ink-900" aria-hidden>
              Payment method
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setMethod(m.id);
                      setPaymentError(null);
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                      active ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400',
                      m.id === 'card' && 'sm:col-span-2',
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-ink-900 shadow-sm ring-1 ring-ink-100">{m.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink-900">{m.label}</span>
                      <span className="block text-sm text-ink-600">{m.sub}</span>
                    </span>
                    <span className={cn('h-5 w-5 shrink-0 rounded-full border-2', active ? 'border-[6px] border-ink-900' : 'border-ink-300')} aria-hidden />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <AnimatePresence mode="wait">
            {method === 'card' && (
              <motion.section key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-label="Card details" className="space-y-6 rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
                <CardPreview number={formatCardNumber(number)} name={name} expiry={expiry} cvv={cvv} brand={brand} flipped={cvvFocused} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="pay-number"
                    label="Card number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={formatCardNumber(number)}
                    onChange={(e) => {
                      setNumber(digitsOnly(e.target.value));
                      if (errors.number) setErrors((p) => ({ ...p, number: null }));
                    }}
                    onBlur={() => blur('number')}
                    placeholder="1234 1234 1234 1234"
                    error={errors.number}
                    className="sm:col-span-2"
                    inputClassName="font-mono tracking-wider"
                    trailing={
                      <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-bold', brand === 'unknown' ? 'text-ink-600' : 'bg-ink-900 text-white')}>
                        {brand === 'unknown' ? <CreditCard className="h-5 w-5" aria-hidden /> : brandLabel(brand)}
                      </span>
                    }
                  />
                  <TextField
                    id="pay-expiry"
                    label="Expiry date"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value, expiry))}
                    onBlur={() => blur('expiry')}
                    placeholder="MM / YY"
                    error={errors.expiry}
                    inputClassName="font-mono"
                  />
                  <TextField
                    id="pay-cvv"
                    label={`Security code (${rule.cvvLength} digits)`}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    type="password"
                    value={cvv}
                    maxLength={rule.cvvLength}
                    onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, rule.cvvLength))}
                    onFocus={() => setCvvFocused(true)}
                    onBlur={() => {
                      setCvvFocused(false);
                      blur('cvv');
                    }}
                    placeholder={brand === 'amex' ? '4 digits' : '3 digits'}
                    error={errors.cvv}
                    hint={brand === 'amex' ? 'On the front of your Amex' : 'On the back of your card'}
                    inputClassName="font-mono"
                  />
                  <TextField
                    id="pay-name"
                    label="Name on card"
                    autoComplete="cc-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => blur('name')}
                    error={errors.name}
                    className="sm:col-span-2"
                  />
                </div>
                <details className="rounded-xl bg-ink-50 p-3 text-sm text-ink-700">
                  <summary className="cursor-pointer font-semibold text-ink-900">Sandbox test cards</summary>
                  <ul className="mt-2 space-y-1.5">
                    {(
                      [
                        ['Success (frictionless)', TEST_CARDS.success],
                        ['3-D Secure challenge', TEST_CARDS.threeDS],
                        ['Declined', TEST_CARDS.declined],
                        ['Amex (4-digit CVV)', TEST_CARDS.amex],
                        ['Mastercard', TEST_CARDS.mastercard],
                      ] as const
                    ).map(([label, num]) => (
                      <li key={num} className="flex items-center justify-between gap-2">
                        <span>{label}</span>
                        <button type="button" className="rounded-md bg-white px-2 py-1 font-mono text-xs font-semibold text-ink-900 ring-1 ring-ink-200 hover:ring-ink-400" onClick={() => { setNumber(digitsOnly(num)); setExpiry('12 / 29'); setErrors({}); }}>
                          {num}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs">Orders over £45 trigger an SCA challenge. Use any future expiry and any CVV.</p>
                </details>
              </motion.section>
            )}
            {(method === 'apple_pay' || method === 'google_pay') && (
              <motion.section key="wallet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-4 rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
                <Smartphone className="mt-1 h-6 w-6 shrink-0 text-ink-700" aria-hidden />
                <div>
                  <h2 className="font-bold text-ink-900">{method === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}</h2>
                  <p className="mt-1 text-sm text-ink-600">You’ll confirm with your device’s biometrics. Card details are never shared with the restaurant.</p>
                </div>
              </motion.section>
            )}
            {(method === 'klarna' || method === 'clearpay') && (
              <motion.section key="bnpl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
                <h2 className="font-bold text-ink-900">
                  {instalments} interest-free payments of {formatMoney(Math.ceil(breakdown.total / instalments))}
                </h2>
                <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: instalments }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i * (method === 'klarna' ? 30 : 14));
                    return (
                      <li key={i} className="rounded-xl bg-ink-50 p-3 text-center">
                        <p className="text-xs font-semibold text-ink-600">{i === 0 ? 'Today' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                        <p className="font-bold tabular-nums text-ink-900">{formatMoney(i === instalments - 1 ? breakdown.total - Math.ceil(breakdown.total / instalments) * (instalments - 1) : Math.ceil(breakdown.total / instalments))}</p>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-xs text-ink-600">
                  Borrowing more than you can afford or paying late may affect your financial status. 18+, UK residents only. T&Cs apply.
                </p>
              </motion.section>
            )}
          </AnimatePresence>

          <section aria-label="Billing address" className="space-y-4 rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
            {fulfilment === 'delivery' ? (
              <Toggle
                checked={sameAsDelivery}
                onChange={setSameAsDelivery}
                label="Billing address same as delivery"
                description={sameAsDelivery ? [checkout.address.line2, checkout.address.line1, checkout.address.postcode].filter(Boolean).join(', ') : 'Enter the address registered with your card'}
              />
            ) : (
              <h2 className="font-bold text-ink-900">Billing address</h2>
            )}
            <AnimatePresence initial={false}>
              {!sameAsDelivery && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid gap-4 pt-1 sm:grid-cols-2">
                    <TextField id="pay-billingLine1" label="Address line 1" autoComplete="billing address-line1" value={billing.line1} onChange={(e) => setBilling({ ...billing, line1: e.target.value })} error={errors.billingLine1} className="sm:col-span-2" />
                    <TextField label="Address line 2" optional autoComplete="billing address-line2" value={billing.line2} onChange={(e) => setBilling({ ...billing, line2: e.target.value })} className="sm:col-span-2" />
                    <TextField label="City" autoComplete="billing address-level2" value={billing.city} onChange={(e) => setBilling({ ...billing, city: e.target.value })} />
                    <TextField id="pay-billingPostcode" label="Postcode" autoComplete="billing postal-code" value={billing.postcode} onChange={(e) => setBilling({ ...billing, postcode: e.target.value.toUpperCase() })} error={errors.billingPostcode} inputClassName="uppercase" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {paymentError && (
            <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">
              {paymentError}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth variant={method === 'apple_pay' ? 'dark' : 'primary'} className="justify-between" disabled={processing}>
            <span className="flex items-center gap-2">
              <Lock className="h-5 w-5" aria-hidden />
              {method === 'apple_pay' ? 'Pay with Apple Pay' : method === 'google_pay' ? 'Pay with Google Pay' : instalments ? `Continue with ${method === 'klarna' ? 'Klarna' : 'Clearpay'}` : 'Pay securely'}
            </span>
            <span className="tabular-nums">{formatMoney(breakdown.total)}</span>
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-600">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Simulated payment — no real money moves. Protected by 3-D Secure 2 and fraud screening.
          </p>
        </form>
        <CheckoutSummary />
      </div>

      <SecureProcessing open={processing} amount={breakdown.total} scenario={scenario} methodLabel={methodLabel} bankName={bankName} onDone={onProcessed} />
      {promo && <span className="sr-only">Promo {promo.code} applied</span>}
    </div>
  );
}
