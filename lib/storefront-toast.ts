"use client";
// coding-standard: maintained

import { toast as sonner } from "sonner";

/**
 * The id of the storefront's toast host. Shared with `StorefrontToaster` so the
 * two halves of the routing cannot drift — a typo here is a toast that renders
 * nowhere, with no error.
 */
export const TOASTER_ID = "storefront";

/**
 * Every storefront surface imports `toast` from here — never from "sonner"
 * directly — because this is the one place that addresses the storefront's own
 * toast host.
 *
 * `toasterId` is the whole job. Sonner renders a toast on the `<Toaster id>`
 * whose id matches, and on the id-less one only when a toast carries no id at
 * all. Stamping it here sends storefront toasts to `StorefrontToaster` — which
 * follows the SHOPPER's light/dark and sits top-center with a close button —
 * and leaves the admin's `<Toaster>` in `app/layout.tsx` to the admin. Look,
 * placement and theme all live on that component now; drop this id and a shop
 * toast silently renders in the admin's theme, bottom-right, again.
 */
const base = { toasterId: TOASTER_ID } as const;

export const toast = {
  success: (message: string) => sonner.success(message, base),
  error: (message: string) => sonner.error(message, base),
  /** Clear in-flight toasts (the cart drawer dismisses on open — it IS the confirmation). */
  dismiss: () => sonner.dismiss(),
};
