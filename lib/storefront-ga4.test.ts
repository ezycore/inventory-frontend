// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ga4BootScript,
  ga4DefaultGranted,
  ga4Money,
  ga4PurchaseItems,
  setGa4Consent,
  trackGa4Event,
  trackGa4Purchase,
  type CookieBannerMode,
  type Ga4PurchaseOrder,
} from "@/lib/storefront-ga4";
import { CONSENT_STORAGE_KEY } from "@/lib/storefront-consent";

/**
 * The GA4 wrapper's rules (backend `docs/plan/storefront-ga4.md` §3–5). None of them shows up in
 * a type-check: whether an event sent before gtag.js loads survives, whether the boot script's
 * consent default matches the tested function, and whether the purchase items add up to `value`.
 */

vi.mock("@/services/storefront/cart-identity", () => ({ isSfPreview: () => false }));

const STORE = { ga4: { measurementId: "G-TEST123" }, currency: "BDT" };

/** Every `gtag(...)` call on the queue, as plain arrays. */
const queued = (): unknown[][] =>
  (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));

const eventsNamed = (name: string) =>
  queued().filter((call) => call[0] === "event" && call[1] === name);

/** Pretend the shopper's device is in `timeZone` — see `consent-bar.test.tsx` for why the whole
 *  constructor is stubbed. */
const pretendTimeZone = (timeZone: string) => {
  const real = Intl.DateTimeFormat;
  const fake = Object.assign(
    function DateTimeFormat() {
      return { resolvedOptions: () => ({ timeZone }) };
    },
    { supportedLocalesOf: real.supportedLocalesOf },
  ) as unknown as typeof Intl.DateTimeFormat;
  vi.stubGlobal("Intl", { ...Intl, DateTimeFormat: fake });
};

beforeEach(() => {
  delete window.dataLayer;
  delete window.gtag;
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ga4BootScript", () => {
  const run = (mode: CookieBannerMode) =>
    // The script is ours, built from a validated id — this is how the browser runs it inline.
    // eslint-disable-next-line no-new-func
    new Function(ga4BootScript("G-TEST123", mode))();

  const cases: {
    mode: CookieBannerMode;
    stored: "granted" | "denied" | null;
    zone: string;
  }[] = [];
  for (const mode of ["off", "eu", "always"] as const) {
    for (const stored of [null, "granted", "denied"] as const) {
      for (const zone of ["Asia/Dhaka", "Europe/Berlin"]) cases.push({ mode, stored, zone });
    }
  }

  it.each(cases)(
    "matches ga4DefaultGranted for $mode / stored $stored / $zone",
    ({ mode, stored, zone }) => {
      pretendTimeZone(zone);
      if (stored) window.localStorage.setItem(CONSENT_STORAGE_KEY, stored);
      run(mode);

      const expected = ga4DefaultGranted(mode, stored, zone.startsWith("Europe/"))
        ? "granted"
        : "denied";
      const calls = queued();
      // Consent default is the FIRST command, as Google requires.
      expect(calls[0]).toEqual([
        "consent",
        "default",
        {
          analytics_storage: expected,
          ad_storage: expected,
          ad_user_data: expected,
          ad_personalization: expected,
        },
      ]);
    },
  );

  it("turns off gtag's own page view and configures the id", () => {
    run("off");
    expect(queued()).toContainEqual(["config", "G-TEST123", { send_page_view: false }]);
  });

  it("follows Option A: no banner means tracking is on", () => {
    expect(ga4DefaultGranted("off", null, false)).toBe(true);
    expect(ga4DefaultGranted("eu", null, false)).toBe(true);
    expect(ga4DefaultGranted("eu", null, true)).toBe(false);
    expect(ga4DefaultGranted("always", null, false)).toBe(false);
    // A stored answer always wins.
    expect(ga4DefaultGranted("off", "denied", false)).toBe(false);
  });
});

describe("trackGa4Event", () => {
  it("queues an event sent before gtag.js has loaded instead of dropping it", () => {
    // No boot script, no library: the queue is recreated rather than the event discarded.
    trackGa4Event(STORE, "view_item", { value: 10 });
    expect(eventsNamed("view_item")).toHaveLength(1);
  });

  it("sends nothing for a store without GA4", () => {
    trackGa4Event({ currency: "BDT" }, "view_item", { value: 10 });
    expect(window.dataLayer).toBeUndefined();
  });
});

