// coding-standard: maintained

import { useForm } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DynamicForm from "../index";
import type { DynamicFormConfig } from "../type";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

/**
 * Shadow test S38: Cancel on an EDITED inline form did nothing at all.
 *
 * Twelve forms render DynamicForm inline inside a dialog or page their caller owns (Record
 * Expense, locations, users, supplier, purchase edit…). Cancel on a dirty form opens the
 * "Discard your changes?" prompt — but the prompt was rendered only in the modal and drawer
 * branches, so inline the click set state for a dialog that was never in the tree.
 */
const config: DynamicFormConfig = {
  fields: [{ name: "note", type: "input", label: "Note" }],
};

const render = (ui: React.ReactElement) =>
  rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

function Harness({ onCancel }: { onCancel: () => void }) {
  const form = useForm({ defaultValues: { note: "" } });
  return <DynamicForm form={form} config={config} onSubmit={() => {}} onCancel={onCancel} />;
}

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText("Note"), { target: { value } });

describe("DynamicForm inline — Cancel", () => {
  it("closes at once when nothing was edited", () => {
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Discard your changes?")).toBeNull();
  });

  it("asks first on an edited form, and Discard then closes it", async () => {
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);
    type("rent for October");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Discard your changes?")).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("a pre-filled default is set but is not an edit: Cancel still closes at once", async () => {
    // Record Expense opens on the default account (S37); that alone must not count as a change.
    const withDefault: DynamicFormConfig = {
      fields: [
        {
          name: "accountId",
          type: "fuseSelect",
          label: "Account",
          options: [
            { value: "a1", label: "Bank" },
            { value: "a2", label: "Cash", isDefault: true } as never,
          ],
          defaultFlag: "isDefault",
        },
        { name: "note", type: "input", label: "Note" },
      ],
    };
    const onCancel = vi.fn();
    let values: Record<string, unknown> = {};
    function DefaultHarness() {
      const form = useForm({ defaultValues: { accountId: "", note: "" } });
      values = form.watch();
      return <DynamicForm form={form} config={withDefault} onSubmit={() => {}} onCancel={onCancel} />;
    }
    render(<DefaultHarness />);

    await waitFor(() => expect(values.accountId).toBe("a2"));
    // Typing and clearing again re-runs React Hook Form's whole-form dirty check against the
    // defaults — which is what made the real dialog prompt (the Amount box re-emits on blur).
    type("x");
    type("");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Discard your changes?")).toBeNull();
  });

  it("Keep editing leaves the form and its text in place", async () => {
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);
    type("rent for October");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keep editing" }));

    expect(onCancel).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Note") as HTMLInputElement).value).toBe("rent for October");
  });
});
