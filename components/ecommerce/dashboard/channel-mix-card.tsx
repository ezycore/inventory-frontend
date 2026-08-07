// coding-standard: maintained
import Link from "next/link";
import { formatMoney } from "@/components/storefront/format";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";

/**
 * Where the merchant's orders actually come from.
 *
 * This is the number the omnichannel work is measured by. A BD f-commerce
 * merchant has never been able to see that most of their volume arrives by
 * Messenger and only a fraction through the website — they have been guessing,
 * and guessing wrong is what makes them spend on the wrong channel.
 *
 * **Every row links to the same channel filtered on the orders list**, so the
 * tile is a way in rather than a dead readout: "70% Messenger" is interesting,
 * "show me those 70%" is actionable.
 */

/** Display names for the stored enum. Unknown values render as-is rather than blank. */
const CHANNEL_LABELS: Record<string, string> = {
  website: "Website",
  messenger: "Messenger",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  comment: "Post comment",
  phone: "Phone call",
  manual: "Other",
};

export interface ChannelMix {
  windowDays: number;
  total: number;
  rows: { channel: string; count: number; revenue: number; share: number }[];
}

export function ChannelMixCard({
  mix,
  currency,
  isLoading,
}: {
  mix?: ChannelMix;
  currency?: string;
  isLoading: boolean;
}) {
  return (
    <Card className="p-5 shadow-none">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Where orders come from</h2>
        {mix ? (
          <span className="text-xs text-muted-foreground">
            Last {mix.windowDays} days
          </span>
        ) : null}
      </div>

      {isLoading || !mix ? (
        <Skeleton className="h-32 w-full" />
      ) : mix.total === 0 ? (
        // A new store has no shape to show yet. Padding the enum with zero rows
        // would imply seven dead channels rather than an empty period.
        <p className="text-sm text-muted-foreground">
          No orders in this period yet.
        </p>
      ) : (
        <div className="space-y-3">
          {mix.rows.map((row) => (
            <Link
              key={row.channel}
              href={`/ecommerce/orders?channel=${row.channel}`}
              className="block rounded-lg p-1 transition-colors hover:bg-muted/50"
            >
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  {CHANNEL_LABELS[row.channel] ?? row.channel}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {row.count} · {formatMoney(row.revenue, currency)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${row.share}%` }}
                  />
                </div>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                  {row.share}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
