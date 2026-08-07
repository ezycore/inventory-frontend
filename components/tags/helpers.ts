// coding-standard: maintained
import { StatData } from "@/ui/components/StatsCard";
import { CheckCircle2, ShoppingBag, Tags, XCircle } from "lucide-react";
import type { Translator } from "@/i18n/config";

export const getTagStats = (
  stats: Record<string, any> | undefined,
  t: Translator,
): StatData[] => [
  {
    label: t("stats.total"),
    value: stats?.total || 0,
    icon: Tags,
    variant: "primary",
    description: t("stats.totalDescription"),
  },
  {
    label: t("stats.active"),
    value: stats?.active || 0,
    icon: CheckCircle2,
    variant: "success",
    description: t("stats.activeDescription"),
  },
  {
    label: t("stats.inactive"),
    value: stats?.inactive || 0,
    icon: XCircle,
    variant: "warning",
    description: t("stats.inactiveDescription"),
  },
  {
    // Products carrying at least one tag — not the org's product total, which
    // would say nothing about how much of the catalog is actually labelled.
    label: t("stats.taggedProducts"),
    value: stats?.totalProducts || 0,
    icon: ShoppingBag,
    variant: "info",
    description: t("stats.taggedProductsDescription"),
  },
];
