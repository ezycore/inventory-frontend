// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { StorefrontStore } from "@/lib/storefront-client";
import { ordersPausedOf } from "@/lib/storefront-orders-paused";

const store = (checkout: StorefrontStore["checkout"], withWhatsApp = true) =>
  ({
    name: "Rafi",
    checkout,
    contactButton: withWhatsApp
      ? { position: "right", channels: [{ kind: "whatsapp", value: "+880 1712-345678" }] }
      : undefined,
  }) as unknown as StorefrontStore;

describe("ordersPausedOf", () => {
  it("is null while orders are open", () => {
    expect(ordersPausedOf(undefined)).toBeNull();
    expect(ordersPausedOf(store({ pausedMessage: "Closed for Eid" }))).toBeNull();
  });

  it("carries the merchant's message, and WhatsApp only when offered", () => {
    expect(ordersPausedOf(store({ ordersPaused: true, pausedMessage: " Closed for Eid " }))).toEqual({
      message: "Closed for Eid",
      whatsappHref: undefined,
    });
    expect(
      ordersPausedOf(store({ ordersPaused: true, pausedMessage: "Closed", pausedWhatsApp: true })),
    ).toEqual({ message: "Closed", whatsappHref: "https://wa.me/8801712345678" });
  });

  it("offers no chat link when the store has no WhatsApp contact", () => {
    const paused = ordersPausedOf(store({ ordersPaused: true, pausedMessage: "Closed", pausedWhatsApp: true }, false));
    expect(paused?.whatsappHref).toBeUndefined();
  });
});
