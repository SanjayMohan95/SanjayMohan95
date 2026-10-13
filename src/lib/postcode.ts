import { CORE_RADIUS_MILES, KITCHEN_HUBS, MAX_RADIUS_MILES, POSTCODE_AREAS } from '@/data/postcodes';
import type { PostcodeArea, PostcodeValidationResult } from '@/types';
import { haversineMiles } from './geo';

/**
 * Royal Mail PAF-compliant postcode pattern (BS 7666).
 * Covers all valid formats: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA, GIR 0AA.
 */
const UK_POSTCODE =
  /^(GIR ?0AA|[A-PR-UWYZ](?:\d{1,2}|[A-HK-Y]\d{1,2}|\d[A-HJKPSTUW]|[A-HK-Y]\d[ABEHMNPRV-Y]) ?\d[ABD-HJLNP-UW-Z]{2})$/;

const OUTCODE_ONLY = /^[A-PR-UWYZ](?:\d{1,2}|[A-HK-Y]\d{1,2}|\d[A-HJKPSTUW]|[A-HK-Y]\d[ABEHMNPRV-Y])$/;

const LONDON_PREFIXES = new Set(['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC']);

/** Uppercases, strips extraneous whitespace and inserts the canonical single space. */
export function normalisePostcode(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function isValidUkPostcodeFormat(raw: string): boolean {
  return UK_POSTCODE.test(normalisePostcode(raw));
}

/** Resolves an outward code to known coverage, falling back from sub-districts (SW1A → SW1). */
function lookupOutcode(outcode: string): PostcodeArea | null {
  if (POSTCODE_AREAS[outcode]) return POSTCODE_AREAS[outcode];
  const withoutSubDistrict = outcode.replace(/[A-Z]$/, '');
  if (withoutSubDistrict !== outcode && POSTCODE_AREAS[withoutSubDistrict]) {
    return POSTCODE_AREAS[withoutSubDistrict];
  }
  return null;
}

export function nearestHubDistance(area: PostcodeArea): { hubName: string; miles: number } {
  let best = { hubName: KITCHEN_HUBS[0].name, miles: Number.POSITIVE_INFINITY };
  for (const hub of KITCHEN_HUBS) {
    const miles = haversineMiles(area.coordinates, hub.coordinates);
    if (miles < best.miles) best = { hubName: hub.name, miles };
  }
  return best;
}

export function validatePostcode(raw: string): PostcodeValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { status: 'idle', normalised: null, area: null, distanceMiles: null, message: '' };
  }

  const normalised = normalisePostcode(trimmed);

  if (OUTCODE_ONLY.test(normalised.replace(' ', ''))) {
    return {
      status: 'invalid_format',
      normalised: null,
      area: null,
      distanceMiles: null,
      message: `Almost there — add the last 3 characters (e.g. ${normalised} 1AA).`,
    };
  }

  if (!UK_POSTCODE.test(normalised)) {
    return {
      status: 'invalid_format',
      normalised: null,
      area: null,
      distanceMiles: null,
      message: 'That doesn’t look like a UK postcode. Try a format like SW1A 1AA.',
    };
  }

  const outcode = normalised.split(' ')[0];
  const area = lookupOutcode(outcode);

  if (!area) {
    const prefix = outcode.match(/^[A-Z]+/)?.[0] ?? '';
    const inLondon = LONDON_PREFIXES.has(prefix);
    return {
      status: inLondon ? 'out_of_range' : 'unknown_area',
      normalised,
      area: null,
      distanceMiles: null,
      message: inLondon
        ? `We’re not delivering to ${outcode} just yet — our couriers are expanding across London weekly.`
        : `CraveOS isn’t live in ${outcode} yet. We currently deliver across central London.`,
    };
  }

  const { miles } = nearestHubDistance(area);
  const distanceMiles = Math.round(miles * 10) / 10;

  if (miles > MAX_RADIUS_MILES) {
    return {
      status: 'out_of_range',
      normalised,
      area: { ...area, zone: 'unserved' },
      distanceMiles,
      message: `${area.district}, ${area.city} is ${distanceMiles} miles from our nearest kitchen hub — outside our ${MAX_RADIUS_MILES}-mile delivery radius.`,
    };
  }

  const zone = miles <= CORE_RADIUS_MILES ? 'core' : 'extended';
  return {
    status: 'valid',
    normalised,
    area: { ...area, zone, baseTransitMin: Math.round(6 + miles * 4) },
    distanceMiles,
    message:
      zone === 'core'
        ? `Great news — we deliver to ${area.district}.`
        : `We deliver to ${area.district} (extended zone — a few spots may be out of reach).`,
  };
}
