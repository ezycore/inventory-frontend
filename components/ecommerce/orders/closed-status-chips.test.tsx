// coding-standard: maintained
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClosedStatusChips } from "./closed-status-chips";
import { isTabActive } from "./helpers";

/** The split inside the Closed tab: 11 closed = 3 cancelled + 7 rejected + 1 returned. */
const counts = { closed: 11, cancelled: 3, rejected: 7, returned: 1, pending: 1 };

describe("ClosedStatusChips", () => {
  it("shows All plus one chip per closed status, with the server's counts", () => {
    render(<ClosedStatusChips status="closed" counts={counts} onChange={() => {}} />);
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels).toEqual(["All11", "Cancelled3", "Rejected7", "Returned1"]);
    expect(screen.getByRole("button", { name: /All/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("filters to one status, and All goes back to the whole tab", () => {
    const onChange = vi.fn();
    render(<ClosedStatusChips status="rejected" counts={counts} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /Rejected/ })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /Cancelled/ }));
    expect(onChange).toHaveBeenLastCalledWith("cancelled");
    fireEvent.click(screen.getByRole("button", { name: /All/ }));
    expect(onChange).toHaveBeenLastCalledWith("closed");
  });

  it("keeps the Closed tab highlighted while a chip narrows it", () => {
    for (const status of ["closed", "cancelled", "rejected", "returned"]) {
      expect(isTabActive("closed", status)).toBe(true);
    }
  });
});
