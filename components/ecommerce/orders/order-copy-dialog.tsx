"use client";
// coding-standard: maintained
import { useState } from "react";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminStorefrontOrder } from "@/services/api";
import { Button } from "@/ui/components/button";
import { CreateOrderDialog } from "./create-order-dialog";
import { useOrderCopyInitial } from "./use-order-copy-initial";

/**
 * A new order seeded with this order's products — see `useOrderCopyInitial` for
 * what is copied and why the rest is not. Offered on every order whatever its
 * status: a rejected or delivered order is as good a template as a live one.
 *
 * Controlled, so the row menu can open it as a sibling of its dropdown (a menu
 * item that hosted it would unmount it on select). Mounts the form only once
 * seeded — `useOrderForm` reads its seed once.
 */
export function OrderCopyDialog({
  order,
  open,
  onOpenChange,
}: {
  order: AdminStorefrontOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { initial, copiedFrom } = useOrderCopyInitial(order, open);
  if (!open || !initial || !copiedFrom) return null;
  return (
    <CreateOrderDialog
      open
      onOpenChange={onOpenChange}
      initial={initial}
      copiedFrom={copiedFrom}
    />
  );
}

/** "Copy" on the order detail header. One word: the header row is already full. */
export function OrderCopyButton({ order }: { order: AdminStorefrontOrder }) {
  const [open, setOpen] = useState(false);
  const { loading } = useOrderCopyInitial(order, open);
  const t = useTranslations("ecommerce.orderCopy");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={loading && open}
      >
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        {t("button")}
      </Button>
      <OrderCopyDialog order={order} open={open} onOpenChange={setOpen} />
    </>
  );
}
