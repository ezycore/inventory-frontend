import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/ui/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        // Active/Success states
        active: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        enabled: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        completed: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        approved: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        published: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        success: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        online: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        verified: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        confirmed: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        delivered: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",

        // Inactive/Disabled states
        inactive: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
        disabled: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
        paused: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
        draft: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
        offline: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
        suspended: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",

        // Warning states
        pending: "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
        processing: "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
        review: "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
        moderate: "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",

        // Error/Danger states
        expired: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
        rejected: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
        failed: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
        error: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
        cancelled: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
        blocked: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
        deleted: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",

        // Info states
        info: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        new: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        scheduled: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        in_progress: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        "in-progress": "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",

        // Purple/Violet states
        premium: "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100",
        featured: "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100",
        vip: "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100",
        shipped: "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100",
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
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: 
    | "active" | "inactive" | "expired" | "pending" | "completed" 
    | "approved" | "rejected" | "processing" | "failed" | "cancelled"
    | "draft" | "published" | "disabled" | "enabled" | "paused"
    | "warning" | "error" | "success" | "info" | "new" | "scheduled"
    | "online" | "offline" | "verified" | "blocked" | "deleted"
    | "suspended" | "review" | "moderate" | "confirmed" | "premium"
    | "featured" | "vip" | "in_progress" | "in-progress"
    | "shipped" | "delivered"
}

function StatusBadge({ className, status, size, ...props }: StatusBadgeProps) {
  // Normalize status for display (replace underscores/hyphens with spaces and capitalize)
  const displayStatus = status
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  return (
    <div 
      className={cn(statusBadgeVariants({ status, size }), className)} 
      {...props}
    >
      {displayStatus}
    </div>
  )
}

export { StatusBadge, statusBadgeVariants }