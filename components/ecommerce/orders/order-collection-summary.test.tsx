// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderCollectionSummary } from "./order-collection-summary";

/**
 * The account of what happened at the door.
 *
 * The bug it closes is one of silence, not arithmetic: every effect was booked
 * correctly — a Sales Return, a post-sale discount, a Payment — but across three
 * documents, so the order page showed a ৳3,450 invoice marked Paid and no sign of
 * the ৳1,800 that came back or the ৳50 conceded.
 */
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));

/** The merchant's own order: ৳3,450 total, ৳150 prepaid, ৳1,800 refused, ৳50 off. */
const order = {
  _id: "order-1",
  totalAmount: 3450,
  items: [
    { productId: "p1", productName: "Cotton pant", quantity: 1, subtotal: 1500 },
    { productId: "p2", productName: "Cotton Kurta", quantity: 1, subtotal: 1800 },
  ],
  collectionDiscountNote: "Customer negotiated at the door",
  returns: [{ salesReturnId: "sr-1", at: "2026-09-05T06:00:00.000Z" }],
  collections: [
    {
      expected: 3300,
      collected: 1450,
      returnedValue: 1800,
      returnedLines: [{ productId: "p2", variantId: null, quantity: 1 }],
      discount: 50,
      stillOwed: 0,
      at: "2026-09-05T06:00:00.000Z",
    },
  ],
} as never;

describe("collection summary", () => {
  it("accounts for every taka between what was asked and what arrived", () => {
    render(<OrderCollectionSummary order={order} />);

    expect(screen.getByText("৳3,300")).toBeInTheDocument();
    expect(screen.getByText("−৳1,800")).toBeInTheDocument();
    expect(screen.getByText("−৳50")).toBeInTheDocument();
    expect(screen.getByText("৳1,450")).toBeInTheDocument();
    // The reason is the whole value of a concession.
    // Naming the line is the point — only that tells the merchant what is back
    // on the shelf.
    expect(screen.getByText("Cotton Kurta × 1")).toBeInTheDocument();
    expect(screen.getByText(/negotiated at the door/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view the sales return/i }),
    ).toBeInTheDocument();
  });

  it("renders nothing when no collection was recorded", () => {
    // An ordinary "Mark COD collected" order has no gap to explain, and an empty
    // card claiming otherwise is worse than no card.
    const { container } = render(
      <OrderCollectionSummary order={{ _id: "o" } as never} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a deliberate residual as part of the account, not a shortfall", () => {
    render(
      <OrderCollectionSummary
        order={
          {
            _id: "o",
            collections: [
              { expected: 1260, collected: 1150, stillOwed: 110 },
            ],
          } as never
        }
      />,
    );
    expect(screen.getByText(/left owing/i)).toBeInTheDocument();
    expect(screen.getByText("−৳110")).toBeInTheDocument();
  });
});
