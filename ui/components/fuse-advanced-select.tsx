"use client";
// coding-standard: maintained

/**
 * FuseAdvancedSelect Component
 *
 * Drop-in replacement for AdvancedSelect that adds Fuse.js-powered fuzzy search.
 * Supports the same props as AdvancedSelect — single and multiple modes.
 *
 * The field itself is the search box: it renders as a **combobox**, so one click
 * focuses it and typing filters immediately. There is no second search input
 * inside the dropdown — the popover is a plain listbox.
 *
 * This module is the orchestrator only. Value normalisation lives in
 * `useFuseSelectValue`, keyboard nav in `useComboboxKeyboard`, the field markup
 * in `fuse-select-fields`, and the listbox in `fuse-select-dropdown`.
 *
 * Features:
 * - 🔍 Fuse.js fuzzy search — finds matches even with spelling mistakes
 * - ⌨️ Full keyboard nav (↑/↓/Home/End/Enter/Esc, Backspace to drop a badge)
 * - 🆓 Form-independent — works standalone or with React Hook Form
 * - 📊 Static options via `options` prop
 * - 📡 Dynamic options via `optionsApi` prop with template support {{fieldName}}
 * - ⚡ Built-in loading and error states
 * - 🔄 Automatic data transformation from API responses
 * - 🔗 Unified dependency system with automatic template resolution
 * - ➕ Quick-add modal for creating new options inline
 * - ✅ Multiple selection mode with badge display + inline typeahead
 */

import { useSelectOptions } from "@/services/api";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { useQuickAddModule } from "@/hooks/use-quick-add-module";
import DynamicForm from "@/ui/components/form";
import type { SelectOption } from "@/ui/components/form/type";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverAnchor } from "@ui/components/popover";
import { FuseSelectDropdown } from "@ui/components/fuse-select-dropdown";
import {
  FuseMultiField,
  FuseSingleField,
  type FuseFieldContext,
} from "@ui/components/fuse-select-fields";
import type { FuseAdvancedSelectProps } from "@ui/components/fuse-select-types";
import { useComboboxKeyboard } from "@ui/hooks/use-combobox-keyboard";
import { useFuseSelectValue } from "@ui/hooks/use-fuse-select-value";
import { cn } from "@ui/lib/utils";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import Fuse from "fuse.js";
import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import { Button } from "./button";

export type {
  FuseAdvancedSelectProps,
  FuseSelectValue,
  LabelValueOption,
} from "@ui/components/fuse-select-types";

