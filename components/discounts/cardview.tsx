import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Edit2, MoreVertical, Percent, Trash2 } from "lucide-react";

const applicableLabels: Record<string, string> = {
  sales: "Sales",
  purchase: "Purchase",
  both: "Both",
};

const applicableColors: Record<string, string> = {
  sales: "bg-green-100 text-green-800 border-green-200",
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

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 group gap-3">
      <div className="flex items-start gap-4">
        {/* Large value display */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <span className="text-lg font-bold text-primary">
            {type === "percentage" ? (
              <span className="flex items-center gap-0.5">
                {value}
                <Percent className="h-3.5 w-3.5" />
              </span>
            ) : (
              `৳${value}`
            )}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">{name}</h3>
            <Badge
              variant={status === "active" ? "default" : "secondary"}
              className="text-xs shrink-0"
            >
              {status}
            </Badge>
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic mt-0.5">
              No description
            </p>
          )}
        </div>

        {/* Actions menu */}
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

      {/* Badges row */}
      <div className="flex items-center gap-2 pt-2">
        <Badge variant="outline" className="text-xs">
          {type === "percentage" ? "Percentage" : "Fixed Amount"}
        </Badge>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${applicableColors[applicableTo] || ""}`}
        >
          {applicableLabels[applicableTo] || applicableTo}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <span>Created: {createdDate}</span>
        <span className="font-medium text-foreground">{displayValue} off</span>
      </div>
    </Card>
  );
};

export default DiscountCardView;
