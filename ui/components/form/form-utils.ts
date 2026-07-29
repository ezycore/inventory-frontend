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
