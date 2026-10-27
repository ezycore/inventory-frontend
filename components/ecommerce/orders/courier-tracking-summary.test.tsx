// coding-standard: maintained
import { renderWithProviders as render, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { AdminStorefrontOrder } from "@/services/api";
import { CourierTrackingSummary } from "./courier-tracking-summary";

/**
 * A parcel the courier stopped recognising (deleted in its own panel, most often) is parked by
 * the backend's status sweep after six rejections in a row (2026-10-27). Until then it sat at
 * "Shipped" forever with nothing on screen saying automatic updates had stopped.
 */
vi.mock("@/services/api", () => ({
  useRefreshTracking: () => ({ mutate: vi.fn(), isPending: false }),
}));

const shipped = (courier: Record<string, unknown>) =>
  ({
    _id: "o1",
    status: "shipped",
    courier: {
      integration: "api",
      provider: "steadfast",
      consignmentId: "310068822",
      normalizedStatus: "pending",
      ...courier,
    },
  }) as unknown as AdminStorefrontOrder;

describe("CourierTrackingSummary — parked parcel", () => {
  it("says the courier no longer recognises the parcel", () => {
    render(<CourierTrackingSummary order={shipped({ pollParkedAt: "2026-10-27T09:00:00.000Z" })} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /Steadfast no longer recognises this parcel/,
    );
    // Refresh stays: it still asks the courier, and an answer clears the flag.
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("says nothing for a parcel that is still being tracked", () => {
    render(<CourierTrackingSummary order={shipped({})} />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
