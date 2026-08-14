import { describe, expect, it } from "vitest";
import { generateSchemaFromConfig } from "../schema";
import type { DynamicFormConfig } from "../type";

/**
 * A required multi-select must mean "pick at least one".
 *
 * It did not: the multiple branch built a bare `z.array(...)` and the shared
 * required block only ever touched `ZodString`, so an empty array passed
 * validation on every required multi-select in the app. The users form's
 * "Assign Locations" was the visible one — the form submitted with nothing
 * selected and the backend answered DEFAULT_LOCATION_REQUIRED, which is a 400
 * the user cannot act on from the field that caused it.
 */
const config = (extra: Record<string, unknown> = {}): DynamicFormConfig => ({
  fields: [
    {
      name: "locationIds",
      type: "select",
      mode: "multiple",
      label: "Assign Locations",
      optionsApi: "/locations",
      required: true,
      ...extra,
    },
  ],
});

describe("generateSchemaFromConfig — required multi-select", () => {
  it("rejects an empty selection", () => {
    const result = generateSchemaFromConfig(config()).safeParse({
      locationIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Assign Locations is required");
  });

  it("accepts a selection", () => {
    const result = generateSchemaFromConfig(config()).safeParse({
      locationIds: ["loc-1"],
    });

    expect(result.success).toBe(true);
  });

  it("leaves an optional multi-select free to be empty", () => {
    const result = generateSchemaFromConfig(config({ required: false })).safeParse({
      locationIds: [],
    });

    expect(result.success).toBe(true);
  });

  it("honors an explicit validation.min over the implicit one", () => {
    const result = generateSchemaFromConfig(
      config({ validation: { min: 2 } }),
    ).safeParse({ locationIds: ["loc-1"] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Minimum 2 items required");
  });

  it("skips validation entirely while the field is hidden by dependsOn", () => {
    // Roles carrying `locations.all` hide the field; a hidden field can never
    // block the form, so the empty array must still pass.
    const hidden = generateSchemaFromConfig(
      {
        fields: [
          { name: "role", type: "select", label: "Role", required: true },
          {
            ...config().fields[0],
            dependsOn: {
              field: "role",
              condition: "notIn" as const,
              value: ["admin"],
              action: "show" as const,
            },
          },
        ],
      },
      { role: "admin", locationIds: [] },
    ).safeParse({ role: "admin", locationIds: [] });

    expect(hidden.success).toBe(true);
  });
});
