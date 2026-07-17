// coding-standard: maintained
import bdGeoRaw from "./bd-geo.json";

/**
 * Canonical Bangladesh geography (64 districts → upazilas) — the single
 * courier-independent location list the address form picks from. Mirror of the
 * backend's `src/data/bd-geo.json`; the address stores plain `district` + `area`
 * names and the backend resolves them to a courier's codes only at dispatch, so
 * a saved address survives a courier switch untouched.
 *
 * `area` is a free-typed field with the district's upazilas as autocomplete
 * suggestions — the government upazila list omits metro thanas (Gulshan,
 * Dhanmondi…), where most orders land, so a strict dropdown would lock them out.
 */
export interface BdUpazila {
  name: string;
  bn: string;
}
export interface BdDistrict {
  name: string;
  bn: string;
  upazilas: BdUpazila[];
}

export const BD_DISTRICTS = bdGeoRaw as BdDistrict[];

const byName = new Map(BD_DISTRICTS.map((d) => [d.name.trim().toLowerCase(), d]));

/** The district's upazilas (autocomplete suggestions for the area field), or `[]`. */
export function upazilasOf(district: string): BdUpazila[] {
  return byName.get(district.trim().toLowerCase())?.upazilas ?? [];
}

/** Localized district label — Bangla name under `bn`, English otherwise. */
export function districtLabel(d: BdDistrict, lang: string): string {
  return lang === "bn" ? d.bn : d.name;
}
