"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import { Ban, ChevronDown } from "lucide-react";
import { Icon as SfIcon, type IconName } from "@/components/storefront/sf-icons";
import { NO_ICON } from "@/lib/storefront-builder/section-specs";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/components/popover";
import { cn } from "@/ui/lib/utils";

/** Tailwind needs the class written out, so the two widths are listed. */
const COLUMNS: Record<4 | 6, string> = { 4: "grid-cols-4", 6: "grid-cols-6" };

/**
 * The glyphs, drawn, in one grid — the shared half of every icon picker.
 *
 * A dropdown of names ("Check", "Coins", "Bolt") asks the merchant to imagine a
 * shape from a word and shows one row at a time, so the set they are choosing
 * from is never on screen at once. Sixteen small shapes are read in a glance,
 * and they are the storefront's OWN `<Icon>` — the exact shape their shoppers
 * will see, not a lucide approximation of it.
 *
 * Callers own the trigger, because the two sites are different shapes: a badge
 * row has a square button beside its text field, a section setting has a
 * full-width control under its label (`IconPicker` below).
 */
export function IconGrid({
  value,
  choices,
  columns = 6,
  labelOf,
  emptyLabel,
  allowNone,
  onPick,
}: {
  /** The chosen icon, or `NO_ICON`; absent means whatever the surface falls back to. */
  value?: string;
  choices: readonly IconName[];
  /** How wide the grid runs. The caller owns the popover's width, so it owns this too. */
  columns?: 4 | 6;
  /** How one value reads — the caller's own vocabulary. */
  labelOf?: (value: string) => string;
  /** Offer "unset", named for what unset means here. Omit where it is not a choice. */
  emptyLabel?: string;
  /**
   * Offer **No icon**. Only where the renderer honours `NO_ICON`: unset is not
   * "no icon" anywhere — every surface substitutes a fallback — so offering it
   * elsewhere would promise something the shop does not draw.
   */
  allowNone?: boolean;
  onPick: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("grid gap-1", COLUMNS[columns])}>
        {choices.map((name) => {
          const on = value === name;
          return (
            <button
              key={name}
              type="button"
              title={labelOf?.(name) ?? name}
              aria-label={labelOf?.(name) ?? name}
              aria-pressed={on}
              onClick={() => onPick(name)}
              className={cn(
                "flex h-9 items-center justify-center rounded-md border transition-colors",
                on
                  ? "border-primary text-primary ring-1 ring-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <SfIcon name={name} size={17} />
            </button>
          );
        })}
      </div>
      {emptyLabel || allowNone ? (
        <div className="flex gap-1 border-t pt-2">
          {emptyLabel ? (
            <ChoiceButton on={value === undefined} onClick={() => onPick(undefined)}>
              {emptyLabel}
            </ChoiceButton>
          ) : null}
          {allowNone ? (
            <ChoiceButton on={value === NO_ICON} onClick={() => onPick(NO_ICON)}>
              <Ban className="size-3.5" /> No icon
            </ChoiceButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ChoiceButton({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors",
        on ? "border-primary text-primary ring-1 ring-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/**
 * One icon setting as a field control: a select-shaped trigger showing the glyph
 * in force, over `IconGrid`.
 *
 * The trigger shows what the section **draws**, which is not always what is
 * stored — an unset icon renders a fallback, and where that fallback is one of
 * the listed glyphs the caller passes it as the value (the same rule
 * `fieldEmptyChoice` applies to every other control).
 */
export function IconPicker({
  id,
  value,
  choices,
  labelOf,
  emptyLabel,
  allowNone,
  onChange,
}: {
  id?: string;
  value?: string;
  choices: readonly IconName[];
  labelOf?: (value: string) => string;
  emptyLabel?: string;
  allowNone?: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    value === NO_ICON ? "No icon" : value ? (labelOf?.(value) ?? value) : (emptyLabel ?? "Default");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className="border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 text-sm shadow-xs transition-colors outline-none hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="flex min-w-0 items-center gap-2">
            <TriggerGlyph value={value} />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="size-4 flex-none opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) gap-2 p-2">
        <IconGrid
          value={value}
          choices={choices}
          labelOf={labelOf}
          emptyLabel={emptyLabel}
          allowNone={allowNone}
          onPick={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * The trigger's preview. Unset draws a dashed placeholder rather than a guess:
 * where the fallback is a real glyph the caller passes it as the value, so an
 * empty preview here means the surface picks the shape (the promises band
 * cycles its three by position), and drawing any one of them would be a lie.
 */
function TriggerGlyph({ value }: { value?: string }) {
  if (value === NO_ICON) return <Ban className="size-4 flex-none text-muted-foreground" />;
  if (!value) return <span className="size-4 flex-none rounded-sm border border-dashed" />;
  return <SfIcon name={value as IconName} size={16} />;
}
