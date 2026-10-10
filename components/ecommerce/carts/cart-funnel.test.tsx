// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartFunnel } from "./cart-funnel";

/**
 * G12 (backend `docs/features/business-modes.md`): every store takes guest orders, so "Signed in"
 * and "Email verified" are not funnel steps — drawn as bars they put 8 sign-ins in front of 458
 * orders.
 */
const data = {
  windowDays: 30,
  funnel: { carts: 600, reachedCheckout: 520, signedIn: 8, verified: 5, ordered: 458 },
} as never;

describe("purchase funnel (G12)", () => {
  it("draws cart → checkout → order, and reports sign-ins beside it", () => {
    render(<CartFunnel data={data} />);
    expect(screen.getByText("Built a cart")).toBeInTheDocument();
    expect(screen.getByText("Reached checkout")).toBeInTheDocument();
    expect(screen.getByText("Ordered")).toBeInTheDocument();
    expect(screen.queryByText("Signed in")).toBeNull();
    expect(screen.queryByText("Email verified")).toBeNull();
    expect(screen.getByText(/Signing in is optional/)).toHaveTextContent("8 of these carts signed in");
  });
});
