"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { BD_DISTRICTS, districtLabel, upazilasOf } from "@/lib/bd-geo";
import { Combobox, type ComboOption } from "./combobox";

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
}: {
  value: GeoValue;
  onChange: (next: GeoValue) => void;
  lang: string;
  labels: { district: string; area: string; noMatch?: string };
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

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Combobox
        value={value.district}
        onChange={(district) => onChange({ district, area: "" })}
        options={districtOptions}
        placeholder={labels.district}
      />
      <Combobox
        value={value.area}
        onChange={(area) => onChange({ ...value, area })}
        options={areaOptions}
        placeholder={labels.area}
        allowFreeText
        disabled={!value.district}
        noMatchText={labels.noMatch}
      />
    </div>
  );
}
