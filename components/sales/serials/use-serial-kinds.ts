// coding-standard: maintained
import { useCallback, useMemo } from "react";
import { productItemsCreateCallback } from "@/components/sales/helpers";
import type { ExtractedProduct, SerialKind } from "@/components/sales/types";
import type { WarrantyTerms } from "@/types/api";
import { useSelectOptions } from "@/services/api";
import { selectOptions } from "@/services/api/select-options";
import { useAuthStore } from "@/services/stores";

/**
 * Serial / IMEI capture shows only while warranty is on — warranty is its
 * switch (backend `docs/plan/sale-serials.md`, decision 1). Off only on an
 * explicit `false`, like every feature key.
 */
export function useSerialsEnabled(): boolean {
  return useAuthStore((s) => s.user?.organization?.features?.warranty) !== false;
}

/**
 * The cached sellable-products list the search box already loaded, keyed by
 * inventory id. A cart line restored from a draft, or persisted before a field
 * existed, does not carry `serialKind` / `warranty` — this is the fallback.
 */
function useSellableByInventory(enabled: boolean): Map<string, ExtractedProduct> {
  const { data: sellable = [] } = useSelectOptions(
    enabled ? selectOptions("sellableProducts") : null,
    productItemsCreateCallback,
  );
  return useMemo(
    () => new Map((sellable as unknown as ExtractedProduct[]).map((row) => [row.value, row])),
    [sellable],
  );
}

type CartLineRef = { inventoryId: string; isCombo?: boolean };

/** Which kind of code a cart line needs, if any. */
export function useSerialKindOf(): (
  line: CartLineRef & { serialKind?: SerialKind },
) => SerialKind | undefined {
  const enabled = useSerialsEnabled();
  const byInventory = useSellableByInventory(enabled);
  return useCallback(
    (line) => {
      if (!enabled || line.isCombo) return undefined;
      return line.serialKind ?? byInventory.get(line.inventoryId)?.serialKind;
    },
    [enabled, byInventory],
  );
}

/**
 * A product's serial kind by product / variant, for screens that hold no
 * inventory id (a warranty claim). Only knows products in stock here — which a
 * replacement from stock needs anyway.
 */
export function useSerialKindOfProduct(): (
  productId: string,
  variantId?: string | null,
) => SerialKind | undefined {
  const enabled = useSerialsEnabled();
  const byInventory = useSellableByInventory(enabled);
  return useCallback(
    (productId, variantId) => {
      if (!enabled) return undefined;
      for (const row of byInventory.values()) {
        if (row.productId === productId && (row.variantId ?? null) === (variantId ?? null)) return row.serialKind;
      }
      return undefined;
    },
    [enabled, byInventory],
  );
}

/** The warranty a cart line's product carries, if any — shown while warranty is on. */
export function useWarrantyOf(): (
  line: CartLineRef & { warranty?: WarrantyTerms },
) => WarrantyTerms | undefined {
  const enabled = useSerialsEnabled();
  const byInventory = useSellableByInventory(enabled);
  return useCallback(
    (line) => {
      if (!enabled || line.isCombo) return undefined;
      return line.warranty ?? byInventory.get(line.inventoryId)?.warranty;
    },
    [enabled, byInventory],
  );
}
