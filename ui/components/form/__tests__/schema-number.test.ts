import { describe, it, expect } from "vitest";
import {
  generateSchemaFromConfig,
  type DynamicFormConfig,
} from "@/ui/components/form/type";

/**
 * The `number` renderer is <NumberField>, whose empty state is `null` (older
 * configs may still carry ""). These lock in that the generated schema treats
 * both as "no value" rather than a type error.
 */
const configWith = (field: Partial<Record<string, any>>): DynamicFormConfig => ({
  fields: [
    {
      name: "qty",
      label: "Quantity",
      type: "number",
      ...field,
    } as any,
  ],
});

describe("generateSchemaFromConfig — number fields", () => {
  it("accepts a plain number", () => {
    const result = generateSchemaFromConfig(configWith({})).safeParse({ qty: 5 });
    expect(result.success).toBe(true);
  });

  it("treats null as empty on an optional field", () => {
    const result = generateSchemaFromConfig(configWith({})).safeParse({ qty: null });
    expect(result.success).toBe(true);
  });

  it("treats an empty string as empty on an optional field", () => {
    const result = generateSchemaFromConfig(configWith({})).safeParse({ qty: "" });
    expect(result.success).toBe(true);
  });

  it("rejects null on a required field with the friendly required message", () => {
    const result = generateSchemaFromConfig(
      configWith({ required: true }),
    ).safeParse({ qty: null });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Quantity is required");
  });

  it("still enforces min/max", () => {
    const schema = generateSchemaFromConfig(
      configWith({ validation: { min: 1, max: 10 } }),
    );
    expect(schema.safeParse({ qty: 0 }).success).toBe(false);
    expect(schema.safeParse({ qty: 11 }).success).toBe(false);
    expect(schema.safeParse({ qty: 10 }).success).toBe(true);
  });

  it("does not let an emptied optional field trip the min bound", () => {
    const schema = generateSchemaFromConfig(
      configWith({ validation: { min: 1 } }),
    );
    expect(schema.safeParse({ qty: null }).success).toBe(true);
  });
});
