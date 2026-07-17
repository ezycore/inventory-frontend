// coding-standard: maintained
import { Loader2, ShieldCheck } from "lucide-react";
import { useOrderFraudScore } from "@/services/api";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";

/**
 * On-demand courier delivery-risk check for the order's phone. Self-contained: it
 * owns the lazy `useOrderFraudScore` mutation and renders idle → loading → result.
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
        <div className="flex gap-5 text-sm">
          <Stat value={result.deliveredParcels} label="delivered" tone="text-green-700" />
          <Stat value={result.cancelledParcels} label="cancelled" tone="text-red-700" />
          <Stat value={result.totalParcels} label="total parcels" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No prior orders from this number — treat as a new customer.
        </p>
      )}
      <p className="mt-2.5 text-[11px] text-muted-foreground">
        Based on this store&apos;s COD history for the customer&apos;s phone.
      </p>
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
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
