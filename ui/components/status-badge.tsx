// coding-standard: maintained
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ui/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        // Active/Success states
        active:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        enabled:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        completed:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        approved:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        published:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        success:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        online:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        verified:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        confirmed:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
        delivered:
          "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",

        // Inactive/Disabled states
        inactive:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",
        disabled:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",
        paused:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",
        draft:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",
        offline:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",
        suspended:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",
        // Closed, not broken. An order that was reversed, called off or turned
        // away is finished work, and red is the colour of something needing
        // attention — on a list where most rows end up here (a store rejecting
        // fake COD numbers rejects most of what it receives), painting them all
        // red makes the page read as an alarm and buries the one order that IS
        // live. Grey is the same answer the pipeline gives: nothing to do.
        returned:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",
        cancelled:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",
        rejected:
          "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800",

        // Warning states
        pending:
          "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-950/60",
        warning:
          "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-950/60",
        processing:
          "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-950/60",
        review:
          "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-950/60",
        moderate:
          "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-950/60",

        // Error/Danger states
        expired:
          "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60",
        failed:
          "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60",
        error:
          "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60",
        blocked:
          "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60",
        deleted:
          "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60",

        // Info states
        info: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60",
        new: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60",
        scheduled:
          "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60",
        in_progress:
          "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60",
        "in-progress":
          "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60",

        // Purple/Violet states
        premium:
          "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/60",
        featured:
          "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/60",
        vip: "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/60",
        shipped:
          "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/60",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface StatusBadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status:
    | "active"
    | "inactive"
    | "expired"
    | "pending"
    | "completed"
    | "approved"
    | "rejected"
    | "processing"
    | "failed"
    | "cancelled"
    | "draft"
    | "published"
    | "disabled"
    | "enabled"
    | "paused"
    | "warning"
    | "error"
    | "success"
    | "info"
    | "new"
    | "scheduled"
    | "online"
    | "offline"
    | "verified"
    | "blocked"
    | "deleted"
    | "suspended"
    | "review"
    | "moderate"
    | "confirmed"
    | "premium"
    | "featured"
    | "vip"
    | "in_progress"
    | "in-progress"
    | "shipped"
    | "delivered"
    | "returned";
  /**
   * Text to show instead of the humanized `status`. The colour still comes from
   * `status`, so a caller can rename what the badge says without inventing a
   * variant — that is how storefront orders render a merchant's own step wording
   * while every other resource keeps the default text.
   */
  label?: string;
}

function StatusBadge({
  className,
  status,
  size,
  label,
  ...props
}: StatusBadgeProps) {
  // Normalize status for display (replace underscores/hyphens with spaces and capitalize)
  const displayStatus = status
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <div
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    >
      {label || displayStatus}
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };
