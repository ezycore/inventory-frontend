// coding-standard: maintained
import { formatMoney } from "@/components/storefront/format";
import { getOrgTimezone } from "@/hooks/use-org-calendar";
import type { CourierPayout } from "@/services/api";
import { StatusBadge } from "@/ui/components/status-badge";
import { cn } from "@/ui/lib/utils";
import { payoutCharges, payoutShortfall, providerLabel } from "./helpers";

const shortDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: getOrgTimezone(),
      })
    : "—";

/**
 * One remittance row.
 *
 * Two flags earn a badge. **Pending** only appears on legacy rows from the retired automatic
 * ingest — a payment recorded by hand posts at once. **Unreconciled** is the one that needs a
 * look: the payment was short of what its parcels should net, or more than them. A shortfall
 * later recovered or written off reads **Recovered** / **Written off** instead
 * (`payoutShortfall`).
 */
export function PayoutRow({
  payout,
  currency,
  onOpen,
}: {
  payout: CourierPayout;
  currency?: string;
  onOpen: () => void;
}) {
  const deductions = payoutCharges(payout);
  const shortfall = payoutShortfall(payout);
  const parcels = payout.lines?.length ?? 0;

  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40"
    >
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{payout.statementRef}</span>
          <span className="text-xs text-muted-foreground">
            {payout.courierName || providerLabel(payout.provider)}
            {payout.paymentMode ? ` · ${payout.paymentMode}` : ""}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-muted-foreground">
        {shortDate(payout.receivedAt)}
      </td>
      <td className="px-3 py-3 tabular-nums">
        {formatMoney(payout.gross, currency)}
      </td>
      {/* What the courier kept, as one figure. The breakdown is a click away in the
          detail sheet — on a row it would be five columns nobody scans. */}
      <td className="px-3 py-3 tabular-nums text-muted-foreground">
        {deductions === 0 ? "—" : `−${formatMoney(deductions, currency)}`}
      </td>
      <td className="px-3 py-3 font-semibold tabular-nums">
        {formatMoney(payout.net, currency)}
      </td>
      <td className="px-3 py-3 text-muted-foreground tabular-nums">
        {parcels}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge
            status={payout.status === "posted" ? "completed" : "pending"}
            label={payout.status === "posted" ? "Posted" : "Pending"}
          />
          {shortfall.badge && (
            <StatusBadge
              status={
                shortfall.badge === "Unreconciled" ? "warning" : "completed"
              }
              label={shortfall.badge}
            />
          )}
        </div>
      </td>
      {/* What the payment still leaves owed — the number a merchant chases. Once recovered
          or written off it reads as settled, struck through, not as money still missing. */}
      <td
        className={cn(
          "px-3 py-3 tabular-nums",
          shortfall.open > 0
            ? "text-amber-700 dark:text-amber-500"
            : "text-muted-foreground",
          shortfall.open === 0 && payout.residual > 0 && "line-through",
        )}
      >
        {payout.residual > 0
          ? formatMoney(shortfall.open || payout.residual, currency)
          : "—"}
      </td>
    </tr>
  );
}
