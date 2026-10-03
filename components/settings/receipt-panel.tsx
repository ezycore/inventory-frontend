"use client";
// coding-standard: maintained
import { Switch } from "@/ui/components/switch";

/** A titled, bordered section — one visual group per concern for even rhythm. */
export const Panel = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-4 rounded-lg border p-4">
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    {children}
  </section>
);

/** A toggle row: label + optional hint on the left, switch on the right. */
export const ToggleRow = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center justify-between gap-3 rounded-md border p-3">
    <span className="space-y-0.5">
      <span className="block text-sm font-medium">{label}</span>
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);
