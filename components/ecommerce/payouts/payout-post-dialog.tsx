"use client";
// coding-standard: maintained

import { useState } from "react";

import { formatMoney } from "@/components/storefront/format";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
import { usePostCourierPayout, type CourierPayout } from "@/services/api";
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
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { presentDeductions, providerLabel } from "./helpers";

/**
 * Confirm where a payout landed, and book it.
 *
 * Posting writes a transfer out of the courier's clearing account into the chosen account and
 * expenses each deduction against the same clearing account — together exactly the gross, so a
 * payout that reconciles leaves clearing at zero. It also books the delivery expense that
 * dispatch deferred while the courier still held the cash.
 *
 * Two reasons this is a dialog and not a row action:
 *
 * 1. **The destination is a choice.** No poller can know whether a remittance hit the bank or
 *    bKash, which is why the sweep records payouts `pending` and stops.
 * 2. **The deductions are an agreement.** This is the merchant's last look at what the courier
 *    kept before it becomes an expense in their books.
 *
 * The account list comes from `useOrderAccountOptions` — the payment-options endpoint, which
 * excludes system accounts, so a clearing account can never be offered as the destination of
 * its own payout.
 */
export function PayoutPostDialog({
  payout,
  onPosted,
}: {
  payout: CourierPayout;
  onPosted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const post = usePostCourierPayout();
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { accountsEnabled, options } = useOrderAccountOptions();
  const money = (n: number) => formatMoney(n, currency);

  const submit = async () => {
    await post.mutateAsync({ id: payout._id, accountId });
    setOpen(false);
    onPosted?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Confirm &amp; post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post {payout.statementRef}</DialogTitle>
          <DialogDescription>
            {money(payout.net)} from {providerLabel(payout.provider)}. Confirm the account it
            landed in and what they kept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5 rounded-lg bg-muted p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Collected</span>
              <span className="tabular-nums">{money(payout.gross)}</span>
            </div>
            {presentDeductions(payout.deductions).map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between text-muted-foreground"
              >
                <span>{row.label}</span>
                <span className="tabular-nums">−{money(row.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-1.5 font-semibold">
              <span>Into your account</span>
              <span className="tabular-nums">{money(payout.net)}</span>
            </div>
          </div>

          {/* With the ledger module off there is nowhere to post to. The statement is still a
              fact worth keeping, so it stays recorded — the backend degrades the same way
              rather than refusing the whole screen. */}
          {accountsEnabled ? (
            <div className="space-y-1.5">
              <Label htmlFor="payout-account">Where it landed</Label>
              <SimpleSelect
                id="payout-account"
                value={accountId}
                onValueChange={setAccountId}
                options={options}
                placeholder="Select an account"
              />
              <p className="text-xs text-muted-foreground">
                Their charges are booked as expenses against the courier&apos;s clearing
                account, which should then be back to zero for these parcels.
              </p>
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Cash &amp; bank is switched off for this workspace, so there is no account to
              post into. The payout stays recorded — switch the module on to book it.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!accountsEnabled || !accountId || post.isPending}
          >
            {post.isPending ? "Posting…" : "Post to ledger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
