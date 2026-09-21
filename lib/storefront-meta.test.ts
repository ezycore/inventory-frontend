/**
 * The browser half of the Meta measurement loop, and specifically the `Purchase` that a merchant
 * can now opt into beside the server-side Conversions API event.
 *
 * Two things are worth pinning here and the rest follows from them:
 *
 * 1. **The shared `event_id`.** Meta collapses a browser event and a server event into ONE
 *    conversion when `event_name` and `event_id` both match — and nothing else does it. The
 *    backend builds `purchase_{orderNumber}` in `meta-purchase.service.ts`; a drift of one
 *    character here doubles a merchant's reported revenue and raises no error anywhere.
 * 2. **The opt-in.** `events.purchase` is off unless the merchant switched it on, and a store
 *    payload that predates the field carries no value at all — a truthy read there would start
 *    firing purchases for every existing store at once.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorefrontStore } from "@/lib/storefront-client";
import { spyOnStorage } from "@/tests/storage-spy";
import {
  metaContentId,
  metaPurchaseEventId,
  trackMetaPurchase,
  type MetaPurchaseOrder,
} from "./storefront-meta";

type FbqCall = [string, string, Record<string, unknown>, { eventID?: string }];

/** Every `fbq` call this test made, in order. */
const calls = (): FbqCall[] =>
  (window.fbq as unknown as { mock: { calls: FbqCall[] } }).mock.calls;

const purchases = () => calls().filter(([, event]) => event === "Purchase");

const store = (events: Partial<StorefrontStore["meta"]>["events"] | undefined) =>
  ({
    currency: "BDT",
    meta: events ? { pixelId: "1234567890", events } : undefined,
  }) as StorefrontStore;

const allOn = {
  pageView: true,
  viewContent: true,
  addToCart: true,
  initiateCheckout: true,
  purchase: true,
};

/**
 * A fresh order per test.
 *
 * The once-only guard is a module-level `Set` on purpose — it has to outlive a re-render — and
 * a module is instantiated once for the whole file, so a shared order number would make every
 * test after the first one see an order this "browser" had already reported. Each test gets its
 * own number; the exactly-once tests reuse theirs deliberately.
 */
let seq = 0;
const makeOrder = (overrides: Partial<MetaPurchaseOrder> = {}): MetaPurchaseOrder => ({
  orderNumber: `ORD-2026-${String((seq += 1)).padStart(4, "0")}`,
  totalAmount: 1280,
  items: [
    { productId: "p1", quantity: 2, price: 600 },
    { productId: "p2", variantId: "v9", quantity: 1, price: 80 },
  ],
  ...overrides,
});

