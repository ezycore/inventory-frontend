// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderReturnsPanel } from "./order-returns-panel";

/**
 * D6 (backend `docs/features/business-modes.md`): an online order lists its own returns, each
 * opening its return document — the counter's Sales Returns page is gone for a shop that sells only
 * online.
 */
const requested = vi.hoisted(() => [] as string[]);
vi.mock("@/services/api", () => ({
  useSalesReturn: (id: string) => {
    if (id) requested.push(id);
    return { data: undefined, isLoading: !!id };
  },
}));
vi.mock("@/services/stores/use-auth-store", () => {
  const state = { user: { organization: { currency: "BDT", timezone: "Asia/Dhaka" } } };
  // A selector hook that also answers `getState()`, which the order-date formatter reads.
  const useAuthStore = (selector: (s: unknown) => unknown) => selector(state);
  return { useAuthStore: Object.assign(useAuthStore, { getState: () => state }) };
});
vi.mock("@/components/sales/returns/return-details-sheet", () => ({
  ReturnDetailsSheet: ({ open }: { open: boolean }) => (open ? <div>return sheet</div> : null),
}));

const order = (returns: unknown[]) => ({ _id: "o1", returns }) as never;

describe("order returns panel (D6)", () => {
  it("renders nothing for an order with no return", () => {
    const { container } = render(<OrderReturnsPanel order={order([])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists each return and opens its document", async () => {
    const user = userEvent.setup();
    render(
      <OrderReturnsPanel
        order={order([
          { salesReturnId: "r1", amount: 450, at: "2026-10-08T14:44:29.893Z" },
          { salesReturnId: "r2", amount: 90, at: "2026-10-09T10:00:00.000Z" },
        ])}
      />,
    );
    expect(screen.getByText("Return 1")).toBeInTheDocument();
    expect(screen.getByText("Return 2")).toBeInTheDocument();

    await user.click(screen.getByText("Return 2"));
    expect(requested).toContain("r2");
    expect(screen.getByText("return sheet")).toBeInTheDocument();
  });
});
