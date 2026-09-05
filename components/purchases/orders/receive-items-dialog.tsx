"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { populatedRef } from "@/utils/populated-ref";
import { useAccountPaymentOptions } from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type { PurchaseOrder, ReceivePurchaseOrderDto } from "@/types";
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
  const t = useTranslations("purchases.receive");
  const tActions = useTranslations("common.actions");
  const router = useRouter();
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const isExpiryEnabled = user?.organization?.features?.expiryTracking ?? false;

  // Minimal list (id/name/isDefault only) — reachable by purchases.edit
  // (what receiving actually requires) as well as accounts.view, so a
  // receiving-only role can pick a payment account without the full list.
  const { data: accountsData } = useAccountPaymentOptions(isAccountsEnabled);
  const accounts = useMemo(() => accountsData ?? [], [accountsData]);
  const defaultAccount = useMemo(
    () => accounts.find((a) => a.isDefault),
    [accounts],
  );

  const [receiveItems, setReceiveItems] = useState<ItemReceiveState[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<string>("");
  // Whether the merchant has typed in the paid field themselves. Once they have,
  // the prefill below stops touching it — nothing is worse than a form that
  // overwrites what you just entered.
  const [paidTouched, setPaidTouched] = useState(false);

  // Re-initialize state every time a new order is opened. This synchronizes
  // local form state with the dialog's external inputs (open state, the
  // selected order, and the async-loaded default account), which is a
  // legitimate use of setState inside an effect.
  useEffect(() => {
    if (open && order) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceiveItems(buildReceiveItemsFromOrder(order));
      setPaidAmount(String(order.dueAmount ?? ""));
      setPaidTouched(false);
      setAccountId(defaultAccount?._id ?? "");
    }
  }, [open, order, defaultAccount]);

  const currentDue = order?.dueAmount ?? 0;
  // Is the whole outstanding order arriving? The dialog opens this way, so the
  // common full receipt is unchanged: the field is prefilled with the due and
  // one click still settles it.
  const isFullReceive =
    receiveItems.length > 0 &&
    receiveItems.every((item) => item.receivedQuantity === item.maxQuantity);

  /**
   * The paid field was prefilled with the ENTIRE invoice no matter how much of
   * the order had actually turned up: receiving 4 of 10 — ৳6,000 of goods —
   * still offered ৳15,000, and a merchant clicking through paid the supplier for
   * six units that were not on the van (QA-R16).
   *
   * It is cleared instead of being recomputed, deliberately: a line's payable
   * share depends on per-line tax and the order's allocated additional discount,
   * and re-deriving that money in the browser is how the two ends drift apart.
   * The merchant knows what they handed over; the form should not guess.
   */
  useEffect(() => {
    if (!open || paidTouched) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaidAmount(isFullReceive ? String(currentDue || "") : "");
  }, [open, paidTouched, isFullReceive, currentDue]);

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

  /**
   * Per-line received quantity — the control that makes a PARTIAL receipt
   * possible.
   *
   * It was commented out of the table along with the Remaining column, which
   * left every receipt an all-or-nothing one: the dialog rendered the ordered
   * quantity as text and submitted the full amount. Everything around it kept
   * working — `maxQuantity` is the remaining quantity, `status: "partial"`
   * exists, the drawer prints a received/ordered counter, and the returns
   * screen reads `receivedQuantity` — so the model supported a case no screen
   * could express (QA-R15).
   *
   * Clamped through the shared helper rather than by the input's own `max`, so
   * a paste or a spinner cannot exceed what is still outstanding.
   */
  const handleQuantityChange = (index: number, value: number | null) => {
    setReceiveItems((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = {
        ...next[index],
        receivedQuantity: clampReceiveQuantity(value ?? 0, next[index].maxQuantity),
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

        {/* Items table. `min-w-0` is load-bearing: DialogContent is a grid, and a
            grid item sizes to its min-content by default — without it the table's
            intrinsic width stretches the whole dialog past the viewport on mobile
            and clips every sibling below. Shrunk here, the table scrolls itself. */}
        <div className="min-w-0 rounded-md border">
          <Table className={isExpiryEnabled ? "min-w-[560px]" : undefined}>
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
                <TableHead className="text-right">{t("colRemaining")}</TableHead>
                <TableHead className="text-right w-32">{t("colReceiveQty")}</TableHead>
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
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {item.maxQuantity}
                  </TableCell>
                  <TableCell>
                    <NumberField
                      precision={0}
                      min={0}
                      max={item.maxQuantity}
                      value={item.receivedQuantity}
                      onChange={(v) => handleQuantityChange(index, v)}
                      className="h-8 text-right"
                      // Named per row: every line otherwise announces the same
                      // "Receive quantity", so a screen reader gives no way to
                      // tell which product's field has focus.
                      aria-label={`${t("colReceiveQty")} — ${item.productName}`}
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
                    onChange={(v) => {
                      setPaidTouched(true);
                      setPaidAmount(v == null ? "" : String(v));
                    }}
                    placeholder="0.00"
                  />
                  {!isFullReceive && (
                    <p className="text-xs text-muted-foreground">
                      {t("partialReceiptPayHint")}
                    </p>
                  )}
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
          <div className="flex gap-2 sm:ml-auto">
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
