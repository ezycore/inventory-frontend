// coding-standard: maintained
import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { HandHelping, Store } from "lucide-react";
import { useCouriers, type AdminStorefrontOrder } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { SimpleSelect } from "@/ui/components/simple-select";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";
import { useStockTracked } from "@/hooks/use-stock-tracked";
import { cap, codToCollect } from "./order-detail-helpers";
import { CourierDispatchForm } from "./courier-dispatch-form";
import { CourierTimeline } from "./courier-timeline";
import { withMerchantReturns } from "./merchant-return-events";
import { CourierTrackingSummary } from "./courier-tracking-summary";
import { ManualDispatchForm } from "./manual-dispatch-form";
import { ManualStatusPanel } from "./manual-status-panel";

/** Custom couriers are namespaced in the picker so an id can't collide with a provider. */
const CUSTOM_PREFIX = "custom:";

/**
 * Fulfillment card. Pickup orders show a static in-store note (no courier).
 * Delivery orders drive dispatch, and dispatching is **commit-first** whichever
 * courier is chosen: it books the online sale (consuming the stock reservation)
 * and marks the order shipped.
 *
 * The picker merges both kinds of courier into one list — the merchant picks a
 * carrier, not a "mode" — and the selection decides which form renders.
 */
export function OrderFulfillmentPanel({ order }: { order: AdminStorefrontOrder }) {
  const tAll = useTranslations("ecommerce");
  const t = useTranslations("ecommerce.fulfillment");
  const { labelFor } = useOrderStatusLabels();
  const { data: couriersData } = useCouriers();
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const stockTracked = useStockTracked();

  const [selected, setSelected] = useState("");
  // Re-dispatch reopens the picker for a cancelled consignment (the sale already
  // exists, so this only books a fresh consignment).
  const [reDispatch, setReDispatch] = useState(false);

  const enabledCouriers = (couriersData?.couriers ?? []).filter((c) => c.enabled);
  const customCouriers = (couriersData?.customCouriers ?? []).filter(
    (c) => c.active,
  );
  const hasCourier = enabledCouriers.length + customCouriers.length > 0;

  const isDispatched = !!(
    order.courier?.consignmentId ||
    (order.courier?.integration === "manual" && order.courier?.name)
  );
  const isCancelled = order.courier?.normalizedStatus === "cancelled";
  const canShip = (order.status === "processing" && !isDispatched) || reDispatch;

  const selectedCustom = selected.startsWith(CUSTOM_PREFIX)
    ? customCouriers.find((c) => c._id === selected.slice(CUSTOM_PREFIX.length))
    : undefined;

  // A recorded prepayment shrinks what the courier collects COD — to nothing at
  // all when the shopper prepaid the whole order.
  const prepaid = order.prepaidAmount ?? 0;
  const toCollect = codToCollect(order);

  if (order.fulfillmentType === "pickup") {
    return (
      <Card className="gap-3 p-5 shadow-none">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border bg-card">
            <Store className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t("pickup")}</div>
            <div className="text-xs text-muted-foreground">{t("pickupHint")}</div>
          </div>
        </div>
      </Card>
    );
  }

  // Handed over in person (shadow test S16, 2026-10-14): no courier will carry it, so the
  // dispatch controls and "Available once the order reaches Processing" said the wrong thing.
  // A booking the courier cancelled stays visible, for the record.
  if (order.handedOverAt) {
    const reason = [...(order.statusHistory ?? [])].reverse().find((h) => h.status === "delivered")?.note;
    return (
      <Card className="gap-3 p-5 shadow-none">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border bg-card">
            <HandHelping className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t("handedOver")}</div>
            <div className="text-xs text-muted-foreground">{reason ?? t("handedOverHint")}</div>
          </div>
        </div>
        {order.courier?.consignmentId && <CourierTrackingSummary order={order} />}
      </Card>
    );
  }

  return (
    <Card className="gap-3 p-5 shadow-none">
      <h3 className="text-sm font-semibold">{t("title")}</h3>

      {isDispatched && !reDispatch ? (
        <>
          <CourierTrackingSummary
            order={order}
            onReDispatch={
              isCancelled
                ? () => {
                    setSelected("");
                    setReDispatch(true);
                  }
                : undefined
            }
          />
          {/* Only a manual courier's status is ours to set — an integrated one
              reports its own, and the sweep would overwrite anything typed here.
              Its panel carries the feed itself, right under the control that
              writes to it; an API courier gets the feed on its own. */}
          {order.courier?.integration === "manual" ? (
            <ManualStatusPanel order={order} />
          ) : (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="text-xs font-medium text-muted-foreground">{t("progress")}</div>
              <CourierTimeline history={withMerchantReturns(order, tAll)} emptyHint={t("noUpdates")} />
            </div>
          )}
        </>
      ) : canShip ? (
        !hasCourier ? (
          <p className="text-sm text-muted-foreground">
            {t.rich("noCourier", {
              link: (chunks) => (
                <Link href="/ecommerce/settings" className="font-medium text-primary underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {/* Nothing was reserved at confirm on a stock-free workspace, so there is nothing to
                  consume here either (QA-N6); the sale and the status change are real at both tiers. */}
              {t(reDispatch ? "reDispatchHint" : stockTracked ? "shipHintStock" : "shipHint")}
            </p>
            {reDispatch ? (
              <button
                type="button"
                className="self-start text-xs font-medium text-muted-foreground underline"
                onClick={() => setReDispatch(false)}
              >
                {t("cancelReDispatch")}
              </button>
            ) : null}

            {prepaid > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  {t("collectsAfterPrepaid", { amount: formatMoney(prepaid, currency) })}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(toCollect, currency)}
                </span>
              </div>
            )}

            <SimpleSelect
              value={selected}
              onValueChange={setSelected}
              options={[
                ...enabledCouriers.map((c) => ({
                  label: t("courierOption", { provider: cap(c.provider) }),
                  value: c.provider,
                })),
                ...customCouriers.map((c) => ({
                  label: c.name,
                  value: `${CUSTOM_PREFIX}${c._id}`,
                })),
              ]}
              placeholder={t("selectCourier")}
            />

            {selectedCustom ? (
              <ManualDispatchForm
                order={order}
                courier={selectedCustom}
                reDispatch={reDispatch}
                onDispatched={() => setReDispatch(false)}
              />
            ) : selected ? (
              <CourierDispatchForm
                order={order}
                provider={selected}
                reDispatch={reDispatch}
                onDispatched={() => setReDispatch(false)}
              />
            ) : null}
          </>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          {t.rich("available", { status: labelFor("processing"), b: (chunks) => <b>{chunks}</b> })}
        </p>
      )}
    </Card>
  );
}
