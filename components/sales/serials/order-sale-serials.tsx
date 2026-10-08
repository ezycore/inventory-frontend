"use client";
// coding-standard: maintained
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { useSale } from "@/services/api";
import type { Sale } from "@/types";
import { SaleSerialsEditor } from "./sale-serials-editor";
import { useSerialsEnabled } from "./use-serial-kinds";

/**
 * "Add / edit serials" on an online order, once it has become a Sale. Nobody
 * scanned anything at a counter for it, so this is where its codes go in.
 * Loads the Sale only for someone who could edit it.
 */
export function OrderSaleSerials({ saleId }: { saleId?: string | null }) {
  const enabled = useSerialsEnabled();
  const canEdit = useHasPermission(PERMISSIONS.salesEdit);
  const { data } = useSale(enabled && canEdit && saleId ? saleId : "");
  const sale = data?.data as Sale | undefined;
  return sale ? <SaleSerialsEditor sale={sale} /> : null;
}
