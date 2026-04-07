"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations, type Language, type TranslationKey } from "@/lib/landing-translations";

interface LandingTranslationStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKey;
}

export const useLandingTranslations = create<LandingTranslationStore>()(
  persist(
    (set) => ({
      language: "en",
      t: translations.en,
      setLanguage: (lang: Language) =>
        set({
          language: lang,
          t: translations[lang],
        }),
    }),
    {
      name: "landing-language-storage",
    }
  )
);
