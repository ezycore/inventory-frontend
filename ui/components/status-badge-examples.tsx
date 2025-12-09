import { StatusBadge } from "./status-badge"

/**
 * StatusBadge Usage Examples
 * 
 * This component demonstrates how to use the StatusBadge component
 * with different status types and automatic color coding.
 */
export function StatusBadgeExamples() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Active/Success States (Green)</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="active" />
          <StatusBadge status="enabled" />
          <StatusBadge status="completed" />
          <StatusBadge status="approved" />
          <StatusBadge status="published" />
          <StatusBadge status="success" />
          <StatusBadge status="online" />
          <StatusBadge status="verified" />
          <StatusBadge status="confirmed" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Inactive/Disabled States (Gray)</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="inactive" />
          <StatusBadge status="disabled" />
          <StatusBadge status="paused" />
          <StatusBadge status="draft" />
          <StatusBadge status="offline" />
          <StatusBadge status="suspended" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Warning States (Yellow)</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="pending" />
          <StatusBadge status="warning" />
          <StatusBadge status="processing" />
          <StatusBadge status="review" />
          <StatusBadge status="moderate" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Error/Danger States (Red)</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="expired" />
          <StatusBadge status="rejected" />
          <StatusBadge status="failed" />
          <StatusBadge status="error" />
          <StatusBadge status="cancelled" />
          <StatusBadge status="blocked" />
          <StatusBadge status="deleted" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Info States (Blue)</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="info" />
          <StatusBadge status="new" />
          <StatusBadge status="scheduled" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="in-progress" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Premium States (Purple)</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="premium" />
          <StatusBadge status="featured" />
          <StatusBadge status="vip" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Different Sizes</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status="active" size="sm" />
          <StatusBadge status="active" size="default" />
          <StatusBadge status="active" size="lg" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Usage in Real Scenarios</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-20">User:</span>
            <StatusBadge status="active" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20">Product:</span>
            <StatusBadge status="expired" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20">Order:</span>
            <StatusBadge status="pending" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20">Payment:</span>
            <StatusBadge status="completed" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20">Account:</span>
            <StatusBadge status="verified" />
          </div>
        </div>
      </div>
    </div>
  )
}