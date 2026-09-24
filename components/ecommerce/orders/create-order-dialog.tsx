"use client";
// coding-standard: maintained
import { useMemo } from "react";
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

const CHANNELS: { value: AdminOrderChannel; label: string }[] = [
  { value: "messenger", label: "Messenger" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "comment", label: "Post comment" },
  { value: "phone", label: "Phone call" },
  { value: "manual", label: "Other" },
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
  { value: "cod", label: "Cash on delivery" },
  { value: "manual", label: "Already paid / manual" },
];

const DISCOUNT_TYPES = [
  { value: "fixed", label: "Amount (৳)" },
  { value: "percentage", label: "Percent (%)" },
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
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const form = useOrderForm(() => onOpenChange(false), initial);
  const areas = useMemo(() => upazilasOf(form.district), [form.district]);

  // The merchant's own methods, appended to the two the platform owns. Every
  // DEFINED method is listed, enabled or not: an order taken last week by a
  // method switched off yesterday still has to be recordable.
  const { data: storeSettings } = useGetStorefrontSettings();
  const paymentMethodOptions = useMemo(
    () => [
      ...BUILT_IN_PAYMENT_METHODS,
      ...(storeSettings?.paymentMethods ?? [])
        .filter((m): m is { id: string; title: string } => !!m.id)
        .map((m) => ({ value: m.id, label: m.title })),
    ],
    [storeSettings?.paymentMethods],
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
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
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
          <DialogTitle>{form.isEdit ? "Edit order" : "Create order"}</DialogTitle>
          <DialogDescription>
            {form.isEdit
              ? "Change the lines, address or price before the order goes to the courier. Prices already agreed stay as they are unless you re-price."
              : "For an order taken on Messenger, WhatsApp, a post comment or the phone. It runs the same pipeline as a website order — courier, tracking and COD included."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Buyers send one blob of text; retyping it into five fields is the
              slowest part of taking a chat order. Create only: the paste fills
              empty fields alone, and an edit opens with every one filled. */}
          {!form.isEdit && (
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
              <Label>Paste the customer&apos;s message</Label>
              <Textarea
                value={form.pasted}
                rows={3}
                placeholder={"Rahim Uddin\n01712345678\nHouse 12, Road 4, Dhanmondi, Dhaka"}
                onChange={(e) => form.setPasted(e.target.value)}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Fills only the fields it recognises, and never overwrites one you
                  have already typed.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={form.applyPaste}
                  disabled={!form.pasted.trim()}
                >
                  Fill fields
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
              <Label>Where did this order come from?</Label>
              <SimpleSelect
                value={form.channel}
                onValueChange={(v) => form.setChannel(v as AdminOrderChannel)}
                options={CHANNELS}
                placeholder="Select a channel"
                // Where an order came from is a fact about the past. A website
                // order was placed by the shopper, and rewriting that would make
                // the channel report — which tells the merchant whether Messenger
                // orders are worth their courier fees — a lie.
                disabled={form.isEdit}
              />
              {form.isEdit ? (
                <p className="text-xs text-muted-foreground">
                  Where an order came from can&apos;t be changed.
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Payment</Label>
              <SimpleSelect
                value={form.paymentMethod}
                onValueChange={form.setPaymentMethod}
                options={paymentMethodOptions}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Customer name</Label>
              <Input
                value={form.name}
                onChange={(e) => form.setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
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
                <p className="text-xs text-destructive">
                  Enter a valid Bangladeshi mobile number, e.g. 01712345678
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => form.setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
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
                  label: districtLabel(d, "en"),
                }))}
                placeholder="Select a district"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Area</Label>
              <SimpleSelect
                value={form.area}
                onValueChange={form.setArea}
                options={areas.map((a) => ({ value: a.name, label: a.name }))}
                placeholder={
                  form.district ? "Select an area" : "Pick a district first"
                }
                disabled={!form.district}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Delivery charge</Label>
              <NumberField
                value={form.shippingCharged}
                precision={2}
                min={0}
                onChange={form.setShippingCharged}
                placeholder="Use store rule"
              />
              {/* Blank = price it like a web order. A typed 0 is a real answer
                  ("free delivery, we agreed") and the server honours it. */}
            </div>
            <div className="space-y-1.5">
              <Label>Coupon code</Label>
              <Input
                value={form.coupon}
                onChange={(e) => form.setCoupon(e.target.value.toUpperCase())}
                placeholder="Optional"
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
                  {form.quote.couponCode} applied ·{" "}
                  {formatCurrency(form.quote.couponDiscount, currency)} off
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Discount</Label>
              <div className="flex gap-2">
                <SimpleSelect
                  value={form.discountType}
                  onValueChange={(v) =>
                    form.setDiscountType(v as "fixed" | "percentage")
                  }
                  options={DISCOUNT_TYPES}
                  className="w-40"
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
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                An amount you agreed in the conversation. Applies on top of a
                coupon.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
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
                Re-price everything at today&apos;s prices
                <span className="block text-xs text-muted-foreground">
                  Off by default, so changing one line never quietly reprices the
                  rest against a total the customer already agreed.
                </span>
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
                Confirm and reserve stock now
                <span className="block text-xs text-muted-foreground">
                  A chat order is already agreed, so this saves a second click.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.excludeFromMeta}
                onCheckedChange={(c) => form.setExcludeFromMeta(c === true)}
              />
              <span>
                Don&apos;t report this order to Meta
                <span className="block text-xs text-muted-foreground">
                  For a personal, internal or test order. Tick it here — confirming above sends
                  the order to Meta straight away, so there is no chance to exclude it later.
                </span>
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
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.submit}
            disabled={!form.canSubmit || form.submitting}
          >
            {form.isEdit
              ? form.submitting
                ? "Saving…"
                : "Save changes"
              : form.submitting
                ? "Creating…"
                : "Create order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
