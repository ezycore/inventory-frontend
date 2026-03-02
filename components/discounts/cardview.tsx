import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Edit2, Hash, MoreVertical, Percent, Trash2 } from "lucide-react";

const applicableLabels: Record<string, string> = {
  sales: "Sales",
  purchase: "Purchase",
  both: "Both",
};

const applicableColors: Record<string, string> = {
  sales: "bg-emerald-100 text-emerald-800 border-emerald-200",
  purchase: "bg-blue-100 text-blue-800 border-blue-200",
  both: "bg-purple-100 text-purple-800 border-purple-200",
};

const DiscountCardView = (
  discount: any,
  { onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void },
) => {
  const { name, value, type, applicableTo, status, description, createdAt } =
    discount;

  const displayValue =
    type === "percentage" ? `${value}%` : `৳${Number(value).toLocaleString()}`;

  const createdDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const TypeIcon = type === "percentage" ? Percent : Hash;

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60">
      {/* Top color accent */}
      <div
        className={`h-1 w-full ${
          type === "percentage"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : "bg-gradient-to-r from-orange-500 to-rose-500"
        }`}
      />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Icon */}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                type === "percentage"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              <TypeIcon className="h-5.5 w-5.5" />
            </div>

            <div className="min-w-0 space-y-1">
              <h3 className="font-semibold text-base truncate leading-tight">
                {name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant={status === "active" ? "default" : "secondary"}
                  className="text-[11px] px-2 py-0"
                >
                  {status === "active" ? "Active" : "Inactive"}
                </Badge>
                <span
                  className={`inline-flex items-center px-2 py-0 rounded-full text-[11px] font-medium border ${applicableColors[applicableTo] || ""}`}
                >
                  {applicableLabels[applicableTo] || applicableTo}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Value highlight */}
        <div className="rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">
              Discount Value
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">
              {displayValue}
            </span>
          </div>
          {description ? (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5">
              {description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic mt-1.5">
              No description
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs text-muted-foreground">
          <span>Created {createdDate}</span>
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              status === "active" ? "text-emerald-600" : "text-muted-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
            {status === "active" ? "In use" : "Disabled"}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default DiscountCardView;
