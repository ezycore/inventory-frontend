"use client";
// coding-standard: maintained

import { useState } from "react";
import { toast } from "sonner";
import type { ShippingRuleMode, StorefrontSettings } from "@/types";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { Field, SaveBar, useStoreSettingsSave } from "./settings-form-shared";

/**
 * "zones" is a UI-only choice: it saves `shippingZones` (which the backend prices ahead of any
 * rule) plus a `none` rule. Offering zones as one of the rules, rather than a separate switch,
 * is what stops a merchant picking "No shipping charge" while zone fees silently apply.
 */
type ShippingChoice = ShippingRuleMode | "zones";

const CHOICES: { value: ShippingChoice; label: string; description: string }[] = [
  { value: "none", label: "No shipping charge", description: "Delivery is free on every order." },
  { value: "flat", label: "Flat fee per order", description: "One fee, wherever the order goes." },
  { value: "free_over_threshold", label: "Free over a threshold", description: "A fee, waived above an order subtotal." },
  { value: "zones", label: "By Dhaka zone", description: "Separate inside / outside Dhaka fees; the shopper's area decides." },
];

export function ShippingSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const zones = settings.shippingZones;
  const hasZones = zones?.inside != null || zones?.outside != null;
  const [choice, setChoice] = useState<ShippingChoice>(hasZones ? "zones" : settings.shippingRule?.mode ?? "none");
  const [flatFee, setFlatFee] = useState<number | null>(settings.shippingRule?.flatFee ?? null);
  const [freeThreshold, setFreeThreshold] = useState<number | null>(settings.shippingRule?.freeThreshold ?? null);
  const [defaultCost, setDefaultCost] = useState<number | null>(settings.defaultDeliveryCost ?? 0);
  const [insideFee, setInsideFee] = useState<number | null>(zones?.inside ?? null);
  const [outsideFee, setOutsideFee] = useState<number | null>(zones?.outside ?? null);
  const [zoneFree, setZoneFree] = useState<number | null>(zones?.freeThreshold ?? null);
  const [insideEstimate, setInsideEstimate] = useState(settings.deliveryEstimates?.insideDhaka ?? "");
  const [outsideEstimate, setOutsideEstimate] = useState(settings.deliveryEstimates?.outsideDhaka ?? "");
  const [pickupEnabled, setPickupEnabled] = useState(!!settings.pickup?.enabled);
  const [pickupInstructions, setPickupInstructions] = useState(settings.pickup?.instructions ?? "");

  const onSave = () => {
    // A blank zone fee would fall back to the old rule for that zone — the hidden override this
    // screen exists to remove — so both are required.
    if (choice === "zones" && (insideFee == null || outsideFee == null)) {
      toast.error("Enter both the Inside Dhaka and Outside Dhaka fee");
      return;
    }
    const mode: ShippingRuleMode = choice === "zones" ? "none" : choice;
    save({
      defaultDeliveryCost: defaultCost ?? 0,
      pickup: { enabled: pickupEnabled, instructions: pickupInstructions.trim() || undefined },
      shippingRule: { mode, flatFee: mode === "none" ? undefined : flatFee ?? undefined, freeThreshold: mode === "free_over_threshold" ? freeThreshold ?? undefined : undefined },
      shippingZones: choice === "zones" ? { inside: insideFee ?? undefined, outside: outsideFee ?? undefined, freeThreshold: zoneFree ?? undefined } : null,
      deliveryEstimates: { insideDhaka: insideEstimate.trim() || undefined, outsideDhaka: outsideEstimate.trim() || undefined },
    });
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div><h3 className="text-sm font-semibold">Shipping charge</h3><p className="text-xs text-muted-foreground">What the shopper pays for delivery at checkout.</p></div>
        <Field label="Shipping rule"><SimpleSelect value={choice} onValueChange={(value) => setChoice(value as ShippingChoice)} options={CHOICES} /></Field>
        {choice === "flat" || choice === "free_over_threshold" ? <Field label={choice === "free_over_threshold" ? "Fee below threshold" : "Flat fee"}><NumberField min={0} precision={2} value={flatFee} onChange={setFlatFee} placeholder="0" /></Field> : null}
        {choice === "free_over_threshold" ? <Field label="Free over (order subtotal)"><NumberField min={0} precision={2} value={freeThreshold} onChange={setFreeThreshold} placeholder="0" /></Field> : null}
        {choice === "zones" ? <>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Placeholders say "e.g." — a bare "120" in an empty fee box reads as a saved value. */}
            <Field label="Inside Dhaka fee"><NumberField min={0} precision={2} value={insideFee} onChange={setInsideFee} placeholder="e.g. 60" /></Field>
            <Field label="Outside Dhaka fee"><NumberField min={0} precision={2} value={outsideFee} onChange={setOutsideFee} placeholder="e.g. 120" /></Field>
            <Field label="Free over (optional)"><NumberField min={0} precision={2} value={zoneFree} onChange={setZoneFree} placeholder="Never free" /></Field>
          </div>
          <p className="text-xs text-muted-foreground">Checkout asks the shopper for their district and area, because it decides the fee.</p>
        </> : null}
        <div className="space-y-1.5 border-t pt-4">
          <Field label="Default courier cost"><NumberField min={0} precision={2} value={defaultCost} onChange={setDefaultCost} placeholder="0" /></Field>
          <p className="text-xs text-muted-foreground">Your own expense per parcel, editable on each order. Never charged to the shopper.</p>
        </div>
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div><h3 className="text-sm font-semibold">Delivery estimates</h3><p className="text-xs text-muted-foreground">Shown on product, cart, and checkout pages. Leave blank to avoid making a delivery promise.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Inside Dhaka"><Input value={insideEstimate} onChange={(e) => setInsideEstimate(e.target.value)} maxLength={120} placeholder="e.g. 1–2 business days" /></Field>
          <Field label="Outside Dhaka"><Input value={outsideEstimate} onChange={(e) => setOutsideEstimate(e.target.value)} maxLength={120} placeholder="e.g. 3–5 business days" /></Field>
        </div>
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-semibold">Store pickup</h3><p className="text-xs text-muted-foreground">Let shoppers collect from your fulfillment location with no shipping fee.</p></div><Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} /></div>
        {pickupEnabled ? <Field label="Pickup instructions (optional)"><Textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} rows={2} maxLength={500} placeholder="e.g. Collect from the front counter, 10am–8pm." /></Field> : null}
      </Card>

      <SaveBar pending={pending} onSave={onSave} />
    </div>
  );
}
