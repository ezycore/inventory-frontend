// coding-standard: maintained
/**
 * `CheckoutCustomFields` — typing the separator in a choice list.
 *
 * The options input renders a comma-separated string and saves a parsed array,
 * and it used to do both on the SAME value: `field.options.join(", ")` was the
 * input's value, re-derived from a parse of every keystroke. That made the
 * separator untypeable. `"Morning,"` parses to `["Morning", ""]`, the empty tail
 * is dropped — correctly, nobody wants to save a blank option — and the value
 * joins back to `"Morning"`, deleting the comma in the frame it was typed. The
 * space after it died to `.trim()` the same way. The only way through was to
 * type `"MorningEvening"` and go back to insert the comma, which is what a
 * merchant reported.
 *
 * The fix is that the text belongs to the person typing and the array belongs to
 * the form. These tests hold both halves of that: what stays on screen, and what
 * the parent is told to save.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CheckoutCustomFields } from "@/components/ecommerce/settings/checkout-custom-fields";
import type { CheckoutField } from "@/types";

const selectField = (options?: string[]): CheckoutField => ({
  key: "f1",
  kind: "input",
  type: "select",
  label: "Delivery time",
  options,
});

const optionsInput = () =>
  screen.getByPlaceholderText(/Options, comma separated/i) as HTMLInputElement;

describe("choice-list options input", () => {
  it("keeps a trailing comma on screen while it is being typed", () => {
    render(<CheckoutCustomFields fields={[selectField(["Morning"])]} onChange={vi.fn()} />);
    fireEvent.change(optionsInput(), { target: { value: "Morning," } });
    // The regression: this used to come back "Morning".
    expect(optionsInput().value).toBe("Morning,");
  });

  it("keeps the space after the comma", () => {
    render(<CheckoutCustomFields fields={[selectField(["Morning"])]} onChange={vi.fn()} />);
    fireEvent.change(optionsInput(), { target: { value: "Morning, " } });
    expect(optionsInput().value).toBe("Morning, ");
  });

  it("lets a second option be typed straight through", () => {
    render(<CheckoutCustomFields fields={[selectField()]} onChange={vi.fn()} />);
    // One character at a time, which is the case the old code failed: every
    // keystroke was re-derived from the parsed array.
    let typed = "";
    for (const char of "Morning, Evening") {
      typed += char;
      fireEvent.change(optionsInput(), { target: { value: typed } });
    }
    expect(optionsInput().value).toBe("Morning, Evening");
  });

  it("still saves a trimmed array with no blanks", () => {
    const onChange = vi.fn();
    render(<CheckoutCustomFields fields={[selectField()]} onChange={onChange} />);
    fireEvent.change(optionsInput(), { target: { value: "Morning,  Evening , " } });
    // The parent gets the value that belongs on the order — the raw text never
    // reaches it, and a half-typed trailing separator saves nothing extra.
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ options: ["Morning", "Evening"] }),
    ]);
  });

  it("seeds from what was saved", () => {
    render(
      <CheckoutCustomFields fields={[selectField(["Morning", "Evening"])]} onChange={vi.fn()} />,
    );
    expect(optionsInput().value).toBe("Morning, Evening");
  });
});
