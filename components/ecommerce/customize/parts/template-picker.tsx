"use client";
// coding-standard: maintained

import { OptionCard } from "@/ui/components/option-card";
import { TemplateSketch } from "@/components/ecommerce/customize/template-sketch";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";

/**
 * The picker every per-page layout choice uses: a wireframe sketch, the option
 * name, and one line saying what it does to the shop.
 *
 * It is deliberately never a row of bare text buttons. "Sticky buy bar" and
 * "Bold CTA" are unguessable words for a purely visual decision, and a merchant
 * who can't tell the options apart picks none of them.
 */
export function TemplatePicker({
  templateKey,
  value,
  onChange,
  columns = 3,
}: {
  templateKey: string;
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3;
}) {
  const options = TEMPLATE_OPTIONS[templateKey] ?? [];
  return (
    <div
      className={
        columns === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-3 gap-2"
      }
    >
      {options.map((o) => (
        <OptionCard
          key={o.value}
          selected={value === o.value}
          onSelect={() => onChange(o.value)}
          label={o.label}
          description={o.description}
          media={<TemplateSketch templateKey={templateKey} value={o.value} />}
        />
      ))}
    </div>
  );
}
