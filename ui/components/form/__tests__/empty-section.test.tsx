// coding-standard: maintained

import { useForm } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormSectionComponent } from "../form-section";
import type { FormSection } from "../type";

/**
 * A section renders nothing when it has nothing to show.
 *
 * Fields could always hide themselves; the section around them could not. So a
 * group whose fields were all conditionally hidden left its shell standing —
 * "Publish to store" shipped as a header, a subtitle promising the product goes
 * live on save, and no control at all beneath it.
 */
function Harness({ section }: { section: FormSection }) {
  const form = useForm({
    // `parent` holds a plain option id: enriching it into the full option is
    // what needs the async fetch, and so what the section cannot resolve.
    defaultValues: { isListed: false, other: "", parent: "opt-1" },
  });
  return (
    <FormSectionComponent
      section={section}
      control={form.control}
      formState={form.formState}
      watch={form.watch}
      setValue={form.setValue}
      maxColumns={12}
      allFields={section.fields}
    />
  );
}

// A visible field may reach `useSelectOptions`, which needs a client.
const render = (ui: React.ReactElement) =>
  rtlRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );

const gated = (name: string) => ({
  name,
  type: "input" as const,
  label: name,
  dependsOn: { field: "isListed", condition: "truthy" as const, action: "show" as const },
});

describe("FormSection — nothing to show", () => {
  it("hides the whole section when every field is hidden", () => {
    render(
      <Harness
        section={{
          title: "Publish to store",
          description: "This product goes live on your store as soon as you save.",
          fields: [gated("onlinePrice"), gated("weightKg")],
        }}
      />,
    );

    expect(screen.queryByText("Publish to store")).not.toBeInTheDocument();
    expect(screen.queryByText(/goes live on your store/)).not.toBeInTheDocument();
  });

  it("keeps the section as soon as one field survives", () => {
    render(
      <Harness
        section={{
          title: "Publish to store",
          fields: [gated("onlinePrice"), { name: "other", type: "input", label: "Other" }],
        }}
      />,
    );

    expect(screen.getByText("Publish to store")).toBeInTheDocument();
  });

  it("keeps a section whose only content is its header action", () => {
    // The Inventory section's "Track stock" toggle is a `headerAction`, not a
    // field — hiding the section would take the toggle with it.
    render(
      <Harness
        section={{
          title: "Inventory",
          fields: [gated("openingStock")],
          headerAction: () => <button type="button">Track stock</button>,
        }}
      />,
    );

    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Track stock" })).toBeInTheDocument();
  });

  it("keeps a section whose visibility it cannot resolve without a hook", () => {
    // The dependency reads a property off an API-backed select, whose options
    // arrive asynchronously. Unknown means visible: hiding a section whose field
    // was about to appear is the worse failure.
    render(
      <Harness
        section={{
          title: "Conditional",
          fields: [
            {
              name: "child",
              type: "input",
              label: "Child",
              dependsOn: {
                field: "parent",
                matchWithProp: "kind",
                condition: "eq",
                value: "special",
                action: "show",
              },
            },
            { name: "parent", type: "select", label: "Parent", optionsApi: "/x", hidden: true },
          ],
        }}
      />,
    );

    expect(screen.getByText("Conditional")).toBeInTheDocument();
  });
});
