import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Edit2, MoreVertical, Palette, Trash2 } from "lucide-react";

// Color palette for value badges
const badgeColors = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-amber-100 text-amber-800 border-amber-200",
];

const VariantCardView = (
  variant: any,
  { onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void },
) => {
  const { name, values = [], status, createdAt } = variant;

  const allValues = Array.isArray(values) ? values : [];

  const createdDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 group gap-3">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 shrink-0">
          <Palette className="h-5 w-5 text-purple-600" />
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
          <p className="text-xs text-muted-foreground mt-0.5">
            {allValues.length} value{allValues.length !== 1 ? "s" : ""}
          </p>
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

      {/* Values grid - show ALL values (unlike table which truncates to 3) */}
      {allValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {allValues.map((value: string, index: number) => (
            <span
              key={index}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColors[index % badgeColors.length]}`}
            >
              {value}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <span>Created: {createdDate}</span>
      </div>
    </Card>
  );
};

export default VariantCardView;
