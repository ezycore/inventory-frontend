// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE_THEME,
  desktopHeaderOverrides,
  effectiveLang,
  effectiveTheme,
  languageThemeOverrides,
  resolveDesktopHeader,
  resolveLanguageTheme,
} from "@/lib/storefront-language-theme";

describe("an untouched shop is the shop it always was", () => {
  // Every live shop has nothing stored. It must keep both languages, open in
  // English, keep its dark switch and keep a header that follows the page.
  it("resolves nothing stored to today's defaults", () => {
    expect(resolveLanguageTheme(undefined)).toEqual({
      languages: "both",
      defaultLanguage: "en",
      darkMode: "switch",
    });
    expect(resolveDesktopHeader(undefined)).toEqual({ sticky: true });
  });

  it("stores nothing for the defaults", () => {
    expect(languageThemeOverrides(DEFAULT_LANGUAGE_THEME)).toBeUndefined();
    expect(desktopHeaderOverrides({ sticky: true })).toBeUndefined();
  });

  it("narrows a value it does not know to the default", () => {
    expect(resolveLanguageTheme({ languages: "fr", darkMode: "dim" })).toEqual(
      DEFAULT_LANGUAGE_THEME,
    );
  });
});

describe("only the difference is stored", () => {
  it("keeps each changed field and nothing else", () => {
    expect(
      languageThemeOverrides({ ...DEFAULT_LANGUAGE_THEME, darkMode: "light" }),
    ).toEqual({ darkMode: "light" });
    expect(desktopHeaderOverrides({ sticky: false })).toEqual({ sticky: false });
  });
});

describe("what a shopper sees", () => {
  const shop = (over: Partial<typeof DEFAULT_LANGUAGE_THEME>) => ({
    ...DEFAULT_LANGUAGE_THEME,
    ...over,
  });

  it("a one-language shop is that language, whatever was chosen elsewhere", () => {
    expect(effectiveLang(shop({ languages: "bn" }), "en")).toBe("bn");
    expect(effectiveLang(shop({ languages: "en" }), "bn")).toBe("en");
  });

  it("a first visit opens in the merchant's language, a return visit in the shopper's", () => {
    const bangla = shop({ defaultLanguage: "bn" });
    expect(effectiveLang(bangla, null)).toBe("bn");
    expect(effectiveLang(bangla, "en")).toBe("en");
  });

  it("an always-light shop is light even for a shopper who chose dark", () => {
    expect(effectiveTheme(shop({ darkMode: "light" }), "dark")).toBe("light");
    expect(effectiveTheme(shop({}), "dark")).toBe("dark");
  });
});
