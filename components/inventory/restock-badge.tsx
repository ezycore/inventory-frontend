// coding-standard: maintained
import { RefreshCw } from "lucide-react";
import { Badge } from "@/ui/components/badge";

/**
 * "Ordered" pill for an inventory row that already has an open restock order
 * (`restockStatus === "ordered"`). Renders nothing for any other status, so it
 * can be dropped into a cell unconditionally.
 *
 * Shared by the current-stock table (`columns.tsx`) and the low-stock page.
 * `label` is passed in so the caller's already-bound translator is reused.
 */
export function RestockBadge({
  restockStatus,
  label,
}: {
  restockStatus?: string | null;
  label: string;
}) {
  if (restockStatus !== "ordered") return null;

  return (
    <Badge className="mt-1 bg-chart-4/10 text-chart-4 border-chart-4/20 gap-1">
      <RefreshCw className="h-3 w-3" />
      {label}
    </Badge>
  );
}
