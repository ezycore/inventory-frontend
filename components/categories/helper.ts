import { StatData } from "@/ui/components/StatsCard";
import { CheckCircle2, ShoppingBag, Tag, XCircle } from "lucide-react";

export function getCategoryStats(stats: Record<string, any> | undefined): StatData[] {
  return [
    {
      label: "Total Categories",
      value: stats?.total || 0,
      icon: Tag,
      variant: "primary",
      description: "All registered categories",
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
      label: "Total Products",
      value: stats?.totalProducts || 0,
      icon: ShoppingBag,
      variant: "info",
      description: "Across all categories",
    },
  ]
}