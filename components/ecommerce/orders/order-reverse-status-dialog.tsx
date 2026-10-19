"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Undo2 } from "lucide-react";
import { useUpdateOrderStatus, type AdminStorefrontOrder } from "@/services/api";
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
import { SimpleSelect } from "@/ui/components/simple-select";
import { Textarea } from "@/ui/components/textarea";

/**
 * Moving an order BACKWARD — the merchant correcting themselves after a
 * mis-clicked confirm, or an order marked delivered a day early.
 *
 * The pipeline, mirrored from the backend's flow definition. Order matters: the
 * index of a status in this list is what decides direction.
 */
const DELIVERY_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];
const PICKUP_FLOW = ["pending", "confirmed", "ready_for_pickup", "picked_up"];

/**
 * The steps this order may go back to.
 *
 * Mirrors the server's rule rather than guessing: an uncommitted order can return
 * to any earlier step, while a committed one (a Sale exists) may only move among
 * the steps at or above the one that created the Sale — `delivered → shipped`
 * corrects a label and leaves the ledger alone, `shipped → processing` would have
 * to reverse the Sale and belongs to the Return path.
 *
 * Empty ⇒ no reversal is offered at all, which is also the answer once the parcel
 * is with a courier: a status change does not recall it.
 */
export const reversibleTargets = (order: AdminStorefrontOrder): string[] => {
  if (order.courier?.consignmentId) return [];
  const flow = order.fulfillmentType === "pickup" ? PICKUP_FLOW : DELIVERY_FLOW;
  const from = flow.indexOf(order.status);
  if (from <= 0) return [];

  // Un-delivering an order whose money is in would leave a parcel marked in
  // transit against a settled COD.
  if (order.saleId && order.paidAt) return [];

  const floor = order.saleId
    ? flow.indexOf(order.fulfillmentType === "pickup" ? "ready_for_pickup" : "shipped")
    : 0;
  return flow.slice(floor, from);
};

export function OrderReverseStatusDialog({ order }: { order: AdminStorefrontOrder }) {
  const t = useTranslations("ecommerce.reverseStatus");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const updateStatus = useUpdateOrderStatus();
  const { labelFor } = useOrderStatusLabels();

  const targets = useMemo(() => reversibleTargets(order), [order]);
  const options = useMemo(
    () => targets.map((s) => ({ value: s, label: labelFor(s) })),
    [targets, labelFor],
  );

  if (!targets.length) return null;

  const close = () => {
    setOpen(false);
    setStatus("");
    setNote("");
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Undo2 className="mr-1.5 h-3.5 w-3.5" />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t(order.stockReserved ? "bodyReserved" : "body")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("to")}</Label>
              <SimpleSelect
                value={status}
                onValueChange={setStatus}
                options={options}
                placeholder={t("stepPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("why")}</Label>
              <Textarea
                value={note}
                rows={2}
                maxLength={280}
                placeholder={t("whyPlaceholder")}
                onChange={(e) => setNote(e.target.value)}
              />
              {/* Required, unlike a forward step: months later this line is the
                  only thing explaining why the order went backward. */}
              <p className="text-xs text-muted-foreground">{t("whyHint")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              disabled={!status || !note.trim() || updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate(
                  { id: order._id, status, note: note.trim() },
                  { onSuccess: close },
                )
              }
            >
              {updateStatus.isPending ? t("moving") : t("button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
