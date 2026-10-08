"use client";
// coding-standard: maintained

import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/format";
import { resolveTimezone } from "@/lib/org-calendar";
import {
  useGetStorefrontSettings,
  useSalesByIds,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { PrintMenu } from "@/components/shared/print/print-menu";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import type { Sale } from "@/types";
import {
  orgToPrintHeader,
  resolveDefaultPaper,
  saleItemNote,
  type PaperSize,
} from "@/utils/print-documents";
import { printStorefrontOrderInvoices } from "@/utils/print-storefront-order";

/**
 * The order's lines with the warranty and serial / IMEI lines of its linked
 * Sale under each — the order itself snapshots neither; they live on the Sale
 * (frozen at commit, codes added afterwards). Lines are matched by product +
 * variant, in order; a combo line (exploded into components on the Sale) and
 * an order with no Sale yet print as before.
 */
const withSaleNotes = (order: AdminStorefrontOrder, sale?: Sale): AdminStorefrontOrder => {
  if (!sale) return order;
  const pool = [...sale.items];
  return {
    ...order,
    items: order.items.map((item) => {
      const at = pool.findIndex(
        (line) =>
          String(line.productId) === String(item.productId) &&
          String(line.variantId ?? "") === String(item.variantId ?? ""),
      );
      if (at < 0) return item;
      const [line] = pool.splice(at, 1);
      const note = saleItemNote(line);
      return note ? { ...item, note } : item;
    }),
  };
};

/**
 * "Print invoice(s)" for the admin order pages — the org's Receipt & Print
 * letterhead on the shared print engine, exactly like the sales/purchase
 * documents (one page per order when printing a selection). PrintMenu supplies
 * the paper-size split button, the popup-blocked toast and the invoicePrinting
 * feature gate.
 */
export function OrderInvoicePrintButton({
  orders,
}: {
  orders: AdminStorefrontOrder[];
}) {
  const org = useAuthStore((s) => s.user?.organization);
  // Store display name feeds the letterhead's "Store / branch" line.
  const { data: settings } = useGetStorefrontSettings();
  // Loaded ahead of the click: printing must stay synchronous, or the browser
  // treats the print window as an unrequested popup.
  // Only for someone who may read sales; without it the invoice prints as before.
  const canViewSales = useHasPermission(PERMISSIONS.salesView);
  const saleIds = canViewSales
    ? orders.map((order) => order.saleId).filter((id): id is string => Boolean(id))
    : [];
  const sales = useSalesByIds(saleIds);
  const saleById = new Map(
    sales
      .map((query) => query.data?.data as Sale | undefined)
      .filter((sale): sale is Sale => Boolean(sale))
      .map((sale) => [String(sale._id), sale]),
  );

  const print = (paper: PaperSize) =>
    printStorefrontOrderInvoices(
      orders.map((order) => withSaleNotes(order, order.saleId ? saleById.get(String(order.saleId)) : undefined)),
      paper,
      {
        header: orgToPrintHeader(org, settings?.displayName),
        currency: (n) => formatCurrency(n, org?.currency),
        // The org's calendar, not the printing device's zone.
        formatDate: (iso) => formatDateTime(iso, "en", resolveTimezone(org?.timezone)),
      },
    );

  return (
    <PrintMenu
      a4Label="Invoice"
      defaultPaper={resolveDefaultPaper(org)}
      onPrint={print}
    />
  );
}
