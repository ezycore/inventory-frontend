"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { useId } from "react";
import { sfFieldLabel, sfVisuallyHidden } from "@/components/storefront/field-styles";
import { DANGER, Field } from "@/components/storefront/checkout/checkout-field";
import type { CheckoutField } from "@/components/storefront/checkout/checkout-validation";

/**
 * A checkout field with its question above it and its complaint below it.
 *
 * `Field` (error + focus handle) and the `<label>` are separate concerns that
 * always appear together, so this composes them once rather than at six call
 * sites. The generated `htmlFor`/`id` pair is why it takes `children` as a
 * render prop: the control needs the id, and threading one manually through six
 * fields is how a form ends up with two of them.
 */
export function LabeledField({
  name,
  label,
  error,
  optional,
  required,
  help,
  children,
}: {
  /** Omitted for a field nothing can be wrong with — the optional notes box. */
  name?: CheckoutField | (string & {});
  /** Absent = the caller labels the control itself (the account address form). */
  label?: string;
  error?: string;
  /** Renders the `— optional` suffix. Say it in the label, not the placeholder:
   *  a placeholder disappears the moment the shopper starts typing. */
  optional?: string;
  /**
   * Renders the red `*`. Takes the WORD for it, not a boolean, because the star
   * is only the sighted half of the marker — the word rides along visually
   * hidden, so the label announces "Mobile number, required" instead of
   * "Mobile number star", and it has to be translated like any other word.
   *
   * Absence is not a claim of optionality: the merchant's notes box says
   * `optional` outright, and the two props stay separate so a field that
   * somehow passed both looks wrong rather than silently picking one.
   */
  required?: string;
  /**
   * A line of explanation under the label. Used by the merchant's own checkout
   * fields, where the wording is theirs and a placeholder would not survive the
   * shopper starting to type.
   */
  help?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  const body = (
    <>
      {label ? (
        <label htmlFor={id} style={sfFieldLabel}>
          {label}
          {optional ? (
            <span style={{ color: "var(--faint)", fontWeight: 500 }}> — {optional}</span>
          ) : null}
          {required ? (
            <>
              <span aria-hidden="true" style={{ color: DANGER, marginLeft: 3 }}>
                *
              </span>
              <span style={sfVisuallyHidden}>{required}</span>
            </>
          ) : null}
        </label>
      ) : null}
      {help ? (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--faint)",
            lineHeight: 1.5,
            margin: "-2px 0 6px",
          }}
        >
          {help}
        </div>
      ) : null}
      {children(id)}
    </>
  );
  if (!name) return <div>{body}</div>;
  return (
    <Field name={name} error={error}>
      {body}
    </Field>
  );
}

/** Two fields side by side, stacking below the storefront's phone breakpoint. */
export function FieldPair({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "var(--cofields)", gap: 14 }}>
      {children}
    </div>
  );
}
