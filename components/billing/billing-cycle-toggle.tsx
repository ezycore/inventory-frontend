"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Badge } from "@/ui/components/badge";
import { Tabs, TabsList, TabsTrigger } from "@/ui/components/tabs";
import type { PlanCadence } from "@/utils/plan-groups";

/**
 * Billing-cycle switch for the plan grid — one segment per cadence the product
 * actually sells, so adding a 6-month plan in Mission Control grows the control
 * with no change here.
 *
 * The caller is responsible for rendering nothing when `planCadences()` returns
 * fewer than two entries; a switch with one position is worse than none.
 */
export function BillingCycleToggle({
  cadences,
  selected,
  onSelect,
}: {
  cadences: PlanCadence[];
  selected: number;
  onSelect: (months: number) => void;
}) {
  const t = useTranslations("settings.billing.cycle");

  /** Named label for the common cadences, else "{n} months". */
  const label = (months: number) => {
    if (months === 1) return t("monthly");
    if (months === 12) return t("yearly");
    return t("everyNMonths", { n: months });
  };

  return (
    <Tabs
      value={String(selected)}
      onValueChange={(v) => onSelect(Number(v))}
      className="w-fit"
    >
      <TabsList aria-label={t("label")}>
        {cadences.map((c) => (
          <TabsTrigger key={c.months} value={String(c.months)} className="gap-2">
            {label(c.months)}
            {c.savePct !== null && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold">
                {t("save", { pct: c.savePct })}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
