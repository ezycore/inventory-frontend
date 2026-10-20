// coding-standard: maintained
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useUpdateOrderStatus, type AdminStorefrontOrder } from "@/services/api";
import { courierDisplayName } from "@/components/ecommerce/payouts/helpers";
import { Button } from "@/ui/components/button";
import { OrderConfirmDialog } from "./order-confirm-dialog";

/** The courier has handed this parcel back — and it is a courier that reports, not one you update. */
export const courierSaysReturned = (order: AdminStorefrontOrder): boolean =>
  order.courier?.normalizedStatus === "returned" && order.courier.integration !== "manual";

/**
 * "Mark as Delivered" on a shipped order — asking first when the courier says the parcel came back.
 *
 * Live, UriiBaba ORD-20260911-00001: Pathao returned the parcel on 14 Sep, it was marked
 * delivered by hand on the 17th and paid on the 28th — revenue for goods back on its own shelf.
 * The backend refuses that move (`COURIER_SAYS_RETURNED`) unless the merchant confirms; this is
 * where they see why, and where "the courier is wrong, the customer has it" is still one click.
 */
export function OrderMarkDelivered({
  order,
  label,
}: {
  order: AdminStorefrontOrder;
  label: string;
}) {
  const t = useTranslations("ecommerce.markDelivered");
  const updateStatus = useUpdateOrderStatus();
  const [open, setOpen] = useState(false);
  const deliver = (confirmCourierReturned?: boolean) =>
    updateStatus.mutate({ id: order._id, status: "delivered", confirmCourierReturned });

  if (!courierSaysReturned(order)) {
    return (
      <Button size="sm" disabled={updateStatus.isPending} onClick={() => deliver()}>
        {label}
      </Button>
    );
  }

  const courier = courierDisplayName(order.courier?.name, order.courier?.provider);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <OrderConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("title", { courier })}
        description={t("body", { courier })}
        actionLabel={t("action")}
        cancelLabel={t("back")}
        destructive
        actionDisabled={updateStatus.isPending}
        onConfirm={() => deliver(true)}
      />
    </>
  );
}
