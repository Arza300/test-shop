"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SellableItemType } from "@prisma/client";

export type CartLine = {
  itemType: SellableItemType;
  itemId: string;
  variantName?: string;
  variantPrice?: number;
  quantity: number;
  title: string;
  price: number;
  slug: string | null;
  imageUrl?: string;
};

type CartState = {
  items: CartLine[];
  selectedPaymentMethodId: string | null;
  add: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQty: (itemType: SellableItemType, itemId: string, quantity: number, variantName?: string) => void;
  remove: (itemType: SellableItemType, itemId: string, variantName?: string) => void;
  setSelectedPaymentMethodId: (paymentMethodId: string | null) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedPaymentMethodId: null,
      add: (line) => {
        const qty = line.quantity ?? 1;
        const cur = get().items;
        const i = cur.findIndex(
          (x) => x.itemType === line.itemType && x.itemId === line.itemId && (x.variantName ?? null) === (line.variantName ?? null)
        );
        if (i === -1) {
          set({
            items: [
              ...cur,
              {
                itemType: line.itemType,
                itemId: line.itemId,
                title: line.title,
                price: line.price,
                variantName: line.variantName,
                variantPrice: line.variantPrice,
                slug: line.slug,
                imageUrl: line.imageUrl,
                quantity: qty,
              },
            ],
          });
        } else {
          const n = [...cur];
          n[i] = { ...n[i], quantity: n[i].quantity + qty };
          set({ items: n });
        }
      },
      setQty: (itemType, itemId, quantity, variantName) => {
        if (quantity < 1) {
          get().remove(itemType, itemId, variantName);
          return;
        }
        set({
          items: get().items.map((x) =>
            x.itemType === itemType && x.itemId === itemId && (x.variantName ?? null) === (variantName ?? null)
              ? { ...x, quantity }
              : x
          ),
        });
      },
      remove: (itemType, itemId, variantName) =>
        set({
          items: get().items.filter(
            (x) => !(x.itemType === itemType && x.itemId === itemId && (x.variantName ?? null) === (variantName ?? null))
          ),
        }),
      setSelectedPaymentMethodId: (paymentMethodId) => set({ selectedPaymentMethodId: paymentMethodId }),
      clear: () => set({ items: [], selectedPaymentMethodId: null }),
    }),
    {
      name: "games-store-cart",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as {
          items?: Array<Record<string, unknown>>;
          selectedPaymentMethodId?: unknown;
        };
        const items = Array.isArray(state.items) ? state.items : [];
        return {
          items: items.map((item) => {
            const itemType = item.itemType === "CUSTOM_SECTION_ITEM" ? item.itemType : "CUSTOM_SECTION_ITEM";
            const itemId =
              typeof item.itemId === "string"
                ? item.itemId
                : typeof item.productId === "string"
                  ? item.productId
                  : "";
            return {
              itemType,
              itemId,
              quantity: typeof item.quantity === "number" ? item.quantity : 1,
              title: typeof item.title === "string" ? item.title : "",
              price: typeof item.price === "number" ? item.price : 0,
              variantName: typeof item.variantName === "string" ? item.variantName : undefined,
              variantPrice: typeof item.variantPrice === "number" ? item.variantPrice : undefined,
              slug: typeof item.slug === "string" ? item.slug : null,
              imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
            };
          }),
          selectedPaymentMethodId:
            typeof state.selectedPaymentMethodId === "string" ? state.selectedPaymentMethodId : null,
        };
      },
    }
  )
);

export function cartSubtotal(items: CartLine[]) {
  return items.reduce((s, l) => s + l.price * l.quantity, 0);
}
