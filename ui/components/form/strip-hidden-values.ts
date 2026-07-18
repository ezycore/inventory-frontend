// coding-standard: maintained
import type { DynamicFormConfig, FormFieldConfig, FormSection } from "./type";
import { dependencyHides } from "./schema-visibility";

/**
 * Removes conditionally-hidden field values before submit so an invisible
 * field can never push stale/default data into the payload. The submission
 * half of the form engine (schema.ts is the validation half).
 */

// Delete a (possibly dot-notation) path from an object, then prune any parent
// objects left empty by the removal. Pruning is what keeps a nested group like
// `salesTax` from being submitted as `{}` — an empty subdoc would otherwise be
// $set on the backend, clobbering sibling keys and re-triggering schema defaults.
const deletePathAndPrune = (obj: Record<string, any>, path: string): void => {
  const keys = path.split(".");
  // Walk to the leaf, remembering each parent so we can prune upward.
  const parents: { container: Record<string, any>; key: string }[] = [];
  let current: any = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current == null || typeof current !== "object") return;
    parents.push({ container: current, key: keys[i] });
    current = current[keys[i]];
  }
  if (current == null || typeof current !== "object") return;
  delete current[keys[keys.length - 1]];

  // Prune now-empty parents from the leaf up.
  for (let i = parents.length - 1; i >= 0; i--) {
    const { container, key } = parents[i];
    const child = container[key];
    if (child && typeof child === "object" && Object.keys(child).length === 0) {
      delete container[key];
    } else {
      break;
    }
  }
};

// Remove values for fields that are conditionally hidden (their own or their
// section's `dependsOn` resolves to hidden) so they never reach the payload.
// Statically `hidden: true` fields are intentional plumbing (e.g. a value carried
// by a header toggle) and are preserved; disabled-but-visible fields are too,
// since `dependencyHides` only reacts to hide/show actions. Returns a new object —
// the input (live form values) is never mutated.
export const stripHiddenValues = (
  config: DynamicFormConfig,
  values: Record<string, any>,
): Record<string, any> => {
  const result = structuredClone(values);

  const fieldEntries: { field: FormFieldConfig; section?: FormSection }[] = [];
  if (config.sections) {
    config.sections.forEach((section) =>
      section.fields.forEach((field) => fieldEntries.push({ field, section })),
    );
  } else if (config.fields) {
    config.fields.forEach((field) => fieldEntries.push({ field }));
  }

  for (const { field, section } of fieldEntries) {
    if (field.hidden === true) continue; // intentional plumbing — keep
    const hidden =
      dependencyHides(values, field.dependsOn) ||
      (section ? dependencyHides(values, section.dependsOn) : false);
    if (hidden) deletePathAndPrune(result, field.name);
  }

  return result;
};
