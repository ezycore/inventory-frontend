// coding-standard: maintained

import { useForm } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormSectionComponent } from "../form-section";
import type { FormSection } from "../type";

/**
 * The plain-chrome section header lets its title read in full.
 *
 * Title and description sat side by side on one baseline row and BOTH carried
 * `truncate`, so flex split the width between them and the title lost its last
 * character while the description beside it had room to spare — "Your
 * organization" measured 119px of text into a 109px box (QA-N4). It was found
 * on signup, but this is a shared component: every plain-chrome section clipped
 * the same way.
 *
 * The rule this pins: the **title is identity and must not be the thing that
 * gets cut**; the description is supplementary and is what absorbs the
 * truncation. Asserting on the class contract rather than on measured widths —
 * jsdom does no layout, so `scrollWidth` is always 0 here and a width-based
 * test would pass against the bug.
 */
function Harness({ section }: { section: FormSection }) {
  const form = useForm({ defaultValues: { name: "" } });
  return (
    <FormSectionComponent
      section={section}
      control={form.control}
      formState={form.formState}
      watch={form.watch}
      setValue={form.setValue}
      maxColumns={12}
      allFields={section.fields}
      // `chrome` is a prop on the component, not a field on the section —
      // the card branch stacks title over description and never had this bug.
      chrome="plain"
    />
  );
}

const render = (ui: React.ReactElement) =>
  rtlRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );

const plainSection = (description?: string): FormSection => ({
  title: "Your organization",
  description,
  fields: [{ name: "name", type: "input", label: "Name" }],
});

const renderPlain = (description?: string) => {
  render(<Harness section={plainSection(description)} />);
  return {
    title: screen.getByText("Your organization"),
    description: description ? screen.getByText(description) : null,
  };
};

const LONG_DESCRIPTION =
  "You can change these later — but your workspace URL becomes your store address, so pick something you are happy to keep.";

describe("FormSection — plain chrome header", () => {
  it("does not let the title shrink below its own text", () => {
    const { title } = renderPlain(LONG_DESCRIPTION);

    // `shrink-0` is the whole fix: without it flex hands the title less than
    // its content width and `truncate` eats the tail.
    expect(title.className).toContain("shrink-0");
  });

  it("lets the description absorb the truncation instead", () => {
    const { description } = renderPlain(LONG_DESCRIPTION);

    expect(description?.className).toContain("truncate");
    expect(description?.className).toContain("min-w-0");
  });

  it("gives the description a floor so it wraps rather than vanishing", () => {
    // Below roughly 10rem it drops to its own line and truncates there, which
    // beats being squeezed to a couple of characters beside the title.
    const { description } = renderPlain(LONG_DESCRIPTION);

    expect(description?.className).toContain("basis-40");
    expect(description?.parentElement?.className).toContain("flex-wrap");
  });

  it("still caps a pathological title at the container", () => {
    // `shrink-0` alone would overflow the row horizontally; `max-w-full` keeps
    // truncation as the last resort rather than removing it.
    const { title } = renderPlain(LONG_DESCRIPTION);

    expect(title.className).toContain("max-w-full");
    expect(title.className).toContain("truncate");
  });

  it("renders a title with no description at all", () => {
    const { title } = renderPlain();

    expect(title).toBeInTheDocument();
  });
});
