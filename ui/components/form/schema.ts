// coding-standard: maintained
import { z } from "zod";
import type { DynamicFormConfig, FormFieldConfig, FormSection } from "./type";
import {
  evalDepCondition,
  getValueByPath,
  isFieldHiddenForSchema,
} from "./schema-visibility";

/**
 * Builds a Zod schema from a DynamicFormConfig — the validation half of the
 * form engine. `values` makes the schema visibility-aware: a field hidden
 * (statically, or via its / its section's dependsOn) keeps its key as
 * `z.any().optional()` so its value still passes through on submit, but skips
 * all validation — an invisible field can never block the form. Pass the live
 * form values (the resolver does this) to honor conditional show/hide; omit
 * them for a plain static schema.
 */
export const generateSchemaFromConfig = (
  config: DynamicFormConfig,
  values?: Record<string, any>,
): z.ZodSchema<any> => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  const nestedMap: Record<string, Record<string, any>> = {};

  // Flatten fields, retaining section context for section-level dependsOn.
  const fieldEntries: { field: FormFieldConfig; section?: FormSection }[] = [];
  if (config.sections) {
    config.sections.forEach((section) =>
      section.fields.forEach((field) => fieldEntries.push({ field, section })),
    );
  } else if (config.fields) {
    config.fields.forEach((field) => fieldEntries.push({ field }));
  }

  // Place a built field schema at its (possibly dot-notation) name.
  const placeFieldSchema = (name: string, fieldSchema: z.ZodTypeAny) => {
    const keys = name.split(".");
    if (keys.length === 1) {
      schemaObject[name] = fieldSchema;
      return;
    }
    const rootKey = keys[0];
    if (!nestedMap[rootKey]) nestedMap[rootKey] = {};
    let current = nestedMap[rootKey];
    for (let i = 1; i < keys.length - 1; i++) {
      if (!current[keys[i]] || current[keys[i]] instanceof z.ZodType) {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, any>;
    }
    current[keys[keys.length - 1]] = fieldSchema;
  };

  fieldEntries.forEach(({ field, section }) => {
    // Hidden field: keep the key (value survives submit) but skip validation.
    if (isFieldHiddenForSchema(field, section, values)) {
      placeFieldSchema(field.name, z.any().optional());
      return;
    }

    let fieldSchema: z.ZodTypeAny;

    // Determine base schema type
    switch (field.zodType || field.type) {
      case "number":
        let numSchema = z.number(
          field.required ? { error: `${field.label} is required` } : undefined,
        );
        if (field.validation?.min !== undefined) {
          numSchema = numSchema.min(
            field.validation.min,
            `Minimum value is ${field.validation.min}`,
          );
        }
        if (field.validation?.max !== undefined) {
          numSchema = numSchema.max(
            field.validation.max,
            `Maximum value is ${field.validation.max}`,
          );
        }
        // A cleared NumberField emits `null` (older configs may still hold "").
        // Both mean "no value": normalize to undefined so an optional number can
        // be emptied, and a required one fails with "<label> is required"
        // instead of Zod's "expected number, received null". `.optional()` must
        // live INSIDE the pipe — an outer one only short-circuits `undefined`.
        fieldSchema = z.preprocess(
          (value) => (value === null || value === "" ? undefined : value),
          field.required ? numSchema : numSchema.optional(),
        );
        break;

      case "boolean":
      case "checkbox":
      case "switch":
        fieldSchema = z.boolean();
        break;

      case "array":
      case "file-upload":
        let arraySchema: z.ZodArray<any>;
        if (field.arrayOf === "file" || field.type === "file-upload") {
          arraySchema = z.array(z.any()); // File objects
        } else if (field.arrayOf === "string") {
          arraySchema = z.array(z.string());
        } else if (field.arrayOf === "number") {
          arraySchema = z.array(z.number());
        } else {
          arraySchema = z.array(z.any());
        }
        if (field.validation?.min !== undefined) {
          arraySchema = arraySchema.min(
            field.validation.min,
            `Minimum ${field.validation.min} items required`,
          );
        }
        if (field.validation?.max !== undefined) {
          arraySchema = arraySchema.max(
            field.validation.max,
            `Maximum ${field.validation.max} items allowed`,
          );
        }
        fieldSchema = arraySchema;
        break;

      case "date":
        fieldSchema = z.string().pipe(z.coerce.date());
        break;

      case "radio-group":
      case "select":
        if (field.mode === "multiple") {
          // Multi-select should be array of strings
          if (field.enumValues) {
            fieldSchema = z.array(
              z.enum(field.enumValues as [string, ...string[]]),
            );
          } else if (field.options) {
            const values = field.options.map((opt) => opt.value) as [
              string,
              ...string[],
            ];
            fieldSchema = z.array(z.enum(values));
          } else {
            fieldSchema = z.array(z.string());
          }
        } else if (field.labelInValue) {
          // labelInValue: true — form stores the full option object, not a plain ID string.
          // Validate that a selection was made by checking the nested .value property.
          const labelInValueLabel = field.label ?? "option";
          if (field.required) {
            fieldSchema = z.any().refine(
              (val) =>
                val !== null &&
                val !== undefined &&
                val !== "" &&
                (typeof val === "object"
                  ? typeof val.value === "string" && val.value.length > 0
                  : typeof val === "string" && val.length > 0),
              { message: `Please select ${labelInValueLabel}` },
            );
          } else {
            fieldSchema = z.any().optional();
          }
        } else {
          // Single select — use string + refine instead of z.enum() so Zod
          // produces readable messages instead of
          // "Invalid option: expected one of 'PHARMACY'|'GROCERY_STORE'|..."
          const selectValues: string[] = field.enumValues
            ? (field.enumValues as string[])
            : field.options
              ? field.options.map((opt) => opt.value)
              : [];
          const selectLabel = field.label ?? "option";

          if (selectValues.length > 0) {
            if (field.required) {
              // Required: empty string fails first with a friendly message
              fieldSchema = z
                .string()
                .min(1, `Please select ${selectLabel}`)
                .refine((val) => selectValues.includes(val), {
                  message: `Please select a valid ${selectLabel.toLowerCase()}`,
                });
            } else {
              // Optional: allow empty/undefined; if a value is given it must be valid
              fieldSchema = z
                .string()
                .refine((val) => !val || selectValues.includes(val), {
                  message: `Please select a valid ${selectLabel.toLowerCase()}`,
                });
            }
          } else {
            fieldSchema = z.string();
          }
        }
        break;

      case "custom":
        // Custom fields can contain any type of data (array of field definitions)
        fieldSchema = z.array(z.any()).optional();
        break;

      case "custom-fields":
        // Custom fields array with field definitions and values
        fieldSchema = z
          .array(
            z.object({
              name: z.string(),
              type: z.string(),
              value: z.any().optional(),
              label: z.string().optional(),
              placeholder: z.string().optional(),
              required: z.boolean().optional(),
              options: z
                .array(
                  z.object({
                    value: z.string(),
                    label: z.string(),
                  }),
                )
                .optional(),
            }),
          )
          .optional();
        break;

      default:
      case "string":
      case "input":
      case "textarea":
        let stringSchema = z.string();
        // "Required" check must come FIRST so an empty submission shows
        // "X is required" before any length/pattern check fires.
        if (field.required) {
          const isTextLike =
            field.zodType !== "number" &&
            field.zodType !== "boolean" &&
            field.zodType !== "array" &&
            field.zodType !== "date";
          if (isTextLike) {
            stringSchema = stringSchema.min(1, `${field.label} is required`);
          }
        }
        if (field.validation?.minLength !== undefined && field.validation.minLength > 1) {
          stringSchema = stringSchema.min(
            field.validation.minLength,
            `Minimum ${field.validation.minLength} characters required`,
          );
        }
        if (field.validation?.maxLength !== undefined) {
          stringSchema = stringSchema.max(
            field.validation.maxLength,
            `Maximum ${field.validation.maxLength} characters allowed`,
          );
        }
        if (field.validation?.pattern) {
          stringSchema = stringSchema.regex(
            field.validation.pattern,
            field.validation.patternMessage ?? "Invalid format",
          );
        }
        if (field.validation?.email) {
          stringSchema = stringSchema.email("Invalid email address");
        }
        if (field.validation?.url) {
          // Allow empty string or valid URL
          stringSchema = stringSchema.refine(
            (val) =>
              !val || val === "" || z.string().url().safeParse(val).success,
            { message: "Invalid URL" },
          );
        }
        fieldSchema = stringSchema;
        break;
    }

    // Handle required/optional
    if (field.required) {
      const isStringField =
        (field.type === "input" || field.type === "textarea") &&
        field.zodType !== "number" &&
        field.zodType !== "boolean" &&
        field.zodType !== "array" &&
        field.zodType !== "date";

      // String fields already had required injected inside the switch block above.
      // Only add it here for non-string required fields that don't have options/enums
      // (selects handle required inline too; labelInValue selects use z.any().refine()).
      if (
        !isStringField &&
        !field.options &&
        !field.enumValues &&
        !field.labelInValue &&
        fieldSchema instanceof z.ZodString
      ) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`);
      }
    } else if (!field.required) {
      // `.nullish()`, not `.optional()`. An edit form is prefilled from an API
      // row, and a nullable column arrives **present-and-null**, not absent —
      // Mongoose writes an explicit `null` for any path with `default: null`
      // (e.g. `Category.parentId`). `.optional()` accepts only `undefined`, so
      // such a row failed validation with Zod's raw "Invalid input: expected
      // string, received null" and the form could never be submitted again.
      //
      // The trap is that it hides until a row has been written *since* the
      // nullable field was added: older documents omit the key entirely, so they
      // pass, and the very first save is what makes the record un-editable.
      //
      // For an optional field `null` and `undefined` both mean "no value", which
      // is already how the number branch above treats them.
      fieldSchema = fieldSchema.nullish();
    }

    placeFieldSchema(field.name, fieldSchema);
  });

  // Recursively build z.object() from a nested plain-object map
  const buildZodObject = (map: Record<string, any>): z.ZodObject<any> => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [key, value] of Object.entries(map)) {
      if (value instanceof z.ZodType) {
        shape[key] = value;
      } else {
        // Nested object group — make it optional so partial fills don't fail
        shape[key] = buildZodObject(value).optional();
      }
    }
    return z.object(shape);
  };

  // Merge nested groups into schemaObject
  for (const [key, nested] of Object.entries(nestedMap)) {
    schemaObject[key] = buildZodObject(nested).optional();
  }

  const baseSchema = z.object(schemaObject);

  // Handle requiredWhen — fields that become required based on another field's value.
  // Uses superRefine for cross-field validation (avoids circular dep with dependency-utils.ts).
  const requiredWhenFields = fieldEntries
    .filter(
      ({ field, section }) =>
        field.requiredWhen && !isFieldHiddenForSchema(field, section, values),
    )
    .map((e) => e.field);
  if (requiredWhenFields.length === 0) {
    return baseSchema;
  }

  // Reuse the shared inline condition evaluator (dot-path aware).
  const evalRequiredWhen = (
    data: Record<string, any>,
    field: FormFieldConfig,
  ): boolean =>
    evalDepCondition(
      getValueByPath(data, field.requiredWhen!.field),
      field.requiredWhen!,
    );

  return baseSchema.superRefine((data, ctx) => {
    for (const field of requiredWhenFields) {
      if (!evalRequiredWhen(data as Record<string, any>, field)) continue;
      const fieldValue = (data as Record<string, any>)[field.name];
      const isEmpty =
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === "" ||
        (typeof fieldValue === "object" &&
          fieldValue !== null &&
          typeof fieldValue.value === "string" &&
          fieldValue.value === "");
      if (isEmpty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Please select ${field.label}`,
          path: [field.name],
        });
      }
    }
  });
};

// Hook to use generated schema
export const useGeneratedSchema = (config: DynamicFormConfig) => {
  return generateSchemaFromConfig(config);
};
