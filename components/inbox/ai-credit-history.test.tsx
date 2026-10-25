// coding-standard: maintained
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { InboxAiCreditDay, InboxAiCreditHistory } from "@/services/api";
import { AiCreditHistory } from "./ai-credit-history";

/**
 * The merchant's AI-credit history: spend per shop-calendar day (opening into that day's chats,
 * each a link to the thread) and the credit added or removed.
 */
const state = vi.hoisted(() => ({
  history: null as InboxAiCreditHistory | null,
  day: null as InboxAiCreditDay | null,
  openedDay: null as string | null,
}));
vi.mock("@/services/api", () => ({
  useInboxAiCreditHistory: () => ({ data: state.history, isLoading: false }),
  useInboxAiCreditDay: (date: string | null) => {
    state.openedDay = date;
    return { data: date ? state.day : undefined, isLoading: false };
  },
}));
vi.mock("@/hooks/use-org-calendar", () => ({
  useOrgCalendar: () => ({ timezone: "Asia/Dhaka", weekStartDay: 6 }),
}));

const HISTORY: InboxAiCreditHistory = {
  timezone: "Asia/Dhaka",
  days: 30,
  totals: { replies: 45, paisa: 586 },
  usage: [
    { date: "2026-10-25", replies: 42, paisa: 546 },
    { date: "2026-10-24", replies: 3, paisa: 40 },
  ],
  credits: [
    { at: "2026-10-24T05:00:00.000Z", paisa: -120, balanceAfter: 380 },
    { at: "2026-10-20T05:00:00.000Z", paisa: 500, balanceAfter: 500 },
  ],
};

const DAY: InboxAiCreditDay = {
  date: "2026-10-25",
  timezone: "Asia/Dhaka",
  totals: { replies: 42, paisa: 546 },
  chats: [
    { conversationId: "6add6a9e0cbaf7591fc9de37", customerName: "Karim", replies: 30, paisa: 400, lastAt: "2026-10-25T08:00:00.000Z" },
    { conversationId: "6add6a9e0cbaf7591fc9de38", customerName: null, replies: 12, paisa: 146, lastAt: "2026-10-25T07:00:00.000Z" },
  ],
};

describe("AiCreditHistory", () => {
  it("shows the period's totals, each day's spend and the credit added and removed", () => {
    state.history = HISTORY;
    renderWithProviders(<AiCreditHistory />);
    expect(screen.getByText(/Last 30 days: 45 AI replies · ৳5\.86/)).toBeInTheDocument();
    expect(screen.getByText("Sun, 25 Oct")).toBeInTheDocument();
    expect(screen.getByText("৳5.46")).toBeInTheDocument();
    expect(screen.getByText("Added ৳5.00")).toBeInTheDocument();
    expect(screen.getByText(/Removed ৳1\.20/)).toBeInTheDocument();
    expect(screen.getByText("Balance ৳3.80")).toBeInTheDocument();
  });

  it("opens a day into its chats, each linking to the thread, and only fetches it when opened", () => {
    state.history = HISTORY;
    state.day = DAY;
    renderWithProviders(<AiCreditHistory />);
    expect(state.openedDay).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Sun, 25 Oct/ }));

    expect(state.openedDay).toBe("2026-10-25");
    expect(screen.getByRole("link", { name: "Karim" })).toHaveAttribute("href", "/inbox?chat=6add6a9e0cbaf7591fc9de37");
    // A chat Meta gave no name for still reads as someone.
    expect(screen.getByRole("link", { name: "Customer" })).toHaveAttribute("href", "/inbox?chat=6add6a9e0cbaf7591fc9de38");
  });

  it("says so when nothing was charged and no credit came in", () => {
    state.history = { ...HISTORY, totals: { replies: 0, paisa: 0 }, usage: [], credits: [] };
    renderWithProviders(<AiCreditHistory />);
    expect(screen.getByText("No AI replies were charged in this period.")).toBeInTheDocument();
    expect(screen.getByText("No credit has been added yet.")).toBeInTheDocument();
  });
});
