// coding-standard: maintained
import { useCallback } from "react";
import { useSaleSerials } from "@/services/api";
import type { Sale, SaleItem } from "@/types";
import { normalizeSerials } from "@/utils/serial";
import { useSerialsEnabled } from "./use-serial-kinds";

/**
 * How many units on a posted sale line still have no serial / IMEI number —
 * 0 for a product that does not track them. Whether it tracks them comes from
 * the server's serial view (`serialKind` per line), which reads the product
 * now, so a sold-out product still counts. Shares its query with
 * `SaleSerialsEditor`.
 */
export function useMissingSerials(sale: Sale): (item: SaleItem) => number {
  const enabled = useSerialsEnabled();
  const posted = sale.status !== "draft" && sale.status !== "cancelled";
  const { data } = useSaleSerials(sale._id, enabled && posted);
  return useCallback(
    (item) => {
      const line = data?.lines[sale.items.indexOf(item)];
      if (!line?.serialKind) return 0;
      return Math.max(0, item.quantity - normalizeSerials(line.serials).length);
    },
    [data, sale.items],
  );
}
