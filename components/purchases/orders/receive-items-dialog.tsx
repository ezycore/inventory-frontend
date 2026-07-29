"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { populatedRef } from "@/utils/populated-ref";
import { useAccounts, useDefaultAccount } from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type { Account, PurchaseOrder, ReceivePurchaseOrderDto } from "@/types";
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
import { NumberField } from "@/ui/components/number-field";
import { DatePicker } from "@/ui/components/date-picker";
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
  const t = useTranslations("purchases.receive");
  const tActions = useTranslations("common.actions");
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
  // Lines being received with no expiry date. Warned about, never blocked:
  // supplier paperwork often has no date, and refusing the receive would just
  // move the dead end here from the adjustment form. Such stock lands in the
  // product's unknown-expiry batch and can be dated later from the stock detail
  // page. The order line does not carry `hasExpiry`, so this counts every
  // dateless line — for a product that does not track expiry the note is
  // harmless, since nothing about the receive changes either way.
  const linesMissingExpiry = receiveItems.filter(
    (item) => item.receivedQuantity > 0 && !item.expiryDate,
  ).length;

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
      toast.error(t("enterQtyOneItem"));
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
        toast.error(t("selectPaymentAccount"));
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
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {order
              ? t("orderLine", { number: order.orderNumber, supplier: populatedRef(order.supplierId)?.name ?? "—" })
              : t("descriptionFallback")}
          </DialogDescription>
        </DialogHeader>

        {/* Items table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colProduct")}</TableHead>
                <TableHead className="text-right">{t("colOrdered")}</TableHead>
                {isExpiryEnabled && (
                  <>
                    <TableHead className="w-40">{t("colExpiryDate")}</TableHead>
                    <TableHead className="w-36">{t("colBatch")}</TableHead>
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
                        <DatePicker
                          date={item.expiryDate || undefined}
                          onSelect={(d) =>
                            handleExpiryFieldChange(index, "expiryDate", d ?? "")
                          }
                          placeholder={t("expiryPlaceholder")}
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
                          placeholder={t("batchOptional")}
                          className="h-8"
                        />
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary chips */}
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("itemsToReceive")}
            </div>
            <div className="text-lg font-semibold">{totalToReceive}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("currentDue")}
            </div>
            <div className="text-lg font-semibold text-orange-600">
              {formatCurrency(currentDue)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("remainingAfterPay")}
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
            {t("expiryHint")}
          </p>
        )}

        {isExpiryEnabled && linesMissingExpiry > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-amber-600">
            <PackageCheck className="h-3.5 w-3.5 shrink-0" />
            {t("missingExpiryWarning", { count: linesMissingExpiry })}
          </p>
        )}

        {/* Payment section */}
        {isAccountsEnabled && currentDue > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium text-sm">
                <CreditCard className="h-4 w-4" />
                {t("payment")}
                <span className="text-xs font-normal text-muted-foreground">
                  {t("leaveEmptyDue")}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>{t("account")}</Label>
                  <SimpleSelect
                    value={accountId}
                    onValueChange={setAccountId}
                    options={accounts.map((acc) => ({
                      label: acc.name,
                      value: acc._id,
                    }))}
                    placeholder={t("selectAccount")}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="receive-paid">{t("paidAmount")}</Label>
                  <NumberField
                    id="receive-paid"
                    precision={2}
                    min={0}
                    max={currentDue}
                    value={paidAmount === "" ? null : Number(paidAmount)}
                    onChange={(v) => setPaidAmount(v == null ? "" : String(v))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {parsedPaid > currentDue && (
                <p className="text-xs text-orange-600">
                  {t("paidCapped", { amount: formatCurrency(currentDue) })}
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
            {t("editOrder")}
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {tActions("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? t("processing") : t("confirmReceipt")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
