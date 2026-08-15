"use client";
// coding-standard: maintained
import { useState } from "react";
import { Pencil } from "lucide-react";
import type { AdminStorefrontOrder } from "@/services/api";
import { Button } from "@/ui/components/button";
import { CreateOrderDialog } from "./create-order-dialog";
import { useOrderEditInitial } from "./use-order-edit-initial";

/**
 * Statuses an order can still be corrected in — everything before it reaches a
 * courier. Mirrors the backend guard; the server has the last word either way.
 */
const EDITABLE_STATUSES = ["pending", "confirmed", "processing"];

/**
 * Whether this order can still be edited.
 *
 * Two hard stops, and they are about the real world rather than the data: once a
 * `saleId` exists the ledger has moved (Sale, VAT, COGS) and the way back is a
 * Return; once a consignment exists the parcel is physically travelling under the
 * address and COD amount printed on it, which no form can change.
 */
export const canEditOrder = (order: AdminStorefrontOrder): boolean =>
  !order.saleId &&
  !order.courier?.consignmentId &&
  EDITABLE_STATUSES.includes(order.status);

/**
 * "Edit" on the order detail header — opens the create-order form seeded with
 * this order.
 *
 * The catalogue fetch behind `useOrderEditInitial` is deliberately tied to `open`:
 * it is a whole-store payload, and the button sits on a page most visits never
 * edit from.
 */
export function OrderEditButton({ order }: { order: AdminStorefrontOrder }) {
  const [open, setOpen] = useState(false);
  const { initial, loading } = useOrderEditInitial(order, open);

  if (!canEditOrder(order)) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={loading && open}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
      {/* Mounted only once seeded — an edit dialog that opened empty and filled in
          afterwards would let the merchant start typing into a form that is about
          to be overwritten. */}
      {open && initial ? (
        <CreateOrderDialog open onOpenChange={setOpen} initial={initial} />
      ) : null}
    </>
  );
}
