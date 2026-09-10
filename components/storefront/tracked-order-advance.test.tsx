// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import type { TrackedOrder } from "@/lib/storefront-client";
import { StorefrontUIProvider } from "@/services/storefront/ui-context";
import { TrackedOrderPanel } from "@/components/storefront/tracked-order-panel";
import { money } from "@/components/storefront/format";

/**
 * The money summary a buyer reads on their own order — specifically, an advance
 * they have already paid.
 *
 * Production order ORD-20260910-00002 (2026-09-10) is the case: the buyer paid a
 * ৳100 COD advance, the merchant recorded it, and this page still showed "৳700"
 * with the payment pending. `paymentStatus` has no "partial" state, so these two
 * rows are the ONLY place the buyer's own money is visible to them.
 */
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/hooks", () => ({
  useStore: () => ({ data: { currency: "BDT" } }),
  storefront: { trackedOrder: (t: string) => ["tracked", t] },
}));

/** The live order, to the taka. */
const order = (over: Partial<TrackedOrder> = {}): TrackedOrder => ({
  orderNumber: "ORD-20260910-00002",
  status: "confirmed",
  fulfillmentType: "delivery",
  paymentMethod: "cod",
  paymentStatus: "pending",
  placedAt: "2026-09-10T10:21:56.776Z",
  items: [
    { productName: "Piano Fitness Rack", quantity: 1, price: 600, subtotal: 600 },
  ],
  subtotal: 600,
  discountAmount: 0,
  shippingCharged: 100,
  totalAmount: 700,
  prepaidAmount: 100,
  amountDue: 600,
  shipTo: { name: "Sheikh Fatema", area: "Chawkbazar", district: "Dhaka" },
  statusHistory: [{ status: "confirmed", at: "2026-09-10T10:24:04.641Z" }],
  ...over,
});

const draw = (o: TrackedOrder) =>
  render(
    <StorefrontUIProvider>
      <TrackedOrderPanel order={o} />
    </StorefrontUIProvider>,
  );

/**
 * A summary row, whole. `getByText` alone cannot assert these: each row is one
 * element holding a label and an amount, and the negative sign is its own text
 * node, so the amount is never a text match on its own. Formatting comes from
 * the real `money` helper rather than a hardcoded string — the assertion is
 * about which numbers the row shows, not about how BDT is punctuated.
 */
const rowText = (label: string) => screen.getByText(label).parentElement?.textContent;

beforeEach(() => localStorage.clear());

describe("an advance on the buyer's own order", () => {
  it("shows what was paid and what is still owed", () => {
    draw(order());

    expect(rowText("Advance paid")).toBe(`Advance paid−${money(100, "BDT")}`);
    expect(rowText("Amount due")).toBe(`Amount due${money(600, "BDT")}`);
    // The total is still stated — the buyer agreed to ৳700 — but it is no longer
    // the last word on the card, which is what made the page read as unpaid.
    expect(rowText("Total")).toBe(`Total${money(700, "BDT")}`);
  });

  it("says nothing about an advance when there is none", () => {
    draw(order({ prepaidAmount: 0, amountDue: 700 }));

    // "Advance paid ৳0" on every ordinary order is noise, and the total already
    // says what is owed.
    expect(screen.queryByText("Advance paid")).not.toBeInTheDocument();
    expect(screen.queryByText("Amount due")).not.toBeInTheDocument();
  });

  it("shows a fully prepaid order as owing nothing", () => {
    draw(order({ prepaidAmount: 700, amountDue: 0 }));

    expect(rowText("Amount due")).toBe(`Amount due${money(0, "BDT")}`);
  });

  it("reads in Bangla for a Bangla shopper", () => {
    localStorage.setItem("ezy-sf-lang", "bn");
    draw(order());

    expect(screen.getByText("অগ্রিম পরিশোধিত")).toBeInTheDocument();
    expect(screen.getByText("বাকি আছে")).toBeInTheDocument();
  });
});
