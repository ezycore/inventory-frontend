"use client";

/**
 * AdvancedSelect Component
 *
 * A versatile, standalone select component that works both inside and outside forms.
 * Supports both static options and dynamic API-based options using TanStack Query
 * hooks for optimal caching and loading states.
 *
 * Features:
 * - 🆓 Form-independent - works standalone or with React Hook Form
 * - 📊 Static options via `options` prop
 * - 📡 Dynamic options via `optionsApi` prop with template support {{fieldName}}
 * - ⚡ Built-in loading and error states
 * - 🔄 Automatic data transformation from API responses
 * - 🚀 Module-independent utility hook for maximum reusability
 * - 💾 Centralized API client with proper caching strategy
 * - 🔗 Unified dependency system with automatic template resolution
 * - ➕ Quick-add modal for creating new options inline
 */

import { useSelectOptions } from "@/services/api";
import { isPermissionDeniedError } from "@/lib/api-client";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { useQuickAddModule } from "@/hooks/use-quick-add-module";
import DynamicForm from "@/ui/components/form";
import type { SelectOption, FieldDependencyConfig } from "@/ui/components/form/type";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { cn } from "@ui/lib/utils";
import { Loader2, Plus, X } from "lucide-react";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "./button";
import { MultiSelect } from "./multi-select";
import { CLEAR_OPTION_VALUE } from "./select-strategy";
import { findDefaultOption } from "./select-default";

export interface LabelValueOption {
  label: string;
  value: string;
}

export type SelectValue =
  | string
  | string[]
  | LabelValueOption
  | LabelValueOption[];

