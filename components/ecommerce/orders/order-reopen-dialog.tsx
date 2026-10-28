"use client";
// coding-standard: maintained
import { useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { useReopenOrder, type AdminStorefrontOrder } from "@/services/api";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";

/**
 * Whether the server would let this order reopen. Mirrors its two order-side
 * refusals, so the button is not offered for a move that is never allowed: the
 * order must be closed, and its advance must not have been refunded — a refund
 * leaves `prepaidAmount` on the order, and dispatch would net the refunded money
 * off the COD. The coupon limit is a live count only the server can answer.
 */
export const canReopen = (order: AdminStorefrontOrder): boolean =>
  (order.status === "cancelled" || order.status === "rejected") &&
  order.paymentStatus !== "refunded" &&
  !order.prepaidRefundShippingTxnId &&
  !order.prepaidRefundGoodsTxnId;

/**
 * Reopening a cancelled or rejected order — back to the first step, to be
 * confirmed again. The reason is required, as on any backward move: it is the
 * only thing explaining the history entry later.
 */
export function OrderReopenDialog({ order }: { order: AdminStorefrontOrder }) {
  const t = useTranslations("ecommerce.reopen");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const reopen = useReopenOrder();
  const { labelFor } = useOrderStatusLabels();

  if (!canReopen(order)) return null;

  const close = () => {
    setOpen(false);
    setNote("");
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("body", { status: labelFor("pending") })}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>{t("why")}</Label>
            <Textarea
              value={note}
              rows={2}
              maxLength={280}
              placeholder={t("whyPlaceholder")}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("whyHint")}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              disabled={!note.trim() || reopen.isPending}
              onClick={() =>
                reopen.mutate({ id: order._id, note: note.trim() }, { onSuccess: close })
              }
            >
              {reopen.isPending ? t("reopening") : t("button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
