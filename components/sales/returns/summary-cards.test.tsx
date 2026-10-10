// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SummaryCards } from "./summary-cards";

/**
 * G8 (backend `docs/features/business-modes.md`): the returns value card showed THIS MONTH's
 * figure (৳13,430) beside an all-time count, under "total refunded" — UriiBaba's 43 returns
 * total ৳35,030, and most of them refunded nothing.
 */
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${Object.values(values).join(" ")}` : key,
}));

const summary = {
  allTime: { returnsCount: 43, totalRefunds: 35030, totalCashRefunded: 0 },
  thisMonth: { returnsCount: 20, totalRefunds: 13430 },
  pending: { returnsCount: 0 },
} as never;

describe("returns summary cards (G8)", () => {
  it("shows the all-time value, with this month in the caption", () => {
    render(
      <SummaryCards
        summary={summary}
        isLoading={false}
        isAccountsEnabled={false}
        formatCurrency={(n) => `৳${n}`}
      />,
    );
    expect(screen.getByText("৳35030")).toBeInTheDocument();
    expect(screen.getByText("allTimeThisMonth ৳13430")).toBeInTheDocument();
    expect(screen.queryByText("totalRefunded")).toBeNull();
  });
});
