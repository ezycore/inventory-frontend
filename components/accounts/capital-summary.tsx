"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

import { useCurrency } from "@/lib/currency";
import { useCapitalReport } from "@/services/api";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";

/**
 * Owner capital at a glance — total invested, total withdrawn, and the net still in the business.
 *
 * These are **all-time** figures on purpose: "how much of my money is in this business" is not a
 * monthly question, so this strip carries no period filter. The full period-scoped breakdown lives
 * in the capital report.
 *
 * Capital is equity, not income — it never appears in revenue or profit. That is why it gets its
 * own strip rather than a fifth tile in the balance banner.
 */
export default function CapitalSummary() {
  const t = useTranslations("accounts.capitalSummary");
  const { format } = useCurrency();
  const { data, isLoading } = useCapitalReport({ period: "thisMonth" });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const summary = data?.summary;
  const items = [
    {
      label: t("invested"),
      value: summary?.capitalInAllTime ?? 0,
      icon: ArrowDownLeft,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("withdrawn"),
      value: summary?.capitalOutAllTime ?? 0,
      icon: ArrowUpRight,
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: t("net"),
      value: summary?.netCapitalAllTime ?? 0,
      icon: Scale,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-medium text-foreground">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <Card key={label} className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", iconBg)}>
                <Icon className={cn("h-4 w-4", iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold truncate">
                  {format(value)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
