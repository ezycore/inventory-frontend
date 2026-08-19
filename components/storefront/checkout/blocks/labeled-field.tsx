"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { useId } from "react";
import { sfFieldLabel } from "@/components/storefront/field-styles";
import { Field } from "@/components/storefront/checkout/checkout-field";
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
  children,
}: {
  /** Omitted for a field nothing can be wrong with — the optional notes box. */
  name?: CheckoutField;
  /** Absent = the caller labels the control itself (the account address form). */
  label?: string;
  error?: string;
  /** Renders the `— optional` suffix. Say it in the label, not the placeholder:
   *  a placeholder disappears the moment the shopper starts typing. */
  optional?: string;
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
        </label>
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
