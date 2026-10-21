"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { SoldChipView } from "@/components/storefront/social-proof/sold-chip";
import { useStockTracked } from "@/hooks/use-stock-tracked";
import { resolveSocialLook, shopPreviewVars, stockLeftText } from "@/lib/storefront-social-proof";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { Field, ToggleRow } from "./settings-form-shared";
import {
  STOCK_LEFT_LABEL_DEFAULT,
  STOCK_LEFT_VAGUE_DEFAULT,
  stockLabelMissingCount,
  type StockLeftDraft,
} from "./social-proof-shared";

const DISPLAY = [
  { value: "exact", label: "Show the number", description: "Only 3 left" },
  { value: "vague", label: "No number", description: "Almost gone" },
];

/**
 * The "Only 3 left" chip's switch and rules (docs/plan/related-products-and-stock-left.md, Part B).
 * The number is the real sellable stock at the online location — there is nothing to enter. Its
 * colour and icon live in Customize, beside the sold chip's.
 */
export function StockLeftSettingsCard({
  value,
  onChange,
}: {
  value: StockLeftDraft;
  onChange: (patch: Partial<StockLeftDraft>) => void;
}) {
  const tracked = useStockTracked();
  const vague = value.display === "vague";
  const wording = vague ? value.vagueLabel : value.label;
  const fallback = vague ? STOCK_LEFT_VAGUE_DEFAULT : STOCK_LEFT_LABEL_DEFAULT;
  const key = vague ? "vagueLabel" : "label";
  const sample = stockLeftText(
    {
      threshold: value.threshold ?? 5,
      display: value.display ?? "exact",
      label: { en: wording?.en?.trim() || fallback.en, bn: wording?.bn?.trim() || fallback.bn },
      showOnCards: !!value.showOnCards,
    },
    Math.min(3, value.threshold ?? 5),
    true,
    "en",
  );

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <ToggleRow
        label="Low stock on products"
        desc="A chip like “Only 3 left” when a product is nearly sold out. It uses your real stock."
        checked={!!value.enabled}
        onChange={(enabled) => onChange({ enabled })}
      />
      {value.enabled && !tracked ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Your workspace doesn’t track stock, so this chip never shows.
        </p>
      ) : null}
      {value.enabled ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Show when stock is at or below">
              <NumberField
                min={1}
                max={100}
                precision={0}
                value={value.threshold ?? 5}
                onChange={(n) => onChange({ threshold: Math.min(100, Math.max(1, n ?? 1)) })}
              />
            </Field>
            <Field label="Wording">
              <SegmentedField
                label="Wording"
                value={value.display ?? "exact"}
                options={DISPLAY}
                onChange={(display) => onChange({ display: display as StockLeftDraft["display"] })}
              />
            </Field>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Sold-out products keep their “Out of stock” badge. A product sold on backorder shows this only while it still has stock. For a product with sizes or colours, it follows the one the shopper picks.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Text (English)">
              <Input
                value={wording?.en ?? ""}
                maxLength={120}
                placeholder={fallback.en}
                onChange={(e) => onChange({ [key]: { ...wording, en: e.target.value } })}
              />
            </Field>
            <Field label="Text (Bangla)">
              <Input
                value={wording?.bn ?? ""}
                maxLength={120}
                placeholder={fallback.bn}
                onChange={(e) => onChange({ [key]: { ...wording, bn: e.target.value } })}
              />
            </Field>
          </div>
          <p
            className={
              !vague && stockLabelMissingCount(value)
                ? "-mt-2 text-xs text-destructive"
                : "-mt-2 text-xs text-muted-foreground"
            }
          >
            {vague
              ? "Leave blank for the wording shown."
              : "{count} becomes the number — it has to be in the text. Leave blank for the wording shown."}
          </p>
          <ToggleRow
            label="Also on product cards"
            desc="Next to the sold count under the product name in grids, as well as the product page."
            checked={!!value.showOnCards}
            onChange={(showOnCards) => onChange({ showOnCards })}
          />
          <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Preview
            <span style={shopPreviewVars("#2563eb") as CSSProperties}>
              {sample ? <SoldChipView text={sample} look={resolveSocialLook(undefined)} kind="stock" /> : null}
            </span>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Colour, size and icon: Online store → Customize → Social proof. On the product page it shows in the “Stock badge and tags” row. If you hid that row (Online Store → Pages → Product), it shows on product cards only.
          </p>
        </>
      ) : null}
    </Card>
  );
}
