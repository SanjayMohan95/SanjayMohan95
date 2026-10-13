'use client';

import { BellRing, DoorOpen, Hand, Home, Wand2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { TextArea, TextField } from '@/components/ui/form';
import { normalisePostcode, validatePostcode } from '@/lib/postcode';
import { cn } from '@/lib/utils';
import { required, validateEmail, validateName, validateUkMobile } from '@/lib/validation';
import { useOrderStore } from '@/store/order-store';
import { usePostcodeStore } from '@/store/postcode-store';
import type { DropOffPreference, FulfilmentMode, UserAddress } from '@/types';

const DROP_OFF: { id: DropOffPreference; label: string; description: string; icon: typeof BellRing }[] = [
  { id: 'ring_doorbell', label: 'Ring doorbell', description: 'Courier rings and waits', icon: BellRing },
  { id: 'leave_at_door', label: 'Leave at door', description: 'Contact-free safe drop', icon: DoorOpen },
  { id: 'hand_to_me', label: 'Hand it to me', description: 'I’ll meet the courier', icon: Hand },
];

type Errors = Partial<Record<'fullName' | 'email' | 'phone' | 'line1' | 'postcode', string | null>>;

export function StepContact({ fulfilment, onComplete }: { fulfilment: FulfilmentMode; onComplete: () => void }) {
  const checkout = useOrderStore((s) => s.checkout);
  const updateCheckout = useOrderStore((s) => s.updateCheckout);
  const prefill = useOrderStore((s) => s.prefillDemoCheckout);
  const savedAddresses = usePostcodeStore((s) => s.savedAddresses);
  const saveAddress = usePostcodeStore((s) => s.saveAddress);
  const activePostcode = usePostcodeStore((s) => s.postcode);
  const activeArea = usePostcodeStore((s) => s.area);
  const [errors, setErrors] = useState<Errors>({});
  const [saveForLater, setSaveForLater] = useState(true);

  const { contact, address } = checkout;
  const setContact = (patch: Partial<typeof contact>) => updateCheckout({ contact: { ...contact, ...patch } });
  const setAddress = (patch: Partial<UserAddress>) => updateCheckout({ address: { ...address, ...patch } });
  const postcodeValue = address.postcode || activePostcode || '';

  const validate = (): Errors => {
    const e: Errors = {
      fullName: validateName(contact.fullName),
      email: validateEmail(contact.email),
      phone: validateUkMobile(contact.phone),
    };
    if (fulfilment === 'delivery') {
      e.line1 = required(address.line1, 'the first line of your address');
      const pc = validatePostcode(postcodeValue);
      if (pc.status !== 'valid') e.postcode = pc.message || 'Enter a valid postcode.';
      else if (activeArea && pc.area?.outcode !== activeArea.outcode) {
        e.postcode = `This postcode is in ${pc.area?.district}. Your basket fees were calculated for ${activePostcode} — update your delivery location first.`;
      }
    }
    return e;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    const firstKey = (Object.keys(e) as (keyof Errors)[]).find((k) => e[k]);
    if (firstKey) {
      document.getElementById(`co-${firstKey}`)?.focus();
      return;
    }
    const finalAddress = { ...address, postcode: normalisePostcode(postcodeValue), coordinates: activeArea?.coordinates ?? address.coordinates };
    updateCheckout({ address: finalAddress });
    if (fulfilment === 'delivery' && saveForLater) {
      const { id: _ignored, ...rest } = finalAddress;
      const existing = savedAddresses.find((a) => a.line1 === rest.line1 && a.postcode === rest.postcode);
      saveAddress({ ...rest, id: existing?.id });
    }
    onComplete();
  };

  const blurValidate = (key: keyof Errors) => {
    if (errors[key] === undefined) return;
    setErrors((prev) => ({ ...prev, [key]: validate()[key] }));
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={prefill} className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-sm font-semibold text-ink-800 hover:bg-ink-100">
          <Wand2 className="h-4 w-4" aria-hidden /> Fill demo details
        </button>
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-bold text-ink-900">Contact</legend>
        <TextField id="co-fullName" label="Full name" autoComplete="name" value={contact.fullName} onChange={(e) => setContact({ fullName: e.target.value })} onBlur={() => blurValidate('fullName')} error={errors.fullName} className="sm:col-span-2" />
        <TextField id="co-email" label="Email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ email: e.target.value })} onBlur={() => blurValidate('email')} error={errors.email} hint="We’ll send your receipt and VAT invoice here." />
        <TextField id="co-phone" label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ phone: e.target.value })} onBlur={() => blurValidate('phone')} error={errors.phone} hint="Only shared with your courier, masked." />
      </fieldset>

      {fulfilment === 'delivery' && (
        <>
          {savedAddresses.length > 0 && (
            <fieldset>
              <legend className="mb-2 font-bold text-ink-900">Saved addresses</legend>
              <div className="flex flex-wrap gap-2">
                {savedAddresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => updateCheckout({ address: { ...a } })}
                    aria-pressed={address.line1 === a.line1 && address.postcode === a.postcode}
                    className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-left text-sm hover:border-ink-400 aria-pressed:border-ink-900 aria-pressed:bg-ink-50"
                  >
                    <Home className="h-4 w-4 text-brand-700" aria-hidden />
                    <span>
                      <span className="block font-semibold text-ink-900">{a.label}</span>
                      <span className="block text-ink-600">{a.line1}, {a.postcode}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-bold text-ink-900">Delivery address</legend>
            <TextField id="co-line1" label="Street address" autoComplete="address-line1" value={address.line1} onChange={(e) => setAddress({ line1: e.target.value })} onBlur={() => blurValidate('line1')} error={errors.line1} className="sm:col-span-2" />
            <TextField label="Apartment, suite or floor" optional autoComplete="address-line2" value={address.line2} onChange={(e) => setAddress({ line2: e.target.value })} placeholder="e.g. Flat 6, 2nd floor" />
            <TextField label="Address label" optional value={address.label} onChange={(e) => setAddress({ label: e.target.value })} placeholder="Home, Work…" />
            <TextField label="City" autoComplete="address-level2" value={address.city} onChange={(e) => setAddress({ city: e.target.value })} />
            <TextField
              id="co-postcode"
              label="Postcode"
              autoComplete="postal-code"
              value={postcodeValue}
              onChange={(e) => setAddress({ postcode: e.target.value.toUpperCase() })}
              onBlur={() => blurValidate('postcode')}
              error={errors.postcode}
              inputClassName="uppercase"
            />
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-bold text-ink-900">When the courier arrives</legend>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Drop-off preference">
              {DROP_OFF.map(({ id, label, description, icon: Icon }) => {
                const active = address.dropOff === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setAddress({ dropOff: id })}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300',
                      active ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400',
                    )}
                  >
                    <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', active ? 'text-brand-700' : 'text-ink-600')} aria-hidden />
                    <span>
                      <span className="block font-semibold text-ink-900">{label}</span>
                      <span className="block text-sm text-ink-600">{description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {address.dropOff === 'leave_at_door' && (
            <TextArea
              label="Safe-drop instructions"
              maxLength={120}
              value={address.safeDropInstructions}
              onChange={(e) => setAddress({ safeDropInstructions: e.target.value })}
              placeholder="e.g. Leave behind the blue planter, not visible from the street"
              hint="Your courier will photograph the drop for your records."
            />
          )}
          <TextArea
            label="Note for courier"
            optional
            maxLength={200}
            value={address.courierNote}
            onChange={(e) => setAddress({ courierNote: e.target.value })}
            placeholder="Gate code, which entrance, parking tips…"
          />
          <label className="flex items-center gap-3 text-sm font-semibold text-ink-900">
            <input type="checkbox" checked={saveForLater} onChange={(e) => setSaveForLater(e.target.checked)} className="h-5 w-5 rounded accent-brand-700" />
            Save this address for next time
          </label>
        </>
      )}

      <Button type="submit" size="lg" fullWidth>
        Continue to delivery time
      </Button>
    </form>
  );
}
