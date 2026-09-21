"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { I18N, type Dict, type Lang } from "@/lib/storefront-i18n";

type Theme = "light" | "dark";

const THEME_KEY = "ezy-sf-theme";
const LANG_KEY = "ezy-sf-lang";

// Tiny localStorage-backed external store so theme/lang read hydration-safely
// (SSR + first render use the defaults, then the stored value), with no
// setState-in-effect. Toggles write to localStorage and notify subscribers.
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
  emit();
}

/**
 * The theme an admin preview frame was told to draw in, or `null` for an
 * ordinary visit. Deliberately NOT persisted — see `PREVIEW_THEME_MESSAGE`.
 */
let previewTheme: Theme | null = null;

/**
 * Point a preview frame at a theme (`PreviewThemeBridge`). It outranks the
 * stored preference, so the frame shows what the editor's toggle says whatever
 * the merchant's own browser last chose on this origin.
 *
 * A toggle INSIDE the frame takes it back (see `pickTheme`): the shopper
 * controls in the Customize preview stay live rather than reading as broken.
 */
export function setPreviewTheme(theme: Theme | null): void {
  if (previewTheme === theme) return;
  previewTheme = theme;
  emit();
}

const storedTheme = (): Theme => (read(THEME_KEY) === "dark" ? "dark" : "light");
const getTheme = (): Theme => previewTheme ?? storedTheme();
const getLang = (): Lang => (read(LANG_KEY) === "bn" ? "bn" : "en");

/** A theme chosen in the page itself: the shopper's, so it drops any override. */
function pickTheme(next: Theme) {
  previewTheme = null;
  write(THEME_KEY, next);
}

interface StorefrontUI {
  theme: Theme;
  lang: Lang;
  t: Dict;
  toggleTheme: () => void;
  toggleLang: () => void;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<StorefrontUI>({
  theme: "light",
  lang: "en",
  t: I18N.en,
  toggleTheme: () => {},
  toggleLang: () => {},
  setTheme: () => {},
  setLang: () => {},
});

/**
 * Provides storefront-wide UI state: light/dark `theme` and EN/BN `lang`, both
 * persisted to localStorage. SSR renders the defaults (light/EN) — best for the
 * anonymous, SEO-facing first paint — then the stored preference hydrates in. A
 * tiny inline script in the storefront layout flips `data-theme` before paint so
 * dark-mode users don't see a light flash.
 *
 * Inside an admin preview frame the theme comes from the editor's toggle
 * instead (`setPreviewTheme`), which is an override and is never stored.
 */
export function StorefrontUIProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
  const lang = useSyncExternalStore(subscribe, getLang, () => "en" as Lang);

  // Reflect onto the .sf-root element (DOM mutation only — no setState).
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sf-root");
    if (root) root.setAttribute("data-theme", theme);
  }, [theme]);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sf-root");
    if (root) root.setAttribute("lang", lang === "bn" ? "bn" : "en");
  }, [lang]);

  const value: StorefrontUI = {
    theme,
    lang,
    t: I18N[lang],
    toggleTheme: () => pickTheme(theme === "dark" ? "light" : "dark"),
    toggleLang: () => write(LANG_KEY, lang === "en" ? "bn" : "en"),
    setTheme: pickTheme,
    setLang: (v) => write(LANG_KEY, v),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStorefrontUI = () => useContext(Ctx);
