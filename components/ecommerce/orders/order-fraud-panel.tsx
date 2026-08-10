// coding-standard: maintained
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { useOrderFraudScore } from "@/services/api";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";

/**
 * On-demand delivery-risk check for the order's phone. Self-contained: it owns
 * the lazy `useOrderFraudScore` mutation and renders idle → loading → result.
 *
 * The **reports** block is the most actionable thing here: another merchant has
 * written down that this buyer cost them a parcel. It is why a buyer with a
 * healthy ratio can still come back `high`.
 *
 * **The data's origin is never shown.** Which delivery-risk provider we use is a
 * commercial arrangement of ours, not something a merchant needs — and putting it
 * on screen would turn swapping provider into a visible change for them.
 */
export function OrderFraudPanel({ orderId }: { orderId: string }) {
  const fraud = useOrderFraudScore();
  const result = fraud.data?.data;

  if (fraud.isPending) {
    return (
      <div className="flex h-9 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking delivery history…
      </div>
    );
  }

  // We could not get an answer at all. The server sends one error for every
  // cause — unconfigured, out of quota, provider down — because which of OUR
  // problems it was is meaningless to someone deciding whether to ship a parcel.
  // What they can act on is telling us.
  if (fraud.isError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
          <AlertTriangle className="h-3.5 w-3.5" /> Delivery check unavailable
        </div>
        <p className="text-[11px] leading-snug text-amber-900">
          Something went wrong. Please contact EzyCore.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => fraud.mutate(orderId)}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!result) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => fraud.mutate(orderId)}
      >
        <ShieldCheck className="mr-2 h-4 w-4" /> Courier fraud-score check
      </Button>
    );
  }

  const riskMap = {
    low: { cls: "border-green-200 bg-green-50 text-green-800", label: "Low risk" },
    medium: {
      cls: "border-yellow-200 bg-yellow-50 text-yellow-800",
      label: "Medium risk",
    },
    high: { cls: "border-red-200 bg-red-50 text-red-800", label: "High risk" },
  } as const;
  const m = riskMap[result.risk];

  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          Delivery risk
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            m.cls,
          )}
        >
          {m.label}
        </span>
      </div>
      {result.available ? (
        <>
          <div className="flex gap-5 text-sm">
            <Stat value={result.deliveredParcels} label="delivered" tone="text-green-700" />
            <Stat value={result.cancelledParcels} label="cancelled" tone="text-red-700" />
            <Stat value={result.totalParcels} label="total parcels" />
            <Stat
              value={`${Math.round((result.successRatio ?? 0) * 100)}%`}
              label="success"
            />
          </div>

          {/* Shown FIRST when present: a written report from another merchant
              outranks any ratio, and it is why the band can read `high` against
              healthy-looking numbers. */}
          {result.reports?.length ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 dark:border-red-500/40 dark:bg-red-500/10">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                {result.reports.length} fraud report
                {result.reports.length > 1 ? "s" : ""} from other merchants
              </div>
              <ul className="space-y-1">
                {result.reports.slice(0, 3).map((r, i) => (
                  <li key={i} className="text-[11px] leading-snug text-red-900">
                    {r.courierName ? `${r.courierName}: ` : ""}
                    {r.details || "No details given"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Per-carrier split. A buyer can be reliable with one courier and
              refuse another's, which tells the merchant who to ship with. */}
          {result.couriers?.length ? (
            <div className="mt-3 space-y-1">
              {result.couriers.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="tabular-nums">
                    {c.deliveredParcels}/{c.totalParcels}
                    <span className="ml-1.5 font-semibold">
                      {Math.round(c.successRatio * 100)}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          No delivery history for this number — treat as a new customer.
        </p>
      )}
      <p className="mt-2.5 text-[11px] text-muted-foreground">
        Delivery history for this customer&apos;s phone number.
      </p>
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number | string;
  label: string;
  tone?: string;
}) {
  return (
    <div>
      <div className={cn("text-base font-bold", tone)}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
