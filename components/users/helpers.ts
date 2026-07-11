// coding-standard: maintained
import type { StatData } from "@/ui/components/StatsCard";
import { CheckCircle2, Shield, UserCheck, Users } from "lucide-react";
import type { Translator } from "@/i18n/config";

export function formatRoleName(role: string): string {
  return role
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getUserStats(
  stats: Record<string, any> | undefined,
  t: Translator,
): StatData[] {
  const byRole = stats?.byRole || {};
  const topRoles = Object.entries(byRole)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 2);

  return [
    {
      label: t("stats.total"),
      value: stats?.total || 0,
      icon: Users,
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
      label: topRoles[0]?.[0] ? formatRoleName(String(topRoles[0][0])) : t("stats.topRole"),
      value: Number(topRoles[0]?.[1] || 0),
      icon: Shield,
      variant: "danger",
      description: t("stats.topRoleDescription"),
    },
    {
      label: topRoles[1]?.[0]
        ? formatRoleName(String(topRoles[1][0]))
        : t("stats.secondRole"),
      value: Number(topRoles[1]?.[1] || 0),
      icon: UserCheck,
      variant: "info",
      description: t("stats.secondRoleDescription"),
    },
  ];
}
