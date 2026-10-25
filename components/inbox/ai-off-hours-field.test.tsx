// coding-standard: maintained
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import { AiOffHoursField, type AiOffWindow } from "./ai-off-hours-field";

vi.mock("@/hooks/use-org-calendar", () => ({
  useOrgCalendar: () => ({ timezone: "Asia/Dhaka", weekStartDay: 6 }),
}));

const lunch: AiOffWindow = { days: [5, 6], start: "10:00", end: "14:00" };

describe("AiOffHoursField", () => {
  it("lists the days from the shop's own week start and marks the chosen ones", () => {
    renderWithProviders(<AiOffHoursField value={[lunch]} onChange={() => {}} />);
    const days = screen.getAllByRole("button", { pressed: true }).map((b) => b.textContent);
    expect(days).toEqual(["Sat", "Fri"]);
    expect(screen.getAllByRole("button").find((b) => b.hasAttribute("aria-pressed"))?.textContent).toBe("Sat");
    expect(screen.getByText(/Asia\/Dhaka/)).toBeInTheDocument();
  });

  it("toggles a day, but never leaves a window with no day at all", () => {
    const onChange = vi.fn();
    renderWithProviders(<AiOffHoursField value={[lunch]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Mon" }));
    expect(onChange).toHaveBeenLastCalledWith([{ ...lunch, days: [1, 5, 6] }]);

    onChange.mockClear();
    renderWithProviders(<AiOffHoursField value={[{ ...lunch, days: [5] }]} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Fri" })[1]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("adds and removes windows, up to five", () => {
    const onChange = vi.fn();
    const { unmount } = renderWithProviders(<AiOffHoursField value={[lunch]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Add off hours/ }));
    expect(onChange.mock.calls[0][0]).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Remove these off hours" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    unmount();

    renderWithProviders(<AiOffHoursField value={Array(5).fill(lunch)} onChange={onChange} />);
    expect(screen.queryByRole("button", { name: /Add off hours/ })).not.toBeInTheDocument();
  });
});
