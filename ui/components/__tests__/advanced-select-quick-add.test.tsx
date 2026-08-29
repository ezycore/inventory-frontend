// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";

/**
 * Quick-add ("+") on a `creatable` select — in BOTH modes.
 *
 * `AdvancedSelect` returns early for `mode: "multiple"`, and the quick-add
 * button and its modal were built below that return. So the product form's
 * Tags field (`creatable: true, quickAddModule: "tag"`) rendered a bare
 * multi-select with no "+" and no way to create a tag inline — a config that
 * type-checked, matched the working Category/Brand fields, and silently did
 * nothing. Anything both branches render has to be built above the branch.
 */

const useSelectOptions = vi.fn(() => ({
  data: [{ label: "Eid Special", value: "tag-1" }],
  isLoading: false,
  error: null,
}));
vi.mock("@/services/api", () => ({
  useSelectOptions: (...args: unknown[]) => useSelectOptions(...(args as [])),
}));

const formReset = vi.fn();
vi.mock("@/hooks/use-dynamic-form", () => ({
  useDynamicForm: () => ({ form: { reset: formReset } }),
}));

// Stands in for the real modal — asserting it opened is enough here.
vi.mock("@/ui/components/form", () => ({
  default: ({ open, title }: { open: boolean; title: string }) =>
    open ? <div>{title}</div> : null,
}));

const moduleConfig = {
  formConfig: { fields: [] },
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  title: "Add New Tag",
  submitLabel: "Create Tag",
  queryRoot: () => ["tags"],
  defaults: {},
};
const useQuickAddModule = vi.fn(
  (creatable: boolean, module?: string) =>
    creatable && module ? moduleConfig : null,
);
vi.mock("@/hooks/use-quick-add-module", () => ({
  useQuickAddModule: (...args: unknown[]) =>
    useQuickAddModule(...(args as [boolean, string?])),
}));

const { AdvancedSelect } = await import("../advanced-select");

const renderSelect = (props: Record<string, unknown>) =>
  renderWithProviders(
    <AdvancedSelect
      optionsApi="/tags?fields=_id,name"
      creatable
      quickAddModule="tag"
      {...props}
    />,
  );

describe("AdvancedSelect quick-add", () => {
  it("renders the + trigger in multiple mode", () => {
    renderSelect({ mode: "multiple" });
    expect(screen.getByRole("button", { name: "Add New Tag" })).toBeTruthy();
  });

  it("still renders the + trigger in single mode", () => {
    renderSelect({ mode: "single" });
    expect(screen.getByRole("button", { name: "Add New Tag" })).toBeTruthy();
  });

  it("opens the quick-add modal from multiple mode", () => {
    renderSelect({ mode: "multiple" });
    expect(screen.queryByText("Add New Tag", { selector: "div" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add New Tag" }));
    expect(screen.getByText("Add New Tag", { selector: "div" })).toBeTruthy();
  });

  it("renders no trigger when the select names no quick-add module", () => {
    renderSelect({ mode: "multiple", quickAddModule: undefined });
    expect(screen.queryByRole("button", { name: "Add New Tag" })).toBeNull();
  });
});
