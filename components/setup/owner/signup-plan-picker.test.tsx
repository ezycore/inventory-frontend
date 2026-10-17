// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { renderWithProviders, screen } from "@/tests/test-utils";
import type { AvailablePlan } from "@/types";
import { SignupPlanPicker } from "./signup-plan-picker";

/** The live tier ladder: three packages, each sold monthly and yearly. */
const plan = (
  group: string,
  rank: number,
  interval: "month" | "year",
  amount: number,
  maxUsers: number,
): AvailablePlan => ({
  id: `${group}-${interval}`,
  name: group[0].toUpperCase() + group.slice(1),
  slug: `${group}-${interval === "month" ? "monthly" : "yearly"}-v2`,
  interval,
  amount,
  currency: "BDT",
  group,
  groupRank: rank,
  modules: [],
  features: [],
  limits: { maxLocations: rank, maxUsers, maxInventoryProducts: 0 },
});
const PLANS = [
  plan("start", 1, "month", 399, 3),
  plan("start", 1, "year", 3990, 3),
  plan("growth", 2, "month", 599, 8),
  plan("growth", 2, "year", 5990, 8),
  plan("business", 3, "month", 999, 0),
  plan("business", 3, "year", 9990, 0),
];

function Harness({ initial, onChange }: { initial: string; onChange: (s: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <SignupPlanPicker
      plans={PLANS}
      value={value}
      onChange={(slug) => {
        setValue(slug);
        onChange(slug);
      }}
    />
  );
}

describe("SignupPlanPicker", () => {
  it("shows one card per package with its price and limits, the picked one checked", () => {
    renderWithProviders(<Harness initial="growth-monthly-v2" onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.textContent?.split("৳")[0])).toEqual(["Start", "Growth", "Business"]);
    expect(screen.getByRole("radio", { name: /Growth/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Business/ }).textContent).toContain("Unlimited");
  });

  it("picks another package on click", async () => {
    const onChange = vi.fn();
    renderWithProviders(<Harness initial="start-monthly-v2" onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: /Business/ }));
    expect(onChange).toHaveBeenLastCalledWith("business-monthly-v2");
  });

  it("switching to yearly keeps the package and moves to its yearly plan", async () => {
    const onChange = vi.fn();
    renderWithProviders(<Harness initial="growth-monthly-v2" onChange={onChange} />);
    await userEvent.click(screen.getByRole("tab", { name: /Yearly/ }));
    expect(onChange).toHaveBeenLastCalledWith("growth-yearly-v2");
    expect(screen.getByRole("radio", { name: /Growth/ }).textContent).toContain("5,990");
  });
});
