"use client";

import { useAccounts } from "@/services/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
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
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  const [receiveItems, setReceiveItems] = useState<ItemReceiveState[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<string>("");

  // Re-initialize state every time a new order is opened
  useEffect(() => {
    if (open && order) {
      setReceiveItems(buildReceiveItemsFromOrder(order));
      setAccountId("");
      setPaidAmount("");
    }
  }, [open, order]);

  const { data: accountsData } = useAccounts({ all: true });
  const accounts: Account[] = useMemo(
    () => (accountsData?.items as Account[]) ?? [],
    [accountsData],
  );

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
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right w-32">Receive Qty</TableHead>
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
                  <TableCell className="text-right">
                    <Badge variant="outline">{item.maxQuantity}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      max={item.maxQuantity}
                      value={item.receivedQuantity}
                      onChange={(e) =>
                        handleQtyChange(index, parseInt(e.target.value) || 0)
                      }
                      className="w-24 text-right ml-auto"
                    />
                  </TableCell>
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

        {/* Payment section */}
        {isAccountsEnabled && currentDue > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium text-sm">
                <CreditCard className="h-4 w-4" />
                Payment (optional)
                <span className="text-xs font-normal text-muted-foreground">
                  Leave empty to keep as due
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
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
                <div className="space-y-1.5 col-span-2">
                  <Label>Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc._id} value={acc._id}>
                          <span className="flex items-center gap-2">
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                            {acc.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Processing..." : "Confirm Receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
