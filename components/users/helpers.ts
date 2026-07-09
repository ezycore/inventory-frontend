// coding-standard: maintained
import type { StatData } from "@/ui/components/StatsCard";
import { CheckCircle2, Shield, UserCheck, Users } from "lucide-react";

export function formatRoleName(role: string): string {
  return role
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getUserStats(stats: Record<string, any> | undefined): StatData[] {
  const byRole = stats?.byRole || {};
  const topRoles = Object.entries(byRole)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 2);

  return [
    {
      label: "Total Users",
      value: stats?.total || 0,
      icon: Users,
      variant: "primary",
      description: "All registered users",
    },
    {
      label: "Active",
      value: stats?.active || 0,
      icon: CheckCircle2,
      variant: "success",
      description: "Currently active",
    },
    {
      label: topRoles[0]?.[0] ? formatRoleName(String(topRoles[0][0])) : "Top Role",
      value: Number(topRoles[0]?.[1] || 0),
      icon: Shield,
      variant: "danger",
      description: "Most assigned role",
    },
    {
      label: topRoles[1]?.[0]
        ? formatRoleName(String(topRoles[1][0]))
        : "Second Role",
      value: Number(topRoles[1]?.[1] || 0),
      icon: UserCheck,
      variant: "info",
      description: "Second most assigned role",
    },
  ];
}