export const FuseAdvancedSelect: React.FC<FuseAdvancedSelectProps> = ({
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  error,
  mode = "single",
  options,
  optionsApi,
  maxCount = 3,
  labelInValue = false,
  creatable = false,
  quickAddModule,
  itemsCreateCallback,
  onMount,
  defaultFlag,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  // null → the input mirrors the committed selection; string → a live query.
  const [query, setQuery] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const isMulti = mode === "multiple";

  const queryClient = useQueryClient();

  // Feature-gated: e.g. the category quick-add drops its VAT picker while the
  // org doesn't charge VAT.
  const moduleConfig = useQuickAddModule(creatable, quickAddModule, optionsApi);
  const { form } = useDynamicForm(moduleConfig?.formConfig || { fields: [] });
  const createMutation = moduleConfig?.useMutation();

  const {
    data: apiOptions,
    isLoading: loading,
    error: queryError,
  } = useSelectOptions(optionsApi || null, itemsCreateCallback);

  const finalOptions = useMemo(
    () => (optionsApi ? apiOptions || [] : options || []),
    [optionsApi, apiOptions, options]
  );

  const apiError = queryError ? (queryError as Error).message : null;

  const {
    handleValueChange,
    singleValue,
    selectedLabel,
    multiValues,
    labelOf,
  } = useFuseSelectValue({
    value,
    onValueChange,
    mode,
    finalOptions,
    optionsApi,
    labelInValue,
    onMount,
    defaultFlag,
  });

  // ── Filtering ─────────────────────────────────────────────────────────────

  const fuse = useMemo(
    () =>
      new Fuse(finalOptions, {
        keys: ["label"],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 1,
        includeScore: true,
      }),
    [finalOptions]
  );

  const filteredOptions = useMemo<SelectOption[]>(() => {
    const q = (query ?? "").trim();
    if (!q) return finalOptions;
    return fuse.search(q).map((r) => r.item);
  }, [query, fuse, finalOptions]);

  // ── Open / close ──────────────────────────────────────────────────────────

  // Opening always starts from a blank query so the full list is offered; the
  // committed label survives as the placeholder until something else is picked.
  const openDropdown = useCallback(() => {
    if (disabled) return;
    setQuery("");
    setOpen(true);
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery(null);
  }, []);

  // What the input shows while it mirrors the committed selection.
  const mirroredText = isMulti ? "" : selectedLabel;

  const handleQueryChange = useCallback(
    (next: string) => {
      setQuery((prev) => {
        if (prev !== null) return next;
        // First keystroke while the input still mirrors the committed label
        // (e.g. typing right after Escape): keep only what was actually typed,
        // so the old label doesn't get prepended to the query.
        return next.length > mirroredText.length && next.startsWith(mirroredText)
          ? next.slice(mirroredText.length)
          : next;
      });
      setOpen(true);
    },
    [mirroredText]
  );

  // ── Selection handlers ────────────────────────────────────────────────────

  const handleSelectSingle = useCallback(
    (optionValue: string) => {
      handleValueChange(optionValue);
      closeDropdown();
    },
    [handleValueChange, closeDropdown]
  );

  const handleToggleMulti = useCallback(
    (optionValue: string) => {
      const next = multiValues.includes(optionValue)
        ? multiValues.filter((v) => v !== optionValue)
        : [...multiValues, optionValue];
      handleValueChange(next);
      // Stay open and reset the query — picking several in a row is the point.
      setQuery("");
    },
    [multiValues, handleValueChange]
  );

  const handleRemoveMulti = useCallback(
    (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleValueChange(multiValues.filter((v) => v !== optionValue));
    },
    [multiValues, handleValueChange]
  );

  // Backspace on an empty query drops the last badge, like a tag input.
  const handleBackspaceMulti = useCallback(() => {
    if (multiValues.length === 0) return;
    handleValueChange(multiValues.slice(0, -1));
  }, [multiValues, handleValueChange]);

  const handleClearSingle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleValueChange("");
      setQuery(null);
    },
    [handleValueChange]
  );

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleValueChange([]);
    },
    [handleValueChange]
  );

  const { activeIndex, setActiveIndex, onKeyDown } = useComboboxKeyboard({
    open,
    onOpen: openDropdown,
    onClose: closeDropdown,
    items: filteredOptions,
    onSelect: isMulti ? handleToggleMulti : handleSelectSingle,
    onBackspaceEmpty: isMulti ? handleBackspaceMulti : undefined,
    isQueryEmpty: !query,
  });

  const handleQuickAddSuccess = async (result: any) => {
    const newItemId = result?.data?._id;
    if (moduleConfig && newItemId) {
      await queryClient.invalidateQueries({
        queryKey: moduleConfig.queryRoot(),
      });
      await new Promise((r) => setTimeout(r, 0));
      handleValueChange(isMulti ? [...multiValues, newItemId] : newItemId);
    }
    setIsModalOpen(false);
    form.reset();
  };

  // ── Shared field box style ────────────────────────────────────────────────

  // The single-mode input *is* this box; multi mode wraps badges + a bare input
  // in it. `pr-8` reserves the chevron / clear slot.
  const fieldCls = useCallback(
    (extra?: string) =>
      cn(
        "w-full min-w-0 rounded-md border border-input bg-transparent px-3 pr-8 text-sm shadow-xs",
        "disabled:cursor-not-allowed disabled:opacity-50",
        extra,
        error ? "border-red-500" : "",
        className
      ),
    [error, className]
  );

  // ── Loading / error states ────────────────────────────────────────────────

  // Both placeholder strings are longer than the value they stand in for, and
  // this box is often much narrower than a form field — a filter-bar chip is
  // 160px. Without `min-w-0` + `truncate` the text wraps to a second line and
  // spills out of the fixed height, so the whole toolbar row visibly breaks for
  // as long as the options are in flight. Truncate, don't wrap.
  if (loading) {
    return (
      <div className={fieldCls("flex h-9 items-center py-2 pr-3 opacity-50")}>
        <span className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span className="truncate">Loading options...</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </div>
    );
  }

  if (apiError) {
    return (
      <div
        className={fieldCls(
          "flex h-9 items-center border-red-500 py-2 pr-3 opacity-50"
        )}
      >
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          Error: {apiError}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const fieldCtx: FuseFieldContext = {
    inputRef,
    disabled,
    placeholder,
    open,
    query,
    onQueryChange: handleQueryChange,
    onOpen: openDropdown,
    onClose: closeDropdown,
    onKeyDown,
    fieldCls,
    listId,
    activeDescendantId:
      open && filteredOptions.length > 0
        ? `${listId}-opt-${activeIndex}`
        : undefined,
  };

  return (
    <>
      <div className="flex gap-2 w-full">
        <Popover
          open={open}
          onOpenChange={
            disabled
              ? undefined
              : (next) => (next ? openDropdown() : closeDropdown())
          }
        >
          {/* Anchor, not trigger: the input owns click and focus, so the popover
              must position against it without also toggling on every click. */}
          <PopoverAnchor asChild>
            <div className="relative w-full min-w-0">
              {isMulti ? (
                <FuseMultiField
                  ctx={fieldCtx}
                  values={multiValues}
                  labelOf={labelOf}
                  maxCount={maxCount}
                  onRemove={handleRemoveMulti}
                  onClearAll={handleClearAll}
                />
              ) : (
                <FuseSingleField
                  ctx={fieldCtx}
                  selectedValue={singleValue}
                  selectedLabel={selectedLabel}
                  onClear={handleClearSingle}
                />
              )}
            </div>
          </PopoverAnchor>

          <FuseSelectDropdown
            listId={listId}
            options={filteredOptions}
            selectedValues={isMulti ? multiValues : singleValue ? [singleValue] : []}
            activeIndex={activeIndex}
            onActivate={setActiveIndex}
            onSelect={isMulti ? handleToggleMulti : handleSelectSingle}
            query={query ?? ""}
          />
        </Popover>

        {creatable && moduleConfig && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              // Open already scoped to whatever narrows this select's
              // options, so a child cannot be created at the wrong level.
              form.reset(moduleConfig.defaults);
              setIsModalOpen(true);
            }}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {creatable && moduleConfig && createMutation && (
        <DynamicForm
          form={form}
          config={moduleConfig.formConfig}
          mutationHook={createMutation}
          openInside="modal"
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={moduleConfig.title}
          submitLabel={moduleConfig.submitLabel}
          cancelLabel="Cancel"
          onCancel={() => setIsModalOpen(false)}
          onSuccess={handleQuickAddSuccess}
          modalSize="md"
        />
      )}
    </>
  );
};

export default FuseAdvancedSelect;
