"use client";
// coding-standard: maintained

import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/format";
import { resolveTimezone } from "@/lib/org-calendar";
import {
  useGetStorefrontSettings,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { PrintMenu } from "@/components/shared/print/print-menu";
import {
  orgToPrintHeader,
  resolveDefaultPaper,
  type PaperSize,
} from "@/utils/print-documents";
import { printStorefrontOrderInvoices } from "@/utils/print-storefront-order";

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

  const print = (paper: PaperSize) =>
    printStorefrontOrderInvoices(orders, paper, {
      header: orgToPrintHeader(org, settings?.displayName),
      currency: (n) => formatCurrency(n, org?.currency),
      // The org's calendar, not the printing device's zone.
      formatDate: (iso) => formatDateTime(iso, "en", resolveTimezone(org?.timezone)),
    });

  return (
    <PrintMenu
      a4Label="Invoice"
      defaultPaper={resolveDefaultPaper(org)}
      onPrint={print}
    />
  );
}
