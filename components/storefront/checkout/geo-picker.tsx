"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { BD_DISTRICTS, districtLabel, upazilasOf } from "@/lib/bd-geo";
import { Combobox, type ComboOption } from "./combobox";
import { FieldPair, LabeledField } from "./blocks/labeled-field";

/** The shopper's courier-neutral location — a canonical district + free-text area. */
export interface GeoValue {
  district: string;
  area: string;
}

/**
 * Courier-INDEPENDENT location picker: a canonical BD district dropdown + a
 * free-typed area with the district's upazilas as autocomplete suggestions. The
 * shopper picks this once; the backend maps it to whichever courier the merchant
 * dispatches with, so a saved address survives a courier switch. Replaces the old
 * provider-specific `CourierLocationPicker`. Shared by checkout + the account
 * address form.
 */
export function GeoPicker({
  value,
  onChange,
  lang,
  labels,
  errors,
  onBlurField,
  fieldLabels,
}: {
  value: GeoValue;
  onChange: (next: GeoValue) => void;
  lang: string;
  labels: { district: string; area: string; noMatch?: string };
  /** Optional — the account address form reuses this picker without validation. */
  errors?: { district?: string; area?: string };
  onBlurField?: (field: "district" | "area") => void;
  /**
   * Field labels above the two combos. Optional because the account address
   * form supplies its own; checkout passes them so the pair reads as two
   * questions rather than two dropdowns that appeared.
   */
  fieldLabels?: { district: string; area: string };
}) {
  // District is a strict pick (canonical name); area is free-text with the
  // district's upazilas + metro thanas as searchable suggestions.
  const districtOptions: ComboOption[] = useMemo(
    () => BD_DISTRICTS.map((d) => ({ value: d.name, label: districtLabel(d, lang) })),
    [lang],
  );
  const areaOptions: ComboOption[] = useMemo(() => {
    if (!value.district) return [];
    return upazilasOf(value.district).map((u) => {
      const label = lang === "bn" ? u.bn : u.name;
      return { value: label, label };
    });
  }, [value.district, lang]);

  const district = (
    <LabeledField name="district" label={fieldLabels?.district} error={errors?.district}>
      {(id) => (
        <Combobox
          id={id}
          value={value.district}
          onChange={(next) => onChange({ district: next, area: "" })}
          options={districtOptions}
          placeholder={labels.district}
          invalid={!!errors?.district}
          onBlur={onBlurField && (() => onBlurField("district"))}
        />
      )}
    </LabeledField>
  );
  const area = (
    <LabeledField name="area" label={fieldLabels?.area} error={errors?.area}>
      {(id) => (
        <Combobox
          id={id}
          value={value.area}
          onChange={(next) => onChange({ ...value, area: next })}
          options={areaOptions}
          placeholder={labels.area}
          allowFreeText
          disabled={!value.district}
          noMatchText={labels.noMatch}
          invalid={!!errors?.area}
          onBlur={onBlurField && (() => onBlurField("area"))}
        />
      )}
    </LabeledField>
  );

  // Labelled, the two combos are short questions and pair on one row; unlabelled
  // (the account form) they stay stacked, which is the shape that page expects.
  if (!fieldLabels) return <div style={{ display: "grid", gap: 12 }}>{district}{area}</div>;
  return <FieldPair>{district}{area}</FieldPair>;
}
