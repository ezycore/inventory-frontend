import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomFields } from "./custom-fields";
import { I18N } from "@/lib/storefront-i18n";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * REGRESSION — what a required field looks like, and what a `<select>` looks
 * like (QA, 2026-09-11).
 *
 * Two defects reported from one screenshot:
 *
 * 1. A required merchant field was indistinguishable from an optional one until
 *    the shopper pressed Place order and got refused. The only marker checkout
 *    had was the `— optional` suffix, so "required" was communicated by the
 *    ABSENCE of a word — which nobody reads.
 * 2. The one native `<select>` in the storefront painted the platform's chevron:
 *    a fixed dark glyph that ignores the store theme and sat at its own offset,
 *    conspicuously so inside the red error ring.
 */

const t = I18N.en;

function api(fields: CheckoutApi["customFields"], errors: Record<string, string> = {}) {
  return {
    t,
    customFields: fields,
    customFieldAnswers: {},
    setCustomFieldAnswer: vi.fn(),
    errors,
    touch: vi.fn(),
    effectivePayment: "cod",
  } as unknown as CheckoutApi;
}

const select = {
  key: "trx",
  kind: "input",
  label: "Bkash tnx number",
  type: "select",
  options: ["One", "Two"],
  required: true,
} as CheckoutApi["customFields"][number];

describe("CustomFields — required marker", () => {
  it("marks a required field with a star and the word behind it", () => {
    render(<CustomFields api={api([select])} slot="after-address" />);
    const label = screen.getByText("Bkash tnx number").closest("label")!;
    expect(label.textContent).toContain("*");
    // The star alone is a star to a screen reader. The word rides along hidden.
    expect(label.textContent).toContain(t.requiredTag);
    expect(label.textContent).not.toContain(t.optionalTag);
  });

  it("leaves an optional field with the word and no star", () => {
    const optional = { ...select, required: false };
    render(<CustomFields api={api([optional])} slot="after-address" />);
    const label = screen.getByText("Bkash tnx number").closest("label")!;
    expect(label.textContent).toContain(t.optionalTag);
    expect(label.textContent).not.toContain("*");
  });

  it("tells assistive tech the same thing the star tells the eye", () => {
    render(<CustomFields api={api([select])} slot="after-address" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-required", "true");
  });
});

describe("CustomFields — select chrome", () => {
  it("turns the platform chevron off and draws its own", () => {
    const { container } = render(<CustomFields api={api([select])} slot="after-address" />);
    const el = container.querySelector("select")!;
    expect(el.style.appearance).toBe("none");
    // Ours: an inline svg sibling, not a background glyph the theme can't reach.
    expect(container.querySelector("select + span svg")).not.toBeNull();
  });

  it("reserves the room the chevron sits in, so text cannot run under it", () => {
    const { container } = render(<CustomFields api={api([select])} slot="after-address" />);
    expect(container.querySelector("select")!.style.paddingRight).toBe("36px");
  });

  it("greys an unanswered select — the prompt is not an answer", () => {
    const { container } = render(<CustomFields api={api([select])} slot="after-address" />);
    expect(container.querySelector("select")!.style.color).toBe("var(--faint)");
  });
});
