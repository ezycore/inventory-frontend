// coding-standard: maintained

import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import enLayout from "@/messages/en/layout.json";
import bnLayout from "@/messages/bn/layout.json";
import { navGroups, NAV_TITLE_WHEN_FEATURE_OFF } from "@/constants/navItem";
import { navLabelKey } from "@/lib/nav-utils";
import type { NavItem } from "@/types/layout";

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

/**
 * A nav title with no message key falls back to its English title (by design, so a new item
 * still renders) — which is how five menu items reached the Bangla sidebar in English: Orders
 * Report, Tags, Notifications, Support Access, Meta Ad Reporting (shadow test S28). The fallback
 * stays; this makes a missing key a red test instead of a silent English label.
 */
describe("every menu label has a message in both languages", () => {
  const itemTitles = (items: NavItem[]): string[] =>
    items.flatMap((item) => [
      item.title,
      ...(item.titleWithoutPos ? [item.titleWithoutPos] : []),
      ...itemTitles(item.items ?? []),
    ]);
  const titles = [
    ...new Set([
      ...navGroups.flatMap((group) => itemTitles(group.items)),
      ...Object.values(NAV_TITLE_WHEN_FEATURE_OFF).map((alt) => alt.title),
    ]),
  ];
  const groupLabels = [
    ...new Set(
      navGroups
        .flatMap((group) => [group.label, ...(group.labelWhenOff ? [group.labelWhenOff.label] : [])])
        // The top group has no heading at all.
        .filter(Boolean),
    ),
  ];
  const locales = { en: enLayout.nav, bn: bnLayout.nav } as Record<
    string,
    { items: Record<string, string>; groups: Record<string, string> }
  >;

  for (const [locale, nav] of Object.entries(locales)) {
    it(`${locale}: every item title`, () => {
      expect(titles.filter((title) => !nav.items[navLabelKey(title)])).toEqual([]);
    });

    it(`${locale}: every group label`, () => {
      expect(groupLabels.filter((label) => !nav.groups[navLabelKey(label)])).toEqual([]);
    });
  }
});
