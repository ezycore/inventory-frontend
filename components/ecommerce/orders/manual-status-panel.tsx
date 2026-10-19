// coding-standard: maintained
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { useSetCourierStatus, type AdminStorefrontOrder } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { SimpleSelect } from "@/ui/components/simple-select";
import { CourierTimeline } from "./courier-timeline";

/**
 * The merchant driving a manual courier's delivery status, and the progress feed
 * that produces. Shown only for `integration: "manual"` — an integrated provider
 * reports its own status, and a hand-set value there would be overwritten by the
 * next sweep.
 *
 * `unknown` is not offered: it is what an unmapped provider string normalizes to,
 * never something a person would choose.
 */
const STATUS_VALUES = ["pending", "in_transit", "delivered", "returned", "cancelled"] as const;

export function ManualStatusPanel({ order }: { order: AdminStorefrontOrder }) {
  const t = useTranslations("ecommerce.manualStatus");
  const tBadge = useTranslations("ecommerce.courierBadge");
  const statusOptions = useMemo(
    () => STATUS_VALUES.map((value) => ({ value, label: tBadge(value) })),
    [tBadge],
  );
  const setStatus = useSetCourierStatus();

  const current = order.courier?.normalizedStatus ?? "pending";
  const [status, setStatus_] = useState<string>(current);
  const [note, setNote] = useState("");

  const history = order.courier?.history ?? [];
  // Only while the order itself is not yet returned: once it is, the sale has been
  // reversed and the warning below would be stale (S21).
  const needsReturn = current === "returned" && order.status !== "returned";
  const unchanged = status === current && !note.trim();

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <h4 className="text-sm font-semibold">{t("title")}</h4>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SimpleSelect
          value={status}
          onValueChange={setStatus_}
          options={statusOptions}
          className="sm:w-48"
        />
        <Input
          value={note}
          maxLength={280}
          placeholder={t("notePlaceholder")}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          className="sm:flex-none"
          disabled={setStatus.isPending || unchanged}
          onClick={() =>
            setStatus.mutate(
              { id: order._id, normalizedStatus: status, note: note.trim() || undefined },
              { onSuccess: () => setNote("") },
            )
          }
        >
          {t("update")}
        </Button>
      </div>

      {/* Marking the parcel returned does NOT reverse the sale — that needs the
          return charge, refund routing and an account. Say so, or the merchant
          will assume the money moved. */}
      {needsReturn ? (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          <span>{t.rich("needsReturn", { b: (chunks) => <b>{chunks}</b> })}</span>
        </p>
      ) : null}

      {history.length > 0 ? (
        <div className="space-y-2 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground">{t("progress")}</div>
          {/* The same component the integrated couriers render, so a merchant
              driving a parcel by hand reads it exactly as they read Pathao's. */}
          <CourierTimeline history={history} />
        </div>
      ) : null}
    </div>
  );
}
