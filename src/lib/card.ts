import type { CardBrand } from '@/types';

interface BrandRule {
  brand: CardBrand;
  label: string;
  pattern: RegExp;
  /** Digit grouping for display. */
  gaps: number[];
  lengths: number[];
  cvvLength: number;
}

/** IIN/BIN ranges — ordered most specific first. */
const RULES: BrandRule[] = [
  { brand: 'amex', label: 'American Express', pattern: /^3[47]/, gaps: [4, 10], lengths: [15], cvvLength: 4 },
  { brand: 'diners', label: 'Diners Club', pattern: /^3(0[0-5]|[689])/, gaps: [4, 10], lengths: [14, 16], cvvLength: 3 },
  { brand: 'jcb', label: 'JCB', pattern: /^35(2[89]|[3-8])/, gaps: [4, 8, 12], lengths: [16], cvvLength: 3 },
  { brand: 'discover', label: 'Discover', pattern: /^(6011|65|64[4-9]|622)/, gaps: [4, 8, 12], lengths: [16, 19], cvvLength: 3 },
  { brand: 'maestro', label: 'Maestro', pattern: /^(5018|5020|5038|5893|6304|6759|676[1-3])/, gaps: [4, 8, 12], lengths: [12, 13, 14, 15, 16, 17, 18, 19], cvvLength: 3 },
  { brand: 'mastercard', label: 'Mastercard', pattern: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/, gaps: [4, 8, 12], lengths: [16], cvvLength: 3 },
  { brand: 'visa', label: 'Visa', pattern: /^4/, gaps: [4, 8, 12], lengths: [13, 16, 19], cvvLength: 3 },
];

const UNKNOWN: BrandRule = { brand: 'unknown', label: 'Card', pattern: /.*/, gaps: [4, 8, 12], lengths: [16], cvvLength: 3 };

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function getBrandRule(number: string): BrandRule {
  const digits = digitsOnly(number);
  return RULES.find((r) => r.pattern.test(digits)) ?? UNKNOWN;
}

export function detectBrand(number: string): CardBrand {
  return getBrandRule(number).brand;
}

export function brandLabel(brand: CardBrand): string {
  return RULES.find((r) => r.brand === brand)?.label ?? 'Card';
}

export function maxCardLength(number: string): number {
  return Math.max(...getBrandRule(number).lengths);
}

export function formatCardNumber(value: string): string {
  const rule = getBrandRule(value);
  const digits = digitsOnly(value).slice(0, Math.max(...rule.lengths));
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (rule.gaps.includes(i)) out += ' ';
    out += digits[i];
  }
  return out;
}

export function luhnCheck(number: string): boolean {
  const digits = digitsOnly(number);
  if (digits.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(number: string): string | null {
  const digits = digitsOnly(number);
  if (!digits) return 'Enter your card number.';
  const rule = getBrandRule(digits);
  if (!rule.lengths.includes(digits.length)) return `${rule.label} numbers are ${rule.lengths.join(' or ')} digits.`;
  if (!luhnCheck(digits)) return 'That card number isn’t valid — please check it.';
  return null;
}

/** Formats raw input as "MM / YY". */
export function formatExpiry(value: string, previous = ''): string {
  let digits = digitsOnly(value).slice(0, 4);
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
  // Allow deleting the separator naturally.
  if (previous.endsWith(' / ') && value.length < previous.length) return digits.slice(0, 1);
  if (digits.length >= 2) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return digits;
}

export function parseExpiry(value: string): { month: number; year: number } | null {
  const digits = digitsOnly(value);
  if (digits.length !== 4) return null;
  return { month: Number(digits.slice(0, 2)), year: 2000 + Number(digits.slice(2)) };
}

export function validateExpiry(value: string, now: Date = new Date()): string | null {
  const parsed = parseExpiry(value);
  if (!parsed) return 'Enter the expiry as MM / YY.';
  if (parsed.month < 1 || parsed.month > 12) return 'Expiry month must be 01–12.';
  const endOfMonth = new Date(parsed.year, parsed.month, 0, 23, 59, 59);
  if (endOfMonth < now) return 'This card has expired.';
  if (parsed.year > now.getFullYear() + 20) return 'Expiry year looks too far ahead.';
  return null;
}

export function validateCvv(cvv: string, cardNumber: string): string | null {
  const expected = getBrandRule(cardNumber).cvvLength;
  const digits = digitsOnly(cvv);
  if (!digits) return 'Enter the security code.';
  if (digits.length !== expected) {
    return expected === 4 ? 'Amex security codes are 4 digits (front of card).' : 'Security code is 3 digits (back of card).';
  }
  return null;
}

/** Sandbox behaviours mirroring common PSP test cards. */
export const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  threeDS: '4000 0000 0000 3220',
  declined: '4000 0000 0000 0002',
  amex: '3782 822463 10005',
  mastercard: '5555 5555 5555 4444',
} as const;

export type CardScenario = 'frictionless' | 'challenge' | 'declined';

export function scenarioForCard(number: string, amountPence: number): CardScenario {
  const digits = digitsOnly(number);
  if (digits === digitsOnly(TEST_CARDS.declined)) return 'declined';
  if (digits === digitsOnly(TEST_CARDS.threeDS)) return 'challenge';
  // SCA: transactions above €50-equivalent are challenged by default unless exempt.
  if (amountPence > 4500) return 'challenge';
  return 'frictionless';
}