describe("trackMetaPurchase", () => {
  beforeEach(() => {
    window.fbq = vi.fn() as unknown as typeof window.fbq;
    // The once-per-order guard is deliberately durable across a reload, so each test starts
    // from a clean session or the second test would see the first one's order as already sent.
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/shop/checkout");
  });

  describe("the merchant's switch", () => {
    it("sends nothing when the browser Purchase is off — the server reports the sale", () => {
      trackMetaPurchase(store({ ...allOn, purchase: false }), makeOrder());
      expect(purchases()).toHaveLength(0);
    });

    it("sends nothing for a store payload that predates the setting", () => {
      // `purchase` absent, not false. The backend resolves it with `=== true` for exactly this
      // reason; `canSend` has to agree, because a duplicate conversion cannot be deleted from
      // Meta afterwards.
      const legacy = {
        pageView: true,
        viewContent: true,
        addToCart: true,
        initiateCheckout: true,
      } as unknown as NonNullable<StorefrontStore["meta"]>["events"];
      trackMetaPurchase(store(legacy), makeOrder());
      expect(purchases()).toHaveLength(0);
    });

    it("sends nothing when the pixel itself is off", () => {
      trackMetaPurchase(store(undefined), makeOrder());
      expect(purchases()).toHaveLength(0);
    });

    it("sends nothing from the Customize preview iframe", () => {
      // The merchant theming their own shop must not pollute their funnel — and a preview
      // "purchase" would be a conversion for a sale that never happened.
      window.history.replaceState({}, "", "/shop/checkout?preview=1");
      trackMetaPurchase(store(allOn), makeOrder());
      expect(purchases()).toHaveLength(0);
    });

    it("sends the purchase once the merchant has switched it on", () => {
      trackMetaPurchase(store(allOn), makeOrder());
      expect(purchases()).toHaveLength(1);
    });
  });

  describe("the shared event id", () => {
    it("uses the id the server also sends, so Meta counts one purchase", () => {
      const order = makeOrder({ orderNumber: "ORD-2026-SHARED" });
      trackMetaPurchase(store(allOn), order);

      const [[, event, , options]] = purchases();
      expect(event).toBe("Purchase");
      // The cross-repo contract, spelled out rather than imported: the backend's
      // `purchaseEventId` builds this exact string for the CAPI event.
      expect(options.eventID).toBe("purchase_ORD-2026-SHARED");
      expect(metaPurchaseEventId(order.orderNumber)).toBe("purchase_ORD-2026-SHARED");
    });

    it("derives the id from the order number alone — never a timestamp or a random value", () => {
      // The failure this prevents is silent: a per-send id never matches the server's, so every
      // order is counted twice and both logs look correct.
      expect(metaPurchaseEventId("ORD-1")).toBe(metaPurchaseEventId("ORD-1"));
      expect(metaPurchaseEventId("ORD-1")).not.toBe(metaPurchaseEventId("ORD-2"));
    });

    it("reports the same amount the server reports", () => {
      // `totalAmount`, not the subtotal: two different values for one sale would break the
      // merchant's ROAS quietly, and the CAPI half sends `totalAmount`.
      const order = makeOrder({ orderNumber: "ORD-2026-VALUE" });
      trackMetaPurchase(store(allOn), order);

      const [[, , payload]] = purchases();
      expect(payload.value).toBe(1280);
      expect(payload.currency).toBe("BDT");
      expect(payload.order_id).toBe("ORD-2026-VALUE");
    });

    it("identifies a variant line the same way the server does", () => {
      trackMetaPurchase(store(allOn), makeOrder());

      const [[, , payload]] = purchases();
      // A product and one of its variants are different sellable things. The server sends
      // `productId:variantId`; sending the bare product id here would describe a different
      // catalogue item on the same conversion.
      expect(payload.content_ids).toEqual(["p1", `p2:v9`]);
      expect(metaContentId("p2", "v9")).toBe("p2:v9");
      expect(payload.contents).toEqual([
        { id: "p1", quantity: 2, item_price: 600 },
        { id: "p2:v9", quantity: 1, item_price: 80 },
      ]);
      // Documented for `InitiateCheckout` alone, and omitted by the CAPI half too.
      expect(payload.num_items).toBeUndefined();
    });
  });

  describe("exactly once", () => {
    it("does not fire again for an order this browser already reported", () => {
      const order = makeOrder();
      // A double-clicked button, a re-render, a hook that runs its effect twice under
      // StrictMode. The sale happened once.
      trackMetaPurchase(store(allOn), order);
      trackMetaPurchase(store(allOn), order);
      trackMetaPurchase(store(allOn), order);

      expect(purchases()).toHaveLength(1);
    });

    it("survives a reload of the thank-you screen", async () => {
      const order = makeOrder();
      trackMetaPurchase(store(allOn), order);
      expect(purchases()).toHaveLength(1);

      // A reload gives you a FRESH module — the in-memory `Set` is gone and only
      // `sessionStorage` remains. Re-importing is the only way to exercise that half; asserting
      // against the same module instance would pass on the `Set` alone and prove nothing.
      vi.resetModules();
      const reloaded = await import("./storefront-meta");
      window.fbq = vi.fn() as unknown as typeof window.fbq;
      reloaded.trackMetaPurchase(store(allOn), order);

      expect(purchases()).toHaveLength(0);
    });

    it("still reports a genuinely different order", () => {
      const first = makeOrder();
      trackMetaPurchase(store(allOn), first);
      // The guard is per order, not per session — a shopper placing a second order in the same
      // visit is a second conversion, and suppressing it would lose real revenue.
      window.fbq = vi.fn() as unknown as typeof window.fbq;
      trackMetaPurchase(store(allOn), makeOrder({ orderNumber: "ORD-2026-SECOND" }));

      expect(purchases()).toHaveLength(1);
      expect(purchases()[0][3].eventID).toBe("purchase_ORD-2026-SECOND");
    });

    it("does not fire when storage is unavailable and the tab is reused", () => {
      // Safari private mode: `sessionStorage` throws. The in-memory guard still has to hold for
      // the life of the tab, which is where a double-render would happen.
      // `spyOnStorage`, not a `Storage.prototype` spy — see that helper for
      // why the prototype one simulates nothing.
      const getItem = spyOnStorage(window.sessionStorage, "getItem")
        .mockImplementation(() => {
          throw new Error("storage disabled");
        });
      const setItem = spyOnStorage(window.sessionStorage, "setItem")
        .mockImplementation(() => {
          throw new Error("storage disabled");
        });

      trackMetaPurchase(store(allOn), makeOrder({ orderNumber: "ORD-NOSTORAGE" }));
      trackMetaPurchase(store(allOn), makeOrder({ orderNumber: "ORD-NOSTORAGE" }));
      expect(purchases()).toHaveLength(1);

      getItem.mockRestore();
      setItem.mockRestore();
    });
  });

  it("never breaks the confirmation screen when the pixel throws", () => {
    // An ad blocker that stubs `fbq` with something hostile, or a Meta script mid-load. The
    // shopper has already paid; nothing here may surface.
    window.fbq = vi.fn(() => {
      throw new Error("blocked");
    }) as unknown as typeof window.fbq;

    expect(() =>
      trackMetaPurchase(store(allOn), makeOrder({ orderNumber: "ORD-THROWS" })),
    ).not.toThrow();
  });
});
