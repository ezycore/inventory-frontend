// coding-standard: maintained
import { useState } from "react";
import { Lock } from "lucide-react";
import { useUpdateCourierCost, type AdminStorefrontOrder } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";

/**
 * Line items (prices snapshotted at purchase) + the money breakdown, including the
 * inline courier-cost editor (editable before payment is recorded) and the
 * shipping-margin note the shopper never sees.
 */
export function OrderLineItems({ order }: { order: AdminStorefrontOrder }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const updateCourierCost = useUpdateCourierCost();
  const [courierCost, setCourierCost] = useState(String(order.shippingCost ?? 0));
  const [editingShipping, setEditingShipping] = useState(false);
  const money = (n: number | undefined) => formatMoney(n ?? 0, currency);

  const saveShipping = () => {
    updateCourierCost.mutate(
      { id: order._id, shippingCost: Number(courierCost) || 0 },
      { onSuccess: () => setEditingShipping(false) },
    );
  };

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h3 className="text-sm font-semibold">Line items</h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> snapshotted at purchase
        </span>
      </div>
      {order.items.map((it, idx) => (
        <div key={idx} className="flex items-center gap-3 border-b px-5 py-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
            {it.productName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{it.productName}</div>
          </div>
          <div className="w-32 text-right text-xs tabular-nums text-muted-foreground">
            {money(it.price)} × {it.quantity}
          </div>
          <div className="w-24 text-right text-sm font-semibold tabular-nums">
            {money(it.subtotal)}
          </div>
        </div>
      ))}

      <div className="space-y-2 px-5 py-4 text-sm">
        <BreakdownRow label="Subtotal" value={money(order.subtotal)} />
        {order.discountAmount > 0 && (
          <BreakdownRow
            label={
              order.couponCode ? `Discount · ${order.couponCode}` : "Discount"
            }
            value={`−${money(order.discountAmount)}`}
            positive
          />
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Shipping fee</span>
          {editingShipping ? (
            <span className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={courierCost}
                onChange={(e) => setCourierCost(e.target.value)}
                className="h-7 w-24 text-right"
              />
              <Button
                size="sm"
                className="h-7"
                disabled={updateCourierCost.isPending}
                onClick={saveShipping}
              >
                Save
              </Button>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="tabular-nums text-foreground">
                {money(order.shippingCharged)}
              </span>
              <button
                type="button"
                onClick={() => setEditingShipping(true)}
                className="text-xs font-semibold text-primary"
              >
                Edit
              </button>
            </span>
          )}
        </div>
        <div className="flex justify-between border-t pt-2.5 text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{money(order.totalAmount)}</span>
        </div>
        <p className="pt-1 text-xs text-muted-foreground">
          Courier cost (your expense): {money(order.shippingCost)} · shipping
          margin {money(order.shippingCharged - order.shippingCost)}
        </p>
      </div>
    </Card>
  );
}

function BreakdownRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between",
        positive ? "text-green-700" : "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className={cn("tabular-nums", !positive && "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
