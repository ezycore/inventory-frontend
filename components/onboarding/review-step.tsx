"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import type { FeatureName, OrganizationFeatures } from "@/types";
import {
  getFeatureDescriptions,
  getFeatureDisplayNames,
  FEATURE_ICONS,
} from "@/lib/feature-utils";
import { NavIcon } from "@/components/shared/nav-icon";
import { Button } from "@/ui/components/button";
import { Switch } from "@/ui/components/switch";
import { ANSWERED_FEATURES, REVIEW_ONLY_FEATURES } from "./steps";

/**
 * "Here's your workspace" — the final step, and the one that holds the whole
 * arc together: **Tell us → We recommend → You confirm.**
 *
 * Split into two groups on purpose. The first echoes what the merchant just
 * said, so they can see they were heard. The second is what was decided *for*
 * them and never discussed — which makes it the set most likely to be wrong,
 * and so the set that most needs to be visible before confirming
 * (docs/plan/onboarding-workspace.md §5.8).
 */
export function ReviewStep({
  features,
  planFeatures,
  onToggle,
  onBack,
  onConfirm,
  isSaving,
  pendingFeature,
}: {
  features: OrganizationFeatures;
  /** The plan ceiling. Undefined only while it loads — see `inPlan` below. */
  planFeatures: OrganizationFeatures | undefined;
  onToggle: (feature: FeatureName, next: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
  isSaving: boolean;
  pendingFeature: FeatureName | null;
}) {
  const t = useTranslations("settings.features");
  const tOnboarding = useTranslations("onboarding");
  const names = getFeatureDisplayNames(t);
  // The strings already existed for Settings → Customize workspace and this
  // screen simply wasn't reading them, so a merchant confirmed "Unit
  // Conversion" with nothing to say what it was — on the one screen whose job
  // is to surface decisions made *for* them.
  const descriptions = getFeatureDescriptions(t);

  const renderGroup = (heading: string, keys: FeatureName[]) => (
    <div className="space-y-2">
      <h2 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {heading}
      </h2>
      <div className="divide-y rounded-xl border bg-card">
        {keys.map((key) => {
          // A feature is available only where the plan grants it, exactly as on
          // Settings → Customize workspace. A live switch over a locked feature
          // is a switch that 403s (`FEATURE_NOT_IN_PLAN`) the moment it is
          // touched. While the ceiling loads, fall back to the effective set.
          const inPlan = planFeatures
            ? planFeatures[key] === true
            : (features[key] ?? false);

          return (
            <div
              key={key}
              className={`flex items-start gap-3 px-4 py-3.5 ${
                inPlan ? "" : "opacity-75"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <NavIcon
                  name={FEATURE_ICONS[key]}
                  className="h-4 w-4 text-muted-foreground"
                />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium">{names[key]}</p>
                <p className="text-xs text-muted-foreground">
                  {/* The locked reason replaces the description: on a screen
                      whose job is confirming decisions, "why can't I turn this
                      on" outranks "what is it". */}
                  {inPlan ? descriptions[key] : t("notIncluded")}
                </p>
              </div>
              {inPlan ? (
                <Switch
                  className="mt-0.5"
                  checked={features[key] ?? false}
                  disabled={pendingFeature === key}
                  onCheckedChange={(next) => onToggle(key, next)}
                />
              ) : (
                // No upgrade link, unlike the settings page: the workspace is
                // pinned to this wizard until it completes, so /dashboard/billing
                // would bounce straight back here.
                <Lock className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {tOnboarding("back")}
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tOnboarding("review.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tOnboarding("review.subtitle")}
        </p>
      </div>

      {renderGroup(tOnboarding("review.fromYourAnswers"), ANSWERED_FEATURES)}
      {renderGroup(tOnboarding("review.weAlsoRecommend"), REVIEW_ONLY_FEATURES)}

      <Button
        onClick={onConfirm}
        disabled={isSaving}
        className="w-full gap-2"
        size="lg"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        {tOnboarding("review.confirm")}
        {!isSaving && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}
