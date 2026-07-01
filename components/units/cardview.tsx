// coding-standard: maintained
import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Edit2, MoreVertical, Ruler, Trash2 } from "lucide-react";

const UnitCardView = (
  unit: any,
  { onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void },
) => {
  const { name, shortName, status, category, isDefault, createdAt, updatedAt } = unit;

  const createdDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const updatedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60">
      {/* Top color accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-blue-600" />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shrink-0">
              <Ruler className="h-5.5 w-5.5" />
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
                {category && (
                  <Badge variant="outline" className="text-[11px] px-2 py-0 capitalize">
                    {category}
                  </Badge>
                )}
                {isDefault && (
                  <Badge
                    variant="outline"
                    className="text-[11px] px-2 py-0 border-primary text-primary"
                  >
                    Default
                  </Badge>
                )}
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

        {/* Short name highlight */}
        <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Abbreviation</span>
          {shortName ? (
            <span className="text-lg font-bold tracking-tight text-foreground font-mono uppercase">
              {shortName}
            </span>
          ) : (
            <span className="text-sm italic text-muted-foreground/60">Not set</span>
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

export default UnitCardView;
