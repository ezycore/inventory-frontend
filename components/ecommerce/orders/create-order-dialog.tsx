"use client";
// coding-standard: maintained
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency";
import type { AdminOrderChannel } from "@/services/api/modules/storefront-orders/api";
import { BD_DISTRICTS, districtLabel, upazilasOf } from "@/lib/bd-geo";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useGetStorefrontSettings } from "@/services/api";
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
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Textarea } from "@/ui/components/textarea";
import { CreateOrderLines } from "./create-order-lines";
import { CreateOrderSummary } from "./create-order-summary";
import { useOrderForm, type OrderFormInitial } from "./use-order-form";

/**
 * Record an order the merchant took off the website.
 *
 * This is the screen the whole omnichannel feature exists for: most of a BD
 * f-commerce merchant's volume arrives by Messenger, WhatsApp, a boosted post's
 * comments or a phone call, and until now their only way to ring it up was a POS
 * `Sale` — which has no courier dispatch, no tracking, no prepayment, no RTO and
 * no fraud check. Typing it here puts it on the same pipeline as a web order.
 *
 * **Channel is required and has no default.** Guessing it would file every chat
 * order as `website` and quietly make the channel report — the number that tells
 * the merchant whether Messenger orders are worth their courier fees — a lie.
 *
 * State and pricing live in `useOrderForm`; the lines table and the money
 * summary are their own components. This file is the shell and the field grid.
 */

/** Brand names stay as they are; the rest are keys under `ecommerce.createOrder`. */
const CHANNELS: { value: AdminOrderChannel; name?: string; key?: string }[] = [
  { value: "messenger", name: "Messenger" },
  { value: "whatsapp", name: "WhatsApp" },
  { value: "instagram", name: "Instagram" },
  { value: "comment", key: "channelComment" },
  { value: "phone", key: "channelPhone" },
  { value: "manual", key: "channelOther" },
];

/**
 * What this dialog can record, beyond the merchant's own methods.
 *
 * `cod` because the platform ships it, and `manual` because it is this endpoint's
 * whole reason to exist: a chat order settled some way the storefront never
 * offered. The merchant's defined methods are appended at render — and unlike the
 * storefront, a DISABLED one is still offered here, because an order taken last
 * week by a method switched off yesterday still has to be recordable.
 */
const BUILT_IN_PAYMENT_METHODS = [
  { value: "cod", key: "payCod" },
  { value: "manual", key: "payManual" },
];

const DISCOUNT_TYPES = [
  { value: "fixed", key: "discountFixed" },
  { value: "percentage", key: "discountPercent" },
];

