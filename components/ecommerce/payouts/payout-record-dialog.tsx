"use client";
// coding-standard: maintained

import { useState } from "react";
import { useRecordCourierPayout } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
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
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { cn } from "@/ui/lib/utils";
import { DEDUCTION_KINDS, type DeductionKind, expectedNet } from "./helpers";

/**
 * File a courier's remittance statement by hand.
 *
 * The form takes the statement as the courier states it and sends those figures verbatim. It
 * does **not** compute the net: the server re-derives the reconciliation against the clearing
 * balances — which this app never sees — and refuses `gross − deductions ≠ net` outright.
 *
 * So the arithmetic shown beside the net field is a *hint*, not a gate. A merchant typing what
 * the statement says and finding it does not add up has discovered something about the
 * statement, and that is worth seeing before submitting rather than being silently corrected
 * into agreement. Same reasoning as the collection dialog, from the other side: there, the
 * merchant must account for a gap; here, the courier must.
 */
export function PayoutRecordDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const record = useRecordCourierPayout();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const [provider, setProvider] = useState("steadfast");
  const [statementRef, setStatementRef] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [gross, setGross] = useState<number>(0);
  const [net, setNet] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState("");
  const [deductions, setDeductions] = useState<
    Partial<Record<DeductionKind, number>>
  >({});

  const money = (n: number) => formatMoney(n, currency);
  const suggested = expectedNet(gross, deductions);
  const difference = Math.round((suggested - net) * 100) / 100;
  const adds = Math.abs(difference) < 0.01;
  const canSubmit = statementRef.trim().length > 0 && gross > 0 && !record.isPending;

  const reset = () => {
    setStatementRef("");
    setReceivedAt("");
    setGross(0);
    setNet(0);
    setPaymentMode("");
    setDeductions({});
  };

  const submit = async () => {
    await record.mutateAsync({
      provider: provider as "pathao" | "steadfast" | "ecourier",
      statementRef: statementRef.trim(),
      receivedAt: receivedAt || undefined,
      gross,
      net,
      deductions: Object.keys(deductions).length ? deductions : undefined,
      paymentMode: paymentMode.trim() || undefined,
      // The courier's statement id is the replay guard server-side; this covers a retry
      // after a timeout on the way there.
      idempotencyKey:
        globalThis.crypto?.randomUUID?.() ??
        `${statementRef}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record a payout</DialogTitle>
          <DialogDescription>
            The courier&apos;s statement, as they sent it. Recording it does not move any
            money — you confirm where the net landed afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="payout-provider">Courier</Label>
              <SimpleSelect
                id="payout-provider"
                value={provider}
                onValueChange={setProvider}
                options={[
                  { label: "Steadfast", value: "steadfast" },
                  { label: "Pathao", value: "pathao" },
                  { label: "eCourier", value: "ecourier" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-ref">Statement reference</Label>
              <Input
                id="payout-ref"
                value={statementRef}
                onChange={(e) => setStatementRef(e.target.value)}
                placeholder="SFC-26926554"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="payout-date">Received</Label>
              <Input
                id="payout-date"
                type="date"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-mode">Paid via</Label>
              <Input
                id="payout-mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                placeholder="Bkash, bank transfer…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payout-gross">Collected (gross)</Label>
            <NumberField
              id="payout-gross"
              precision={2}
              min={0}
              value={gross}
              onChange={(v) => setGross(v ?? 0)}
            />
            <p className="text-xs text-muted-foreground">
              Everything the courier collected on this statement, before their charges.
            </p>
          </div>

          <div className="space-y-2">
            <Label>What the courier kept</Label>
            <div className="space-y-2 rounded-md border p-3">
              {DEDUCTION_KINDS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor={`deduction-${key}`}
                    className="text-sm font-normal text-muted-foreground"
                  >
                    {label}
                  </Label>
                  <NumberField
                    id={`deduction-${key}`}
                    className="w-32"
                    precision={2}
                    min={0}
                    value={deductions[key] ?? 0}
                    onChange={(v) =>
                      setDeductions((prev) => ({ ...prev, [key]: v ?? 0 }))
                    }
                  />
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">
                Payment charge is the disbursement fee, kept apart from delivery on purpose —
                folding it in would overstate what shipping costs.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payout-net">Paid over (net)</Label>
            <NumberField
              id="payout-net"
              precision={2}
              min={0}
              value={net}
              onChange={(v) => setNet(v ?? 0)}
            />
            {/* A hint, never a substitution. The server refuses a statement whose own
                arithmetic does not hold, and it is right to — but the merchant should see
                that before the request, not as an error after it. */}
            <p
              className={cn(
                "text-xs",
                adds ? "text-muted-foreground" : "text-amber-700 dark:text-amber-500",
              )}
            >
              {adds
                ? `Adds up: ${money(gross)} less their charges leaves ${money(suggested)}.`
                : `The statement says ${money(net)}, but ${money(gross)} less their charges leaves ${money(suggested)} — a difference of ${money(Math.abs(difference))}. Check it before saving; the server will refuse a statement that does not add up.`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {record.isPending ? "Saving…" : "Record payout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
