// coding-standard: maintained

/**
 * Which languages and colour schemes a shop offers (`nav.languageTheme`), and
 * the computer header's own behaviour (`nav.desktopHeader`) — Customize →
 * Language & theme, and Header → Computer.
 *
 * Every stored field is optional and every default is the shop as it was
 * before these settings existed: English and Bangla with a switch, opening in
 * English, light with a dark switch, a header that follows the page. So a shop
 * that never opens the part stores nothing and changes nothing — the same
 * "only the difference is stored" rule as `mobileOverrides` and `nav.menu`.
 *
 * The backend validates these as closed enums; the resolvers still narrow, so a
 * value from a newer admin degrades to the default rather than reaching the DOM.
 */

export type ShopLang = "en" | "bn";
export type ShopTheme = "light" | "dark";

/** As stored: loose, because it arrives from a database document. */
export interface LanguageThemeConfig {
  languages?: string;
  defaultLanguage?: string;
  darkMode?: string;
}

export interface ResolvedLanguageTheme {
  /** `both` offers the switch; `en` / `bn` fix the shop to one language. */
  languages: "both" | ShopLang;
  /** The language a first visit opens in, while `languages` is `both`. */
  defaultLanguage: ShopLang;
  /** `light` removes the dark switch and ignores a shopper's stored dark choice. */
  darkMode: "switch" | "light";
}

export const DEFAULT_LANGUAGE_THEME: ResolvedLanguageTheme = {
  languages: "both",
  defaultLanguage: "en",
  darkMode: "switch",
};

const oneOf = <T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T =>
  typeof raw === "string" && allowed.includes(raw as T) ? (raw as T) : fallback;

export function resolveLanguageTheme(
  config: LanguageThemeConfig | undefined,
): ResolvedLanguageTheme {
  return {
    languages: oneOf(config?.languages, ["both", "en", "bn"] as const, "both"),
    defaultLanguage: oneOf(config?.defaultLanguage, ["en", "bn"] as const, "en"),
    darkMode: oneOf(config?.darkMode, ["switch", "light"] as const, "switch"),
  };
}

/** Only the fields off their default, or `undefined` when none are. */
export function languageThemeOverrides(
  value: ResolvedLanguageTheme,
): LanguageThemeConfig | undefined {
  const out: LanguageThemeConfig = {};
  if (value.languages !== DEFAULT_LANGUAGE_THEME.languages) out.languages = value.languages;
  // Only meaningful while the shopper can switch — a fixed shop opens in its
  // one language — but kept as set, so switching back to both restores it.
  if (value.defaultLanguage !== DEFAULT_LANGUAGE_THEME.defaultLanguage) {
    out.defaultLanguage = value.defaultLanguage;
  }
  if (value.darkMode !== DEFAULT_LANGUAGE_THEME.darkMode) out.darkMode = value.darkMode;
  return Object.keys(out).length ? out : undefined;
}

export const offersLanguageSwitch = (v: ResolvedLanguageTheme): boolean =>
  v.languages === "both";

export const offersDarkMode = (v: ResolvedLanguageTheme): boolean =>
  v.darkMode === "switch";

/**
 * The language a shopper reads the shop in. A fixed shop is its language
 * whatever the shopper chose on another shop; otherwise the shopper's own
 * stored choice, else the merchant's opening language.
 */
export function effectiveLang(v: ResolvedLanguageTheme, stored: ShopLang | null): ShopLang {
  if (v.languages !== "both") return v.languages;
  return stored ?? v.defaultLanguage;
}

/** An always-light shop is light, whatever the shopper last chose. */
export const effectiveTheme = (v: ResolvedLanguageTheme, chosen: ShopTheme): ShopTheme =>
  v.darkMode === "light" ? "light" : chosen;

/* ============================== desktop header ============================== */

export interface DesktopHeaderConfig {
  sticky?: boolean;
}

export interface ResolvedDesktopHeader {
  /** Follows the page. Absent ⇒ true: the header always has. */
  sticky: boolean;
}

export const resolveDesktopHeader = (
  config: DesktopHeaderConfig | undefined,
): ResolvedDesktopHeader => ({ sticky: config?.sticky !== false });

/** Only a header that stopped following the page stores anything. */
export const desktopHeaderOverrides = (
  value: ResolvedDesktopHeader,
): DesktopHeaderConfig | undefined => (value.sticky ? undefined : { sticky: false });
