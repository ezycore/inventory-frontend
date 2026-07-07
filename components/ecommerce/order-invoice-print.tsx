"use client";
// coding-standard: maintained

import "@/app/(storefront)/storefront.css";
import { type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import {
  useGetStorefrontSettings,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useHydrated } from "@/hooks";
import { I18N } from "@/lib/storefront-i18n";
import {
  InvoiceSheet,
  buildSellerLines,
} from "@/components/storefront/invoice-sheet";
import { Button } from "@/ui/components/button";

/**
 * "Print invoice(s)" for the admin order pages. Renders the shared storefront
 * <InvoiceSheet> into a body-level print-only portal (`.sf-print-only`,
 * storefront.css) so window.print() outputs the same branded document the
 * shopper gets — one page per order — instead of the admin screen.
 */
export function OrderInvoicePrintButton({
  orders,
  label = "Print invoice",
}: {
  orders: AdminStorefrontOrder[];
  label?: string;
}) {
  const hydrated = useHydrated();
  const { data: settings } = useGetStorefrontSettings();
  const org = useAuthStore((s) => s.user?.organization);

  const seller = {
    name: settings?.displayName || org?.name || "Store",
    logoUrl: settings?.logo?.url || settings?.logo?.thumbnailUrl,
    lines: buildSellerLines(settings?.contact),
  };
  const brand = settings?.theme?.brandColor;
  const currency = settings?.currency ?? org?.currency;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!settings || orders.length === 0}
        onClick={() => window.print()}
      >
        <Printer className="mr-1.5 h-4 w-4" /> {label}
      </Button>
      {hydrated && settings
        ? createPortal(
            <div
              className="sf-root sf-print-only"
              style={
                brand
                  ? ({ "--primary": brand, "--primary-hover": brand } as CSSProperties)
                  : undefined
              }
            >
              {orders.map((o, i) => (
                <div
                  key={o._id}
                  className="sf-invoice-wrap"
                  style={i < orders.length - 1 ? { breakAfter: "page" } : undefined}
                >
                  <InvoiceSheet
                    order={o}
                    seller={seller}
                    t={I18N.en}
                    lang="en"
                    currency={currency}
                  />
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
