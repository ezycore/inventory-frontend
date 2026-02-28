import { cn } from "@/ui/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "../button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  compact = false,
}: EmptyStateProps) => {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-full bg-muted flex items-center justify-center mb-4",
            compact ? "h-12 w-12" : "h-16 w-16",
          )}
        >
          <Icon
            className={cn(
              "text-muted-foreground",
              compact ? "h-6 w-6" : "h-8 w-8",
            )}
          />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold",
          compact ? "text-sm" : "text-lg",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-1 max-w-sm",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          size={compact ? "sm" : "default"}
          className="mt-4"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
};

export default EmptyState;
export type { EmptyStateProps };
