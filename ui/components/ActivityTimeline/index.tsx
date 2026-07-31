// coding-standard: maintained
import { cn } from "@/ui/lib/utils";
import { LucideIcon } from "lucide-react";

type TimelineVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info";

interface TimelineItem {
  id: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  timestamp: string;
  variant?: TimelineVariant;
  meta?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  title?: string;
  className?: string;
  maxItems?: number;
  emptyMessage?: string;
}

const variantStyles: Record<TimelineVariant, { dot: string; icon: string }> = {
  default: {
    dot: "bg-muted-foreground/20",
    icon: "text-muted-foreground",
  },
  success: {
    dot: "bg-success/20",
    icon: "text-success",
  },
  warning: {
    dot: "bg-warning/20",
    icon: "text-warning",
  },
  destructive: {
    dot: "bg-destructive/20",
    icon: "text-destructive",
  },
  info: {
    dot: "bg-chart-4/20",
    icon: "text-chart-4",
  },
};

const ActivityTimeline = ({
  items,
  title,
  className,
  maxItems,
  emptyMessage = "No recent activity",
}: ActivityTimelineProps) => {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className={cn("space-y-3", className)}>
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      {displayItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {emptyMessage}
        </p>
      ) : (
        <div className="relative space-y-0">
          {displayItems.map((item, index) => {
            const variant = item.variant || "default";
            const styles = variantStyles[variant];
            const Icon = item.icon;
            const isLast = index === displayItems.length - 1;

            return (
              <div key={item.id} className="relative flex gap-3 pb-4">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
                )}

                {/* Dot / Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-7 w-7 items-center justify-center rounded-full shrink-0",
                    styles.dot,
                  )}
                >
                  {Icon ? (
                    <Icon className={cn("h-3.5 w-3.5", styles.icon)} />
                  ) : (
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        variant === "success" && "bg-success",
                        variant === "warning" && "bg-warning",
                        variant === "destructive" && "bg-destructive",
                        variant === "info" && "bg-chart-4",
                        variant === "default" && "bg-muted-foreground",
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.meta && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {item.meta}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {item.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
export type { ActivityTimelineProps, TimelineItem, TimelineVariant };
