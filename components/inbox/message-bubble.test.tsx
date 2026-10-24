// coding-standard: maintained
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { InboxMessage } from "@/services/api";
import { MessageBubble } from "./message-bubble";

vi.mock("@/hooks/use-formatters", () => ({
  useFormatters: () => ({ formatDateTime: () => "23 Oct, 10:15" }),
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

  it("names a voice message instead of showing a broken player", () => {
    renderWithProviders(<MessageBubble message={message({ attachments: [{ type: "audio", url: "https://x" }] })} />);
    expect(screen.getByText("Voice message — open it in Meta Business Suite")).toBeInTheDocument();
  });
});
