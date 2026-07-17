// coding-standard: maintained
import type {
  FieldDependency,
  FieldDependencyConfig,
  FormFieldConfig,
  FormSection,
} from "./type";

/**
 * Visibility/condition helpers shared by the schema generator (schema.ts) and
 * the submit-time value stripper (strip-hidden-values.ts). Kept free of any
 * react-hook-form / dependency-utils import so both callers stay pure and this
 * mirrors — but does not merge with — dependency-utils.ts (see evalDepCondition).
 */

// Read a (possibly dot-notation) path out of a values object.
export const getValueByPath = (
  obj: Record<string, any> | undefined,
  path: string,
): any => {
  if (!obj) return undefined;
  return path.split(".").reduce((acc: any, k) => (acc == null ? acc : acc[k]), obj);
};

// Inline dependency-condition evaluator — mirrors evaluateDependencyCondition in
// dependency-utils.ts. Kept inline (not imported) to avoid a runtime circular
// import: dependency-utils imports types from the type module.
export const evalDepCondition = (watched: any, dep: FieldDependency): boolean => {
  let v = watched;
  if (dep.matchWithProp && v && typeof v === "object") {
    v = dep.matchWithProp.includes(".")
      ? dep.matchWithProp.split(".").reduce((a: any, p) => a?.[p], v)
      : (v[dep.matchWithProp] ?? v);
  }
  const cmp = dep.value;
  switch (dep.condition ?? "eq") {
    case "eq":    return v === cmp;
    case "ne":    return v !== cmp;
    case "gt":    return Number(v) > Number(cmp);
    case "gte":   return Number(v) >= Number(cmp);
    case "lt":    return Number(v) < Number(cmp);
    case "lte":   return Number(v) <= Number(cmp);
    case "in":    return Array.isArray(cmp) && cmp.includes(v);
    case "notIn": return Array.isArray(cmp) && !cmp.includes(v);
    case "truthy":
      if (v === null || v === undefined) return false;
      if (typeof v === "string" && v.trim() === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return Boolean(v);
    case "falsy":
      if (v === null || v === undefined) return true;
      if (typeof v === "string" && v.trim() === "") return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return !Boolean(v);
    default:      return false;
  }
};

// True when a dependsOn group (single condition or AND-array) hides its target
// given the current values. Only hide/show actions affect visibility; the action
// is taken from the first entry (matches evaluateFieldDependencies semantics).
export const dependencyHides = (
  values: Record<string, any>,
  dep?: FieldDependencyConfig,
): boolean => {
  if (!dep) return false;
  const list = Array.isArray(dep) ? dep : [dep];
  if (!list.length) return false;
  const action = list[0].action ?? "disable";
  if (action !== "hide" && action !== "show") return false;
  const allMet = list.every((d) =>
    evalDepCondition(getValueByPath(values, d.field), d),
  );
  return !allMet;
};

// Mirror of the render-time visibility check (form-field.tsx). A field is hidden
// for schema purposes when statically hidden, or when its own / its section's
// dependsOn resolves to hidden against the current values. With no values (the
// static build) only statically-hidden fields are treated as hidden.
export const isFieldHiddenForSchema = (
  field: FormFieldConfig,
  section: FormSection | undefined,
  values?: Record<string, any>,
): boolean => {
  if (field.hidden === true) return true;
  if (!values) return false;
  if (dependencyHides(values, field.dependsOn)) return true;
  if (section && dependencyHides(values, section.dependsOn)) return true;
  return false;
};
