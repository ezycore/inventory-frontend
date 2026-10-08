"use client";
// coding-standard: maintained
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductSearch } from "@/components/sales";
import { ProductThumb } from "@/components/sales/product-thumb";
import { useSellPage } from "@/components/sales/sell/use-sell-page";
import { POS_PATH } from "@/constants/pos";
import { useMatchesMedia } from "@/hooks/use-matches-media";
import { useAuthStore, type SellOrderItem } from "@/services/stores";
import { PosCameraScan } from "./pos-camera-scan";
import { PosCart } from "./pos-cart";
import { PosCheckoutPanel } from "./pos-checkout-panel";
import { PosCustomerPanel } from "./pos-customer-panel";
import { PosMobileCheckout } from "./pos-mobile-checkout";
import { PosProductBrowser } from "./pos-product-browser";
import { PosShortcutBar } from "./pos-shortcut-bar";
import { PosTopBar } from "./pos-top-bar";
import { PosViewTabs, type PosView } from "./pos-view-tabs";
import { usePosCatalog } from "./use-pos-catalog";
import { usePosShortcuts } from "./use-pos-shortcuts";

/** At this width and up the counter keeps customer + payment beside the cart. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * The full-screen POS counter (`/sales/pos`).
 *
 * A second face on New Sale, not a second sale engine: every number and every
 * action comes from `useSellPage` — the same cart store, customer discount,
 * store credit, drafts (`?draftId=` too), payment and receipt.
 *
 * Layout, by width:
 * - **1024 px and up** — left: scan/search, then **Browse products ↔ Cart**
 *   tabs; right: customer + payment, always visible (wider on bigger screens).
 * - **Below 1024 px** (tablets, phones) — the same tabs full width, and a
 *   bottom bar whose Checkout opens customer + payment in a sheet.
 * Inside each tab the browser and the cart size to their own width (container
 * queries), so nothing depends on guessing the screen.
 *
 * The customer form is mounted in exactly one place for the current width
 * (`useMatchesMedia`), because a form field mounted twice registers twice.
 */
export function PosScreen() {
  const tPos = useTranslations("sales.pos");
  const catalog = usePosCatalog();
  const renderThumb = useCallback(
    (item: SellOrderItem) => <ProductThumb src={catalog.photos.get(item.productId)} />,
    [catalog.photos],
  );
  // Auto-print is a counter behaviour (plan P8): New Sale never prints unasked.
  const autoPrint = useAuthStore(
    (s) => s.user?.organization?.receiptSettings?.autoPrintAfterSale === true,
  );
  const ctx = useSellPage({ homePath: POS_PATH, afterDraftSave: "stay", renderThumb, autoPrint });
  const barcodeEnabled = useAuthStore((s) => s.user?.organization?.features?.barcodeSystem) ?? false;
  const isDesktop = useMatchesMedia(DESKTOP_QUERY);

  // A resumed draft (its lines load a moment later) or a cart left from earlier
  // opens on the cart; an empty counter opens on the products.
  const [view, setView] = useState<PosView>(() =>
    ctx.isDraftMode || ctx.items.length > 0 ? "cart" : "browse",
  );

  const searchRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<HTMLElement>(null);

  // Ready to scan the moment the counter opens — on a mouse-and-keyboard
  // counter. On a touch screen focusing would pop the on-screen keyboard over
  // the products, so there the cashier taps the box when they want it.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) searchRef.current?.focus();
  }, []);

  usePosShortcuts({
    focusSearch: () => searchRef.current?.focus(),
    focusCustomer: () => customerRef.current?.querySelector<HTMLElement>("button, input")?.focus(),
    confirm: () => {
      if (ctx.items.length === 0 || ctx.isPending || ctx.isFinalizing) return;
      void ctx.handleMarkAsSold();
    },
  });

  return (
    <div className="flex h-full flex-col bg-muted/40">
      <PosTopBar />

      <div className="flex min-h-0 flex-1 gap-3 p-2 sm:p-3 lg:p-4">
        <main className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <ProductSearch
                onSelect={ctx.handleProductSelect}
                onScan={barcodeEnabled ? ctx.handleBarcodeScan : undefined}
                thumbnails={catalog.photos}
                size="lg"
                inputRef={searchRef}
                openOnFocus={false}
                placeholder={barcodeEnabled ? tPos("searchPlaceholder") : undefined}
              />
            </div>
            {barcodeEnabled && (
              <PosCameraScan onDetect={ctx.handleBarcodeScan} cartCount={ctx.items.length} />
            )}
          </div>

          <PosViewTabs
            view={view}
            onChange={setView}
            lineCount={ctx.items.length}
            total={ctx.totalSalePrice}
          />

          <div className="min-h-0 flex-1">
            {view === "browse" ? (
              <PosProductBrowser
                ctx={ctx}
                groups={catalog.groups}
                categories={catalog.categories}
                isLoading={catalog.isLoading}
              />
            ) : (
              <PosCart ctx={ctx} thumbnails={catalog.photos} />
            )}
          </div>
        </main>

        {isDesktop && (
          <aside className="flex w-[360px] shrink-0 flex-col gap-3 overflow-y-auto xl:w-[380px] 2xl:w-[420px]">
            <PosCustomerPanel ctx={ctx} containerRef={customerRef} />
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <PosCheckoutPanel ctx={ctx} />
            </div>
          </aside>
        )}
      </div>

      {isDesktop ? <PosShortcutBar ctx={ctx} /> : <PosMobileCheckout ctx={ctx} />}
      <ctx.SerialsConfirmDialog />
    </div>
  );
}
