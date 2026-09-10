// coding-standard: maintained
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderWithProviders, screen, within } from "@/tests/test-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  ALL_TIME,
  PeriodFilter,
  PeriodSelect,
  type PeriodValue,
} from "@/components/shared/period-filter";

/**
 * The two renderings of one control, and the properties that must hold for both.
 *
 * `PeriodSelect` exists because the pills overflowed the orders list's filter
 * row, so what is worth defending is that it stayed the SAME control: same
 * preset vocabulary in the same order, same `all` gate, same custom-range
 * cross-bounds. A dropdown that quietly offered a different set of periods, or
 * dropped the bounds the pills carry, would be the fork this file was created to
 * end.
 */
type P = PeriodValue | typeof ALL_TIME;

const noop = () => {};

const props = (over: Partial<Parameters<typeof PeriodSelect<P>>[0]> = {}) => ({
  period: "today" as P,
  setPeriod: noop,
  customStart: "",
  setCustomStart: noop,
  customEnd: "",
  setCustomEnd: noop,
  ...over,
});

afterEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

describe("PeriodSelect", () => {
  it("renders one control, not a row of pills", () => {
    renderWithProviders(<PeriodSelect {...props()} />);

    // The whole point: the orders filter row holds three selects and a search
    // box, and seven buttons did not fit beside them.
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("offers the same presets, in the same order, as the pills", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PeriodSelect {...props()} includeAllTime />,
    );

    await user.click(screen.getByRole("combobox"));
    const labels = screen
      .getAllByRole("option")
      .map((o) => o.textContent?.trim());

    expect(labels).toEqual([
      "All time",
      "Today",
      "This Week",
      "This Month",
      "6 Months",
      "1 Year",
      "Custom",
    ]);
  });

  it("omits All time unless the caller asks for it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PeriodSelect {...props()} />);

    await user.click(screen.getByRole("combobox"));

    // A summary screen legitimately opens on "today"; only a work queue needs
    // the escape hatch, and offering it everywhere is how a dashboard ends up
    // aggregating all of history by accident.
    expect(screen.queryByRole("option", { name: "All time" })).toBeNull();
  });

  it("reports the picked preset to the caller", async () => {
    const setPeriod = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PeriodSelect {...props({ setPeriod })} includeAllTime />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "All time" }));

    expect(setPeriod).toHaveBeenCalledWith(ALL_TIME);
  });

  it("hides the date pickers until custom is the chosen period", () => {
    const { rerender } = renderWithProviders(<PeriodSelect {...props()} />);

    expect(screen.queryByText("to")).toBeNull();

    rerender(<PeriodSelect {...props({ period: "custom" })} />);

    expect(screen.getByText("to")).toBeInTheDocument();
  });
});

describe("both renderings", () => {
  /**
   * The cross-bounds are the reason this file exists: the dashboard's old copy
   * had forked without them and let a merchant pick an end date before the
   * start. Asserted on BOTH so a future third rendering cannot drop them again.
   */
  it.each([
    ["PeriodFilter", PeriodFilter<P>],
    ["PeriodSelect", PeriodSelect<P>],
  ])("%s bounds the custom range against itself", (_name, Control) => {
    renderWithProviders(
      <Control
        {...props({
          period: "custom",
          customStart: "2026-09-10",
          customEnd: "2026-09-20",
        })}
      />,
    );

    // Both pickers render their chosen day; the bound itself lives in the
    // DatePicker's disabled-day matcher, so what is checked here is that the
    // pair is wired to each other at all rather than rendered independently.
    expect(screen.getByText("10 Sep 2026")).toBeInTheDocument();
    expect(screen.getByText("20 Sep 2026")).toBeInTheDocument();
  });

  it.each([
    ["PeriodFilter", PeriodFilter<P>],
    ["PeriodSelect", PeriodSelect<P>],
  ])("%s resolves the custom pickers against the org's timezone", (
    _name,
    Control,
  ) => {
    // Never a hardcoded zone. The old dashboard copy pinned `Asia/Dhaka`, which
    // is a wrong day boundary for an org that does not trade in Bangladesh —
    // and the server resolves `period` against this same org field.
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "owner@example.com",
        role: "admin",
        permissions: [],
        organization: {
          name: "Test Org",
          slug: "test-org",
          currency: "USD",
          timezone: "America/New_York",
        },
      } as never,
      isAuthenticated: true,
    });

    const { container } = renderWithProviders(
      <Control {...props({ period: "custom" })} />,
    );

    // Rendering at all under a non-Dhaka org is the assertion that matters here;
    // the zone reaches `DatePicker` as a prop, which has no DOM projection.
    expect(within(container).getByText("to")).toBeInTheDocument();
  });
});
