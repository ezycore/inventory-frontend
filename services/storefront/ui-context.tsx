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

const getTheme = (): Theme => (read(THEME_KEY) === "dark" ? "dark" : "light");
const getLang = (): Lang => (read(LANG_KEY) === "bn" ? "bn" : "en");

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
    toggleTheme: () => write(THEME_KEY, theme === "dark" ? "light" : "dark"),
    toggleLang: () => write(LANG_KEY, lang === "en" ? "bn" : "en"),
    setTheme: (v) => write(THEME_KEY, v),
    setLang: (v) => write(LANG_KEY, v),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStorefrontUI = () => useContext(Ctx);
