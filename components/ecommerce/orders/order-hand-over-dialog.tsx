"use client";
// coding-standard: maintained
import { useState } from "react";
import { useTranslations } from "next-intl";
import { HandHelping } from "lucide-react";
import { useHandOverOrder, type AdminStorefrontOrder } from "@/services/api";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
import { formatMoney } from "@/components/storefront/format";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Textarea } from "@/ui/components/textarea";

/** The courier cancelled this booking: it never carried the parcel. */
export const courierBookingCancelled = (order: AdminStorefrontOrder): boolean =>
  order.status === "shipped" &&
  order.courier?.normalizedStatus === "cancelled" &&
  order.courier.integration !== "manual";

/**
 * Whether the order can be handed over in person. Mirrors the backend
 * (`storefrontOrderHandoverService`): a delivery order that is confirmed or processing
 * with no courier booked, or shipped with a booking the courier cancelled.
 */
export const canHandOver = (order: AdminStorefrontOrder): boolean =>
  order.fulfillmentType !== "pickup" &&
  ((["confirmed", "processing"].includes(order.status) && !order.courier?.consignmentId) ||
    (order.status === "shipped" && order.courier?.normalizedStatus === "cancelled"));

/**
 * "Handed over in person" — the customer collected a delivery order from the merchant, with no
 * courier (shadow test S4, 2026-10-13). Delivered and paid in one step, the money to the
 * merchant. The note is required: it is the only record of why this order never went out with
 * a courier.
 */
export function OrderHandOverDialog({ order }: { order: AdminStorefrontOrder }) {
  const t = useTranslations("ecommerce.handOver");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  // Unticked by default — the merchant opts in to dropping the charge (owner, 2026-10-13).
  const [removeDeliveryCharge, setRemoveDeliveryCharge] = useState(false);
  const [pickedAccountId, setAccountId] = useState("");
  const handOver = useHandOverOrder();
  const {
    accountsEnabled,
    options,
    defaultAccountId: defaultOrderAccountId,
  } = useOrderAccountOptions(order.paymentMethod);
  // The merchant's pick, else the account this order's payment method maps to, else
  // the org default (`useOrderAccountOptions`).
  const accountId = pickedAccountId || defaultOrderAccountId;
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  if (!canHandOver(order)) return null;

  const deliveryCharge = order.shippingCharged ?? 0;
  // An advance on the delivery charge was money taken; removing the charge would need a refund.
  const canRemoveCharge = deliveryCharge > 0 && !(order.prepaidShippingAmount ?? 0);
  const removing = canRemoveCharge && removeDeliveryCharge;
  const toPay = (order.totalAmount ?? 0) - (removing ? deliveryCharge : 0) - (order.prepaidAmount ?? 0);
  const money = (n: number) => formatMoney(Math.max(0, n), currency);

  const close = () => {
    setOpen(false);
    setNote("");
    setRemoveDeliveryCharge(false);
    setAccountId("");
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <HandHelping className="mr-1.5 h-3.5 w-3.5" />
        {t("title")}
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {t(courierBookingCancelled(order) ? "bodyCancelledBooking" : "body")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hand-over-note">{t("why")}</Label>
              <Textarea
                id="hand-over-note"
                value={note}
                rows={2}
                maxLength={280}
                placeholder={t("whyPlaceholder")}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("whyHint")}</p>
            </div>

            {canRemoveCharge && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={removeDeliveryCharge}
                  onCheckedChange={(checked) => setRemoveDeliveryCharge(checked === true)}
                />
                {t("removeCharge", { amount: money(deliveryCharge) })}
              </label>
            )}

            {accountsEnabled && (
              <div className="space-y-1.5">
                <Label>{t("account")}</Label>
                <SimpleSelect
                  value={accountId}
                  onValueChange={setAccountId}
                  options={options}
                  placeholder={t("accountPlaceholder")}
                />
              </div>
            )}

            <p className="text-sm font-medium">{t("customerPaid", { amount: money(toPay) })}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              disabled={!note.trim() || (accountsEnabled && !accountId) || handOver.isPending}
              onClick={() =>
                handOver.mutate(
                  {
                    id: order._id,
                    note: note.trim(),
                    removeDeliveryCharge: removing,
                    ...(accountsEnabled ? { accountId } : {}),
                  },
                  { onSuccess: close },
                )
              }
            >
              {handOver.isPending ? t("saving") : t("submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
