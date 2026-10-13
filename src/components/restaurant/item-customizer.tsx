'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, Info } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { TextArea } from '@/components/ui/form';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { SmartImage } from '@/components/ui/smart-image';
import { formatDelta, formatMoney } from '@/lib/format';
import { defaultModifiers } from '@/lib/order-factory';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useStock } from '@/store/merchant-store';
import { toast } from '@/store/ui-store';
import type { CartItem, MenuItem, ModifierGroup, SelectedModifier } from '@/types';
import { ALLERGEN_LABEL, DietaryTags, SpiceIndicator } from './dietary';

export const INSTRUCTIONS_MAX = 160;

type Selections = Record<string, string[]>;

function toSelections(mods: SelectedModifier[]): Selections {
  return mods.reduce<Selections>((acc, m) => {
    acc[m.groupId] = [...(acc[m.groupId] ?? []), m.optionId];
    return acc;
  }, {});
}

function groupError(group: ModifierGroup, chosen: string[]): string | null {
  if (chosen.length < group.min) {
    return group.selection === 'single' ? 'Please choose one option.' : `Choose at least ${group.min}.`;
  }
  if (chosen.length > group.max) return `Choose up to ${group.max}.`;
  return null;
}

export interface ItemCustomizerProps {
  item: MenuItem | null;
  restaurantName: string;
  open: boolean;
  onClose: () => void;
  /** When present, edits this cart line instead of adding a new one. */
  editLine?: CartItem | null;
}

