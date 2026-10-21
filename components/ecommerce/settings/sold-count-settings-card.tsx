"use client";
// coding-standard: maintained

import Link from "next/link";
import type { CSSProperties } from "react";
import { SoldChipView } from "@/components/storefront/social-proof/sold-chip";
import { resolveSocialLook, shopPreviewVars, soldChipText } from "@/lib/storefront-social-proof";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Field, ToggleRow } from "./settings-form-shared";
import { SOLD_LABEL_DEFAULT, type SoldCountDraft } from "./social-proof-shared";

const COUNT_FROM = [
  { value: "placed", label: "When the order is placed", description: "Counts at once, pending orders included. A cancelled order drops back out." },
  { value: "confirmed", label: "When I confirm the order", description: "Pending orders wait until you accept them." },
  { value: "delivered", label: "When the order is delivered", description: "Strictest. The number moves only after the courier delivers." },
];

const DISPLAY = [
  { value: "exact", label: "Exact", description: "124 sold" },
  { value: "rounded", label: "Rounded", description: "120+ sold — rounds down, never up" },
];

/** The sold chip's switch and rules. The chip's colours and size live in Customize. */
export function SoldCountSettingsCard({
  value,
  onChange,
}: {
  value: SoldCountDraft;
  onChange: (patch: Partial<SoldCountDraft>) => void;
}) {
  const sample = value.display === "rounded" ? 120 : 124;
  const label = {
    en: value.label?.en?.trim() || SOLD_LABEL_DEFAULT.en,
    bn: value.label?.bn?.trim() || SOLD_LABEL_DEFAULT.bn,
  };
  const chip = { display: value.display ?? "exact", label, showOnCards: !!value.showOnCards };

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <ToggleRow
        label="Sold count on products"
        desc="A chip like “124 sold” on the product page: your opening count plus online orders."
        checked={!!value.enabled}
        onChange={(enabled) => onChange({ enabled })}
      />
      {value.enabled ? (
        <>
          <Field label="Count an online sale">
            <SimpleSelect
              value={value.countFrom ?? "placed"}
              onValueChange={(countFrom) => onChange({ countFrom: countFrom as SoldCountDraft["countFrom"] })}
              options={COUNT_FROM}
            />
          </Field>
          <p className="-mt-2 text-xs text-muted-foreground">
            Cancelled and rejected orders never count, and returned items are taken off. Every size or colour of a product adds up to one number.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Show the chip from">
              <NumberField min={0} max={100000} precision={0} value={value.minToShow ?? 10} onChange={(n) => onChange({ minToShow: n ?? 0 })} />
            </Field>
            <Field label="Number style">
              <SegmentedField
                label="Number style"
                value={value.display ?? "exact"}
                options={DISPLAY}
                onChange={(display) => onChange({ display: display as SoldCountDraft["display"] })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Text (English)">
              <Input value={value.label?.en ?? ""} maxLength={120} placeholder={SOLD_LABEL_DEFAULT.en} onChange={(e) => onChange({ label: { ...value.label, en: e.target.value } })} />
            </Field>
            <Field label="Text (Bangla)">
              <Input value={value.label?.bn ?? ""} maxLength={120} placeholder={SOLD_LABEL_DEFAULT.bn} onChange={(e) => onChange({ label: { ...value.label, bn: e.target.value } })} />
            </Field>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">{"{count}"} becomes the number. Leave blank for the wording shown.</p>
          <ToggleRow
            label="Also on product cards"
            desc="A small line under the product name in grids, as well as the product page."
            checked={!!value.showOnCards}
            onChange={(showOnCards) => onChange({ showOnCards })}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              Preview
              <span style={shopPreviewVars("#2563eb") as CSSProperties}>
                <SoldChipView text={soldChipText(sample, chip, "en")} look={resolveSocialLook(undefined)} />
              </span>
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/products/sold-counts">Set opening sold counts</Link>
            </Button>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Colours, size and icon: Online store → Customize → Social proof. On the product page it shows in the “Stock badge and tags” row. If you hid that row (Online Store → Pages → Product), it shows on product cards only.
          </p>
        </>
      ) : null}
    </Card>
  );
}
