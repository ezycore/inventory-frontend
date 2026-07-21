"use client";
// coding-standard: maintained

import { toast as sonner } from "sonner";

/**
 * Storefront toasts render TOP-CENTER, unlike the admin's bottom-right default:
 * the shop's bottom strip is owned by the cart drawer footer, the mobile bottom
 * nav and the sticky buy-bar product template, so bottom toasts cover CTAs.
 * Every storefront surface imports `toast` from here — never from "sonner"
 * directly — so the position stays a single decision.
 */
const position = "top-center" as const;

export const toast = {
  success: (message: string) => sonner.success(message, { position }),
  error: (message: string) => sonner.error(message, { position }),
  /** Clear in-flight toasts (the cart drawer dismisses on open — it IS the confirmation). */
  dismiss: () => sonner.dismiss(),
};
