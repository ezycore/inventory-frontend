// coding-standard: maintained
import { useCallback, useMemo } from "react";
import { productItemsCreateCallback } from "@/components/sales/helpers";
import type { ExtractedProduct, SerialKind } from "@/components/sales/types";
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
 * Which kind of code a cart line needs, if any. The line carries `serialKind`
 * when it was added from the picker or a scan; a line restored from a draft, or
 * one persisted in the cart before serials existed, does not — so fall back to
 * the cached sellable-products list the search box already loaded.
 */
export function useSerialKindOf(): (line: {
  serialKind?: SerialKind;
  inventoryId: string;
  isCombo?: boolean;
}) => SerialKind | undefined {
  const enabled = useSerialsEnabled();
  const { data: sellable = [] } = useSelectOptions(
    enabled ? selectOptions("sellableProducts") : null,
    productItemsCreateCallback,
  );
  const byInventory = useMemo(
    () =>
      new Map(
        (sellable as unknown as ExtractedProduct[]).map((row) => [row.value, row.serialKind]),
      ),
    [sellable],
  );
  return useCallback(
    (line) => {
      if (!enabled || line.isCombo) return undefined;
      return line.serialKind ?? byInventory.get(line.inventoryId);
    },
    [enabled, byInventory],
  );
}
