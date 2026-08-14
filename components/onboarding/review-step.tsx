"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { FeatureName, OrganizationFeatures } from "@/types";
import { getFeatureDisplayNames, FEATURE_ICONS } from "@/lib/feature-utils";
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
  onToggle,
  onBack,
  onConfirm,
  isSaving,
  pendingFeature,
}: {
  features: OrganizationFeatures;
  onToggle: (feature: FeatureName, next: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
  isSaving: boolean;
  pendingFeature: FeatureName | null;
}) {
  const t = useTranslations("settings.features");
  const names = getFeatureDisplayNames(t);

  const renderGroup = (heading: string, keys: FeatureName[]) => (
    <div className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {heading}
      </h2>
      <div className="divide-y rounded-lg border bg-card">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-3 px-4 py-3">
            <NavIcon
              name={FEATURE_ICONS[key]}
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />
            <span className="flex-1 text-sm font-medium">{names[key]}</span>
            <Switch
              checked={features[key] ?? false}
              disabled={pendingFeature === key}
              onCheckedChange={(next) => onToggle(key, next)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Here&apos;s your workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Turn on only the tools you need. You can change this any time.
        </p>
      </div>

      {renderGroup("From your answers", ANSWERED_FEATURES)}
      {renderGroup("We also recommend", REVIEW_ONLY_FEATURES)}

      <Button onClick={onConfirm} disabled={isSaving} className="w-full" size="lg">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Start using Ezycore
      </Button>
    </div>
  );
}
