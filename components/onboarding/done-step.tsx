"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";

import { NavIcon } from "@/components/shared/nav-icon";
import { FEATURE_ICONS, getFeatureDisplayNames } from "@/lib/feature-utils";
import type { FeatureName } from "@/types";
import { Button } from "@/ui/components/button";

/**
 * The closing screen.
 *
 * The wizard used to end by `router.replace("/dashboard")` the instant the
 * confirm mutation resolved — the merchant answered six screens and the flow
 * simply vanished, dropping them into a sidebar with no acknowledgement that
 * anything had been set up. Setup is the one moment worth marking: it is the
 * only screen in the product that reports work the merchant just finished.
 *
 * It is local state, not a step: `onboardingCompletedAt` is already written by
 * the time this renders, so a reload lands on the dashboard rather than here.
 *
 * The chips make "we've turned on only what you asked for" concrete — the
 * description claims it, and without them the screen never says what. The
 * button is sized to its label from `sm` up: stretched across the 576px column
 * it outweighed the confirmation it sits under. On a phone it stays full width,
 * where a wide tap target is the point.
 */
export function DoneStep({
  organizationName,
  enabledFeatures,
  onEnter,
}: {
  organizationName?: string;
  /** What the workspace now has switched on, in the review screen's order. */
  enabledFeatures: FeatureName[];
  onEnter: () => void;
}) {
  const t = useTranslations("onboarding");
  const names = getFeatureDisplayNames(useTranslations("settings.features"));

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center sm:py-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-7 w-7 text-primary" />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {organizationName
            ? t("done.titleNamed", { organization: organizationName })
            : t("done.title")}
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {t("done.description")}
        </p>
      </div>

      {enabledFeatures.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t("done.enabledLabel")}
          </p>
          <ul className="flex max-w-md flex-wrap justify-center gap-2">
            {enabledFeatures.map((key) => (
              <li
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium"
              >
                <NavIcon
                  name={FEATURE_ICONS[key]}
                  className="h-3.5 w-3.5 text-primary"
                />
                {names[key]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button className="w-full gap-2 px-6 sm:w-auto" onClick={onEnter}>
        {t("done.action")}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
