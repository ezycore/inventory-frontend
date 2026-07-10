// coding-standard: maintained
import { Badge } from "@/ui/components/badge";
import { cn } from "@/ui/lib/utils";
import {
  formatPermission,
  getActionStyle,
  getCategoryConfig,
} from "./permission-display";

interface PermissionGroupCardProps {
  /** Category key, i.e. the part before the dot in `category.action`. */
  category: string;
  /** Full permission keys belonging to this category. */
  permissions: string[];
}

/**
 * One permission category as a color-coded card: tinted header with the
 * category name + count, body listing each action with its icon.
 */
export function PermissionGroupCard({
  category,
  permissions,
}: PermissionGroupCardProps) {
  const config = getCategoryConfig(category);

  return (
    <div
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-colors",
        config.color
      )}
    >
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between",
          config.bgColor
        )}
      >
        <span className={cn("font-semibold text-sm", config.textColor)}>
          {config.name}
        </span>
        <Badge variant="secondary" className="text-xs tabular-nums h-5 px-2">
          {permissions.length}
        </Badge>
      </div>

      <div className="p-3 bg-card/50 space-y-1.5">
        {permissions.map((permission) => {
          const action = formatPermission(permission);
          const style = getActionStyle(action);
          const Icon = style.icon;

          return (
            <div
              key={permission}
              className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", style.className)} />
              <span className="text-foreground/90">{action}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
