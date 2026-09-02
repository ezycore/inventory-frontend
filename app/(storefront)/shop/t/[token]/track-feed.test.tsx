// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrackedOrder } from "@/lib/storefront-client";
import { StorefrontUIProvider } from "@/services/storefront/ui-context";
import View from "./view";

/**
 * The parcel feed on the **tokenized tracking page** — the only surface a guest
 * has. They have no account to sign into and no other copy of their order, so a
 * feed that renders in the account view but not here is invisible to exactly the
 * buyers who need it most. It was: this page carried a courier card with a
 * tracking code and nothing else until 2026-09-02.
 *
 * The query, store and route params are stubbed so these tests are about one
 * thing — what the courier card draws.
 */
vi.mock("next/navigation", () => ({ useParams: () => ({ token: "tok" }) }));
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/hooks", () => ({
  useStore: () => ({ data: { currency: "BDT" } }),
  storefront: { trackedOrder: (t: string) => ["tracked", t] },
}));

const query = vi.hoisted(() => ({ data: undefined as TrackedOrder | undefined }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: query.data,
    isPending: false,
    isError: false,
    error: null,
    refetch: () => {},
    isFetching: false,
  }),
}));

const order = (courier: TrackedOrder["courier"]): TrackedOrder => ({
  orderNumber: "ORD-20260825-00005",
  status: "shipped",
  fulfillmentType: "delivery",
  paymentMethod: "cod",
  paymentStatus: "pending",
  placedAt: "2026-08-17T12:00:00.000Z",
  items: [{ productName: "Widget", quantity: 1, price: 90, subtotal: 90 }],
  subtotal: 90,
  discountAmount: 0,
  shippingCharged: 0,
  totalAmount: 90,
  shipTo: { name: "Tanvir Hasan", area: "Banani" },
  statusHistory: [{ status: "shipped", at: "2026-08-17T12:00:00.000Z" }],
  courier,
});

const pathaoHistory = [
  { status: "pending", group: "Accepted", label: "Pickup requested.", at: "2026-08-17T12:31:00.000Z" },
  { status: "pending", group: "Accepted", label: "Order confirmed.", at: "2026-08-17T12:36:00.000Z" },
  { status: "in_transit", group: "Picked", label: "Received at pickup hub: Rayerbag.", at: "2026-08-17T17:50:00.000Z" },
];

beforeEach(() => localStorage.clear());

describe("tracking link — the parcel feed a guest sees", () => {
  it("shows the carrier's own events, grouped by phase", () => {
    query.data = order({
      name: "pathao",
      trackingCode: "DM170826EVBUTT",
      normalizedStatus: "in_transit",
      history: pathaoHistory,
    });
    render(<View />);

    expect(screen.getByText("Received at pickup hub: Rayerbag.")).toBeInTheDocument();
    expect(screen.getByText("Order confirmed.")).toBeInTheDocument();
    // One heading for the two events it holds.
    expect(screen.getAllByText("Accepted")).toHaveLength(1);
    expect(screen.getByText("Picked")).toBeInTheDocument();
  });

  /**
   * The gate used to be `courier?.trackingCode` alone. A manual courier commonly
   * has no code — the merchant hands the parcel over and types updates by hand —
   * so the whole card, feed included, disappeared for exactly the merchants whose
   * updates are the only tracking there is.
   */
  it("shows the feed for a courier that has no tracking code", () => {
    query.data = order({
      name: "RedX",
      normalizedStatus: "in_transit",
      history: [
        { status: "pending", label: "Handed to RedX", at: "2026-08-21T06:00:00.000Z" },
        { status: "in_transit", label: "Left Mirpur hub", at: "2026-08-21T11:30:00.000Z" },
      ],
    });
    render(<View />);

    expect(screen.getByText("RedX")).toBeInTheDocument();
    expect(screen.getByText("Handed to RedX")).toBeInTheDocument();
    expect(screen.getByText("Left Mirpur hub")).toBeInTheDocument();
    // No code to show, so the label for one must not be printed empty.
    expect(screen.queryByText(/Tracking code:/)).not.toBeInTheDocument();
  });

  it("still draws the card for a dispatched parcel with no events yet", () => {
    query.data = order({
      name: "steadfast",
      trackingCode: "SF912987",
      normalizedStatus: "pending",
      history: [],
    });
    render(<View />);

    expect(screen.getByText(/Tracking code:/)).toBeInTheDocument();
    // The feed's own heading must not appear over an empty list.
    expect(screen.queryByText("Delivery updates")).not.toBeInTheDocument();
  });

  /**
   * A guest following a merchant's link has no account and no way to switch
   * anything — whatever language the shop is in is what they get. The page shipped
   * with its status vocabulary, "Courier", "Tracking code", "Progress" and the
   * address line hardcoded in English, under a feed that was already translating
   * its headings.
   */
  it("speaks Bangla when the shop does", () => {
    localStorage.setItem("ezy-sf-lang", "bn");
    // No carrier name, so the card falls back to the generic word — which is one
    // of the strings this test exists for. A named carrier prints its own name in
    // either language, correctly.
    query.data = order({
      trackingCode: "DM170826EVBUTT",
      normalizedStatus: "in_transit",
      history: pathaoHistory,
    });
    render(
      <StorefrontUIProvider>
        <View />
      </StorefrontUIProvider>,
    );

    // Twice over, and both are right: the heading at the top and the row in the
    // order's own Progress card, which reads from the same vocabulary.
    expect(screen.getAllByText("পথে আছে").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("কুরিয়ার")).toBeInTheDocument();
    expect(screen.getByText(/ট্র্যাকিং কোড/)).toBeInTheDocument();
    expect(screen.getByText("অগ্রগতি")).toBeInTheDocument();
    expect(screen.getByText(/ডেলিভারি হচ্ছে/)).toBeInTheDocument();
    // The carrier's own sentences stay English — they name hubs and riders.
    expect(screen.getByText("Received at pickup hub: Rayerbag.")).toBeInTheDocument();
  });

  it("names a status it has no wording for rather than blanking it", () => {
    // The map is ours; the status vocabulary is the backend's and can grow.
    query.data = { ...order(undefined), status: "awaiting_courier" };
    render(<View />);
    expect(screen.getByText("awaiting_courier")).toBeInTheDocument();
  });

  it("renders no courier card at all before dispatch", () => {
    query.data = order(undefined);
    render(<View />);

    expect(screen.queryByText(/Tracking code:/)).not.toBeInTheDocument();
    expect(screen.queryByText("Delivery updates")).not.toBeInTheDocument();
    // The order itself still renders.
    expect(screen.getByText(/ORD-20260825-00005/)).toBeInTheDocument();
  });
});
