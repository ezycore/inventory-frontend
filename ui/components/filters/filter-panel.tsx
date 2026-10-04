"use client";

import type { UseFiltersReturn } from "@/hooks/use-filters";
import { FilterConfig } from "@/types/DataTable";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@ui/components/sheet";
import { cn } from "@ui/lib/utils";
import { Filter } from "lucide-react";
import React from "react";
import { FilterFieldRenderer } from "./filter-field-renderer";

interface FilterPanelProps {
  config: FilterConfig;
  /** Shared filter state — owned by the caller so inline controls and the
   * panel are two views of one source of truth. */
  state: UseFiltersReturn;
  trigger?: React.ReactNode;
  /** Override `config.showResetButton` (e.g. suppressed when the bar owns Reset). */
  showReset?: boolean;
  /**
   * Only these fields — the ones the bar could not show inline. Without it the
   * panel repeats every inline filter, and its count badge counts them twice.
   */
  fieldNames?: string[];
  /**
   * Apply each change at once, like the inline bar beside it, instead of
   * waiting for "Apply Filters". Free text still commits on a debounce.
   */
  live?: boolean;
}

const FREE_TEXT_TYPES = new Set(["text", "number"]);

const isActiveValue = (v: unknown) =>
  Array.isArray(v) ? v.length > 0 : v !== "" && v !== null && v !== undefined;

/**
 * Presentational Advanced-filter panel (popover on desktop, sheet on mobile).
 * Renders the complete field set from `config.fields`, driven entirely by the
 * shared `state`. No filter state of its own — see `GlobalFilter` (uncontrolled)
 * and `FilterBar` (inline + overflow) for the two entry points.
 */
export function FilterPanel({
  config,
  state,
  trigger,
  showReset,
  fieldNames,
  live = false,
}: FilterPanelProps) {
  const {
    fields: allFields = [],
    columns = 2,
    viewMode = "sheet",
    applyOnChange = false,
    showResetButton = true,
    showApplyButton = true,
  } = config;

  const { values, updateField, apply, reset, isOpen, setIsOpen } = state;

  const fields = fieldNames
    ? allFields.filter((f) => fieldNames.includes(f.name))
    : allFields;
  const activeCount = fieldNames
    ? fields.filter((f) => isActiveValue(values[f.name])).length
    : state.activeCount;

  const handleChange = (name: string, type: string, value: unknown) => {
    if (!live) return updateField(name, value);
    if (FREE_TEXT_TYPES.has(type)) return state.setFilterDebounced(name, value);
    state.setFieldAndApply(name, value);
  };

  const resetVisible = showReset ?? showResetButton;

  const handleReset = () => {
    reset();
    config.onReset?.();
  };

  const triggerButton = trigger || (
    <Button variant="outline" className="gap-2 h-8">
      <Filter className="h-4 w-4" />
      Filters
      {activeCount > 0 && (
        <Badge variant="secondary" className="ml-1 rounded-full px-2">
          {activeCount}
        </Badge>
      )}
    </Button>
  );

  const filterContent = (
    <>
      {/* Filter Fields */}
      <div
        className={cn(
          "grid gap-6 px-1",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {fields.map((field) => {
          if (field.showWhen && !field.showWhen(values)) {
            return null;
          }

          return (
            <div
              key={field.name}
              className={cn(
                field.columnSpan === 2 && "sm:col-span-2",
                field.columnSpan === 3 && "lg:col-span-3",
                field.columnSpan === 4 && "lg:col-span-4",
              )}
            >
              <FilterFieldRenderer
                field={field}
                value={
                  live && FREE_TEXT_TYPES.has(field.type)
                    ? state.filterInputs[field.name]
                    : values[field.name]
                }
                values={values}
                onChange={(value) => handleChange(field.name, field.type, value)}
              />
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div
        className={cn(
          "mt-6 gap-2 flex",
          viewMode === "sheet"
            ? "flex-col sm:flex-row sm:justify-end"
            : "flex-row justify-end",
        )}
      >
        {resetVisible && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={activeCount === 0}
            className={viewMode === "sheet" ? "w-full sm:w-auto" : "w-auto"}
          >
            Reset All
          </Button>
        )}
        {showApplyButton && !applyOnChange && !live && (
          <Button
            onClick={apply}
            className={viewMode === "sheet" ? "w-full sm:w-auto" : "w-auto"}
          >
            Apply Filters
          </Button>
        )}
      </div>
    </>
  );

  if (viewMode === "popover") {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        {/* Always below the button, capped to the room left and scrolled
            inside. Left to collision handling, a tall panel flipped ABOVE the
            button and ran off the top of the screen — title and first row
            unreachable. `end` grows it leftward from a right-hand button. */}
        <PopoverContent
          className="w-[600px] max-w-[calc(100vw-2rem)] max-h-(--radix-popover-content-available-height) overflow-y-auto p-6"
          side="bottom"
          align="end"
          avoidCollisions={false}
          collisionPadding={16}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-1">Filter Options</h4>
              <p className="text-sm text-muted-foreground">
                Apply filters to refine your results
              </p>
            </div>
            {filterContent}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Options</SheetTitle>
          <SheetDescription>
            Apply filters to refine your results
          </SheetDescription>
        </SheetHeader>
        <div className="mx-4 mt-6">{filterContent}</div>
      </SheetContent>
    </Sheet>
  );
}
