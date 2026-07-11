// coding-standard: maintained
/**
 * Translated labels for sidebar/kbar navigation. Nav constants keep their
 * English titles as identity (keys, filtering, kbar keywords); this hook maps
 * a title to `layout.nav.*` with the English title as fallback so a nav item
 * added without a translation still renders (docs/I18N.md).
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { navLabelKey } from "@/lib/nav-utils";

export function useNavLabels() {
  const t = useTranslations("layout.nav");

  // Memoized so consumers (kbar) can list the label fns as hook deps.
  return useMemo(() => {
    const itemLabel = (title: string) => {
      const key = `items.${navLabelKey(title)}`;
      return t.has(key) ? t(key) : title;
    };

    const groupLabel = (label: string) => {
      const key = `groups.${navLabelKey(label)}`;
      return t.has(key) ? t(key) : label;
    };

    return { itemLabel, groupLabel };
  }, [t]);
}
