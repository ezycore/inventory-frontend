// coding-standard: maintained
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { MerchantAlert, MerchantAlertBell } from "@/services/api";
import { NotificationBell } from "./notification-bell";

/** The top-bar bell: a count, the alerts in words, and a click that opens the order or chat. */
const state = vi.hoisted(() => ({
  bell: null as MerchantAlertBell | null,
  push: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("@/services/api", () => ({
  useNotificationBell: () => ({ data: state.bell }),
  useMarkAlertRead: () => ({ mutate: state.markRead }),
  useMarkAllAlertsRead: () => ({ mutate: state.markAllRead }),
}));
vi.mock("@/hooks/use-formatters", () => ({
  useFormatters: () => ({ formatDateTime: () => "24 Oct, 10:00" }),
}));

const alert = (over: Partial<MerchantAlert>): MerchantAlert => ({
  _id: "6add6a9e0cbaf7591fc9de40",
  eventKey: "order.placed",
  data: { order_number: "ORD-20261025-00012", total_amount: "৳1,450", customer_name: "Karim" },
  link: { kind: "order", id: "6add6a9e0cbaf7591fc9de37" },
  createdAt: new Date().toISOString(),
  read: false,
  ...over,
});

describe("NotificationBell", () => {
  it("shows the unread count and each alert in words", () => {
    state.bell = {
      unread: 2,
      items: [
        alert({}),
        alert({
          _id: "6add6a9e0cbaf7591fc9de41",
          eventKey: "inbox.handover",
          data: { customer_name: "Tasnim", reason: "Customer is unhappy with the delivery" },
          link: { kind: "chat", id: "6add6a9e0cbaf7591fc9de38" },
        }),
      ],
    };
    renderWithProviders(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));
    expect(screen.getByText("New online order ORD-20261025-00012")).toBeInTheDocument();
    expect(screen.getByText("৳1,450 · Karim")).toBeInTheDocument();
    expect(screen.getByText("Tasnim needs a reply")).toBeInTheDocument();
    expect(screen.getByText("Customer is unhappy with the delivery")).toBeInTheDocument();
  });

  it("opening an alert marks it read and goes to the chat", () => {
    state.bell = {
      unread: 1,
      items: [
        alert({ eventKey: "inbox.handover", data: { customer_name: "Tasnim" }, link: { kind: "chat", id: "c9" } }),
      ],
    };
    renderWithProviders(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    fireEvent.click(screen.getByText("Tasnim needs a reply"));
    expect(state.markRead).toHaveBeenCalledWith("6add6a9e0cbaf7591fc9de40");
    expect(state.push).toHaveBeenCalledWith("/inbox?chat=c9");
  });

  it("mark all read, and an empty bell says what will show up", () => {
    state.bell = { unread: 1, items: [alert({})] };
    const { unmount } = renderWithProviders(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(state.markAllRead).toHaveBeenCalled();
    unmount();

    state.bell = { unread: 0, items: [] };
    renderWithProviders(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText(/Nothing new/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
  });
});
