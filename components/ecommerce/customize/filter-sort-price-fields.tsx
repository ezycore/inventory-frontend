"use client";
// coding-standard: maintained

import { Plus, X } from "lucide-react";
import {
  FILTER_PRICE_MODES,
  SORT_IDS,
  SORT_LABELS,
  type FilterPriceMode,
  type ResolvedFilterSettings,
  type SortId,
} from "@/lib/storefront-filters";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { PartField, PartSwitch } from "@/components/ecommerce/customize/part-group";

/** Most ranges a merchant may write — the storefront shows them as one row of chips. */
const MAX_RANGES = 6;

type Ranges = ResolvedFilterSettings["pricePresets"];

/**
 * The price filter: ranges, typed boxes or both (plan F3), and the merchant's
 * own ranges when the automatic ones (built from the catalogue's prices) are
 * not the ones their shoppers think in.
 */
export function PriceFilterFields({
  mode,
  ranges,
  onMode,
  onRanges,
}: {
  mode: FilterPriceMode;
  ranges: Ranges;
  onMode: (mode: FilterPriceMode) => void;
  onRanges: (ranges: Ranges) => void;
}) {
  const setRow = (i: number, next: Partial<Ranges[number]>) =>
    onRanges(ranges.map((r, j) => (j === i ? { ...r, ...next } : r)));
  return (
    <>
      <PartField label="Price filter">
        <SegmentedField
          label="Price filter"
          value={mode}
          onChange={(v) => onMode(v as FilterPriceMode)}
          options={FILTER_PRICE_MODES.map((o) => ({
            value: o.id,
            label: o.label,
            description: o.description,
          }))}
        />
      </PartField>
      {mode !== "typed" ? (
        <PartField
          label="Price ranges"
          hint="Leave empty and the shop builds up to four ranges from your own prices."
        >
          <div className="space-y-1.5">
            {ranges.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <NumberField
                  value={r.min ?? null}
                  onChange={(v) => setRow(i, { min: v ?? undefined })}
                  min={0}
                  precision={0}
                  placeholder="From"
                  aria-label={`Range ${i + 1} from`}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <NumberField
                  value={r.max ?? null}
                  onChange={(v) => setRow(i, { max: v ?? undefined })}
                  min={0}
                  precision={0}
                  placeholder="Up to"
                  aria-label={`Range ${i + 1} up to`}
                  size="sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-none"
                  aria-label={`Remove range ${i + 1}`}
                  onClick={() => onRanges(ranges.filter((_, j) => j !== i))}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {ranges.length < MAX_RANGES ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onRanges([...ranges, {}])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add a range
              </Button>
            ) : null}
          </div>
        </PartField>
      ) : null}
    </>
  );
}

/** Which sort a listing opens on, and which the shopper is offered (plan F7). */
export function SortFields({
  value,
  onChange,
}: {
  value: ResolvedFilterSettings["sort"];
  onChange: (sort: ResolvedFilterSettings["sort"]) => void;
}) {
  return (
    <>
      <PartField label="Products are sorted by">
        <SimpleSelect
          value={value.default}
          onValueChange={(v) =>
            onChange({
              default: v as SortId,
              // The default is always offered, so it cannot stay hidden.
              hidden: value.hidden.filter((id) => id !== v),
            })
          }
          options={SORT_IDS.map((id) => ({ value: id, label: SORT_LABELS[id] }))}
          className="h-8"
        />
      </PartField>
      <PartField label="Shoppers can also sort by">
        <div className="space-y-2">
          {SORT_IDS.filter((id) => id !== value.default).map((id) => (
            <PartSwitch
              key={id}
              label={SORT_LABELS[id]}
              ariaLabel={`Offer "${SORT_LABELS[id]}" sort`}
              checked={!value.hidden.includes(id)}
              onCheckedChange={(on) =>
                onChange({
                  ...value,
                  hidden: on ? value.hidden.filter((h) => h !== id) : [...value.hidden, id],
                })
              }
            />
          ))}
        </div>
      </PartField>
    </>
  );
}
