const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UK_PHONE = /^(?:(?:\+44\s?|0044\s?)7\d{3}|07\d{3})\s?\d{3}\s?\d{3}$/;

export function validateName(v: string): string | null {
  if (v.trim().length < 2) return 'Enter your full name.';
  if (!/^[\p{L}' .-]+$/u.test(v.trim())) return 'Names can only contain letters, spaces, apostrophes and hyphens.';
  return null;
}

export function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Enter your email for the receipt.';
  return EMAIL.test(v.trim()) ? null : 'Enter a valid email, like name@example.com.';
}

export function validateUkMobile(v: string): string | null {
  if (!v.trim()) return 'Enter a mobile number so your courier can reach you.';
  return UK_PHONE.test(v.trim().replace(/[()-]/g, '')) ? null : 'Enter a UK mobile number, like 07700 900123.';
}

export function required(v: string, label: string): string | null {
  return v.trim() ? null : `Enter ${label}.`;
}
