"use client";
// coding-standard: maintained

import { Toaster } from "sonner";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { TOASTER_ID } from "@/lib/storefront-toast";

/**
 * The storefront's own toast host.
 *
 * **Why it is not the admin's `<Toaster>` in `app/layout.tsx`.** That one reads
 * `next-themes`, and the storefront does not use next-themes: its light/dark is
 * `.sf-root[data-theme]`, driven by `ezy-sf-theme` in localStorage through
 * `StorefrontUIProvider`. The admin toaster also portals to `document.body`,
 * OUTSIDE `.sf-root`, so it cannot inherit the storefront's tokens either. A
 * shopper in light mode was therefore served whatever theme the admin app had
 * resolved — a near-black success toast on a white shop.
 *
 * Sonner routes by id: a `<Toaster id>` renders only toasts carrying that
 * `toasterId`, and an id-less one renders only toasts without it. So this host
 * takes the storefront's toasts and the admin's keeps taking the admin's, with
 * no double-render on either side. `lib/storefront-toast.ts` is what stamps the
 * id, and it is the only thing that should.
 *
 * `expand` / `visibleToasts` mirror the admin toaster deliberately: this change
 * is about theme and the close button, not about how toasts stack.
 */
export function StorefrontToaster() {
  const { theme } = useStorefrontUI();
  return (
    <Toaster
      id={TOASTER_ID}
      theme={theme}
      // TOP-CENTER because the shop's bottom strip is owned by the cart drawer
      // footer, the mobile bottom nav and the sticky buy-bar product template.
      position="top-center"
      richColors
      closeButton
      expand
      visibleToasts={4}
      // Classes rather than styling `[data-close-button]` globally: these land on
      // the toast and its close button only for THIS toaster, so nothing here can
      // reach an admin toast. Rules live in `app/(storefront)/storefront.css`.
      toastOptions={{
        classNames: { toast: "sf-toast", closeButton: "sf-toast-close" },
      }}
    />
  );
}
