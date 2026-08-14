"use client";
// coding-standard: maintained
import { useMemo } from "react";
import { useOrderableProducts } from "@/services/api";
import type { AdminStorefrontOrder } from "@/types/api";
import type { Line, OrderFormInitial } from "./use-order-form";

/**
 * Turn an existing order into the seed for the edit dialog.
 *
 * **Why this needs a second fetch.** An order stores what was bought, not what is
 * left: there is no `availableQuantity` on an order line. Without it the quantity
 * stepper has no ceiling on exactly the lines a merchant is most likely to raise,
 * so the catalogue is fetched alongside and joined by product+variant.
 *
 * A line whose product has since been unlisted or deleted simply gets a ceiling of
 * its own current quantity — the merchant can lower or remove it but not add more,
 * which is the honest answer when the catalogue no longer offers it. (The server
 * has the last word either way; the quote returns such a line in `rejected`.)
 *
 * Lines are seeded at the order's STORED price, never the catalogue's, so the
 * dialog opens showing what the buyer actually agreed. See D2 in
 * docs/features/order-edit.md.
 */
export function useOrderEditInitial(
  order: AdminStorefrontOrder | undefined,
  enabled: boolean,
): { initial?: OrderFormInitial; loading: boolean } {
  const { data: orderable = [], isLoading } = useOrderableProducts(enabled);

  const initial = useMemo<OrderFormInitial | undefined>(() => {
    if (!order) return undefined;

    const stockByKey = new Map(
      orderable.map((row) => [
        `${row.productId}:${row.variantId ?? ""}`,
        row.availableQuantity,
      ]),
    );

    const lines: Line[] = order.items.map((item) => {
      const variantId = item.variantId ? String(item.variantId) : null;
      const key = `${String(item.productId)}:${variantId ?? ""}`;
      return {
        productId: String(item.productId),
        variantId,
        label: item.productName,
        // The agreed price, not today's — this is what the dialog must show.
        price: item.price,
        quantity: item.quantity,
        // The picker reports stock NET of holds, and this order's own lines are
        // part of that hold, so add them back or a confirmed order looks
        // unraisable by exactly the amount it already reserved.
        availableQuantity: (stockByKey.get(key) ?? 0) + item.quantity,
      };
    });

    const address = order.shippingAddress;
    return {
      orderId: String(order._id),
      lines,
      channel: order.channel,
      paymentMethod: order.paymentMethod,
      name: address?.name ?? "",
      phone: address?.phone ?? "",
      address: address?.address ?? "",
      district: address?.district ?? "",
      area: address?.area ?? "",
      notes: order.notes ?? "",
      shippingCharged: order.shippingCharged ?? null,
      coupon: order.couponCode ?? "",
      // Seeded from the type+value the merchant AGREED, not from the resolved
      // amount — so a "10% off" reopens as 10%, and re-resolves against the new
      // subtotal if the lines change. (The order stores both; see the backend's
      // `manualDiscount`.)
      discountType: order.manualDiscount?.type ?? "fixed",
      discountValue: order.manualDiscount?.value ?? null,
    };
  }, [order, orderable]);

  return { initial, loading: isLoading };
}
