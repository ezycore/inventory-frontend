// coding-standard: maintained

import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import enLayout from "@/messages/en/layout.json";
import bnLayout from "@/messages/bn/layout.json";

/**
 * A menu row named for a switch the shop has off. "Courier Payouts" with payouts
 * off opens a page that only shows courier CHARGES, so the row is named for what
 * it opens (shadow test S6). Identity — the English title the nav filter, ⌘K and
 * breadcrumbs key on — does not change; only the label does.
 */

const store = { user: null as { organization?: { features?: Record<string, boolean> } } | null };

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: typeof store) => unknown) => selector(store),
}));

const { useNavLabels } = await import("../use-nav-labels");

const labelFor = (title: string, locale: "en" | "bn", features?: Record<string, boolean>) => {
  store.user = features ? { organization: { features } } : null;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale={locale} messages={{ layout: locale === "en" ? enLayout : bnLayout }}>
      {children}
    </NextIntlClientProvider>
  );
  return renderHook(() => useNavLabels(), { wrapper }).result.current.itemLabel(title);
};

describe("useNavLabels — a title that follows a feature switch", () => {
  it("says Courier Charges while courier payouts are off", () => {
    expect(labelFor("Courier Payouts", "en", { courierPayouts: false })).toBe("Courier Charges");
    expect(labelFor("Courier Payouts", "bn", { courierPayouts: false })).toBe("কুরিয়ার চার্জ");
  });

  it("says Courier Payouts once they are on", () => {
    expect(labelFor("Courier Payouts", "en", { courierPayouts: true })).toBe("Courier Payouts");
    expect(labelFor("Courier Payouts", "bn", { courierPayouts: true })).toBe("কুরিয়ার পেমেন্ট");
  });

  it("does not promise payouts before the feature map has loaded", () => {
    expect(labelFor("Courier Payouts", "en")).toBe("Courier Charges");
  });

  it("leaves every other title alone", () => {
    expect(labelFor("Online Orders", "en", { courierPayouts: false })).toBe("Online Orders");
  });
});
