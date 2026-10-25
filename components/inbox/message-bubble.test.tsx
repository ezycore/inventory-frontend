// coding-standard: maintained
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { InboxMessage } from "@/services/api";
import { MessageBubble } from "./message-bubble";

vi.mock("@/hooks/use-formatters", () => ({
  useFormatters: () => ({ formatDateTime: () => "23 Oct, 10:15" }),
}));

const flagMutate = vi.hoisted(() => vi.fn());
vi.mock("@/services/api", async (importActual) => ({
  ...(await importActual<typeof import("@/services/api")>()),
  useFlagInboxReply: () => ({ mutate: flagMutate, isPending: false }),
  useUnflagInboxReply: () => ({ mutate: vi.fn(), isPending: false }),
}));

const message = (over: Partial<InboxMessage>): InboxMessage =>
  ({
    organizationId: "o1",
    conversationId: "c1",
    platform: "messenger",
    role: "customer",
    attachments: [],
    deliveryStatus: "received",
    at: "2026-10-23T04:15:00Z",
    ...over,
  }) as InboxMessage;

describe("MessageBubble", () => {
  it("marks a reply typed in Meta's own inbox", () => {
    renderWithProviders(
      <MessageBubble message={message({ role: "staff", source: "platform_inbox", text: "ji ache" })} />,
    );
    expect(screen.getByText(/Replied from Facebook/)).toBeInTheDocument();
  });

  it("marks a reply the AI wrote, so staff can tell it from their own", () => {
    renderWithProviders(<MessageBubble message={message({ role: "ai", text: "Ji ache!" })} />);
    expect(screen.getByText(/· AI$/)).toBeInTheDocument();
  });

  it("falls back to a Meta Business Suite note when a photo link has expired", () => {
    renderWithProviders(
      <MessageBubble message={message({ attachments: [{ type: "image", url: "https://cdn.example/x.jpg" }] })} />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Photo" }));
    expect(screen.getByText("Photo — open it in Meta Business Suite")).toBeInTheDocument();
  });

  it("shows an order the AI took as a staff note linking to the order, not as a sent bubble", () => {
    renderWithProviders(
      <MessageBubble
        message={message({ role: "system", orderId: "ord1", text: "AI placed order ORD-1 — ৳1980, cash on delivery, pending." })}
      />,
    );
    expect(screen.getByText(/AI took an order/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View order" })).toHaveAttribute("href", "/ecommerce/orders/ord1");
    // The backend's English log line is not what staff read.
    expect(screen.queryByText(/AI placed order ORD-1/)).not.toBeInTheDocument();
  });

  it("names a voice message instead of showing a broken player", () => {
    renderWithProviders(<MessageBubble message={message({ attachments: [{ type: "audio", url: "https://x" }] })} />);
    expect(screen.getByText("Voice message — open it in Meta Business Suite")).toBeInTheDocument();
  });

  it("lets someone who may reply flag an AI reply — never a customer's or staff's message", () => {
    renderWithProviders(<MessageBubble message={message({ _id: "m1", role: "ai", text: "XL nai." })} conversationId="c1" canFlag />);
    fireEvent.click(screen.getByRole("button", { name: /Flag/ }));
    fireEvent.click(screen.getByLabelText("Should have passed to staff"));
    fireEvent.click(screen.getByRole("button", { name: "Save flag" }));
    expect(flagMutate).toHaveBeenCalledWith({ messageId: "m1", reason: "missed_handover" }, expect.anything());

    renderWithProviders(<MessageBubble message={message({ _id: "m2", role: "customer", text: "ache?" })} conversationId="c1" canFlag />);
    renderWithProviders(<MessageBubble message={message({ _id: "m3", role: "staff", text: "ji" })} conversationId="c1" canFlag />);
    expect(screen.getAllByRole("button", { name: /Flag/ })).toHaveLength(1);
  });

  it("'Other' cannot be saved without saying what was wrong", () => {
    renderWithProviders(<MessageBubble message={message({ _id: "m1", role: "ai", text: "x" })} conversationId="c1" canFlag />);
    fireEvent.click(screen.getByRole("button", { name: /Flag/ }));
    fireEvent.click(screen.getByLabelText("Other"));
    expect(screen.getByRole("button", { name: "Save flag" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Gave a wrong delivery time" } });
    expect(screen.getByRole("button", { name: "Save flag" })).toBeEnabled();
  });

  it("shows a flag to everyone, including someone who may only read the chat", () => {
    const flagged = message({
      _id: "m1",
      role: "ai",
      text: "XL nai.",
      aiFlag: { reason: "wrong_info", flaggedBy: "u1", flaggedAt: "2026-10-25T04:00:00Z" },
    });
    renderWithProviders(<MessageBubble message={flagged} conversationId="c1" />);
    expect(screen.getByText("Flagged: Wrong information")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Flag/ })).not.toBeInTheDocument();
  });
});
