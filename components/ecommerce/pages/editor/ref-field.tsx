"use client";
// coding-standard: maintained

import type { SectionRefKind } from "@/lib/storefront-builder/field-specs";
import { selectOptions } from "@/services/api/select-options";
import { FuseAdvancedSelect } from "@/ui/components/fuse-advanced-select";
import { CampaignRefField } from "./campaign-ref-field";

/**
 * Where each kind of document a section can point at is listed from. Built with
 * `selectOptions`, so these dropdowns refresh when the collections, tags or
 * products they list change.
 *
 * Pages have no picker yet. A campaign has its own (`CampaignRefField`): which
 * offers it lists depends on the clock and on the one already picked.
 */
const SOURCES: Partial<Record<SectionRefKind, string>> = {
  category: selectOptions("categories", { fields: "_id,name" }),
  tag: selectOptions("tags", { status: "active", fields: "_id,name" }),
  product: selectOptions("products", { fields: "_id,name" }),
};

/**
 * A setting that points at store documents by id — one (`ref`) or several
 * (`refs`, at most `max`). The section stores ids only; the storefront looks the
 * documents up when it draws.
 *
 * Always the Fuse combobox, never `<AdvancedSelect>`: called directly, that one
 * skips the searchable-select heuristic and renders a plain dropdown — unusable
 * over a catalogue of thousands of products (CLAUDE.md → "Product pickers").
 */
export function RefField({
  id,
  to,
  value,
  onChange,
  multiple = false,
  max,
}: {
  id: string;
  to: SectionRefKind;
  value: unknown;
  onChange: (value: unknown) => void;
  multiple?: boolean;
  max?: number;
}) {
  if (to === "campaign" && !multiple) return <CampaignRefField id={id} value={value} onChange={onChange} />;
  const optionsApi = SOURCES[to];
  if (!optionsApi) {
    return <p className="text-xs text-muted-foreground">This setting cannot be edited here yet.</p>;
  }

  const ids = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return (
    <FuseAdvancedSelect
      id={id}
      optionsApi={optionsApi}
      mode={multiple ? "multiple" : "single"}
      value={multiple ? ids : typeof value === "string" ? value : undefined}
      placeholder={multiple ? "Choose…" : "Choose one"}
      onValueChange={(next) => {
        if (multiple) {
          const picked = Array.isArray(next) ? next.filter((item): item is string => typeof item === "string") : [];
          onChange(max === undefined ? picked : picked.slice(0, max));
        } else {
          onChange(typeof next === "string" && next ? next : undefined);
        }
      }}
    />
  );
}
