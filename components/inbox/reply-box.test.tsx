// coding-standard: maintained
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReplyBox } from "./reply-box";

/**
 * The reply box enforces nothing the server does not — but it must not offer a reply Facebook
 * will refuse (the 24-hour rule), and Enter must send while Shift+Enter must not.
 */
const mutate = vi.fn();
vi.mock("@/services/api", () => ({
  useReplyInbox: () => ({ mutate, isPending: false }),
}));
vi.mock("@/hooks/use-formatters", () => ({
  useFormatters: () => ({ formatDateTime: () => "23 Oct, 18:00" }),
}));

beforeEach(() => mutate.mockClear());

describe("ReplyBox", () => {
  it("replaces the box with the reason once Facebook's window has closed", () => {
    renderWithProviders(<ReplyBox conversationId="c1" canReply={false} windowClosesAt={null} />);
    expect(screen.getByText(/within 24 hours of the customer's last message/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows until when a reply is allowed", () => {
    renderWithProviders(<ReplyBox conversationId="c1" canReply windowClosesAt="2026-10-23T12:00:00Z" />);
    expect(screen.getByText("You can reply until 23 Oct, 18:00")).toBeInTheDocument();
  });

  it("sends on Enter, keeps Shift+Enter for a new line, and never sends blank text", () => {
    renderWithProviders(<ReplyBox conversationId="c1" canReply windowClosesAt="2026-10-23T12:00:00Z" />);
    const box = screen.getByRole("textbox");

    fireEvent.keyDown(box, { key: "Enter" });
    expect(mutate).not.toHaveBeenCalled();

    fireEvent.change(box, { target: { value: "Ji, L size ache" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(mutate).not.toHaveBeenCalled();

    fireEvent.keyDown(box, { key: "Enter" });
    expect(mutate).toHaveBeenCalledWith("Ji, L size ache", expect.anything());
  });
});
