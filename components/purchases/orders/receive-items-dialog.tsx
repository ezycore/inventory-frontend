"use client";

import { useAccounts, useDefaultAccount } from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type { Account, PurchaseOrder, ReceivePurchaseOrderDto } from "@/types";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Separator } from "@/ui/components/separator";
import SimpleSelect from "@/ui/components/simple-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/table";
import {
  CreditCard,
  PackageCheck,
  Pencil,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  buildReceiveItemsFromOrder,
  clampReceiveQuantity,
  hasAnyReceivableItems,
} from "./helpers";
import type { ItemReceiveState } from "./types";

interface ReceiveItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
  formatCurrency: (n: number) => string;
  isPending: boolean;
  onSubmit: (id: string, data: ReceivePurchaseOrderDto) => Promise<void> | void;
}

export function ReceiveItemsDialog({
  open,
  onOpenChange,
  order,
  formatCurrency,
  isPending,
  onSubmit,
}: ReceiveItemsDialogProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const isExpiryEnabled = user?.organization?.features?.expiryTracking ?? false;

  const { data: accountsData } = useAccounts({ all: true });
  const accounts: Account[] = useMemo(
    () => (accountsData?.items as Account[]) ?? [],
    [accountsData],
  );
  const { data: defaultAccount } = useDefaultAccount();

  const [receiveItems, setReceiveItems] = useState<ItemReceiveState[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<string>("");

  // Re-initialize state every time a new order is opened. This synchronizes
  // local form state with the dialog's external inputs (open state, the
  // selected order, and the async-loaded default account), which is a
  // legitimate use of setState inside an effect.
  useEffect(() => {
    if (open && order) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceiveItems(buildReceiveItemsFromOrder(order));
      setPaidAmount(String(order.dueAmount ?? ""));
      setAccountId((defaultAccount as Account | undefined)?._id ?? "");
    }
  }, [open, order, defaultAccount]);

  const currentDue = order?.dueAmount ?? 0;
  const parsedPaid = Math.max(0, parseFloat(paidAmount) || 0);
  const cappedPaid = Math.min(parsedPaid, currentDue);
  const remainingDue = Math.max(0, currentDue - cappedPaid);
  const totalToReceive = receiveItems.reduce(
    (sum, item) => sum + item.receivedQuantity,
    0,
  );

  const handleQtyChange = (index: number, value: number) => {
    setReceiveItems((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = {
        ...next[index],
        receivedQuantity: clampReceiveQuantity(value, next[index].maxQuantity),
      };
      return next;
    });
  };

  const handleExpiryFieldChange = (
    index: number,
    field: "expiryDate" | "batchNumber",
    value: string,
  ) => {
    setReceiveItems((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!order) return;
    if (!hasAnyReceivableItems(receiveItems)) {
      toast.error("Please enter quantity for at least one item");
      return;
    }

    const payload: ReceivePurchaseOrderDto = {
      items: receiveItems
        .filter((item) => item.receivedQuantity > 0)
        .map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          inventoryId: item.inventoryId,
          receivedQuantity: item.receivedQuantity,
          // Per-line expiry — backend creates a batch only for expiry-tracked products
          ...(isExpiryEnabled && item.expiryDate
            ? { expiryDate: item.expiryDate }
            : {}),
          ...(isExpiryEnabled && item.batchNumber
            ? { batchNumber: item.batchNumber }
            : {}),
        })),
    };

    if (isAccountsEnabled && cappedPaid > 0) {
      if (!accountId) {
        toast.error("Please select a payment account");
        return;
      }
      payload.payment = {
        accountId,
        paidAmount: cappedPaid,
      };
    }

    await onSubmit(order._id, payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Receive Items
          </DialogTitle>
          <DialogDescription>
            {order
              ? `Order ${order.orderNumber} — ${order.supplierId?.name ?? "—"}`
              : "Confirm received quantities and optionally record a payment."}
          </DialogDescription>
        </DialogHeader>

        {/* Items table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                {isExpiryEnabled && (
                  <>
                    <TableHead className="w-40">Expiry Date</TableHead>
                    <TableHead className="w-36">Batch #</TableHead>
                  </>
                )}
                {/* <TableHead className="text-right">Remaining</TableHead> */}
                {/* <TableHead className="text-right w-32">Receive Qty</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {receiveItems.map((item, index) => (
                <TableRow
                  key={`${item.productId}-${item.variantId ?? "no-variant"}-${index}`}
                >
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {(order?.items[index]?.quantity ?? 0)}
                  </TableCell>
                  {isExpiryEnabled && (
                    <>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.expiryDate ?? ""}
                          onChange={(e) =>
                            handleExpiryFieldChange(
                              index,
                              "expiryDate",
                              e.target.value,
                            )
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.batchNumber ?? ""}
                          onChange={(e) =>
                            handleExpiryFieldChange(
                              index,
                              "batchNumber",
                              e.target.value,
                            )
                          }
                          placeholder="optional"
                          className="h-8"
                        />
                      </TableCell>
                    </>
                  )}
                  {/* <TableCell className="text-right">
                    <Badge variant="outline">{item.maxQuantity}</Badge>
                  </TableCell> */}
                  {/* <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      disabled={true}
                      max={item.maxQuantity}
                      value={item.receivedQuantity}
                      onChange={(e) =>
                        handleQtyChange(index, parseInt(e.target.value) || 0)
                      }
                      className="w-24 text-right ml-auto"
                    />
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary chips */}
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Items to receive
            </div>
            <div className="text-lg font-semibold">{totalToReceive}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Current due
            </div>
            <div className="text-lg font-semibold text-orange-600">
              {formatCurrency(currentDue)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Remaining after pay
            </div>
            <div
              className={`text-lg font-semibold ${
                remainingDue > 0 ? "text-orange-600" : "text-green-600"
              }`}
            >
              {formatCurrency(remainingDue)}
            </div>
          </div>
        </div>

        {/* Expiry batch is captured per line in the items table above. */}
        {isExpiryEnabled && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PackageCheck className="h-3.5 w-3.5" />
            Set an expiry date (and optional batch number) per line above — only
            applied to expiry-tracked products.
          </p>
        )}

        {/* Payment section */}
        {isAccountsEnabled && currentDue > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium text-sm">
                <CreditCard className="h-4 w-4" />
                Payment
                <span className="text-xs font-normal text-muted-foreground">
                  Leave empty to keep as due
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Account</Label>
                  <SimpleSelect
                    value={accountId}
                    onValueChange={setAccountId}
                    options={accounts.map((acc) => ({
                      label: acc.name,
                      value: acc._id,
                    }))}
                    placeholder="Select account"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="receive-paid">Paid Amount</Label>
                  <Input
                    id="receive-paid"
                    type="number"
                    min={0}
                    max={currentDue}
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {parsedPaid > currentDue && (
                <p className="text-xs text-orange-600">
                  Paid amount capped at current due ({formatCurrency(currentDue)}).
                </p>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              if (order) router.push(`/purchases/orders/${order._id}/edit`);
            }}
            disabled={isPending}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit Order
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Processing..." : "Confirm Receipt"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
