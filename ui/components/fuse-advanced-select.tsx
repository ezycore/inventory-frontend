"use client";

/**
 * FuseAdvancedSelect Component
 *
 * Drop-in replacement for AdvancedSelect that adds Fuse.js-powered fuzzy search.
 * Supports the same props as AdvancedSelect — single and multiple modes.
 *
 * Features:
 * - 🔍 Fuse.js fuzzy search — finds matches even with spelling mistakes
 * - 🆓 Form-independent — works standalone or with React Hook Form
 * - 📊 Static options via `options` prop
 * - 📡 Dynamic options via `optionsApi` prop with template support {{fieldName}}
 * - ⚡ Built-in loading and error states
 * - 🔄 Automatic data transformation from API responses
 * - 🔗 Unified dependency system with automatic template resolution
 * - ➕ Quick-add modal for creating new options inline
 * - ✅ Multiple selection mode with badge display + fuzzy search
 */

import { quickAddConfig } from "@/config/quickAddConfig";
import { useSelectOptions } from "@/services/api";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import DynamicForm from "@/ui/components/form";
import type { SelectOption, FieldDependencyConfig } from "@/ui/components/form/type";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/components/popover";
import { Badge } from "@ui/components/badge";
import { cn } from "@ui/lib/utils";
import { Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react";
import Fuse from "fuse.js";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Button } from "./button";

// ── Types (same as AdvancedSelect) ────────────────────────────────────────────

export interface LabelValueOption {
  label: string;
  value: string;
}

export type FuseSelectValue =
  | string
  | string[]
  | LabelValueOption
  | LabelValueOption[];

