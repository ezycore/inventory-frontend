// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CashSummaryCards } from "./cash-summary-cards";
import type { CashReport } from "@/types/api";

/**
 * The cash report's tiles, against money the merchant does not hold.
 *
 * `summary.totalBalance` stopped including `courier_clearing` when the remittance work
 * shipped, and `withCourier` arrived beside it. An added response field is never a compile
 * error, so the first COD parcel a courier held simply made the headline figure drop with
 * nothing on screen to read it against — on a COD business, most of a week's takings.
 *
 * Zero is not the same case: a merchant who ships no COD should not carry a permanently-empty
 * tile, so the row only appears when there is something in it.
 */
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/currency", () => ({
  useCurrency: () => ({ format: (n: number) => `BDT ${n}` }),
}));

// The real shape, not a cast through `unknown`: a fixture that drifts from the generated type is
// a test that keeps passing after the contract moves.
const summary = (withCourier: number): CashReport["summary"] => ({
  totalBalance: 12000,
  withCourier,
  accountCount: 3,
  totalIncome: 5000,
  totalExpense: 2000,
  netCashFlow: 3000,
  incomeCount: 12,
  expenseCount: 4,
  previousIncome: 4000,
  previousExpense: 1500,
  capitalIn: 0,
  capitalOut: 0,
  netCapital: 0,
});

describe("CashSummaryCards", () => {
  it("reports money with a courier separately from the cash total", () => {
    render(<CashSummaryCards summary={summary(5250)} capitalCount={0} />);
    expect(screen.getByText("withCourier")).toBeInTheDocument();
    expect(screen.getByText("BDT 5250")).toBeInTheDocument();
    // The headline figure is the merchant's own money and must not have absorbed it.
    expect(screen.getByText("BDT 12000")).toBeInTheDocument();
  });

  it("drops the tile when no courier is holding anything", () => {
    render(<CashSummaryCards summary={summary(0)} capitalCount={0} />);
    expect(screen.queryByText("withCourier")).not.toBeInTheDocument();
  });
});
