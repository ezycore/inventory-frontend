"use client";
// coding-standard: maintained

import { RefreshCw } from "lucide-react";

import { useSyncCourierPayouts } from "@/services/api";
import { Button } from "@/ui/components/button";
import { cn } from "@/ui/lib/utils";

/**
 * Ask the couriers for their remittances now, rather than waiting for the nightly sweep.
 *
 * Records what they report and posts nothing — and only Steadfast publishes a payout feed at
 * all. For Pathao and eCourier the backend assembles a statement from the parcels themselves,
 * so a courier producing nothing is an ordinary outcome, not a failure.
 */
export function PayoutSyncButton() {
  const sync = useSyncCourierPayouts();

  return (
    <Button
      variant="outline"
      className="rounded-xl"
      onClick={() => sync.mutate(undefined)}
      disabled={sync.isPending}
    >
      <RefreshCw className={cn("mr-2 h-4 w-4", sync.isPending && "animate-spin")} />
      {sync.isPending ? "Checking couriers…" : "Check for payouts"}
    </Button>
  );
}
