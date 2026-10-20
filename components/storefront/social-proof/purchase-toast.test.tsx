// coding-standard: maintained
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StorefrontStore } from "@/lib/storefront-client";
import { resolveSocialLook } from "@/lib/storefront-social-proof";
import { PurchaseToast } from "./purchase-toast";

const recentPurchases = vi.fn();
let pathname = "/";

vi.mock("@/lib/storefront-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storefront-client")>()),
  storefrontApi: { recentPurchases: (slug: string) => recentPurchases(slug) },
}));
vi.mock("@/services/storefront/use-store-pathname", () => ({ useStorePathname: () => pathname }));
vi.mock("@/services/storefront/use-social-look", () => ({ useSocialLook: () => resolveSocialLook(undefined) }));
vi.mock("@/lib/storefront-preview", () => ({ isPreviewSession: () => false }));

const store = {
  socialProof: {
    purchaseToast: {
      firstDelaySeconds: 2,
      staySeconds: 3,
      gapSeconds: 5,
      maxPerVisit: 2,
      template: { en: "{name} bought {product}", bn: "{name} কিনেছেন {product}" },
      position: "bottom-left",
    },
  },
} as unknown as StorefrontStore;

const entries = [
  { productSlug: "mat", name: "Rahim", productName: "Floor Mat", minutesAgo: 5 },
  { productSlug: "cushion", name: "Karim", productName: "Cushion", timeLabel: "Today" },
];

const advance = async (seconds: number) => {
  await act(async () => {
    vi.advanceTimersByTime(seconds * 1000);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  pathname = "/";
  recentPurchases.mockReset();
  recentPurchases.mockResolvedValue({ entries });
});
afterEach(() => vi.useRealTimers());

const mount = async (s: StorefrontStore = store) => {
  render(<PurchaseToast slug="shop" base="/shop" store={s} />);
  await act(async () => {}); // let the feed resolve
};

describe("the purchase toast clock", () => {
  it("waits, shows for its stay, pauses, shows the next — then stops at the visit cap", async () => {
    await mount();
    expect(screen.queryByRole("status")).toBeNull();
    await advance(2);
    expect(screen.getByRole("status").textContent).toContain("Rahim bought Floor Mat");
    expect(screen.getByRole("status").textContent).toContain("5 min ago");
    await advance(3);
    expect(screen.queryByRole("status")).toBeNull();
    await advance(5);
    expect(screen.getByRole("status").textContent).toContain("Karim bought Cushion");
    expect(screen.getByRole("status").textContent).toContain("Today");
    await advance(3 + 5 + 10);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it.each(["/checkout", "/shop/checkout", "/shop/cart", "/shop/account/orders"])(
    "never runs on %s — with or without the store's base",
    async (path) => {
      pathname = path;
      await mount();
      await advance(30);
      expect(screen.queryByRole("status")).toBeNull();
    },
  );

  it("stays closed for the visit once the shopper closes it", async () => {
    await mount();
    await advance(2);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByRole("status")).toBeNull();
    // The clock stops too: no later toast, and nothing writes the close back to false.
    await advance(60);
    expect(screen.queryByRole("status")).toBeNull();
    expect(JSON.parse(sessionStorage.getItem("ezy-sf-purchase-toast")!).closed).toBe(true);
  });

  it("does nothing — not even a request — while the toast is off", async () => {
    await mount({} as StorefrontStore);
    await advance(30);
    expect(recentPurchases).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
