"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { BillingCycleToggle } from "@/components/billing/billing-cycle-toggle";
import { usePlanIntervalSuffix } from "@/hooks/use-plan-interval-suffix";
import { formatCurrency } from "@/lib/currency";
import type { AvailablePlan } from "@/types";
import { cn } from "@/ui/lib/utils";
import {
  groupPlans,
  monthsOf,
  planCadences,
  variantFor,
  type PlanGroup,
} from "@/utils/plan-groups";

/**
 * Pick the plan on the signup form itself.
 *
 * The plan used to arrive only as `?plan=<slug>` from the pricing page, so
 * someone opening `/signup` directly — the team setting up a merchant's
 * workspace, now that self-signup is closed — could not choose one, and a
 * mistyped slug fell back to the entry plan without a word. The picker lists
 * the plans actually on sale (`GET /public/signup-options`), one card per
 * package with the same billing-cycle switch as the billing page
 * (`groupPlans` / `planCadences`), so a plan reads the same in both places.
 *
 * Controlled: the page owns the selected slug and sends it as `planSlug`.
 */
export function SignupPlanPicker({
  plans,
  value,
  onChange,
}: {
  plans: AvailablePlan[];
  value: string | undefined;
  onChange: (slug: string) => void;
}) {
  const t = useTranslations("auth.signup.plan");
  const groups = useMemo(() => groupPlans(plans), [plans]);
  const cadences = useMemo(() => planCadences(groups), [groups]);
  const selected = plans.find((p) => p.slug === value);
  // Opens on the selected plan's own cycle, so a yearly link shows Yearly.
  const [months, setMonths] = useState<number | null>(
    () => (selected ? monthsOf(selected) : null) ?? cadences[0]?.months ?? null,
  );

  const changeCycle = (next: number) => {
    setMonths(next);
    // Keep the package, move to its variant on the new cycle.
    const group = groups.find((g) => g.variants.some((v) => v.slug === value));
    if (group) onChange(variantFor(group, next).slug);
  };

  return (
    <fieldset className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <legend className="text-sm font-semibold">{t("pickTitle")}</legend>
          <p className="text-xs text-muted-foreground">{t("trial")}</p>
        </div>
        {cadences.length > 1 && months !== null && (
          <BillingCycleToggle
            cadences={cadences}
            selected={months}
            onSelect={changeCycle}
          />
        )}
      </div>
      <div
        role="radiogroup"
        aria-label={t("pickTitle")}
        className="grid gap-3 sm:grid-cols-3"
      >
        {groups.map((group) => (
          <PlanOption
            key={group.key}
            group={group}
            plan={variantFor(group, months)}
            selectedSlug={value}
            onSelect={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}

function PlanOption({
  group,
  plan,
  selectedSlug,
  onSelect,
}: {
  group: PlanGroup;
  plan: AvailablePlan;
  selectedSlug: string | undefined;
  onSelect: (slug: string) => void;
}) {
  const tUsage = useTranslations("settings.billing.usage");
  const intervalSuffix = usePlanIntervalSuffix();
  const checked = group.variants.some((v) => v.slug === selectedSlug);
  const limit = (label: string, value?: number) =>
    value === undefined
      ? null
      : `${value > 0 ? value.toLocaleString() : tUsage("unlimited")} ${label}`;
  const limits = [
    limit(tUsage("locations"), plan.limits?.maxLocations),
    limit(tUsage("users"), plan.limits?.maxUsers),
    limit(tUsage("inventory"), plan.limits?.maxInventoryProducts),
  ].filter(Boolean);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={() => onSelect(plan.slug)}
      className={cn(
        "relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
        checked
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-foreground/30",
      )}
    >
      {checked && (
        <Check className="absolute top-3 right-3 size-4 text-primary" />
      )}
      <span className="text-sm font-semibold">{group.name}</span>
      <span>
        <span className="text-lg font-bold">
          {formatCurrency(plan.amount, plan.currency)}
        </span>
        <span className="text-xs text-muted-foreground">
          {intervalSuffix(plan)}
        </span>
      </span>
      {limits.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {limits.join(" · ")}
        </span>
      )}
    </button>
  );
}
