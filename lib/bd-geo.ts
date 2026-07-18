// coding-standard: maintained
import bdGeoRaw from "./bd-geo.json";
import { METRO_AREAS } from "./bd-metro-areas";

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

/**
 * Area suggestions for the district — its government upazilas PLUS the city
 * metropolitan thanas (see `bd-metro-areas.ts`), deduped by name and sorted. The
 * area field stays free-text, so this is only the suggestion set, not a whitelist.
 */
export function upazilasOf(district: string): BdUpazila[] {
  const key = district.trim();
  const base = byName.get(key.toLowerCase())?.upazilas ?? [];
  const metro = METRO_AREAS[key] ?? [];
  if (metro.length === 0) return base;
  const seen = new Set(base.map((u) => u.name.toLowerCase()));
  const merged = [...base, ...metro.filter((u) => !seen.has(u.name.toLowerCase()))];
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

/** Localized district label — Bangla name under `bn`, English otherwise. */
export function districtLabel(d: BdDistrict, lang: string): string {
  return lang === "bn" ? d.bn : d.name;
}
