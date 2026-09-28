"use client";
// coding-standard: maintained

import { useState } from "react";

import { formatMoney } from "@/components/storefront/format";
import { useWriteOffCourierShortfall, type CourierBalance } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { courierParams } from "./helpers";

/**
 * Give up on a courier's shortfall — money earlier payments came up short by (backend
 * `courier-settlement-manual.md` D3). The whole shortfall, booked as an expense out of the
 * courier's clearing account, so the card stops carrying money the merchant will not get.
 */
export function ShortfallWriteOffDialog({ balance }: { balance: CourierBalance }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const writeOff = useWriteOffCourierShortfall();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const submit = async () => {
    await writeOff.mutateAsync({
      ...courierParams(balance),
      note: note.trim() || undefined,
    });
    setOpen(false);
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Write off shortfall
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Write off {formatMoney(balance.shortfall, currency)} from {balance.label}?
          </DialogTitle>
          <DialogDescription>
            Do this only when the courier will not pay it — a later payment that includes
            it is counted against it automatically. With Cash &amp; Bank on, it is booked as
            an expense.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="write-off-note">Reason (optional)</Label>
          <Input
            id="write-off-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Courier disputes it"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={writeOff.isPending}>
            {writeOff.isPending ? "Writing off…" : "Write off"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
