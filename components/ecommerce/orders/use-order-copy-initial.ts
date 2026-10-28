"use client";
// coding-standard: maintained
import { useMemo } from "react";
import { useOrderableProducts } from "@/services/api";
import type { AdminStorefrontOrder } from "@/types/api";
import type { Line, OrderFormInitial } from "./use-order-form";

/** What the copy dialog shows beside the form — never put into it unasked. */
export interface CopiedFrom {
  orderNumber: string;
  /** The old buyer, offered behind a "Use these" button. */
  customer: {
    name: string;
    phone: string;
    address: string;
    district: string;
    area: string;
  };
  /** Products on the old order the catalogue no longer offers — left out. */
  dropped: string[];
}

/**
 * Turn an existing order into the seed for a NEW one — "the same as hers, sent to
 * me", the commonest repeat request in a chat-order shop.
 *
 * **Only the products are copied**, at today's catalogue price (the form has no
 * `orderId`, so the quote prices it as a fresh order — a campaign running now
 * applies, an ended one does not). Everything else belonged to the old buyer:
 * - **customer** — left empty and shown beside the form instead. Pre-filled, a
 *   merchant who changes the products and forgets the address ships the parcel to
 *   the old buyer's door, and the phone files it under their customer record;
 * - **channel** — the dialog makes the merchant answer it, because guessing makes
 *   the channel report lie (see `CreateOrderDialog`);
 * - **coupon, manual discount, delivery charge, notes, advance** — negotiated
 *   with, priced for, or written about that buyer.
 *
 * A product the catalogue no longer lists is dropped and named, rather than seeded
 * for the save to refuse. Low stock is kept: the quote flags it on the line.
 */
export function useOrderCopyInitial(
  order: AdminStorefrontOrder,
  enabled: boolean,
): { initial?: OrderFormInitial; copiedFrom?: CopiedFrom; loading: boolean } {
  const { data: orderable, isLoading } = useOrderableProducts(enabled);

  const seed = useMemo(() => {
    // Wait for the catalogue: `useOrderForm` reads its seed once.
    if (!orderable) return undefined;

    const catalogue = new Map(
      orderable.map((row) => [`${row.productId}:${row.variantId ?? ""}`, row]),
    );
    const lines: Line[] = [];
    const dropped: string[] = [];
    for (const item of order.items) {
      const variantId = item.variantId ? String(item.variantId) : null;
      const row = catalogue.get(`${String(item.productId)}:${variantId ?? ""}`);
      if (!row) {
        dropped.push(item.productName);
        continue;
      }
      lines.push({
        productId: row.productId,
        variantId,
        label: row.label,
        price: row.price,
        quantity: item.quantity,
        availableQuantity: row.availableQuantity,
      });
    }

    const address = order.shippingAddress;
    const initial: OrderFormInitial = {
      lines,
      channel: "",
      paymentMethod: "cod",
      name: "",
      phone: "",
      address: "",
      district: "",
      area: "",
      notes: "",
      shippingCharged: null,
      coupon: "",
      discountType: "fixed",
      discountValue: null,
    };
    const copiedFrom: CopiedFrom = {
      orderNumber: order.orderNumber,
      customer: {
        name: address?.name ?? "",
        phone: address?.phone ?? "",
        address: address?.address ?? "",
        district: address?.district ?? "",
        area: address?.area ?? "",
      },
      dropped,
    };
    return { initial, copiedFrom };
  }, [order, orderable]);

  return { ...seed, loading: isLoading };
}