describe("ga4Money", () => {
  it("never guesses a currency", () => {
    expect(ga4Money({ ga4: STORE.ga4 }, 100)).toEqual({});
    expect(ga4Money(STORE, 99.999)).toEqual({ currency: "BDT", value: 100 });
  });
});

describe("setGa4Consent", () => {
  it("updates all four signals", () => {
    window.dataLayer = [];
    window.gtag = (...args: unknown[]) => void window.dataLayer?.push(args);
    setGa4Consent(false);
    expect(queued()[0]).toEqual([
      "consent",
      "update",
      {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
  });
});

describe("ga4PurchaseItems", () => {
  const line = (price: number, quantity: number, productId = "p1") => ({
    productId,
    productName: `Product ${productId}`,
    price,
    quantity,
    subtotal: price * quantity,
  });
  const sumItems = (items: { price: number; quantity: number }[]) =>
    Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;

  it("the review's example: 1,000 − 100 discount + 80 delivery", () => {
    const order: Ga4PurchaseOrder = {
      orderNumber: "ORD-1",
      totalAmount: 980,
      shippingCharged: 80,
      items: [line(600, 1, "a"), line(200, 2, "b")],
    };
    const { items, value } = ga4PurchaseItems(order);
    expect(value).toBe(900);
    expect(sumItems(items)).toBe(value);
    expect(items[0]).toMatchObject({ item_id: "a", price: 540, discount: 60 });
    expect(items[1]).toMatchObject({ item_id: "b", price: 180, discount: 20, quantity: 2 });
  });

  it("a share that does not divide evenly stays one entry and value follows the items", () => {
    const { items, value } = ga4PurchaseItems({
      orderNumber: "ORD-2",
      totalAmount: 100,
      shippingCharged: 0,
      items: [line(40, 3)],
    });
    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(33.33);
    expect(value).toBe(99.99);
    expect(sumItems(items)).toBe(value);
  });

  it("is exact with no discount", () => {
    const { items, value } = ga4PurchaseItems({
      orderNumber: "ORD-3",
      totalAmount: 530,
      shippingCharged: 60,
      items: [line(125, 2, "a"), line(220, 1, "b")],
    });
    expect(value).toBe(470);
    expect(items.every((i) => i.discount === undefined)).toBe(true);
  });

  it("a discount at or above the subtotal prices everything at 0", () => {
    const { items, value } = ga4PurchaseItems({
      orderNumber: "ORD-4",
      totalAmount: 60,
      shippingCharged: 60,
      items: [line(100, 1)],
    });
    expect(value).toBe(0);
    expect(items[0].price).toBe(0);
  });

  it("keeps a variant line's id distinct", () => {
    const { items } = ga4PurchaseItems({
      orderNumber: "ORD-5",
      totalAmount: 50,
      shippingCharged: 0,
      items: [{ ...line(50, 1), variantId: "v1" }],
    });
    expect(items[0].item_id).toBe("p1:v1");
  });
});

describe("trackGa4Purchase", () => {
  const order: Ga4PurchaseOrder = {
    orderNumber: "ORD-9",
    totalAmount: 980,
    shippingCharged: 80,
    couponCode: "EID10",
    items: [
      { productId: "a", productName: "A", price: 1000, quantity: 1, subtotal: 1000 },
    ],
  };

  it("sends one purchase with shipping separate from value", () => {
    trackGa4Purchase(STORE, order);
    const [call] = eventsNamed("purchase");
    expect(call[2]).toMatchObject({
      transaction_id: "ORD-9",
      currency: "BDT",
      value: 900,
      shipping: 80,
      coupon: "EID10",
    });
  });

  it("sends it once, across a reload of the thank-you screen", () => {
    // Its own order number: the guard is module-wide, so ORD-9 is already spent above.
    const again = { ...order, orderNumber: "ORD-10" };
    trackGa4Purchase(STORE, again);
    trackGa4Purchase(STORE, again);
    expect(eventsNamed("purchase")).toHaveLength(1);
  });
});
