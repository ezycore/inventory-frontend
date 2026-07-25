"use client";
// coding-standard: maintained

import { Badge } from "@ui/components/badge";
import { cn } from "@ui/lib/utils";
import { ChevronDown, X } from "lucide-react";
import type { KeyboardEvent, MouseEvent, RefObject } from "react";

/**
 * The two visible shapes of `FuseAdvancedSelect`'s combobox field. Both are the
 * Popover *anchor*, so the input keeps focus while the listbox is open — every
 * affordance drawn here cancels mousedown rather than handling click, because a
 * click lands after the blur that would have closed the popover.
 *
 * Purely presentational: state, filtering and keyboard handling stay in the
 * component / `useComboboxKeyboard`.
 */

const bareInput =
  "bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed";

/** Everything both modes need from the owning component. */
export interface FuseFieldContext {
  inputRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  placeholder?: string;
  open: boolean;
  /** `null` → the input mirrors the committed selection; string → live query. */
  query: string | null;
  onQueryChange: (next: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  /** Box classes (border, error state, consumer `className`). */
  fieldCls: (extra?: string) => string;
  listId: string;
  activeDescendantId?: string;
}

function comboboxAria(ctx: FuseFieldContext) {
  return {
    role: "combobox" as const,
    "aria-expanded": ctx.open,
    "aria-controls": ctx.listId,
    "aria-autocomplete": "list" as const,
    "aria-activedescendant": ctx.activeDescendantId,
  };
}

// ── Single mode ───────────────────────────────────────────────────────────────

interface FuseSingleFieldProps {
  ctx: FuseFieldContext;
  /** Committed option value, or "" when nothing is picked. */
  selectedValue: string;
  selectedLabel: string;
  onClear: (e: MouseEvent) => void;
}

export function FuseSingleField({
  ctx,
  selectedValue,
  selectedLabel,
  onClear,
}: FuseSingleFieldProps) {
  const { disabled, open, query, inputRef } = ctx;
  const hasValue = !!selectedValue && !disabled;

  return (
    <div className="relative w-full min-w-0 group">
      <input
        {...comboboxAria(ctx)}
        ref={inputRef}
        type="text"
        disabled={disabled}
        value={query ?? selectedLabel}
        // Once open the committed label demotes to a hint, so the box is free to
        // type in without the current selection reading as the query.
        placeholder={
          open && selectedValue
            ? selectedLabel
            : ctx.placeholder || "Select an option..."
        }
        onChange={(e) => ctx.onQueryChange(e.target.value)}
        onFocus={ctx.onOpen}
        onClick={ctx.onOpen}
        onBlur={ctx.onClose}
        onKeyDown={ctx.onKeyDown}
        className={ctx.fieldCls(
          cn(bareInput, "h-9 py-2 focus:ring-1 focus:ring-ring")
        )}
      />

      {/* Clear — takes over the chevron's slot on hover, as AdvancedSelect does. */}
      {hasValue && (
        <button
          type="button"
          aria-label="Clear selection"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClear}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      )}
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 transition-opacity",
          hasValue && "group-hover:opacity-0"
        )}
      />
    </div>
  );
}

// ── Multiple mode ─────────────────────────────────────────────────────────────

interface FuseMultiFieldProps {
  ctx: FuseFieldContext;
  values: string[];
  labelOf: (optionValue: string) => string;
  /** How many badges to show before collapsing the rest into "+N more". */
  maxCount: number;
  onRemove: (optionValue: string, e: MouseEvent) => void;
  onClearAll: (e: MouseEvent) => void;
}

export function FuseMultiField({
  ctx,
  values,
  labelOf,
  maxCount,
  onRemove,
  onClearAll,
}: FuseMultiFieldProps) {
  const { disabled, query, inputRef } = ctx;
  const visibleBadges = values.slice(0, maxCount);
  const overflowCount = values.length - maxCount;

  return (
    <div
      className={ctx.fieldCls(
        cn(
          "relative flex h-auto min-h-9 flex-wrap items-center gap-1 py-1.5",
          "cursor-text focus-within:ring-1 focus-within:ring-ring",
          disabled && "cursor-not-allowed opacity-50"
        )
      )}
      // Clicking the padding around the badges behaves like clicking the input.
      onMouseDown={(e) => {
        if (disabled || e.target === inputRef.current) return;
        e.preventDefault();
        inputRef.current?.focus();
        ctx.onOpen();
      }}
    >
      {visibleBadges.map((v) => {
        const label = labelOf(v);
        return (
          <Badge
            key={v}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-0.5 text-xs"
          >
            {label}
            {!disabled && (
              <span
                role="button"
                aria-label={`Remove ${label}`}
                onMouseDown={(e) => onRemove(v, e)}
                className="cursor-pointer hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Badge>
        );
      })}
      {overflowCount > 0 && (
        <Badge variant="secondary" className="px-2 py-0.5 text-xs">
          +{overflowCount} more
        </Badge>
      )}

      <input
        {...comboboxAria(ctx)}
        ref={inputRef}
        type="text"
        disabled={disabled}
        // Badges carry the selection here, so the input only ever shows the query.
        value={query ?? ""}
        placeholder={
          values.length === 0 ? ctx.placeholder || "Select options..." : ""
        }
        onChange={(e) => ctx.onQueryChange(e.target.value)}
        onFocus={ctx.onOpen}
        onClick={ctx.onOpen}
        onBlur={ctx.onClose}
        onKeyDown={ctx.onKeyDown}
        className={cn(bareInput, "h-6 w-16 min-w-0 flex-1")}
      />

      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {values.length > 0 && !disabled && (
          <span
            role="button"
            aria-label="Clear all"
            onMouseDown={onClearAll}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </span>
        )}
        <ChevronDown className="pointer-events-none h-4 w-4 opacity-50" />
      </span>
    </div>
  );
}
