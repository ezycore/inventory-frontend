"use client";
// coding-standard: maintained

import { useId, type CSSProperties } from "react";
import { BD_DISTRICTS, districtLabel, upazilasOf } from "@/lib/bd-geo";
import { input } from "./checkout-bits";

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
  labels: { district: string; area: string };
}) {
  const listId = useId();
  const upazilas = value.district ? upazilasOf(value.district) : [];
  const select: CSSProperties = { ...input, appearance: "auto" };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <select
        style={select}
        value={value.district}
        onChange={(e) => onChange({ district: e.target.value, area: "" })}
      >
        <option value="" disabled>
          {labels.district}
        </option>
        {BD_DISTRICTS.map((d) => (
          <option key={d.name} value={d.name}>
            {districtLabel(d, lang)}
          </option>
        ))}
      </select>

      <input
        style={{ ...input, opacity: value.district ? 1 : 0.6 }}
        disabled={!value.district}
        list={listId}
        placeholder={labels.area}
        value={value.area}
        onChange={(e) => onChange({ ...value, area: e.target.value })}
      />
      <datalist id={listId}>
        {upazilas.map((u) => (
          <option key={u.name} value={lang === "bn" ? u.bn : u.name} />
        ))}
      </datalist>
    </div>
  );
}
