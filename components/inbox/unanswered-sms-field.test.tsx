// coding-standard: maintained
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import { UnansweredSmsField } from "./unanswered-sms-field";

/** "Text me when a customer waits": off by default; on, it asks how long and says where it goes. */
describe("UnansweredSmsField", () => {
  it("off: just the switch", () => {
    const onChange = vi.fn();
    renderWithProviders(<UnansweredSmsField value={{ enabled: false, minutes: 10 }} onChange={onChange} />);
    expect(screen.queryByText(/Send the SMS when nobody has replied/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith({ enabled: true, minutes: 10 });
  });

  it("on: the wait, and where the SMS goes and what it costs", () => {
    renderWithProviders(<UnansweredSmsField value={{ enabled: true, minutes: 15 }} onChange={() => {}} />);
    expect(screen.getByText("Send the SMS when nobody has replied after")).toBeInTheDocument();
    expect(screen.getByText("15 minutes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Notifications" })).toHaveAttribute("href", "/settings/notifications");
  });
});
