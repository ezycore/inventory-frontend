// coding-standard: maintained
import { renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { InboxAiFlagRow } from "@/services/api";
import type { PaginatedResponse } from "@/types";
import { AiFlagsCard } from "./ai-flags-card";

/** The owner's review list of flagged AI replies: what the customer said, what the AI said, why. */
const state = vi.hoisted(() => ({ data: null as PaginatedResponse<InboxAiFlagRow> | null }));
vi.mock("@/services/api", () => ({
  useInboxAiFlags: () => ({ data: state.data, isLoading: false, isFetching: false }),
}));
vi.mock("@/hooks/use-formatters", () => ({
  useFormatters: () => ({ formatDateTime: () => "25 Oct, 10:00" }),
}));

const ROW: InboxAiFlagRow = {
  messageId: "6add6a9e0cbaf7591fc9de40",
  conversationId: "6add6a9e0cbaf7591fc9de37",
  customerName: "Karim",
  customerText: "kurti XL ache?",
  replyText: "XL nai.",
  replyAt: "2026-10-25T03:00:00.000Z",
  reason: "wrong_info",
  note: "XL is in stock",
  flaggedAt: "2026-10-25T04:00:00.000Z",
  flaggedBy: "Nusrat Jahan",
};

const page = (items: InboxAiFlagRow[]): PaginatedResponse<InboxAiFlagRow> => ({
  items,
  total: items.length,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
});

describe("AiFlagsCard", () => {
  it("shows each flag with the customer's message, the AI's reply, the reason and a link to the chat", () => {
    state.data = page([ROW, { ...ROW, messageId: "6add6a9e0cbaf7591fc9de41", customerName: null, flaggedBy: null, note: null }]);
    renderWithProviders(<AiFlagsCard />);
    expect(screen.getAllByText("kurti XL ache?")).toHaveLength(2);
    expect(screen.getAllByText("XL nai.")).toHaveLength(2);
    expect(screen.getAllByText("Wrong information")).toHaveLength(2);
    expect(screen.getByText("“XL is in stock”")).toBeInTheDocument();
    expect(screen.getByText("Flagged by Nusrat Jahan · 25 Oct, 10:00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open chat with Karim" })).toHaveAttribute("href", "/inbox?chat=6add6a9e0cbaf7591fc9de37");
    expect(screen.getByRole("link", { name: "Open chat with the customer" })).toBeInTheDocument();
  });

  it("says so when nothing has been flagged", () => {
    state.data = page([]);
    renderWithProviders(<AiFlagsCard />);
    expect(screen.getByText("No reply has been flagged yet.")).toBeInTheDocument();
  });
});
