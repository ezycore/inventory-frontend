// coding-standard: maintained
import type { StorefrontStore } from "@/lib/storefront-client";
import { CONTACT_CHANNELS } from "@/lib/storefront-contact-channels";

/**
 * "Pause online orders" as the storefront reads it (backend plan
 * storefront-builder §6): the merchant's message, and a WhatsApp link when they
 * offered one and the store has a WhatsApp contact. `null` while orders are open.
 *
 * Every buy surface asks this one question, so a paused store never shows a Buy
 * button beside the notice. The order API refuses on its own
 * (`STORE_ORDERS_PAUSED`); this only keeps shoppers from reaching that refusal.
 */
export interface OrdersPaused {
  message: string;
  whatsappHref?: string;
}

export function ordersPausedOf(store: StorefrontStore | undefined): OrdersPaused | null {
  const checkout = store?.checkout;
  if (!checkout?.ordersPaused) return null;
  const whatsapp = checkout.pausedWhatsApp
    ? store?.contactButton?.channels.find((channel) => channel.kind === "whatsapp" && channel.value?.trim())
    : undefined;
  return {
    message: checkout.pausedMessage?.trim() ?? "",
    whatsappHref: whatsapp ? CONTACT_CHANNELS.whatsapp.href(whatsapp.value.trim(), "") : undefined,
  };
}