export function CreateOrderDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present ⇒ the dialog edits that order instead of creating a new one. */
  initial?: OrderFormInitial;
}) {
  const t = useTranslations("ecommerce.createOrder");
  const locale = useLocale();
  const channelOptions = useMemo(
    () => CHANNELS.map((c) => ({ value: c.value, label: c.name ?? t(c.key!) })),
    [t],
  );
  const discountTypeOptions = useMemo(
    () => DISCOUNT_TYPES.map((d) => ({ value: d.value, label: t(d.key) })),
    [t],
  );
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const form = useOrderForm(() => onOpenChange(false), initial);
  const areas = useMemo(() => upazilasOf(form.district), [form.district]);

  // The merchant's own methods, appended to the two the platform owns. Every
  // DEFINED method is listed, enabled or not: an order taken last week by a
  // method switched off yesterday still has to be recordable.
  const { data: storeSettings } = useGetStorefrontSettings();
  const paymentMethodOptions = useMemo(
    () => [
      ...BUILT_IN_PAYMENT_METHODS.map((m) => ({ value: m.value, label: t(m.key) })),
      ...(storeSettings?.paymentMethods ?? [])
        .filter((m): m is { id: string; title: string } => !!m.id)
        .map((m) => ({ value: m.id, label: m.title })),
    ],
    [storeSettings?.paymentMethods, t],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl"
        // An edit opens on the product search (the first field without the
        // paste box), and focusing it pops the product list over the order the
        // merchant came to read — and the keyboard on a phone. Focus the dialog
        // itself instead so Esc and Tab still work.
        onOpenAutoFocus={
          form.isEdit
            ? (e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement | null)?.focus();
              }
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{t(form.isEdit ? "editTitle" : "createTitle")}</DialogTitle>
          <DialogDescription>{t(form.isEdit ? "editBody" : "createBody")}</DialogDescription>
        </DialogHeader>

        {/* `min-w-0`: DialogContent is a grid, and a grid item will not shrink
            below its content — one long product name in a nowrap table cell
            would widen the whole dialog past a phone's screen. */}
        <div className="min-w-0 space-y-4">
          {/* Buyers send one blob of text; retyping it into five fields is the
              slowest part of taking a chat order. Create only: the paste fills
              empty fields alone, and an edit opens with every one filled. */}
          {!form.isEdit && (
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
              <Label>{t("paste")}</Label>
              <Textarea
                value={form.pasted}
                rows={3}
                placeholder={t("pastePlaceholder")}
                onChange={(e) => form.setPasted(e.target.value)}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{t("pasteHint")}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={form.applyPaste}
                  disabled={!form.pasted.trim()}
                >
                  {t("fill")}
                </Button>
              </div>
            </div>
          )}

          <CreateOrderLines
            open={open}
            lines={form.lines}
            onAdd={form.addLine}
            onQuantity={form.setQuantity}
            onRemove={form.removeLine}
            quotedFor={form.quotedFor}
            rejectedFor={form.rejectedFor}
            quoting={form.quoting}
            currency={currency}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("channel")}</Label>
              <SimpleSelect
                value={form.channel}
                onValueChange={(v) => form.setChannel(v as AdminOrderChannel)}
                options={channelOptions}
                placeholder={t("channelPlaceholder")}
                // Where an order came from is a fact about the past. A website
                // order was placed by the shopper, and rewriting that would make
                // the channel report — which tells the merchant whether Messenger
                // orders are worth their courier fees — a lie.
                disabled={form.isEdit}
              />
              {form.isEdit ? (
                <p className="text-xs text-muted-foreground">{t("channelLocked")}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>{t("payment")}</Label>
              <SimpleSelect
                value={form.paymentMethod}
                onValueChange={form.setPaymentMethod}
                options={paymentMethodOptions}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("name")}</Label>
              <Input
                value={form.name}
                onChange={(e) => form.setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("phone")}</Label>
              <Input
                value={form.phone}
                inputMode="tel"
                onChange={(e) => form.setPhone(e.target.value)}
                aria-invalid={form.phoneInvalid}
              />
              {/* The phone is the buyer's identity on an order with no account —
                  it keys the customer match, the delivery-risk score and the
                  coupon limit — so the server rejects one it cannot normalise. */}
              {form.phoneInvalid ? (
                <p className="text-xs text-destructive">{t("phoneInvalid")}</p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("address")}</Label>
              <Input
                value={form.address}
                onChange={(e) => form.setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("district")}</Label>
              <SimpleSelect
                value={form.district}
                onValueChange={(v) => {
                  form.setDistrict(v);
                  // The area list is district-scoped, so a stale area would be
                  // sent for the wrong district and break courier resolution.
                  form.setArea("");
                }}
                options={BD_DISTRICTS.map((d) => ({
                  value: d.name,
                  label: districtLabel(d, locale),
                }))}
                placeholder={t("districtPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("area")}</Label>
              <SimpleSelect
                value={form.area}
                onValueChange={form.setArea}
                options={areas.map((a) => ({ value: a.name, label: a.name }))}
                placeholder={t(form.district ? "areaPlaceholder" : "areaNeedsDistrict")}
                disabled={!form.district}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("deliveryCharge")}</Label>
              <NumberField
                value={form.shippingCharged}
                precision={2}
                min={0}
                onChange={form.setShippingCharged}
                placeholder={t("deliveryChargePlaceholder")}
              />
              {/* Blank = price it like a web order. A typed 0 is a real answer
                  ("free delivery, we agreed") and the server honours it. */}
            </div>
            <div className="space-y-1.5">
              <Label>{t("coupon")}</Label>
              <Input
                value={form.coupon}
                onChange={(e) => form.setCoupon(e.target.value.toUpperCase())}
                placeholder={t("optional")}
                aria-invalid={!!form.quote?.couponError}
              />
              {/* The buyer quoting a code back from a boosted post is the case
                  this is here for, so an invalid one is a field-level answer —
                  the rest of the order keeps its prices. */}
              {form.quote?.couponError ? (
                <p className="text-xs text-destructive">
                  {form.quote.couponError.message}
                </p>
              ) : form.quote?.couponCode ? (
                <p className="text-xs text-muted-foreground">
                  {t("couponApplied", {
                    code: form.quote.couponCode,
                    amount: formatCurrency(form.quote.couponDiscount, currency),
                  })}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("discount")}</Label>
              <div className="flex gap-2">
                <SimpleSelect
                  value={form.discountType}
                  onValueChange={(v) =>
                    form.setDiscountType(v as "fixed" | "percentage")
                  }
                  options={discountTypeOptions}
                  className="w-36 shrink-0"
                />
                <NumberField
                  value={form.discountValue}
                  // A percentage is capped at 100; a fixed amount is capped by
                  // the server at the subtotal, which this form does not compute.
                  precision={form.discountType === "percentage" ? 0 : 2}
                  min={0}
                  max={form.discountType === "percentage" ? 100 : undefined}
                  onChange={form.setDiscountValue}
                  placeholder="0"
                  className="min-w-0 flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("discountHint")}</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={form.notes}
                rows={2}
                onChange={(e) => form.setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Editing never moves the order's status — confirming is its own
              action, and a save that also reserved stock would hide that. What an
              edit offers instead is the escape hatch from the price hold. */}
          {form.isEdit ? (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.reprice}
                onCheckedChange={(c) => form.setReprice(c === true)}
              />
              <span>
                {t("reprice")}
                <span className="block text-xs text-muted-foreground">{t("repriceHint")}</span>
              </span>
            </label>
          ) : (
            <>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.confirmImmediately}
                onCheckedChange={(c) => form.setConfirmImmediately(c === true)}
              />
              <span>
                {t("confirmNow")}
                <span className="block text-xs text-muted-foreground">{t("confirmNowHint")}</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.excludeFromMeta}
                onCheckedChange={(c) => form.setExcludeFromMeta(c === true)}
              />
              <span>
                {t("excludeMeta")}
                <span className="block text-xs text-muted-foreground">{t("excludeMetaHint")}</span>
              </span>
            </label>
            </>
          )}

          <CreateOrderSummary
            quote={form.lines.length ? form.quote : undefined}
            quoting={form.quoting}
            rejected={form.rejected}
            currency={currency}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={form.submit}
            disabled={!form.canSubmit || form.submitting}
          >
            {form.isEdit
              ? t(form.submitting ? "saving" : "save")
              : t(form.submitting ? "creating" : "create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
