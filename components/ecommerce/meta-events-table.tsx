"use client";
// coding-standard: maintained

import { useRetryMetaEvent } from "@/services/api";
import type { MetaEventRow } from "@/types/api";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { SimpleTable } from "@/ui/components/simple-table";

/**
 * One row per event EzyCore queued for Meta — including the ones it deliberately did not send.
 *
 * The skipped rows are the point of this screen, not noise in it: "why is this order not in my
 * Meta reporting" is the question the log exists to answer, and a merchant cannot read the code.
 */

/** Plain-language reasons. The stored enum is for us; this is for the person reading the screen. */
const SKIP_LABELS: Record<string, string> = {
  platform_off: "Reporting is switched off platform-wide",
  disabled: "Server-side reporting is off in your settings",
  no_pixel: "No Pixel ID saved",
  no_token: "No access token saved",
  demo_data: "Sample data — never sent to Meta",
  channel_off: "This order source is switched off in your settings",
  excluded: "You excluded this order",
  already_sent: "Already reported",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  sent: "secondary",
  pending: "outline",
  processing: "outline",
  skipped: "outline",
  failed: "destructive",
};

export function MetaEventsTable({ rows }: { rows: MetaEventRow[] }) {
  const retry = useRetryMetaEvent();

  return (
    <SimpleTable
      rows={rows}
      getRowKey={(row) => row._id}
      columns={[
        {
          key: "order",
          header: "Order",
          cell: (row) => (
            <span className="font-medium">{row.eventId.replace("purchase_", "")}</span>
          ),
        },
        {
          key: "when",
          header: "When it counted",
          cell: (row) => (
            <span className="text-xs text-muted-foreground">
              {new Date(row.eventTime).toLocaleString()}
              <span className="block">
                {/* The merchant's own wording for the trigger they chose. */}
                {row.trigger === "pending"
                  ? "when placed"
                  : row.trigger === "delivered"
                    ? "when delivered"
                    : "when confirmed"}
              </span>
            </span>
          ),
        },
        {
          key: "value",
          header: "Value",
          align: "right",
          cell: (row) => formatCurrency(row.sentValue, row.currency),
        },
        {
          key: "status",
          header: "Status",
          cell: (row) => (
            <div className="space-y-1">
              <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>{row.status}</Badge>
              {row.skipReason ? (
                <span className="block text-xs text-muted-foreground">
                  {SKIP_LABELS[row.skipReason] ?? row.skipReason}
                </span>
              ) : null}
              {row.error ? (
                <span className="block text-xs text-destructive">{row.error}</span>
              ) : null}
              {/* Sent, but with poor matching data — the honest reason a merchant's Event Match
                  Quality looks low for some orders and not others. */}
              {row.degraded ? (
                <span className="block text-xs text-muted-foreground">
                  Sent without browser tracking data — Meta can match this one less well.
                </span>
              ) : null}
            </div>
          ),
        },
        {
          key: "actions",
          header: "",
          align: "right",
          cell: (row) =>
            row.status === "failed" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={retry.isPending}
                onClick={() => retry.mutate(row._id)}
              >
                Retry
              </Button>
            ) : null,
        },
      ]}
    />
  );
}
