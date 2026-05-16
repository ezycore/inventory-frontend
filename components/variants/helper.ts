import { StatData } from "@/ui/components/StatsCard";
import { CheckCircle2, Hash, Palette, XCircle } from "lucide-react";

export function getVariantStats(stats: Record<string, any> | undefined): StatData[] {
  return [
    {
      label: "Total Attributes",
      value: stats?.total || 0,
      icon: Palette,
      variant: "primary",
      description: "All variant attributes",
    },
    {
      label: "Active",
      value: stats?.active || 0,
      icon: CheckCircle2,
      variant: "success",
      description: "Currently active",
    },
    {
      label: "Inactive",
      value: stats?.inactive || 0,
      icon: XCircle,
      variant: "warning",
      description: "Currently inactive",
    },
    {
      label: "Total Values",
      value: stats?.totalValues || 0,
      icon: Hash,
      variant: "info",
      description: "Across all attributes",
    },
  ]
}