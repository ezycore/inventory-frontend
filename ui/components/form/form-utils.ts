// coding-standard: maintained
import type { ColumnSpan } from "./type";

// Read a nested value from an object by dot-separated path.
export const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
};

/**
 * A copy of `config` without the named fields, for both shapes a config can
 * take (flat `fields` or `sections`). A section left with no fields is dropped
 * too — otherwise gating every field of the standalone Tax section would leave
 * a bare heading behind.
 *
 * One home for every "hide these fields" rule: the org's `excludedFields`
 * settings (`useFilteredFormConfig`) and the VAT gate (`useVatGatedFormConfig`).
 */
export function omitFormFields<T extends { sections?: any[]; fields?: any[] }>(
  config: T,
  omitted: string[],
): T {
  if (!omitted || omitted.length === 0) return config;

  if (config.sections) {
    return {
      ...config,
      sections: config.sections
        .map((section) => ({
          ...section,
          fields: (section.fields || []).filter(
            (field: any) => !omitted.includes(field.name),
          ),
        }))
        .filter((section) => section.fields.length > 0),
    };
  }

  if (config.fields) {
    return {
      ...config,
      fields: config.fields.filter((field: any) => !omitted.includes(field.name)),
    };
  }

  return config;
}

/**
 * A copy of `config` without the named sections, matched on the stable `id`
 * rather than the translated `title`.
 *
 * Use this, not `omitFormFields`, whenever a whole section belongs to a tier:
 * listing its field names by hand is a list that goes stale the moment someone
 * adds a sixth field. That is exactly what happened to "Publish to store" — it
 * grew `weightKg` and `featured`, the gate still named only the original three,
 * and on every other tier the section rendered as an empty card, because the two
 * survivors were themselves hidden by a `dependsOn` pointing at the `isListed`
 * checkbox the gate HAD removed.
 */
export function omitFormSections<T extends { sections?: any[] }>(
  config: T,
  omittedIds: string[],
): T {
  if (!omittedIds.length || !config.sections) return config;
  return {
    ...config,
    sections: config.sections.filter(
      (section: any) => !section.id || !omittedIds.includes(section.id),
    ),
  };
}

/**
 * Move one field into another section, keeping its position within that section
 * last.
 *
 * The case it exists for is **cost price on a stock-free product form**. Cost
 * price is declared in the Inventory section because that is where it persists
 * from — `costPrice` lives on the Inventory model and nowhere else. For a
 * merchant who counts stock that is also where it belongs on screen: the backend
 * only writes it when `addToInventory` is ticked, so showing it anywhere else
 * would take a number and silently drop it.
 *
 * A merchant who does NOT count stock is the other case entirely.
 * `provisionUntrackedInventory` writes their cost price unconditionally, there
 * is no toggle to sit behind, and leaving the field where it is forces the whole
 * Inventory section to stay — headed "Stock levels and low-stock alerts", with a
 * "Track stock" toggle, on a workspace that tracks none (QA-N1/C2). Moving the
 * one surviving field out lets `omitFormFields` drop the section outright, and
 * `headerAction` goes with it — which field-level removal alone cannot do.
 *
 * A no-op when either the field or the destination is absent, so it composes
 * safely after a gate that already removed one of them.
 */
export function moveFormField<T extends { sections?: any[] }>(
  config: T,
  fieldName: string,
  toSectionId: string,
): T {
  if (!config.sections) return config;
  const field = config.sections
    .flatMap((section: any) => section.fields || [])
    .find((candidate: any) => candidate.name === fieldName);
  if (!field) return config;
  if (!config.sections.some((section: any) => section.id === toSectionId)) {
    return config;
  }
  return {
    ...config,
    sections: config.sections.map((section: any) =>
      section.id === toSectionId
        ? { ...section, fields: [...(section.fields || []), field] }
        : {
            ...section,
            fields: (section.fields || []).filter(
              (candidate: any) => candidate.name !== fieldName,
            ),
          },
    ),
  };
}

