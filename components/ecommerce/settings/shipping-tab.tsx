"use client";
// coding-standard: maintained

import { useState } from "react";
import type { ShippingRuleMode, StorefrontSettings } from "@/types";
import { Card } from "@/ui/components/card";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { Field, SaveBar, useSave } from "./settings-primitives";

const SHIPPING_MODES: { value: ShippingRuleMode; label: string }[] = [
  { value: "none", label: "No shipping charge" },
  { value: "flat", label: "Flat fee per order" },
  { value: "free_over_threshold", label: "Free over a threshold" },
];

/** Store Settings → Shipping: the shipping rule, Dhaka zones, and store pickup. */
export function ShippingTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const [mode, setMode] = useState<ShippingRuleMode>(
    settings.shippingRule?.mode ?? "none",
  );
  const [flatFee, setFlatFee] = useState<number | null>(
    settings.shippingRule?.flatFee ?? null,
  );
  const [freeThreshold, setFreeThreshold] = useState<number | null>(
    settings.shippingRule?.freeThreshold ?? null,
  );
  const [defaultDeliveryCost, setDefaultDeliveryCost] = useState<number | null>(
    settings.defaultDeliveryCost ?? 0,
  );
  const [zonesEnabled, setZonesEnabled] = useState(
    settings.shippingZones?.inside != null ||
      settings.shippingZones?.outside != null,
  );
  const [zoneInside, setZoneInside] = useState<number | null>(
    settings.shippingZones?.inside ?? null,
  );
  const [zoneOutside, setZoneOutside] = useState<number | null>(
    settings.shippingZones?.outside ?? null,
  );
  const [zoneFree, setZoneFree] = useState<number | null>(
    settings.shippingZones?.freeThreshold ?? null,
  );
  const [pickupEnabled, setPickupEnabled] = useState(
    !!settings.pickup?.enabled,
  );
  const [pickupInstructions, setPickupInstructions] = useState(
    settings.pickup?.instructions ?? "",
  );

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Shipping &amp; delivery</h3>
        <Field label="Shipping rule">
          <SimpleSelect
            value={mode}
            onValueChange={(v) => setMode(v as ShippingRuleMode)}
            options={SHIPPING_MODES}
          />
        </Field>
        {mode !== "none" && (
          <Field
            label={
              mode === "free_over_threshold" ? "Fee below threshold" : "Flat fee"
            }
          >
            <NumberField
              min={0}
              precision={2}
              value={flatFee}
              onChange={setFlatFee}
              placeholder="0"
            />
          </Field>
        )}
        {mode === "free_over_threshold" && (
          <Field label="Free over (order subtotal)">
            <NumberField
              min={0}
              precision={2}
              value={freeThreshold}
              onChange={setFreeThreshold}
              placeholder="0"
            />
          </Field>
        )}
        <Field label="Default courier cost (your expense, editable per order)">
          <NumberField
            min={0}
            precision={2}
            value={defaultDeliveryCost}
            onChange={setDefaultDeliveryCost}
            placeholder="0"
          />
        </Field>
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Dhaka delivery zones</h3>
            <p className="text-xs text-muted-foreground">
              Charge inside / outside Dhaka rates. When on, these override the
              shipping rule above and the shopper picks a zone at checkout.
            </p>
          </div>
          <Switch checked={zonesEnabled} onCheckedChange={setZonesEnabled} />
        </div>
        {zonesEnabled && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Inside Dhaka fee">
              <NumberField
                min={0}
                precision={2}
                value={zoneInside}
                onChange={setZoneInside}
                placeholder="60"
              />
            </Field>
            <Field label="Outside Dhaka fee">
              <NumberField
                min={0}
                precision={2}
                value={zoneOutside}
                onChange={setZoneOutside}
                placeholder="120"
              />
            </Field>
            <Field label="Free over (subtotal)">
              <NumberField
                min={0}
                precision={2}
                value={zoneFree}
                onChange={setZoneFree}
                placeholder="2000"
              />
            </Field>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Store pickup</h3>
            <p className="text-xs text-muted-foreground">
              Let shoppers collect from your store instead of courier delivery —
              no shipping fee. Pickup uses your fulfillment location.
            </p>
          </div>
          <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} />
        </div>
        {pickupEnabled && (
          <Field label="Pickup instructions (optional)">
            <Textarea
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Collect from the front counter, 10am–8pm. Bring your order number."
            />
          </Field>
        )}
      </Card>

      <SaveBar
        pending={pending}
        onSave={() =>
          save({
            defaultDeliveryCost: defaultDeliveryCost ?? 0,
            pickup: {
              enabled: pickupEnabled,
              instructions: pickupInstructions.trim() || undefined,
            },
            shippingRule: {
              mode,
              flatFee: mode === "none" ? undefined : (flatFee ?? undefined),
              freeThreshold:
                mode === "free_over_threshold"
                  ? (freeThreshold ?? undefined)
                  : undefined,
            },
            // Blank stays undefined (not 0) — a 0 fee reads as "ships free", which
            // silently zeroed the zone's delivery charge. computeShipping falls back
            // to the shipping rule for any direction left unset. Disabled sends an
            // explicit `null` (not undefined, which JSON drops) so the backend
            // actually clears the stored zones instead of leaving them to resurrect.
            shippingZones: zonesEnabled
              ? {
                  inside: zoneInside ?? undefined,
                  outside: zoneOutside ?? undefined,
                  freeThreshold: zoneFree ?? undefined,
                }
              : null,
          })
        }
      />
    </div>
  );
}
