"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { input } from "@/components/storefront/checkout/checkout-bits";
import { sfSelect } from "@/components/storefront/field-styles";
import { Icon } from "@/components/storefront/sf-icons";
import { DANGER, invalidInput } from "@/components/storefront/checkout/checkout-field";
import { LabeledField } from "@/components/storefront/checkout/blocks/labeled-field";
import {
  isCheckoutFieldVisible,
  slotOf,
  type CheckoutFieldSlot,
} from "@/components/storefront/checkout/checkout-validation";
import {
  noticeMetrics,
  noticeSurface,
} from "@/lib/checkout-notice-style";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * The merchant's own checkout entries — notices they wrote and inputs they
 * defined, in the order they arranged them.
 *
 * Answers are inert: they travel as `customFieldAnswers`, are stored on the order
 * beside a snapshot of the label, and never touch a price. A merchant asking the
 * shopper to state a shipping charge is asking for a CLAIM they will act on
 * themselves — only the merchant can change what an order costs.
 *
 * **One `slot` per mount.** The component is rendered at five anchors across the
 * blocks and each mount takes only the fields anchored to it, rather than each
 * block re-deciding what belongs to it. That keeps the filter in one place, and
 * it keeps the merchant's ordering inside a slot as the array order — the same
 * list the editor reorders. Renders nothing when its slot is empty, so a block
 * can mount it unconditionally without leaving a gap.
 */
export function CustomFields({
  api,
  slot,
  style,
}: {
  api: CheckoutApi;
  slot: CheckoutFieldSlot;
  /** Spacing from the block that mounts it — applied only when it renders. */
  style?: CSSProperties;
}) {
  const { t, customFieldAnswers, setCustomFieldAnswer, errors, touch } = api;
  // Slot says WHERE, `showWhen` says WHETHER. Answers already typed into a field
  // that just became hidden are kept in state, not cleared — a shopper who
  // switches payment method to look and switches back should find their typing —
  // and dropped at submit instead, by `visibleCustomFields`.
  const customFields = api.customFields.filter(
    (field) =>
      slotOf(field) === slot &&
      isCheckoutFieldVisible(field, { paymentMethod: api.effectivePayment }),
  );
  // Before the wrapper, so a block can mount this unconditionally and a merchant
  // who used no fields at this anchor pays neither a div nor its margin.
  if (!customFields.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, ...style }}>
      {customFields.map((field) => {
        // A notice is prose the merchant wrote, not a control. Its tone and size
        // are the merchant's, resolved to storefront CSS vars rather than to
        // colours they typed — see `lib/checkout-notice-style`. Unset reads as
        // plain/small, which is the box every notice was before.
        if (field.kind === "notice") {
          const surface = noticeSurface(field.tone);
          const metrics = noticeMetrics(field.size);
          return (
            <div
              key={field.key}
              style={{
                background: surface.background,
                border: `1px solid ${surface.border}`,
                borderRadius: "var(--radius-sm)",
                padding: metrics.padding,
                fontSize: metrics.fontSize,
                fontWeight: surface.fontWeight,
                color: surface.color,
                lineHeight: metrics.lineHeight,
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
            required={field.required ? t.requiredTag : undefined}
            help={field.helpText}
          >
            {(id) =>
              field.type === "textarea" ? (
                <textarea
                  id={id}
                  rows={3}
                  style={{ ...(invalid ? invalidInput() : input), resize: "vertical" }}
                  aria-invalid={invalid}
                  aria-required={field.required || undefined}
                  value={value}
                  onChange={(e) => setCustomFieldAnswer(field.key, e.target.value)}
                  onBlur={() => touch(key)}
                />
              ) : field.type === "select" ? (
                // The chevron is ours, not the platform's — `sfSelect` turns the
                // native one off. See the note on that style for why the select
                // itself stays native.
                <div style={{ position: "relative" }}>
                  <select
                    id={id}
                    style={{
                      ...(invalid ? invalidInput(sfSelect) : sfSelect),
                      // An unanswered select shows the prompt, and a prompt is not
                      // an answer — colour it like the placeholder it is.
                      color: value ? "var(--text)" : "var(--faint)",
                    }}
                    aria-invalid={invalid}
                    aria-required={field.required || undefined}
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
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      right: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "flex",
                      // The glyph must not eat the click: every pixel of the
                      // control opens the picker, chevron included.
                      pointerEvents: "none",
                      color: invalid ? DANGER : "var(--muted)",
                    }}
                  >
                    <Icon name="chevD" size={15} />
                  </span>
                </div>
              ) : field.type === "checkbox" ? (
                <label
                  style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}
                >
                  <input
                    id={id}
                    type="checkbox"
                    aria-required={field.required || undefined}
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
                  aria-required={field.required || undefined}
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
