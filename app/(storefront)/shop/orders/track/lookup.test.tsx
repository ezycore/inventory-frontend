// coding-standard: maintained

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrackedOrder } from "@/lib/storefront-client";
import { StorefrontUIProvider } from "@/services/storefront/ui-context";
import View from "./view";

/**
 * The lost-link lookup — the ONLY way back to an order for a guest who deleted
 * the tracking link, and the fallback the confirmation screen promises ("Save
 * this link — without an account it's your only way back to this order").
 *
 * It was dead. A correct order number and phone returned 200 and then pushed to
 * `/orders/track/result`, a route that exists nowhere in the app, so the buyer
 * landed on a 404 (QA-N12). Nothing caught it: the API call succeeded, the form
 * validated, and no test followed the buyer past the submit.
 *
 * So these tests assert the buyer ARRIVES — the order on the screen, not a
 * successful fetch. A regression here means the guest recovery path is dead
 * again, however green the request looks.
 */
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/hooks", () => ({
  useStore: () => ({ data: { currency: "BDT" } }),
  storefront: { trackedOrder: (t: string) => ["tracked", t] },
}));
vi.mock("@/components/storefront/content-frame", () => ({
  ContentFrame: ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const api = vi.hoisted(() => ({ lookupOrder: vi.fn() }));
vi.mock("@/lib/storefront-client", () => ({ storefrontApi: api }));

const order: TrackedOrder = {
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
  courier: undefined,
};

const draw = () =>
  render(
    <StorefrontUIProvider>
      <View />
    </StorefrontUIProvider>,
  );

/** Fill both fields with a pair the server would accept, then submit. */
const lookUp = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("Order number"), "ORD-20260825-00005");
  await user.type(screen.getByPlaceholderText("Phone number"), "01712345678");
  await user.click(screen.getByRole("button", { name: /find my order/i }));
};

beforeEach(() => {
  localStorage.clear();
  api.lookupOrder.mockReset();
});

describe("lost-link lookup", () => {
  it("renders the order in place — no navigation to a route that does not exist", async () => {
    api.lookupOrder.mockResolvedValue(order);
    draw();
    await lookUp();

    // The order itself, not just a resolved promise: number, line, and total.
    await waitFor(() => expect(screen.getByText(/ORD-20260825-00005/)).toBeInTheDocument());
    expect(screen.getByText(/Widget/)).toBeInTheDocument();
    expect(screen.getByText(/Tanvir Hasan/)).toBeInTheDocument();
    // The form is gone — the result replaced it, rather than sitting under a
    // redirect that never landed.
    expect(screen.queryByPlaceholderText("Order number")).not.toBeInTheDocument();
  });

  it("keeps the buyer on the form, unblocked, when the pair does not match", async () => {
    api.lookupOrder.mockRejectedValue(new Error("404"));
    draw();
    await lookUp();

    await waitFor(() =>
      expect(screen.getByText(/couldn't find an order/i)).toBeInTheDocument(),
    );
    // `busy` has to clear on the failure path too, or a mistyped digit locks the
    // button and the only recovery route is a page reload.
    expect(screen.getByRole("button", { name: /find my order/i })).toBeEnabled();
    expect(screen.getByPlaceholderText("Order number")).toBeInTheDocument();
  });
});
