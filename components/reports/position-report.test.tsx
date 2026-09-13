// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PositionReport } from "./position-report";

/**
 * The position report's asset rows must sum to the total they print.
 *
 * `assets.withCourier` is kept OUT of `assets.cash` (it is not spendable) and IN
 * `assets.total` (it is still an asset). So a report that renders cash, stock and receivables
 * but not with-courier prints rows that visibly do not add up to their own total — and the
 * missing line is the one a COD merchant most needs to see.
 */
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/currency", () => ({
  useCurrency: () => ({ format: (n: number) => `BDT ${n}` }),
}));

const position = (withCourier: number) => ({
  assets: {
    cash: 10000,
    accountCount: 2,
    withCourier,
    stockValue: 40000,
    receivables: 2000,
    receivableCount: 1,
    total: 52000 + withCourier,
  },
  liabilities: {
    payables: 1000,
    payableCount: 1,
    customerCredit: 0,
    total: 1000,
  },
  netPosition: 51000 + withCourier,
  basis: { stockTracked: true, cashTracked: true },
});

const mockReport = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock("@/services/api", () => ({
  usePositionReport: () => ({ data: mockReport.current, isLoading: false }),
}));

describe("PositionReport", () => {
  it("shows COD held by a courier as its own asset row", () => {
    mockReport.current = position(6000);
    render(<PositionReport />);
    expect(screen.getByText("withCourier")).toBeInTheDocument();
    expect(screen.getByText("BDT 6000")).toBeInTheDocument();
    // Cash keeps its own figure — the two are never merged.
    expect(screen.getByText("BDT 10000")).toBeInTheDocument();
  });

  it("drops the row when no courier is holding anything", () => {
    mockReport.current = position(0);
    render(<PositionReport />);
    expect(screen.queryByText("withCourier")).not.toBeInTheDocument();
  });
});
