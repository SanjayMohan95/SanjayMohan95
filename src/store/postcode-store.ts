'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { validatePostcode } from '@/lib/postcode';
import { uid } from '@/lib/utils';
import type { PostcodeArea, PostcodeValidationResult, PostcodeValidationStatus, UserAddress } from '@/types';

interface PostcodeState {
  /** Normalised, validated postcode currently unlocking browsing. */
  postcode: string | null;
  area: PostcodeArea | null;
  distanceMiles: number | null;
  /** Status of the most recent validation attempt (may be an error while a valid postcode is retained). */
  lastAttempt: { status: PostcodeValidationStatus; message: string; input: string } | null;
  savedAddresses: UserAddress[];
  selectedAddressId: string | null;
  recentPostcodes: string[];

  submitPostcode: (raw: string) => PostcodeValidationResult;
  clearPostcode: () => void;
  saveAddress: (address: Omit<UserAddress, 'id'> & { id?: string }) => UserAddress;
  removeAddress: (id: string) => void;
  selectAddress: (id: string | null) => void;
}

export const usePostcodeStore = create<PostcodeState>()(
  persist(
    (set, get) => ({
      postcode: null,
      area: null,
      distanceMiles: null,
      lastAttempt: null,
      savedAddresses: [],
      selectedAddressId: null,
      recentPostcodes: [],

      submitPostcode: (raw) => {
        const result = validatePostcode(raw);
        set({ lastAttempt: { status: result.status, message: result.message, input: raw } });
        if (result.status === 'valid' && result.area && result.normalised) {
          const normalised = result.normalised;
          set({
            postcode: normalised,
            area: result.area,
            distanceMiles: result.distanceMiles,
            recentPostcodes: [normalised, ...get().recentPostcodes.filter((p) => p !== normalised)].slice(0, 5),
          });
        }
        return result;
      },

      clearPostcode: () => set({ postcode: null, area: null, distanceMiles: null, lastAttempt: null }),

      saveAddress: (address) => {
        const id = address.id ?? uid('addr_');
        const record: UserAddress = { ...address, id };
        const others = get().savedAddresses.filter((a) => a.id !== id);
        set({ savedAddresses: [record, ...others].slice(0, 8), selectedAddressId: id });
        return record;
      },

      removeAddress: (id) =>
        set((s) => ({
          savedAddresses: s.savedAddresses.filter((a) => a.id !== id),
          selectedAddressId: s.selectedAddressId === id ? null : s.selectedAddressId,
        })),

      selectAddress: (id) => set({ selectedAddressId: id }),
    }),
    {
      name: 'craveos.postcode',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        postcode: s.postcode,
        area: s.area,
        distanceMiles: s.distanceMiles,
        savedAddresses: s.savedAddresses,
        selectedAddressId: s.selectedAddressId,
        recentPostcodes: s.recentPostcodes,
      }),
    },
  ),
);
