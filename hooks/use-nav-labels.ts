// coding-standard: maintained
/**
 * Translated labels for sidebar/kbar navigation. Nav constants keep their
 * English titles as identity (keys, filtering, kbar keywords); this hook maps
 * a title to `layout.nav.*` with the English title as fallback so a nav item
 * added without a translation still renders (docs/I18N.md).
 *
 * A title listed in `NAV_TITLE_WHEN_FEATURE_OFF` is shown under its alternate
 * name while that feature is off for the organization.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { NAV_TITLE_WHEN_FEATURE_OFF } from "@/constants/navItem";
import { isFeatureOn } from "@/lib/feature-utils";
import { navLabelKey } from "@/lib/nav-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";

export function useNavLabels() {
  const t = useTranslations("layout.nav");
  const features = useAuthStore((state) => state.user?.organization?.features);

  // Memoized so consumers (kbar) can list the label fns as hook deps.
  return useMemo(() => {
    const itemLabel = (title: string) => {
      const alternate = NAV_TITLE_WHEN_FEATURE_OFF[title];
      // Not loaded yet reads as "off" (`isFeatureOn`), which is the default state
      // of every opt-in feature — the label does not flash to "Payouts" and back.
      const shown = alternate && !isFeatureOn(features, alternate.feature) ? alternate.title : title;
      const key = `items.${navLabelKey(shown)}`;
      return t.has(key) ? t(key) : shown;
    };

    const groupLabel = (label: string) => {
      const key = `groups.${navLabelKey(label)}`;
      return t.has(key) ? t(key) : label;
    };

    return { itemLabel, groupLabel };
  }, [t, features]);
}
