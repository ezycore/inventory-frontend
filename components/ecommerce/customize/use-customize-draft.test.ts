// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  changedParts,
  seedDraft,
  type CustomizeDraft,
} from "@/components/ecommerce/customize/use-customize-draft";

const base: CustomizeDraft = {
  ...seedDraft({
    published: true,
    allowedPaymentMethods: ["cod"],
    shippingRule: { mode: "none" },
    defaultDeliveryCost: 0,
  }),
  collections: [],
};

/** A value that differs from `v`, whatever its type. */
const other = (v: unknown): unknown =>
  typeof v === "boolean" ? !v : typeof v === "string" ? `${v}x` : v === null ? "x" : 1;

/**
 * `nav.menu` is ONE stored object edited from three rows (2026-09-29): how it
 * opens under Header, what it lists under Menu, the category sidebar under Page
 * layout. Each row's dirty slice lists its fields by hand, so a field added to
 * `ResolvedMenuSettings` and left out of every slice would be edited, shown in
 * the preview — and never saved, because no part reports it changed.
 */
describe("every menu setting belongs to exactly one part", () => {
  const menu = base.navMenu;
  const cases: [string, CustomizeDraft][] = [
    ["subcategories", { ...base, navMenu: { ...menu, subcategories: "off" } }],
    ...Object.entries(menu.mobile).map(([key, value]): [string, CustomizeDraft] => [
      `mobile.${key}`,
      { ...base, navMenu: { ...menu, mobile: { ...menu.mobile, [key]: other(value) } } },
    ]),
    ...Object.entries(menu.desktop).map(([key, value]): [string, CustomizeDraft] => [
      `desktop.${key}`,
      { ...base, navMenu: { ...menu, desktop: { ...menu.desktop, [key]: other(value) } } },
    ]),
  ];

  it.each(cases)("%s", (_field, edited) => {
    expect(changedParts(edited, base)).toHaveLength(1);
  });
});

describe("Language & theme and the computer header", () => {
  it("counts languages and dark mode as their own part", () => {
    expect(
      changedParts(
        { ...base, languageTheme: { ...base.languageTheme, darkMode: "light" } },
        base,
      ),
    ).toEqual(["language"]);
  });

  it("counts the computer header's sticky switch as Header", () => {
    expect(changedParts({ ...base, desktopHeader: { sticky: false } }, base)).toEqual([
      "header",
    ]);
  });
});

describe("the header rows that folded into Header", () => {
  it("counts the phone arrangement and the info strip as Header", () => {
    expect(
      changedParts({ ...base, mobile: { ...base.mobile, sticky: !base.mobile.sticky } }, base),
    ).toEqual(["header"]);
    expect(
      changedParts(
        { ...base, utilityBar: { ...base.utilityBar, enabled: !base.utilityBar.enabled } },
        base,
      ),
    ).toEqual(["header"]);
  });
});