/**
 * Drop `dependsOn` rules that point at fields which are no longer in the config.
 *
 * Deliberately separate from `omitFormFields` rather than folded into it. A
 * dangling dependency is not always a bug: the VAT gate removes fields whose
 * dependants are *meant* to stay hidden along with them, and auto-releasing
 * there would surface controls that gate was hiding. So this is opt-in, for the
 * case where a field must SURVIVE its trigger's removal.
 *
 * The case it exists for: a stock-free product form drops the "Add to inventory"
 * toggle, but must keep **Cost price** — that is where the merchant's buy price
 * lives and the only reason gross profit works at that tier. Cost price shows
 * only when `addToInventory` is truthy, so removing the toggle alone would hide
 * the one inventory-section field the tier still needs.
 */
export function releaseFieldDependencies<
  T extends { sections?: any[]; fields?: any[] },
>(config: T, triggers: string[]): T {
  if (!triggers || triggers.length === 0) return config;

  const strip = (field: any) => {
    const rules = field.dependsOn;
    if (!rules) return field;
    const kept = (Array.isArray(rules) ? rules : [rules]).filter(
      (rule: any) => !triggers.includes(rule?.field),
    );
    if (kept.length === (Array.isArray(rules) ? rules.length : 1)) return field;
    const { dependsOn, ...rest } = field;
    return kept.length > 0 ? { ...rest, dependsOn: kept } : rest;
  };

  if (config.sections) {
    return {
      ...config,
      sections: config.sections.map((section) => ({
        ...section,
        fields: (section.fields || []).map(strip),
      })),
    };
  }
  if (config.fields) {
    return { ...config, fields: config.fields.map(strip) };
  }
  return config;
}

/**
 * Narrow a select's choices to the ones this workspace can actually act on.
 *
 * `omitFormFields` removes whole fields, which is the wrong instrument when the
 * field must stay and only some of its OPTIONS have become meaningless. The case
 * this exists for: a discount's "Applicable To" offers Sales / Purchase / Both,
 * and a merchant without the purchasing module can pick "Purchase Only" — saving
 * a record that applies to nothing, on a form that suggested it was a real
 * choice.
 *
 * A `defaultValue` that survives the filter is left alone; one that does not is
 * moved to the first remaining option, because a select whose default is not in
 * its own option list renders blank on a required field and blocks the save with
 * no visible reason.
 *
 * Fields named with an empty allow-list are left untouched — an empty select is
 * worse than an unfiltered one, and it means the caller computed nothing rather
 * than "nothing is allowed".
 */
export function restrictSelectOptions<
  T extends { sections?: any[]; fields?: any[] },
>(config: T, allowed: Record<string, string[]>): T {
  const names = Object.keys(allowed).filter((k) => allowed[k]?.length);
  if (names.length === 0) return config;

  const narrow = (field: any) => {
    const keep = allowed[field?.name];
    if (!keep?.length || !Array.isArray(field.options)) return field;

    const options = field.options.filter((o: any) => keep.includes(o?.value));
    if (options.length === field.options.length) return field;

    const next = { ...field, options };
    if (
      next.defaultValue !== undefined &&
      !options.some((o: any) => o?.value === next.defaultValue)
    ) {
      next.defaultValue = options[0]?.value;
    }
    return next;
  };

  if (config.sections) {
    return {
      ...config,
      sections: config.sections.map((section) => ({
        ...section,
        fields: (section.fields || []).map(narrow),
      })),
    };
  }
  if (config.fields) {
    return { ...config, fields: config.fields.map(narrow) };
  }
  return config;
}

// Grid column classes with responsive breakpoints (mobile-full → lg-span).
export const getColumnClass = (span: ColumnSpan): string => {
  const spanMap: Record<ColumnSpan, string> = {
    1: "col-span-12 sm:col-span-6 lg:col-span-1",
    2: "col-span-12 sm:col-span-6 lg:col-span-2",
    3: "col-span-12 sm:col-span-6 lg:col-span-3",
    4: "col-span-12 sm:col-span-6 lg:col-span-4",
    6: "col-span-12 sm:col-span-6 lg:col-span-6",
    8: "col-span-12 sm:col-span-6 lg:col-span-8",
    12: "col-span-12",
  };
  return spanMap[span] || "col-span-12";
};
