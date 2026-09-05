"use client";
// coding-standard: maintained

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Button } from "@/ui/components/button";
import { useFeatureLabel } from "@/hooks/use-feature-label";
import { useGetAvailablePlans } from "@/services/api";
import type { FeatureName } from "@/types";

/**
 * Why a capability is unavailable, and therefore what the merchant can do
 * about it. The three are genuinely different actions, which is the whole
 * reason this is not one "not available" screen:
 *
 * - `off`     — they switched it off. One click in Customize workspace.
 * - `plan`    — their plan does not grant it. Costs money; name the tier.
 * - `parent`  — a capability it depends on is off. Free to fix, but they have
 *               to be told *which* one, or the switch looks broken.
 */
export type FeatureLockReason =
  | { kind: "off"; feature: FeatureName }
  | { kind: "plan"; feature: FeatureName }
  | { kind: "parent"; feature: FeatureName; parent: FeatureName };

/**
 * The screen a merchant meets instead of a 403.
 *
 * The launch-plan seed refused to differentiate tiers by module for exactly one
 * reason, and it wrote the reason down: withholding a module means "a paying
 * customer clicks 'Online Store' and hits a wall rather than an upsell". That
 * is true of a bare `FEATURE_*_DISABLED` — nothing on the frontend branches on
 * those codes, so one surfaces as a generic error toast on a blank page. This
 * component is what turns the wall back into an offer, and it is therefore a
 * precondition for selling capability-differentiated plans at all, not a
 * decoration on top of them.
 *
 * Three things a merchant needs in one place: what this is, why they cannot see
 * it, and the one action that fixes it.
 */
export function FeatureLockedScreen({ reason }: { reason: FeatureLockReason }) {
  const t = useTranslations("common.access");
  const featureLabel = useFeatureLabel();
  // Only the plan case needs the catalogue, and it is already cached for five
  // minutes by the billing page. The other two must not wait on a network call
  // to tell the merchant to flip a switch they own.
  const { data } = useGetAvailablePlans();

  const feature = featureLabel(reason.feature);

  if (reason.kind === "parent") {
    const parent = featureLabel(reason.parent);
    return (
      <LockedFrame
        title={t("lockedParentTitle", { feature, parent })}
        description={t("lockedParentDescription", { feature, parent })}
        href="/settings/features"
        action={t("lockedOffAction")}
      />
    );
  }

  if (reason.kind === "off") {
    return (
      <LockedFrame
        title={t("lockedOffTitle", { feature })}
        description={t("lockedOffDescription", { feature })}
        href="/settings/features"
        action={t("lockedOffAction")}
      />
    );
  }

  const tier = cheapestPlanGranting(data?.plans, reason.feature);
  return (
    <LockedFrame
      title={t("lockedPlanTitle", { feature })}
      description={
        t("lockedPlanDescription", { feature }) +
        (tier ? ` ${t("lockedPlanWithTier", { plan: tier })}` : "")
      }
      href="/dashboard/billing"
      action={t("lockedPlanAction")}
    />
  );
}

/**
 * The entry tier that includes this capability — the honest answer to "what do
 * I have to buy".
 *
 * Ranked by `groupRank`, not by price, and that is deliberate. A tier sells as
 * two plans (monthly and yearly) whose amounts are not comparable, so the
 * cheapest *amount* granting a feature is always whichever cadence happens to
 * bill in smaller instalments — which names a billing cycle, not a tier. Rank
 * is the tier ladder itself and is identical across a group's cadences.
 *
 * Falls back to amount only for ungrouped plans, which carry no rank.
 */
function cheapestPlanGranting(
  plans: { name: string; features: string[]; groupRank?: number; amount: number }[] | undefined,
  feature: FeatureName,
): string | undefined {
  const granting = (plans ?? []).filter((p) => p.features.includes(feature));
  if (granting.length === 0) return undefined;
  const best = granting.reduce((a, b) => {
    const ra = a.groupRank ?? Number.MAX_SAFE_INTEGER;
    const rb = b.groupRank ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra < rb ? a : b;
    return a.amount <= b.amount ? a : b;
  });
  return best.name;
}

function LockedFrame({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="max-w-md rounded-lg border p-10 text-center">
        <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 text-muted-foreground">{description}</p>
        <Button asChild>
          <Link href={href}>{action}</Link>
        </Button>
      </div>
    </div>
  );
}
