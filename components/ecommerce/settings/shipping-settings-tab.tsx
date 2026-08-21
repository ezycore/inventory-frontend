"use client";
// coding-standard: maintained

import { useState } from "react";
import type { ShippingRuleMode, StorefrontSettings } from "@/types";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { Field, SaveBar, useStoreSettingsSave } from "./settings-form-shared";

const MODES: { value: ShippingRuleMode; label: string }[] = [
  { value: "none", label: "No shipping charge" },
  { value: "flat", label: "Flat fee per order" },
  { value: "free_over_threshold", label: "Free over a threshold" },
];

export function ShippingSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const [mode, setMode] = useState<ShippingRuleMode>(settings.shippingRule?.mode ?? "none");
  const [flatFee, setFlatFee] = useState<number | null>(settings.shippingRule?.flatFee ?? null);
  const [freeThreshold, setFreeThreshold] = useState<number | null>(settings.shippingRule?.freeThreshold ?? null);
  const [defaultCost, setDefaultCost] = useState<number | null>(settings.defaultDeliveryCost ?? 0);
  const [zonesEnabled, setZonesEnabled] = useState(settings.shippingZones?.inside != null || settings.shippingZones?.outside != null);
  const [insideFee, setInsideFee] = useState<number | null>(settings.shippingZones?.inside ?? null);
  const [outsideFee, setOutsideFee] = useState<number | null>(settings.shippingZones?.outside ?? null);
  const [zoneFree, setZoneFree] = useState<number | null>(settings.shippingZones?.freeThreshold ?? null);
  const [insideEstimate, setInsideEstimate] = useState(settings.deliveryEstimates?.insideDhaka ?? "");
  const [outsideEstimate, setOutsideEstimate] = useState(settings.deliveryEstimates?.outsideDhaka ?? "");
  const [pickupEnabled, setPickupEnabled] = useState(!!settings.pickup?.enabled);
  const [pickupInstructions, setPickupInstructions] = useState(settings.pickup?.instructions ?? "");

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Shipping &amp; delivery</h3>
        <Field label="Shipping rule"><SimpleSelect value={mode} onValueChange={(value) => setMode(value as ShippingRuleMode)} options={MODES} /></Field>
        {mode !== "none" ? <Field label={mode === "free_over_threshold" ? "Fee below threshold" : "Flat fee"}><NumberField min={0} precision={2} value={flatFee} onChange={setFlatFee} placeholder="0" /></Field> : null}
        {mode === "free_over_threshold" ? <Field label="Free over (order subtotal)"><NumberField min={0} precision={2} value={freeThreshold} onChange={setFreeThreshold} placeholder="0" /></Field> : null}
        <Field label="Default courier cost (your expense, editable per order)"><NumberField min={0} precision={2} value={defaultCost} onChange={setDefaultCost} placeholder="0" /></Field>
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div><h3 className="text-sm font-semibold">Delivery estimates</h3><p className="text-xs text-muted-foreground">Shown on product, cart, and checkout pages. Leave blank to avoid making a delivery promise.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Inside Dhaka"><Input value={insideEstimate} onChange={(e) => setInsideEstimate(e.target.value)} maxLength={120} placeholder="e.g. 1–2 business days" /></Field>
          <Field label="Outside Dhaka"><Input value={outsideEstimate} onChange={(e) => setOutsideEstimate(e.target.value)} maxLength={120} placeholder="e.g. 3–5 business days" /></Field>
        </div>
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-semibold">Dhaka delivery zones</h3><p className="text-xs text-muted-foreground">These rates override the general rule; the shopper chooses a zone at checkout.</p></div><Switch checked={zonesEnabled} onCheckedChange={setZonesEnabled} /></div>
        {zonesEnabled ? <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Inside Dhaka fee"><NumberField min={0} precision={2} value={insideFee} onChange={setInsideFee} placeholder="60" /></Field>
          <Field label="Outside Dhaka fee"><NumberField min={0} precision={2} value={outsideFee} onChange={setOutsideFee} placeholder="120" /></Field>
          <Field label="Free over (subtotal)"><NumberField min={0} precision={2} value={zoneFree} onChange={setZoneFree} placeholder="2000" /></Field>
        </div> : null}
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-semibold">Store pickup</h3><p className="text-xs text-muted-foreground">Let shoppers collect from your fulfillment location with no shipping fee.</p></div><Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} /></div>
        {pickupEnabled ? <Field label="Pickup instructions (optional)"><Textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} rows={2} maxLength={500} placeholder="e.g. Collect from the front counter, 10am–8pm." /></Field> : null}
      </Card>

      <SaveBar pending={pending} onSave={() => save({
        defaultDeliveryCost: defaultCost ?? 0,
        pickup: { enabled: pickupEnabled, instructions: pickupInstructions.trim() || undefined },
        shippingRule: { mode, flatFee: mode === "none" ? undefined : flatFee ?? undefined, freeThreshold: mode === "free_over_threshold" ? freeThreshold ?? undefined : undefined },
        shippingZones: zonesEnabled ? { inside: insideFee ?? undefined, outside: outsideFee ?? undefined, freeThreshold: zoneFree ?? undefined } : null,
        deliveryEstimates: { insideDhaka: insideEstimate.trim() || undefined, outsideDhaka: outsideEstimate.trim() || undefined },
      })} />
    </div>
  );
}