export interface FuseAdvancedSelectProps {
  // Core select properties
  value?: FuseSelectValue;
  onValueChange?: (value: FuseSelectValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  /** When true, onChange returns {label, value} object(s) instead of just value string(s) */
  labelInValue?: boolean;
  /** "single" (default) or "multiple" */
  mode?: "single" | "multiple";

  // Options — either static or API-driven
  options?: SelectOption[];
  /** API endpoint. Supports template syntax: '/products/{{productId}}/variants' */
  optionsApi?: string;

  // Dependency system (used by DynamicForm)
  dependsOn?: FieldDependencyConfig;

  // Multi-select display
  maxCount?: number;

  // Quick-add functionality
  creatable?: boolean;
  quickAddModule?: string;
  itemsCreateCallback?: (response: any) => SelectOption[];

  /** Called once on mount with the current value (used for auto-fill on initial render) */
  onMount?: (value: FuseSelectValue | undefined) => void;

  /**
   * Name of a boolean field on the fetched options that marks the default option
   * (e.g. "isDefault", "isDefaultSales"). When set and the field is empty, the
   * matching option is auto-selected once so create forms come pre-filled.
   */
  defaultFlag?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  dependsOn,
  maxCount = 3,
  labelInValue = false,
  creatable = false,
  quickAddModule,
  itemsCreateCallback,
  onMount,
  defaultFlag,
}) => {
  // ── Hooks (all before any early return) ───────────────────────────────────

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  // const hasMountedRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Guards the one-time default auto-select so we never override the user.
  const defaultAppliedRef = useRef(false);

  const queryClient = useQueryClient();

  const moduleConfig =
    creatable && quickAddModule ? quickAddConfig[quickAddModule] : null;
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

  // ── Helpers ───────────────────────────────────────────────────────────────

  const extractRaw = useCallback(
    (val: FuseSelectValue | undefined): string | string[] => {
      if (!val) return mode === "multiple" ? [] : "";
      if (Array.isArray(val))
        return val.map((v) => (typeof v === "object" ? v.value : v));
      return typeof val === "object" ? val.value : val;
    },
    [mode]
  );

  const findOption = useCallback(
    (valueStr: string): SelectOption | LabelValueOption =>
      finalOptions.find((o) => o.value === valueStr) ?? {
        label: valueStr,
        value: valueStr,
      },
    [finalOptions]
  );

  const formatValue = useCallback(
    (raw: string | string[]): FuseSelectValue => {
      if (!labelInValue) return raw;
      if (Array.isArray(raw)) return raw.map((v) => findOption(v));
      return findOption(raw);
    },
    [labelInValue, findOption]
  );

  const handleValueChange = useCallback(
    (raw: string | string[]) => {
      onValueChange?.(formatValue(raw));
    },
    [formatValue, onValueChange]
  );

  // onMount enrichment
  useEffect(() => {
    if (!onMount) return;
    if (optionsApi && finalOptions.length === 0) return;
    const rawVal = extractRaw(value);
    if (!rawVal || (Array.isArray(rawVal) && rawVal.length === 0)) return;
    // hasMountedRef.current = true;
    onMount(labelInValue ? formatValue(rawVal) : value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalOptions, value]);

  // Auto-select the default option once for empty single-selects. Editing an
  // existing record keeps its value (we only fill when nothing is set).
  useEffect(() => {
    if (!defaultFlag || mode === "multiple" || defaultAppliedRef.current) return;
    if (optionsApi && finalOptions.length === 0) return;

    const rawVal = extractRaw(value);
    const hasValue = Array.isArray(rawVal) ? rawVal.length > 0 : !!rawVal;
    if (hasValue) {
      defaultAppliedRef.current = true;
      return;
    }

    const defaultOption = finalOptions.find(
      (opt) => (opt as Record<string, unknown>)[defaultFlag] === true,
    );
    if (defaultOption) {
      defaultAppliedRef.current = true;
      handleValueChange(defaultOption.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalOptions, value, defaultFlag]);

  // Fuse instance
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

  // Filtered options
  const filteredOptions = useMemo<SelectOption[]>(() => {
    const q = searchQuery.trim();
    if (!q) return finalOptions;
    return fuse.search(q).map((r) => r.item);
  }, [searchQuery, fuse, finalOptions]);

  // Auto-focus / clear search on open/close
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  // ── Derived values ────────────────────────────────────────────────────────

  const actualValue = extractRaw(value);

  // Single-select derived
  const singleValue = Array.isArray(actualValue)
    ? actualValue[0] || ""
    : actualValue || "";

  const selectedLabel =
    finalOptions.find((o) => o.value === singleValue)?.label ?? singleValue;

  // Multi-select derived
  const multiValues: string[] = useMemo(
    () =>
      Array.isArray(actualValue)
        ? actualValue
        : actualValue
          ? [actualValue]
          : [],
    [actualValue],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectSingle = useCallback(
    (optionValue: string) => {
      handleValueChange(optionValue);
      setOpen(false);
    },
    [handleValueChange]
  );

  const handleToggleMulti = useCallback(
    (optionValue: string) => {
      const next = multiValues.includes(optionValue)
        ? multiValues.filter((v) => v !== optionValue)
        : [...multiValues, optionValue];
      handleValueChange(next);
    },
    [multiValues, handleValueChange]
  );

  const handleRemoveMulti = useCallback(
    (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      handleValueChange(multiValues.filter((v) => v !== optionValue));
    },
    [multiValues, handleValueChange]
  );

  const handleClearSingle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleValueChange("");
    },
    [handleValueChange]
  );

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleValueChange([]);
    },
    [handleValueChange]
  );

  // Quick-add
  const handleQuickAddSuccess = async (result: any) => {
    const newItemId = result?.data?._id;
    if (moduleConfig && newItemId) {
      await queryClient.invalidateQueries({
        queryKey: ["select-options", moduleConfig.optionsApiPath],
      });
      await new Promise((r) => setTimeout(r, 0));
      if (mode === "multiple") {
        handleValueChange([...multiValues, newItemId]);
      } else {
        handleValueChange(newItemId);
      }
    }
    setIsModalOpen(false);
    form.reset();
  };

  // ── Shared trigger style ──────────────────────────────────────────────────
  const triggerCls = (extra?: string) =>
    cn(
      "flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
      "focus:outline-none focus:ring-1 focus:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error ? "border-red-500" : "",
      extra,
      className
    );

  // ── Shared dropdown content ───────────────────────────────────────────────

  const renderDropdown = (
    isMulti: boolean,
    selectedValues: string[],
    onSelectItem: (v: string) => void
  ) => (
    <PopoverContent
      className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[12rem]"
      align="start"
      sideOffset={4}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      {/* Search box */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Search options"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && filteredOptions.length === 1) {
              onSelectItem(filteredOptions[0].value);
            }
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Options */}
      <div role="listbox" className="max-h-60 overflow-y-auto overflow-x-hidden py-1">
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {searchQuery ? `No results for "${searchQuery}"` : "No data available"}
          </div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => !option.disabled && onSelectItem(option.value)}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  "disabled:pointer-events-none disabled:opacity-50",
                  isSelected && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </button>
            );
          })
        )}
      </div>
    </PopoverContent>
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <button type="button" disabled className={triggerCls()}>
        <span className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading options...
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (apiError) {
    return (
      <button type="button" disabled className={triggerCls("border-red-500")}>
        <span className="truncate text-muted-foreground">Error: {apiError}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    );
  }

  // ── Multiple select mode ──────────────────────────────────────────────────

  if (mode === "multiple") {
    const visibleBadges = multiValues.slice(0, maxCount);
    const overflowCount = multiValues.length - maxCount;

    return (
      <>
        <div className="flex gap-2 w-full">
          <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
            <PopoverTrigger asChild>
              <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                aria-expanded={open}
                aria-haspopup="listbox"
                className={cn(
                  triggerCls(),
                  "h-auto min-h-9 flex-wrap gap-1 py-1.5"
                )}
              >
                {multiValues.length === 0 ? (
                  <span className="text-muted-foreground">
                    {placeholder || "Select options..."}
                  </span>
                ) : (
                  <span className="flex flex-wrap gap-1 flex-1 min-w-0">
                    {visibleBadges.map((v) => {
                      const label =
                        finalOptions.find((o) => o.value === v)?.label ?? v;
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
                              onClick={(e) => handleRemoveMulti(v, e)}
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
                  </span>
                )}
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  {multiValues.length > 0 && !disabled && (
                    <span
                      role="button"
                      aria-label="Clear all"
                      onClick={handleClearAll}
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </span>
              </button>
            </PopoverTrigger>
            {renderDropdown(true, multiValues, handleToggleMulti)}
          </Popover>

          {creatable && moduleConfig && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsModalOpen(true)}
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
  }

  // ── Single select mode ────────────────────────────────────────────────────

  return (
    <>
      <div className="flex gap-2 w-full">
        <div className="relative w-full min-w-0 group">
          <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
            <PopoverTrigger asChild>
              <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                aria-expanded={open}
                aria-haspopup="listbox"
                className={triggerCls(
                  singleValue && !disabled
                    ? "[&>svg.chevron]:group-hover:opacity-0"
                    : ""
                )}
              >
                <span
                  className={cn(
                    "line-clamp-1 text-left",
                    !singleValue && "text-muted-foreground"
                  )}
                >
                  {singleValue
                    ? selectedLabel
                    : placeholder || "Select an option..."}
                </span>
                <ChevronDown className="chevron h-4 w-4 shrink-0 opacity-50 transition-opacity" />
              </button>
            </PopoverTrigger>

            {/* Clear button — visible on hover */}
            {singleValue && !disabled && (
              <button
                type="button"
                onClick={handleClearSingle}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            {renderDropdown(false, singleValue ? [singleValue] : [], handleSelectSingle)}
          </Popover>
        </div>

        {creatable && moduleConfig && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsModalOpen(true)}
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
