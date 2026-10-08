"use client";
// coding-standard: maintained
import type { SellOrderItem } from "@/services/stores";
import { CartLineSerials } from "@/components/sales/serials/cart-line-serials";
import { CartLineWarranty } from "@/components/sales/warranty/cart-line-warranty";

/**
 * The chips under a cart line's name — its warranty, then its serial / IMEI
 * count. Shared by New Sale's table and the POS phone cart, and mounted only
 * while warranty is on; each chip renders nothing when its product has none.
 */
export function CartLineChips({
  item,
  onSerialsChange,
}: {
  item: SellOrderItem;
  onSerialsChange: (serials: string[]) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 empty:hidden">
      <CartLineWarranty item={item} />
      <CartLineSerials item={item} onChange={onSerialsChange} />
    </div>
  );
}