export function ItemCustomizer({ item, restaurantName, open, onClose, editLine }: ItemCustomizerProps) {
  const addItem = useCartStore((s) => s.addItem);
  const updateLine = useCartStore((s) => s.updateLine);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { isItemAvailable, isOptionAvailable } = useStock();

  const [selections, setSelections] = useState<Selections>({});
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const groupRefs = useRef<Record<string, HTMLFieldSetElement | null>>({});

  useEffect(() => {
    if (!item || !open) return;
    if (editLine) {
      setSelections(toSelections(editLine.modifiers));
      setQuantity(editLine.quantity);
      setInstructions(editLine.specialInstructions);
    } else {
      // Pre-select defaults, skipping any the kitchen has 86'd.
      const defaults = defaultModifiers(item.modifierGroups).filter((m) => isOptionAvailable(item.restaurantId, m.groupId, m.optionId));
      setSelections(toSelections(defaults));
      setQuantity(1);
      setInstructions('');
    }
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, open, editLine?.lineId]);

  const modifiers = useMemo<SelectedModifier[]>(() => {
    if (!item) return [];
    return item.modifierGroups.flatMap((g) =>
      (selections[g.id] ?? [])
        .map((oid) => g.options.find((o) => o.id === oid))
        .filter((o): o is NonNullable<typeof o> => !!o)
        .map((o) => ({ groupId: g.id, groupName: g.name, optionId: o.id, optionName: o.name, priceDelta: o.priceDelta })),
    );
  }, [item, selections]);

  if (!item) return null;

  const errors = Object.fromEntries(item.modifierGroups.map((g) => [g.id, groupError(g, selections[g.id] ?? [])]));
  const firstInvalid = item.modifierGroups.find((g) => errors[g.id]);
  const unitPrice = item.price + modifiers.reduce((s, m) => s + m.priceDelta, 0);
  const total = unitPrice * quantity;
  const available = isItemAvailable(item);

  const toggle = (group: ModifierGroup, optionId: string) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selection === 'single') return { ...prev, [group.id]: [optionId] };
      if (current.includes(optionId)) return { ...prev, [group.id]: current.filter((o) => o !== optionId) };
      if (current.length >= group.max) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  };

  const submit = () => {
    if (firstInvalid) {
      setShowErrors(true);
      const el = groupRefs.current[firstInvalid.id];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector<HTMLInputElement>('input:not([disabled])')?.focus({ preventScroll: true });
      return;
    }
    if (editLine) {
      updateLine(editLine.lineId, { modifiers, specialInstructions: instructions, quantity });
      toast({ title: 'Basket updated', description: `${item.name} has been updated.`, tone: 'success' });
      onClose();
      return;
    }
    const result = addItem({
      restaurantId: item.restaurantId,
      restaurantName,
      menuItemId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      quantity,
      modifiers,
      specialInstructions: instructions,
    });
    onClose();
    if (result.status === 'added') {
      toast({
        title: `Added ${quantity} × ${item.name}`,
        description: formatMoney(total),
        tone: 'success',
        action: { label: 'View basket', onClick: openDrawer },
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editLine ? `Edit ${item.name}` : item.name}
      description={restaurantName}
      size="lg"
      footer={
        <div className="flex items-center gap-3">
          <QuantityStepper
            label={item.name}
            value={quantity}
            onIncrement={() => setQuantity((q) => Math.min(25, q + 1))}
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
          />
          <Button size="lg" className="flex-1 justify-between" onClick={submit} disabled={!available}>
            <span>{!available ? 'Sold out' : editLine ? 'Update basket' : 'Add to basket'}</span>
            <motion.span key={total} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">
              {formatMoney(total)}
            </motion.span>
          </Button>
        </div>
      }
    >
      {item.image && (
        <div className="relative aspect-[16/9] w-full bg-ink-100">
          <SmartImage src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 672px" />
        </div>
      )}
      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <p className="text-[15px] text-ink-700">{item.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-600">
            <span className="font-bold text-ink-900">{formatMoney(item.price)}</span>
            {item.calories > 0 && <span>{item.calories} kcal</span>}
            <SpiceIndicator level={item.spiceLevel} />
            <DietaryTags tags={item.dietary} />
          </div>
          {item.allergens.length > 0 && (
            <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                <strong>Contains:</strong> {item.allergens.map((a) => ALLERGEN_LABEL[a]).join(', ')}
              </span>
            </p>
          )}
          {!available && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              This dish is currently sold out. The kitchen will restock soon.
            </p>
          )}
        </div>

        {item.modifierGroups.map((group) => {
          const chosen = selections[group.id] ?? [];
          const error = showErrors ? errors[group.id] : null;
          const satisfied = !errors[group.id];
          const atMax = group.selection === 'multiple' && chosen.length >= group.max;
          const legendId = `${item.id}-${group.id}-legend`;
          return (
            <fieldset
              key={group.id}
              ref={(el) => {
                groupRefs.current[group.id] = el;
              }}
              aria-describedby={error ? `${legendId}-err` : undefined}
              className={cn('rounded-2xl border p-4 transition-colors', error ? 'border-red-600 bg-red-50/40' : 'border-ink-100')}
            >
              <legend id={legendId} className="sr-only">
                {group.name}
              </legend>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink-900" aria-hidden>
                    {group.name}
                  </p>
                  <p className="text-sm text-ink-600">
                    {group.description ??
                      (group.selection === 'single' ? 'Choose 1' : group.min > 0 ? `Choose ${group.min}–${group.max}` : `Choose up to ${group.max}`)}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                    group.required ? (satisfied ? 'bg-herb-50 text-herb-700' : 'bg-ink-900 text-white') : 'bg-ink-50 text-ink-700',
                  )}
                >
                  {group.required ? satisfied ? <><Check className="h-3 w-3" aria-hidden /> Required</> : 'Required' : 'Optional'}
                </span>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p
                    id={`${legendId}-err`}
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-800"
                  >
                    <AlertCircle className="h-4 w-4" aria-hidden /> {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <ul className="divide-y divide-ink-100">
                {group.options.map((option) => {
                  const checked = chosen.includes(option.id);
                  const soldOut = option.available === false || !isOptionAvailable(item.restaurantId, group.id, option.id);
                  const disabled = soldOut || (!checked && atMax);
                  return (
                    <li key={option.id}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-3 py-3 has-[:focus-visible]:rounded-lg has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-300',
                          disabled && 'cursor-not-allowed opacity-60',
                        )}
                      >
                        <input
                          type={group.selection === 'single' ? 'radio' : 'checkbox'}
                          name={`${item.id}-${group.id}`}
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggle(group, option.id)}
                          className={cn(
                            'h-5 w-5 shrink-0 border-2 border-ink-400 text-brand-700 accent-brand-700',
                            group.selection === 'single' ? 'rounded-full' : 'rounded-md',
                          )}
                        />
                        <span className="flex-1 text-[15px] text-ink-900">
                          {option.name}
                          {soldOut && <span className="ml-2 text-xs font-bold uppercase text-red-800">Sold out</span>}
                          {option.dietary && <DietaryTags tags={option.dietary} compact className="ml-2 inline-flex align-middle" />}
                        </span>
                        {option.priceDelta !== 0 && (
                          <span className={cn('text-sm tabular-nums', option.priceDelta < 0 ? 'text-herb-700' : 'text-ink-700')}>
                            {formatDelta(option.priceDelta)}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}

        <TextArea
          label="Special instructions"
          optional
          maxLength={INSTRUCTIONS_MAX}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. No coriander, sauce on the side. For allergies, please contact the restaurant."
          hint="Dietary requests are passed to the kitchen. We can’t guarantee every request."
        />
      </div>
    </Dialog>
  );
}
