// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/tests/test-utils";
import type { AdminStorefrontOrder } from "@/services/api";
import { OrderActivityLog } from "./order-activity-log";

const order = {
  createdAt: "2026-09-28T10:45:00.000Z",
  statusHistory: [
    { status: "processing", at: "2026-09-28T12:45:00.000Z", by: "system" },
    {
      status: "delivered",
      at: "2026-10-14T06:00:43.000Z",
      by: "6abcd0a0ca78a12c15364426",
      note: "Customer collected it from our office",
    },
  ],
} as unknown as AdminStorefrontOrder;

describe("OrderActivityLog", () => {
  it("shows a step's note under it (shadow test S15: the hand-over note was saved but never shown)", () => {
    renderWithProviders(<OrderActivityLog order={order} />);
    expect(screen.getByText("Customer collected it from our office")).toBeInTheDocument();
  });

  it("a step without a note renders no empty note line", () => {
    const { container } = renderWithProviders(<OrderActivityLog order={order} />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });
});
