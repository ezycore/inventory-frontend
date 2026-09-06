"use client";
// coding-standard: maintained

import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import {
  MOBILE_ACTIONS,
  mobileAction,
  type MobileActionId,
  type MobileActionSpec,
} from "@/lib/storefront-mobile";
import { Button } from "@/ui/components/button";
import { SimpleSelect } from "@/ui/components/simple-select";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { cn } from "@/ui/lib/utils";

/**
 * The control a merchant arranges one slot of their phone bar with — the top
 * bar's left and right clusters, and the bottom tab row.
 *
 * **A row of chips with arrows, not drag-and-drop.** The lists are two to five
 * items in a 380px rail that is itself inside a scrolling page, and a drag there
 * fights the page scroll on precisely the device this feature is about. Arrows
 * are also the only version a keyboard can use.
 *
 * The offered actions come from `MOBILE_ACTIONS`, so an action added to that
 * registry appears here with its name and its glyph choices already right —
 * there is no second list to keep in step.
 */
export function MobileSlotField({
  value,
  onChange,
  allow,
  max,
  /** Greyed out with a reason instead of hidden — see `needs` on the spec. */
  disabledIds,
  emptyLabel,
}: {
  value: MobileActionId[];
  onChange: (next: MobileActionId[]) => void;
  /** Which actions this slot may hold (tabs take a subset). */
  allow: readonly MobileActionId[];
  max: number;
  disabledIds?: Partial<Record<MobileActionId, string>>;
  emptyLabel: string;
}) {
  const options = MOBILE_ACTIONS.filter(
    (a) => allow.includes(a.id) && !value.includes(a.id),
  );

  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= value.length) return;
    const next = [...value];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.length === 0 ? (
        <PartHint>{emptyLabel}</PartHint>
      ) : (
        <ul className="space-y-1">
          {value.map((id, i) => (
            <SlotRow
              key={id}
              spec={mobileAction(id)}
              note={disabledIds?.[id]}
              first={i === 0}
              last={i === value.length - 1}
              onMove={(dir) => move(i, dir)}
              onRemove={() => onChange(value.filter((v) => v !== id))}
            />
          ))}
        </ul>
      )}

      {value.length >= max ? (
        <PartHint>
          {/* A cap with no explanation reads as a bug. */}
          {max === 1
            ? "One is all this slot fits."
            : `${max} is as many as fit on a phone.`}
        </PartHint>
      ) : options.length === 0 ? null : (
        <SimpleSelect
          size="sm"
          value=""
          placeholder="Add…"
          onValueChange={(id) => onChange([...value, id as MobileActionId])}
          options={options.map((o) => ({ value: o.id, label: o.label }))}
        />
      )}
    </div>
  );
}

function SlotRow({
  spec,
  note,
  first,
  last,
  onMove,
  onRemove,
}: {
  spec?: MobileActionSpec;
  note?: string;
  first: boolean;
  last: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  if (!spec) return null;
  return (
    <li className="flex items-center gap-1 rounded-md border bg-background px-2 py-1">
      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {spec.label}
        {note ? (
          <span className="ml-1.5 font-normal text-muted-foreground">{note}</span>
        ) : null}
      </span>
      <IconBtn label="Move earlier" disabled={first} onClick={() => onMove(-1)}>
        <ArrowLeft className="h-3.5 w-3.5" />
      </IconBtn>
      <IconBtn label="Move later" disabled={last} onClick={() => onMove(1)}>
        <ArrowRight className="h-3.5 w-3.5" />
      </IconBtn>
      <IconBtn label={`Remove ${spec.label}`} onClick={onRemove}>
        <X className="h-3.5 w-3.5" />
      </IconBtn>
    </li>
  );
}

function IconBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6 flex-none text-muted-foreground"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/**
 * Glyph pickers for the actions the merchant has actually placed.
 *
 * **Only for what is on screen, and only where there is a choice.** Offering a
 * hamburger picker to a shop whose template has no menu button is a control that
 * changes nothing, and an action with one glyph in its registry entry has
 * nothing to pick between — both would be rows a merchant reads and learns to
 * skip.
 */
export function MobileIconField({
  placed,
  icons,
  onChange,
}: {
  /** Every action the chrome currently draws, in bar or tab. */
  placed: MobileActionId[];
  icons: Partial<Record<MobileActionId, string>>;
  onChange: (icons: Partial<Record<MobileActionId, string>>) => void;
}) {
  const rows = MOBILE_ACTIONS.filter(
    (a) => placed.includes(a.id) && a.icons.length > 1,
  );
  if (!rows.length) return null;

  return (
    <div className="space-y-2">
      {rows.map((spec) => (
        <div key={spec.id} className="flex items-center gap-2">
          <span className="w-16 flex-none text-xs text-muted-foreground">
            {spec.label}
          </span>
          <div className="flex flex-wrap gap-1">
            {spec.icons.map((name) => {
              const on = (icons[spec.id] ?? spec.icon) === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-label={`${spec.label}: ${name}`}
                  aria-pressed={on}
                  onClick={() => onChange({ ...icons, [spec.id]: name })}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border bg-background text-foreground transition-colors",
                    on
                      ? "border-primary ring-1 ring-primary"
                      : "hover:bg-accent",
                  )}
                >
                  <GlyphPreview name={name} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The storefront glyph, drawn in the admin.
 *
 * Inline paths rather than importing the storefront's `<Icon>`: that component
 * is a storefront-design-system client component and this is the admin, and the
 * whole point of the picker is that the merchant sees **the exact shape their
 * shoppers will**, not a lucide approximation of it. Nine short strings is a
 * cheaper honesty than a shared component neither design system owns.
 */
const GLYPHS: Record<string, string> = {
  menu: "M4 7h16M4 12h16M4 17h16",
  menuAlt: "M4 8h16M4 16h10",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  list: "M8.5 6h12M8.5 12h12M8.5 18h12M4 6h.01M4 12h.01M4 18h.01",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  cart: "M2.5 3.5h2.2l2.2 11.2h9.9L20.5 7H6M9 20h.01M18 20h.01",
  bag: "M5.5 7.5h13l1 13h-15zM8.8 10V6.8a3.2 3.2 0 0 1 6.4 0V10",
  basket: "M3 9.5h18l-1.6 9H4.6zM8 9.5 10.5 4M16 9.5 13.5 4",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14m9 16-3.2-3.2",
  zoomIn: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14m9 16-3.2-3.2M8.4 11h5.2M11 8.4v5.2",
  box: "M12 3 20 7v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10",
  truck: "M2.5 6.5h10v9h-10zM12.5 9.5h4l3 3v3h-7zM6 17.5h.01M16.5 17.5h.01",
};

function GlyphPreview({ name }: { name: string }) {
  return (
    <svg
      width={17}
      height={17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={GLYPHS[name] ?? ""} />
    </svg>
  );
}
