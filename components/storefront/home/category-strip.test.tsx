// coding-standard: maintained
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryStrip } from "@/components/storefront/home/category-strip";

vi.mock("@/services/storefront/ui-context", () => ({
  useStorefrontUI: () => ({ t: { previousCategories: "Previous", nextCategories: "Next" } }),
}));

const labels = { previous: "Previous", next: "Next" };

/**
 * Both arrows are always in the markup while arrows are on; the one with
 * nowhere to go is DISABLED, which the shared stylesheet hides
 * (`.sf-cat-strip-arrow:disabled`) and a theme may keep greyed out in place
 * (Showroom's heading-row arrows).
 */
describe("CategoryStrip arrows", () => {
  it("draws both, disabled, while the row fits", () => {
    render(
      <CategoryStrip align="left" gap={16} arrowLabels={labels}>
        <div>A</div>
        <div>B</div>
      </CategoryStrip>,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("enables the side there is more on", () => {
    const { container } = render(
      <CategoryStrip align="left" gap={16} arrowLabels={labels}>
        <div>A</div>
        <div>B</div>
      </CategoryStrip>,
    );
    const track = container.querySelector(".sf-cat-strip-track") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { configurable: true, value: 900 });
    Object.defineProperty(track, "clientWidth", { configurable: true, value: 300 });
    fireEvent.scroll(track);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("draws none when arrows are off", () => {
    render(
      <CategoryStrip align="left" gap={16} arrows={false} arrowLabels={labels}>
        <div>A</div>
      </CategoryStrip>,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
