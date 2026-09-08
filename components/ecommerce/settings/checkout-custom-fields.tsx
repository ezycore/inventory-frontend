"use client";
// coding-standard: maintained

import type { CheckoutField } from "@/types";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

/**
 * Editor for the merchant's own checkout entries.
 *
 * Two kinds share one ordered list so the merchant controls the sequence a
 * shopper meets them in: a **notice** is prose they write (a policy, an
 * instruction), an **input** is a question the shopper answers.
 *
 * **These never change a price.** A merchant may ask a shopper to state a
 * shipping charge; the answer arrives as text on the order and the merchant
 * applies it themselves by editing the order's shipping charge. Wiring a
 * shopper-typed value into the total would let an anonymous checkout set its own
 * price, which is why the backend stores these as inert labelled strings.
 */
const MAX_FIELDS = 5;

const KIND_OPTIONS = [
  { label: "Input — the shopper answers", value: "input" },
  { label: "Notice — text they read", value: "notice" },
];

const TYPE_OPTIONS = [
  { label: "Short text", value: "text" },
  { label: "Long text", value: "textarea" },
  { label: "Number", value: "number" },
  { label: "Choice list", value: "select" },
  { label: "Checkbox", value: "checkbox" },
];

/** Keys are stored on every order, so they are generated once and never reused. */
function newKey(): string {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function CheckoutCustomFields({
  fields,
  onChange,
}: {
  fields: CheckoutField[];
  onChange: (next: CheckoutField[]) => void;
}) {
  const update = (index: number, patch: Partial<CheckoutField>) =>
    onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Extra checkout fields</Label>
        <p className="text-xs text-muted-foreground">
          Shown at checkout after the delivery address. Answers appear on the order —
          they never change the order total.
        </p>
      </div>

      {fields.map((field, index) => (
        <div key={field.key} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <SimpleSelect
              value={field.kind}
              onValueChange={(kind) =>
                update(index, {
                  kind: kind as CheckoutField["kind"],
                  // A notice has no input semantics; drop them rather than keep
                  // them dormant and have them reappear on a later switch back.
                  type: kind === "input" ? (field.type ?? "text") : undefined,
                  required: kind === "input" ? field.required : undefined,
                  options: kind === "input" ? field.options : undefined,
                })
              }
              options={KIND_OPTIONS}
              className="max-w-[220px]"
            />
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Move down"
                disabled={index === fields.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() => onChange(fields.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <Input
            value={field.label}
            maxLength={200}
            placeholder={
              field.kind === "notice"
                ? "The text the shopper reads"
                : "Field label, e.g. Preferred delivery time"
            }
            onChange={(e) => update(index, { label: e.target.value })}
          />

          {field.kind === "input" ? (
            <>
              <Input
                value={field.helpText ?? ""}
                maxLength={300}
                placeholder="Help text under the label (optional)"
                onChange={(e) => update(index, { helpText: e.target.value || undefined })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <SimpleSelect
                  value={field.type ?? "text"}
                  onValueChange={(type) =>
                    update(index, { type: type as CheckoutField["type"] })
                  }
                  options={TYPE_OPTIONS}
                  className="max-w-[200px]"
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!field.required}
                    onCheckedChange={(value) => update(index, { required: value === true })}
                  />
                  Required
                </label>
              </div>
              {field.type === "select" ? (
                <div className="space-y-1.5">
                  <Input
                    value={(field.options ?? []).join(", ")}
                    placeholder="Options, comma separated — e.g. Morning, Evening"
                    onChange={(e) =>
                      update(index, {
                        options: e.target.value
                          .split(",")
                          .map((option) => option.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    A choice list needs at least one option, or the shopper meets a
                    control they cannot satisfy.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= MAX_FIELDS}
        onClick={() =>
          onChange([
            ...fields,
            { key: newKey(), kind: "input", type: "text", label: "", required: false },
          ])
        }
      >
        Add field
      </Button>
      {fields.length >= MAX_FIELDS ? (
        <p className="text-xs text-muted-foreground">
          Five is the maximum — a long checkout is the commonest reason an order is
          abandoned.
        </p>
      ) : null}
    </div>
  );
}
