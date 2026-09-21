"use client";
// coding-standard: maintained

import type { SectionRefKind } from "@/lib/storefront-builder/field-specs";
import { selectOptions } from "@/services/api/select-options";
import { AdvancedSelect } from "@/ui/components/advanced-select";

/**
 * Where each kind of document a section can point at is listed from. Built with
 * `selectOptions`, so these dropdowns refresh when the collections, tags or
 * products they list change.
 *
 * Campaigns and pages have no picker yet: only `countdown` points at a campaign,
 * and it is not offered in the editor (plan §17).
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
  const optionsApi = SOURCES[to];
  if (!optionsApi) {
    return <p className="text-xs text-muted-foreground">This setting cannot be edited here yet.</p>;
  }

  const ids = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return (
    <AdvancedSelect
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
