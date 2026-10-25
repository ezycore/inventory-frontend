// coding-standard: maintained
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { NotificationEventRow } from "@/types/api";
import { NotificationChannelCell } from "./notification-channel-cell";

/** The "In ezycore" (bell) box: a real switch where the event offers it, a dash where it does not. */
const row = (merchant: NotificationEventRow["channels"]["merchant"]): NotificationEventRow =>
  ({
    key: "order.placed",
    domain: "storefront",
    category: "transactional",
    mandatory: false,
    audiences: ["merchant"],
    vars: [],
    channels: { merchant },
    smsPreview: {},
    smsEditable: [],
  }) as NotificationEventRow;

const cell = (r: NotificationEventRow, onToggle = vi.fn()) =>
  renderWithProviders(
    <NotificationChannelCell row={r} audience="merchant" channel="inApp" smsAvailable pending={false} onToggle={onToggle} />,
  );

describe("NotificationChannelCell — the bell box", () => {
  it("is a checkbox the merchant can switch on an event that rings the bell", () => {
    const onToggle = vi.fn();
    cell(row({ email: true, sms: false, inApp: true }), onToggle);
    const box = screen.getByRole("checkbox", { name: "order.placed merchant inApp" });
    expect(box).toBeChecked();
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalled();
  });

  it("is a dash on an event without a bell — not an 'off' box", () => {
    cell(row({ email: true, sms: false }));
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
