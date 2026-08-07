import { describe, expect, it } from "vitest";
import { generateSchemaFromConfig } from "../schema";
import type { DynamicFormConfig } from "../type";

/**
 * An edit form is prefilled straight from an API row, and a nullable column
 * arrives PRESENT-and-null — Mongoose writes an explicit `null` for any path
 * with `default: null`. `.optional()` accepts only `undefined`, so those rows
 * failed with Zod's raw "Invalid input: expected string, received null" and the
 * form could not be submitted at all.
 *
 * The trap is that it hides until a row is written after the nullable field is
 * added: older documents omit the key and pass. `Category.parentId` shipped
 * exactly this way — every top-level category became permanently un-editable
 * the first time it was saved.
 */
const config = (extra: Record<string, unknown> = {}): DynamicFormConfig => ({
  fields: [
    { name: "name", type: "input", label: "Name", required: true },
    { name: "parentId", type: "select", label: "Parent", optionsApi: "/categories", ...extra },
  ],
});

describe("generateSchemaFromConfig — optional fields and null", () => {
  it("accepts null for an optional select", () => {
    const result = generateSchemaFromConfig(config()).safeParse({
      name: "Personal Care",
      parentId: null,
    });
    expect(result.success).toBe(true);
  });

  it("still accepts undefined and a real value", () => {
    const schema = generateSchemaFromConfig(config());
    expect(schema.safeParse({ name: "A" }).success).toBe(true);
    expect(schema.safeParse({ name: "A", parentId: "abc" }).success).toBe(true);
  });

  it("accepts null for an optional text field", () => {
    const schema = generateSchemaFromConfig({
      fields: [{ name: "description", type: "textarea", label: "Description" }],
    });
    expect(schema.safeParse({ description: null }).success).toBe(true);
  });

  it("keeps required fields required", () => {
    // The relaxation is scoped to the optional branch — nothing else moves.
    const result = generateSchemaFromConfig(config()).safeParse({ parentId: null });
    expect(result.success).toBe(false);
  });

  it("still rejects a wrong-typed value on an optional field", () => {
    const schema = generateSchemaFromConfig({
      fields: [{ name: "note", type: "input", label: "Note" }],
    });
    expect(schema.safeParse({ note: 42 }).success).toBe(false);
  });
});
