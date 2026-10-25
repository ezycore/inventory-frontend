// coding-standard: maintained
import { renderWithProviders, screen } from "@/tests/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { InboxAiCredit } from "@/services/api";
import { AiCreditCard, aiCreditProblem, formatPaisa } from "./ai-credit-card";

/**
 * The AI credit card — the balance in ৳, "≈ N replies left", and the one reason the AI is stopped
 * when it is: no price yet, credit used up, or credit expired. Each has a different fix, so the
 * card must never say "replies left" while one of them applies.
 */
const credit = vi.hoisted(() => ({ current: null as InboxAiCredit | null }));
vi.mock("@/services/api", () => ({
  useInboxAiCredit: () => ({ data: credit.current, isLoading: false }),
}));

const RATES = { inputPaisaPer1k: 1.25, outputPaisaPer1k: 6 };
const TERMS = { version: "2026-10-24.1", en: "AI credit is prepaid.", bn: "এআই ক্রেডিট প্রিপেইড।" };
const base: InboxAiCredit = {
  paisa: 50_000,
  expiresAt: "2027-04-22T00:00:00.000Z",
  expired: false,
  repliesLeft: 10_000,
  typicalReplyPaisa: 7,
  replyPaisaRange: { low: 5, high: 8 },
  rates: RATES,
  terms: TERMS,
};

describe("AiCreditCard", () => {
  it("reads whole paisa as Taka", () => {
    expect(formatPaisa(50_000)).toBe("৳500.00");
    expect(formatPaisa(5)).toBe("৳0.05");
  });

  it("names the one reason the AI is stopped, in the order a merchant can act on", () => {
    expect(aiCreditProblem(base)).toBeNull();
    expect(aiCreditProblem({ ...base, rates: null, terms: null })).toBe("no_rates");
    expect(aiCreditProblem({ ...base, expired: true })).toBe("expired");
    expect(aiCreditProblem({ ...base, paisa: 0, repliesLeft: 0 })).toBe("empty");
  });

  it("shows the balance, replies left and the price per reply", () => {
    credit.current = base;
    renderWithProviders(<AiCreditCard />);
    expect(screen.getByText("৳500.00")).toBeInTheDocument();
    expect(screen.getByText(/10,000 replies left/)).toBeInTheDocument();
    // A range, never one number (owner 2026-10-25).
    expect(screen.getByText(/usually costs 5–8 paisa/)).toBeInTheDocument();
  });

  it("says the credit is used up instead of counting replies", () => {
    credit.current = { ...base, paisa: 0, repliesLeft: 0 };
    renderWithProviders(<AiCreditCard />);
    expect(screen.getByText(/AI credit is used up/)).toBeInTheDocument();
    expect(screen.queryByText(/replies left/)).not.toBeInTheDocument();
  });
});
