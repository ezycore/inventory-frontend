// coding-standard: maintained
import { formatMoney } from "@/components/storefront/format";
import { getOrgTimezone } from "@/hooks/use-org-calendar";
import type { CourierPayout } from "@/services/api";
import { StatusBadge } from "@/ui/components/status-badge";
import { cn } from "@/ui/lib/utils";
import { deductionsTotal, providerLabel } from "./helpers";

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
 * Two flags earn a badge and nothing else does. **Pending** is the one that needs an action —
 * the money has not reached an account yet and the deductions are not in the books.
 * **Unreconciled** is the one that needs a look: the courier kept money they did not explain,
 * or paid for parcels this workspace never shipped. Both come from the server; neither is
 * re-derived here.
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
  const deductions = deductionsTotal(payout.deductions);
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
            {providerLabel(payout.provider)}
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
      <td className="px-3 py-3 text-muted-foreground tabular-nums">{parcels}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge
            status={payout.status === "posted" ? "completed" : "pending"}
            label={payout.status === "posted" ? "Posted" : "Pending"}
          />
          {!payout.reconciled && (
            <StatusBadge status="warning" label="Unreconciled" />
          )}
        </div>
      </td>
      {/* Residual is money still sitting in the clearing account because the payout did
          not cover it. Shown on the row because it is the number a merchant chases. */}
      <td
        className={cn(
          "px-3 py-3 tabular-nums",
          payout.residual > 0 ? "text-amber-700 dark:text-amber-500" : "text-muted-foreground",
        )}
      >
        {payout.residual > 0 ? formatMoney(payout.residual, currency) : "—"}
      </td>
    </tr>
  );
}
