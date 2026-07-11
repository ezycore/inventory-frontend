import { StatData } from "@/ui/components/StatsCard";
import { CheckCircle2, Hash, Palette, XCircle } from "lucide-react";
import type { Translator } from "@/i18n/config";

export function getVariantStats(
  stats: Record<string, any> | undefined,
  t: Translator,
): StatData[] {
  return [
    {
      label: t("stats.total"),
      value: stats?.total || 0,
      icon: Palette,
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
      label: t("stats.totalValues"),
      value: stats?.totalValues || 0,
      icon: Hash,
      variant: "info",
      description: t("stats.totalValuesDescription"),
    },
  ]
}