"use client";
// coding-standard: maintained

import { useState } from "react";

import { formatMoney } from "@/components/storefront/format";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
import {
  useRecordCourierPayment,
  type CourierBalance,
  type CourierParcel,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import { DatePicker } from "@/ui/components/date-picker";
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
import { autoTick, courierParams, expectedFor } from "./helpers";
import { PaymentDifference, type ShortReason } from "./payment-difference";
import { PaymentParcelList } from "./payment-parcel-list";

/**
 * "Record payment received" — one form, the same for every courier (backend
 * `courier-settlement-manual.md` §4.3 D).
 *
 * The merchant enters what arrived; the open parcels are pre-ticked **oldest first** until
 * their owed sum covers it, and every tick can be changed (once touched, typing a new amount
 * stops re-ticking). Expected, received and the difference are shown before saving
 * (`PaymentDifference`). A difference is never blocked (D3): a short payment is either
 * extra courier charges or still owed, as the merchant says; extra is booked as an
 * adjustment after recovering any earlier shortfall.
 */
export function PaymentRecordDialog({
  balance,
  parcels,
  trigger,
}: {
  balance: CourierBalance;
  parcels: CourierParcel[];
  trigger: React.ReactNode;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { accountsEnabled, options } = useOrderAccountOptions();
  const record = useRecordCourierPayment();
  const money = (n: number) => formatMoney(n, currency);

  // Starts at everything open: all parcels ticked, the amount their owed sum — or, with no
  // parcel left, the shortfall. Typing a different amount re-ticks oldest first.
  const allIds = parcels.map((p) => p.orderId);
  const suggested = parcels.length
    ? Math.max(0, expectedFor(parcels, allIds))
    : balance.shortfall;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(suggested);
  const [ticked, setTicked] = useState<string[]>(allIds);
  const [touched, setTouched] = useState(false);
  const [receivedAt, setReceivedAt] = useState<string | undefined>();
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [shortReason, setShortReason] = useState<ShortReason>("still_owed");

  const reset = () => {
    setAmount(suggested);
    setTicked(allIds);
    setTouched(false);
    setReceivedAt(undefined);
    setAccountId("");
    setReference("");
    setNote("");
    setShortReason("still_owed");
  };

  const expected = expectedFor(parcels, ticked);
  const short = amount < expected - 0.005;
  const canSubmit =
    (amount > 0 || ticked.length > 0) &&
    (!accountsEnabled || !!accountId) &&
    !record.isPending;

  const changeAmount = (next: number) => {
    setAmount(next);
    if (!touched) setTicked(autoTick(parcels, next));
  };
  const toggle = (orderId: string, next: boolean) => {
    setTouched(true);
    setTicked((prev) =>
      next ? [...prev, orderId] : prev.filter((id) => id !== orderId),
    );
  };

  const submit = async () => {
    await record.mutateAsync({
      ...courierParams(balance),
      amount,
      receivedAt,
      accountId: accountsEnabled ? accountId : undefined,
      orderIds: ticked,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined,
      ...(short ? { shortReason } : {}),
      // Guards a retry after a timeout; the server replays the payment already on file.
      idempotencyKey:
        globalThis.crypto?.randomUUID?.() ??
        `${balance.courierKey}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Initialised on open, not on close: after a payment the parcels refetch while the
        // dialog is closed, and a reset at close time would reopen on the paid parcels.
        if (next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment from {balance.label}</DialogTitle>
          <DialogDescription>
            Enter what arrived. The parcels it covers are ticked oldest first —
            change them if the courier&apos;s statement says otherwise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">Amount received</Label>
              <NumberField
                id="payment-amount"
                precision={2}
                min={0}
                value={amount}
                onChange={(v) => changeAmount(v ?? 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-date">Date</Label>
              <DatePicker
                id="payment-date"
                date={receivedAt}
                onSelect={setReceivedAt}
                placeholder="Today"
                toDate={new Date()}
              />
            </div>
          </div>

          {accountsEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="payment-account">Received into</Label>
              <SimpleSelect
                id="payment-account"
                value={accountId}
                onValueChange={setAccountId}
                options={options}
                placeholder="Select an account"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Parcels this covers</Label>
            <PaymentParcelList
              parcels={parcels}
              ticked={ticked}
              onToggle={toggle}
            />
          </div>

          <PaymentDifference
            expected={expected}
            received={amount}
            parcelCount={ticked.length}
            shortfall={balance.shortfall}
            reason={shortReason}
            onReasonChange={setShortReason}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payment-ref">Reference (optional)</Label>
              <Input
                id="payment-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Statement id or bKash TrxID"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-note">Note (optional)</Label>
              <Input
                id="payment-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {record.isPending ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
