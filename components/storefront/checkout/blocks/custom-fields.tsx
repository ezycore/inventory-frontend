"use client";
// coding-standard: maintained

import { input } from "@/components/storefront/checkout/checkout-bits";
import { invalidInput } from "@/components/storefront/checkout/checkout-field";
import { LabeledField } from "@/components/storefront/checkout/blocks/labeled-field";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * The merchant's own checkout entries — notices they wrote and inputs they
 * defined, in the order they arranged them.
 *
 * Answers are inert: they travel as `customFieldAnswers`, are stored on the order
 * beside a snapshot of the label, and never touch a price. A merchant asking the
 * shopper to state a shipping charge is asking for a CLAIM they will act on
 * themselves — only the merchant can change what an order costs.
 */
export function CustomFields({ api }: { api: CheckoutApi }) {
  const { t, customFields, customFieldAnswers, setCustomFieldAnswer, errors, touch } = api;
  if (!customFields.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {customFields.map((field) => {
        // A notice is prose the merchant wrote, not a control. It gets the
        // tinted surface the other read-only rows use so it reads as guidance
        // rather than as a field somebody forgot to render an input for.
        if (field.kind === "notice") {
          return (
            <div
              key={field.key}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 13px",
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {field.label}
            </div>
          );
        }

        const key = `custom:${field.key}`;
        const error = errors[key];
        const value = customFieldAnswers[field.key] ?? "";
        const invalid = !!error;

        return (
          <LabeledField
            key={field.key}
            name={key}
            label={field.label}
            error={error}
            optional={field.required ? undefined : t.optionalTag}
            help={field.helpText}
          >
            {(id) =>
              field.type === "textarea" ? (
                <textarea
                  id={id}
                  rows={3}
                  style={{ ...(invalid ? invalidInput() : input), resize: "vertical" }}
                  aria-invalid={invalid}
                  value={value}
                  onChange={(e) => setCustomFieldAnswer(field.key, e.target.value)}
                  onBlur={() => touch(key)}
                />
              ) : field.type === "select" ? (
                <select
                  id={id}
                  style={invalid ? invalidInput() : input}
                  aria-invalid={invalid}
                  value={value}
                  onChange={(e) => setCustomFieldAnswer(field.key, e.target.value)}
                  onBlur={() => touch(key)}
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <label
                  style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={value === "Yes"}
                    onChange={(e) =>
                      // Stored as words, not a boolean: the value is read by a
                      // person on the order and printed on a slip.
                      setCustomFieldAnswer(field.key, e.target.checked ? "Yes" : "")
                    }
                  />
                  <span style={{ color: "var(--muted)" }}>{field.label}</span>
                </label>
              ) : (
                <input
                  id={id}
                  // `number` keeps the numeric keypad on a phone. It is still sent
                  // and stored as text — nothing downstream computes with it.
                  type={field.type === "number" ? "number" : "text"}
                  inputMode={field.type === "number" ? "decimal" : undefined}
                  style={invalid ? invalidInput() : input}
                  aria-invalid={invalid}
                  value={value}
                  onChange={(e) => setCustomFieldAnswer(field.key, e.target.value)}
                  onBlur={() => touch(key)}
                />
              )
            }
          </LabeledField>
        );
      })}
    </div>
  );
}