interface AdvancedSelectProps {
  // Core select properties
  /** DOM id for the trigger — the target of a `<Label htmlFor>` above it. Set on
   *  every state this can render (loading, error, single, multiple), because a
   *  label that stops working while options load is a label nobody trusts. */
  id?: string;
  value?: SelectValue;
  onValueChange?: (value: SelectValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  // When true, onChange returns {label, value} object(s) instead of just value string(s)
  labelInValue?: boolean;
  // Mode selection
  mode?: "single" | "multiple";

  // Options - either static or API-driven
  options?: SelectOption[];
  /**
   * API endpoint for select options
   * Supports template syntax: '/products/{{productId}}/variants'
   */
  optionsApi?: string;

  // Unified dependency system
  dependsOn?: FieldDependencyConfig;
  // Multi-select specific props
  variant?: "default" | "secondary" | "destructive" | "inverted";
  maxCount?: number;
  modalPopover?: boolean;
  asChild?: boolean;

  // Quick-add functionality
  creatable?: boolean;
  quickAddModule?: string;
  itemsCreateCallback?: (response: any) => SelectOption[];

  // Called once on mount with the current value (used for auto-fill on initial render)
  onMount?: (value: SelectValue | undefined) => void;

  /**
   * Name of a boolean field on the fetched options that marks the default option
   * (e.g. "isDefault", "isDefaultSales"). When set and the field is empty, the
   * matching option is auto-selected once so create forms come pre-filled.
   */
  defaultFlag?: string;
  /** Pre-fill the option with this label when none carries `defaultFlag`. */
  defaultFallbackLabel?: string;

  /** Single mode: a first menu item with this label that clears the selection. */
  clearOptionLabel?: string;
  /** Single mode: show the clear ✕ whenever a value is set — touch has no hover. */
  alwaysShowClear?: boolean;
}

export const AdvancedSelect: React.FC<AdvancedSelectProps> = ({
  id,
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
  variant = "default",
  maxCount,
  modalPopover,
  asChild,
  labelInValue = false,
  creatable = false,
  quickAddModule,
  itemsCreateCallback,
  onMount,
  defaultFlag,
  defaultFallbackLabel,
  clearOptionLabel,
  alwaysShowClear,
}) => {
  // Quick-add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Guards the one-time default auto-select so we never override the user.
  const defaultAppliedRef = useRef(false);
  const queryClient = useQueryClient();
  // Get quick-add config if creatable (feature-gated: e.g. no VAT fields while
  // the org doesn't charge VAT)
  const moduleConfig = useQuickAddModule(creatable, quickAddModule, optionsApi);
  const { form } = useDynamicForm(moduleConfig?.formConfig || { fields: [] });
  const createMutation = moduleConfig?.useMutation();

  // Helper: Extract actual value string(s) from SelectValue (handles labelInValue format)
  const extractValue = (val: SelectValue | undefined): string | string[] => {
    if (!val) return "";
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === "object" ? v.value : v));
    }
    return typeof val === "object" ? val.value : val;
  };

  // Helper: Find full option object for a value
  const findOptionForValue = (valueStr: string): SelectOption | LabelValueOption => {
    const option = finalOptions.find((opt) => opt.value === valueStr);
    return option || { label: valueStr, value: valueStr };
  };

  // Helper: Convert value string(s) to labelInValue format if needed
  const formatValue = (rawValue: string | string[]): SelectValue => {
    if (!labelInValue) return rawValue;
    if (Array.isArray(rawValue)) {
      return rawValue.map((v) => findOptionForValue(v));
    }
    return findOptionForValue(rawValue);
  };

  // Use the useSelectOptions hook for API-driven options
  const {
    data: apiOptions,
    isLoading: loading,
    error: queryError,
  } = useSelectOptions(optionsApi || null, itemsCreateCallback);

  // Determine which options to use
  const finalOptions = optionsApi ? apiOptions || [] : options || [];
  // A permission-denied options query gets its own placeholder below — the raw
  // backend message ("Insufficient permissions") is not useful to the user and
  // there is nothing actionable to retry, unlike a transient fetch failure.
  const isPermissionDenied = isPermissionDeniedError(queryError);
  const apiError = queryError
    ? isPermissionDenied
      ? "You don't have permission to view these options"
      : (queryError as Error).message
    : null;

  // Fire onMount once after options are available so labelInValue enrichment works
  // const hasMountedRef = useRef(false);
  useEffect(() => {
    // if (hasMountedRef.current) return;
    if (!onMount) return;
    // For API-driven selects, wait until options have loaded
    if (optionsApi && finalOptions.length === 0) return;

    const rawVal = extractValue(value);
    if (!rawVal || (Array.isArray(rawVal) && rawVal.length === 0)) return;

    // hasMountedRef.current = true;
    // Return the labelInValue-enriched value (full option object) if applicable
    const enriched = labelInValue ? formatValue(rawVal) : value;
    onMount(enriched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalOptions, value]);

  // Extract actual value strings for rendering
  const actualValue = extractValue(value);
  // How many badges fit is measured from the trigger's width inside
  // <MultiSelect>; this is only the ceiling on top of that, so a form field
  // that says nothing gets width-driven behaviour instead of a hard 3.
  const multiMaxCount = maxCount ?? 20;

  // Multi mode always renders from an array, whatever shape the value arrives in.
  const multiValue = Array.isArray(actualValue)
    ? actualValue
    : actualValue
      ? [actualValue]
      : [];

  // Handle value changes for both single and multiple modes
  const handleValueChange = (newValue: string | string[]) => {
    const formattedValue = formatValue(newValue);
    if (onValueChange) onValueChange(formattedValue);
  };

  // Auto-select the default option once for empty single-selects. Editing an
  // existing record keeps its value (we only fill when nothing is set).
  useEffect(() => {
    if (!defaultFlag || mode === "multiple" || defaultAppliedRef.current) return;
    if (optionsApi && finalOptions.length === 0) return;

    const rawVal = extractValue(value);
    const hasValue = Array.isArray(rawVal) ? rawVal.length > 0 : !!rawVal;
    if (hasValue) {
      defaultAppliedRef.current = true;
      return;
    }

    const defaultOption = findDefaultOption(finalOptions, defaultFlag, defaultFallbackLabel);
    if (defaultOption) {
      defaultAppliedRef.current = true;
      handleValueChange(defaultOption.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalOptions, value, defaultFlag, defaultFallbackLabel]);

  // Quick-add modal success handler. Multi mode APPENDS: creating a tag from a
  // half-filled Tags field must not throw away the badges already picked.
  const handleQuickAddSuccess = async (result: any) => {
    const newItemId = result?.data?._id;

    if (moduleConfig && newItemId) {
      // Invalidate cache to refetch with new data
      await queryClient.invalidateQueries({
        queryKey: moduleConfig.queryRoot(),
      });

      // Wait a tick for React to re-render with updated options
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Set the newly created item as selected
      handleValueChange(
        mode === "multiple" ? [...multiValue, newItemId] : newItemId,
      );
    }

    setIsModalOpen(false);
    form.reset();
  };

  // The quick-add trigger and its modal, built once and rendered by BOTH modes.
  // They used to live only in the single-mode return, below the `mode ===
  // "multiple"` early return — so a creatable multi select (the product form's
  // Tags) silently rendered no "+" at all. Anything shared by both branches has
  // to be built above them.
  const quickAddButton = creatable && moduleConfig && (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={moduleConfig.title}
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
  );

  const quickAddModal = creatable && moduleConfig && createMutation && (
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
  );

  // Every multi-mode return goes through this, loading and error states
  // included, so the "+" keeps its place instead of popping in once the
  // options land.
  const withQuickAdd = (field: React.ReactNode) => (
    <>
      <div className="flex gap-2 w-full">
        <div className="min-w-0 flex-1">{field}</div>
        {quickAddButton}
      </div>
      {quickAddModal}
    </>
  );

  // Show loading state for both modes
  if (loading) {
    if (mode === "multiple") {
      return withQuickAdd(
        <MultiSelect
          id={id}
          options={[]}
          value={multiValue}
          onValueChange={handleValueChange}
          placeholder="Loading options..."
          variant={variant}
          disabled={true}
          className={cn(error ? "border-red-500" : "", className)}
          maxCount={multiMaxCount}
          modalPopover={modalPopover}
          asChild={asChild}
        />,
      );
    }

    return (
      <Select disabled={true}>
        <SelectTrigger
          id={id}
          className={cn("w-full", error ? "border-red-500" : "", className)}
        >
          <div className="flex items-center gap-2 w-full">
            <Loader2 className="h-4 w-4 animate-spin" />
            <SelectValue placeholder="Loading options..." />
          </div>
        </SelectTrigger>
      </Select>
    );
  }

  // Show error state for both modes
  if (apiError) {
    if (mode === "multiple") {
      return withQuickAdd(
        <MultiSelect
          id={id}
          options={[]}
          value={multiValue}
          onValueChange={handleValueChange}
          placeholder={isPermissionDenied ? apiError : `Error: ${apiError}`}
          variant={variant}
          disabled={true}
          className={cn(isPermissionDenied ? "" : "border-red-500", className)}
          maxCount={multiMaxCount}
          modalPopover={modalPopover}
          asChild={asChild}
        />,
      );
    }

    return (
      <Select disabled={true}>
        <SelectTrigger id={id} className={cn("w-full", isPermissionDenied ? "" : "border-red-500", className)}>
          <SelectValue placeholder={isPermissionDenied ? apiError : `Error: ${apiError}`} />
        </SelectTrigger>
      </Select>
    );
  }

  // Render multi-select mode
  if (mode === "multiple") {
    return withQuickAdd(
      <MultiSelect
        id={id}
        options={finalOptions}
        value={multiValue}
        onValueChange={handleValueChange}
        placeholder={placeholder || "Select options..."}
        variant={variant}
        disabled={disabled}
        className={cn(error ? "border-red-500" : "", className)}
        maxCount={multiMaxCount}
        modalPopover={modalPopover}
        asChild={asChild}
      />,
    );
  }

  // Render single select mode
  const singleValue = Array.isArray(actualValue)
    ? actualValue[0] || ""
    : actualValue || "";

  const handleClearValue = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the select
    handleValueChange(undefined);
  };

  return (
    <>
      <div className="flex gap-2 w-full">
        <div className="relative w-full min-w-0 group">
          <Select
            value={singleValue}
            // Ignore Radix's spurious empty fires (which would wipe an
            // auto-applied default). Real items always have a truthy value;
            // clearing goes through the X button, not this handler.
            onValueChange={(newValue) => {
              if (newValue === CLEAR_OPTION_VALUE) handleValueChange(undefined);
              else if (newValue) handleValueChange(newValue);
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              className={cn(
                "w-full",
                error ? "border-red-500" : "",
                singleValue &&
                  !disabled &&
                  (alwaysShowClear ? "[&>svg]:opacity-0" : "[&>svg]:group-hover:opacity-0"),
                className
              )}
            >
              <SelectValue placeholder={placeholder || "Select an option..."} />
            </SelectTrigger>
            {/* Popper, not Radix's default item-aligned: that lays the menu over
                the trigger, hiding the field the merchant just clicked. */}
            <SelectContent position="popper">
              {clearOptionLabel && (
                <SelectItem value={CLEAR_OPTION_VALUE}>{clearOptionLabel}</SelectItem>
              )}
              {finalOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No data available
                </div>
              ) : (
                finalOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {singleValue && !disabled && (
            <button
              type="button"
              onClick={handleClearValue}
              aria-label="Clear selection"
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 transition-opacity z-10 cursor-pointer",
                alwaysShowClear ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {quickAddButton}
      </div>

      {/* Quick-add modal */}
      {quickAddModal}
    </>
  );
};

export default AdvancedSelect;
