// coding-standard: maintained
import { renderWithProviders, screen, within } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { InboxConversation } from "@/services/api";
import { ConversationList } from "./conversation-list";

/** Each chat in the list says who answers it, so the merchant need not open it to find out. */
const state = vi.hoisted(() => ({
  rows: [] as InboxConversation[],
  summary: { unreadConversations: 0, aiActive: true, aiOffNow: false },
}));
vi.mock("@/services/api", () => ({
  useInboxConversations: () => ({ data: { items: state.rows }, isLoading: false }),
  useInboxSummary: () => ({ data: state.summary }),
}));
vi.mock("@/hooks/use-formatters", () => ({
  useFormatters: () => ({ formatDate: (_: string, pattern: string) => pattern, formatDateTime: () => "25 Oct, 10:00" }),
}));

const row = (over: Partial<InboxConversation>): InboxConversation =>
  ({
    _id: "c1",
    organizationId: "o1",
    platform: "messenger",
    externalAccountId: "p1",
    externalUserId: "u1",
    owner: "ai",
    lastMessageAt: "2026-10-25T04:00:00Z",
    unreadCount: 0,
    replyWindowClosesAt: null,
    canReply: true,
    ...over,
  }) as InboxConversation;

const item = (name: string) => within(screen.getByText(name).closest("li") as HTMLElement);

describe("ConversationList", () => {
  it("tags each chat AI or Staff and marks the AI's last reply", () => {
    state.summary = { unreadConversations: 0, aiActive: true, aiOffNow: false };
    state.rows = [
      row({ _id: "c1", customerName: "Tasnim", lastMessageRole: "ai", lastMessagePreview: "Ji ache" }),
      row({ _id: "c2", customerName: "Karim", owner: "staff", lastMessageRole: "staff", lastMessagePreview: "Ok" }),
    ];
    renderWithProviders(<ConversationList onSelect={() => {}} />);
    expect(item("Tasnim").getByText("AI")).toBeInTheDocument();
    expect(item("Tasnim").getByText("AI: Ji ache")).toBeInTheDocument();
    expect(item("Karim").getByText("Staff")).toBeInTheDocument();
    expect(item("Karim").getByText("You: Ok")).toBeInTheDocument();
  });

  it("keeps the time short so the name fits: today's time, an older year's date", () => {
    state.summary = { unreadConversations: 0, aiActive: true, aiOffNow: false };
    state.rows = [
      row({ _id: "c1", customerName: "Tasnim", lastMessageAt: new Date().toISOString() }),
      row({ _id: "c2", customerName: "Karim", lastMessageAt: "2020-03-01T06:00:00Z" }),
    ];
    renderWithProviders(<ConversationList onSelect={() => {}} />);
    expect(item("Tasnim").getByText("h:mm a")).toHaveAttribute("title", "25 Oct, 10:00");
    expect(item("Karim").getByText("d MMM yyyy")).toBeInTheDocument();
  });

  it("shows Staff on the AI's chats during its off hours, and no tag for a shop without the AI", () => {
    state.rows = [row({ customerName: "Tasnim" })];
    state.summary = { unreadConversations: 0, aiActive: true, aiOffNow: true };
    const { unmount } = renderWithProviders(<ConversationList onSelect={() => {}} />);
    expect(item("Tasnim").getByText("Staff")).toBeInTheDocument();
    unmount();

    state.rows = [row({ customerName: "Karim", owner: "staff" })];
    state.summary = { unreadConversations: 0, aiActive: false, aiOffNow: false };
    renderWithProviders(<ConversationList onSelect={() => {}} />);
    expect(item("Karim").queryByText("Staff")).not.toBeInTheDocument();
    expect(item("Karim").queryByText("AI")).not.toBeInTheDocument();
  });
});
