// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@ui/components/calendar";

/* The dropdown caption, pinned to a fixed month so the labels are assertable.
   `startMonth`/`endMonth` are what decide the year list — see the DatePicker,
   which always supplies them. */
const renderCaption = () =>
  render(
    <Calendar
      mode="single"
      captionLayout="dropdown"
      month={new Date(2026, 8, 1)}
      onMonthChange={() => {}}
      startMonth={new Date(2020, 0, 1)}
      endMonth={new Date(2030, 11, 31)}
    />,
  );

describe("Calendar dropdown caption", () => {
  /* The regression this guards. react-day-picker's stock caption is a native
     `<select>` held at `opacity-0` over a styled label: the trigger picks up the
     theme and the list it opens is the browser's own OS menu, which no
     stylesheet can reach. Restyling cannot fix that — only replacing the
     control can, so a native select reappearing here IS the bug. */
  it("renders no native select", () => {
    renderCaption();
    expect(document.querySelector("select")).toBeNull();
  });

  it("renders month and year as themed comboboxes showing the current month", () => {
    renderCaption();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getByText("Sep")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  /* The caption controls sit UNDER the nav bar, which is absolutely positioned
     across the full width of the same 32px row and holds only the two arrows —
     so its empty middle is an invisible sheet over the month/year controls. It
     stayed hidden while the caption was a native `<select>`, because that select
     was itself absolute and later in the DOM, so it painted above the bar. An
     in-flow Radix trigger has no such luck: drop `pointer-events-none` and the
     dropdowns go dead with nothing on screen to explain why.

     jsdom does no hit-testing, so this asserts the arrangement rather than a
     click — the overlap is precisely what a click cannot see. */
  it("keeps the nav bar from swallowing clicks meant for the caption", () => {
    renderCaption();
    const nav = document.querySelector(".rdp-nav") as HTMLElement;
    const dropdowns = document.querySelector(".rdp-dropdowns") as HTMLElement;

    // The arrangement that makes the guard necessary: an absolute bar, painted
    // over a caption that comes after it in the document.
    expect(nav.classList.contains("absolute")).toBe(true);
    expect(nav.compareDocumentPosition(dropdowns)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    // The guard itself, and the arrows opting back in.
    expect(nav.classList.contains("pointer-events-none")).toBe(true);
    const arrows = [...nav.querySelectorAll("button")];
    expect(arrows).toHaveLength(2);
    for (const arrow of arrows) {
      expect(arrow.classList.contains("pointer-events-auto")).toBe(true);
    }
  });

  /* The plain caption must stay plain — the range picker still uses it. */
  it('leaves captionLayout="label" as a text caption with no comboboxes', () => {
    render(
      <Calendar
        mode="single"
        month={new Date(2026, 8, 1)}
        onMonthChange={() => {}}
      />,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
