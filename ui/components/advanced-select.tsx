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

import { quickAddConfig } from "@/config/quickAddConfig";
import { useSelectOptions } from "@/services/api";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
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
}

export const AdvancedSelect: React.FC<AdvancedSelectProps> = ({
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
}) => {
  // Quick-add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Guards the one-time default auto-select so we never override the user.
  const defaultAppliedRef = useRef(false);
  const queryClient = useQueryClient();
  // Get quick-add config if creatable
  const moduleConfig =
    creatable && quickAddModule ? quickAddConfig[quickAddModule] : null;
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
  const apiError = queryError ? (queryError as Error).message : null;

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

    const defaultOption = finalOptions.find(
      (opt) => (opt as Record<string, unknown>)[defaultFlag] === true,
    );
    if (defaultOption) {
      defaultAppliedRef.current = true;
      handleValueChange(defaultOption.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalOptions, value, defaultFlag]);

  // Show loading state for both modes
  if (loading) {
    if (mode === "multiple") {
      const multiValue = Array.isArray(actualValue)
        ? actualValue
        : actualValue
          ? [actualValue]
          : [];
      return (
        <MultiSelect
          options={[]}
          value={multiValue}
          onValueChange={handleValueChange}
          placeholder="Loading options..."
          variant={variant}
          disabled={true}
          className={cn(error ? "border-red-500" : "", className)}
          maxCount={maxCount}
          modalPopover={modalPopover}
          asChild={asChild}
        />
      );
    }

    return (
      <Select disabled={true}>
        <SelectTrigger
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
      const multiValue = Array.isArray(actualValue)
        ? actualValue
        : actualValue
          ? [actualValue]
          : [];
      return (
        <MultiSelect
          options={[]}
          value={multiValue}
          onValueChange={handleValueChange}
          placeholder={`Error: ${apiError}`}
          variant={variant}
          disabled={true}
          className={cn("border-red-500", className)}
          maxCount={maxCount}
          modalPopover={modalPopover}
          asChild={asChild}
        />
      );
    }

    return (
      <Select disabled={true}>
        <SelectTrigger className={cn("w-full border-red-500", className)}>
          <SelectValue placeholder={`Error: ${apiError}`} />
        </SelectTrigger>
      </Select>
    );
  }

  // Render multi-select mode
  if (mode === "multiple") {
    const multiValue = Array.isArray(actualValue)
      ? actualValue
      : actualValue
        ? [actualValue]
        : [];
    return (
      <MultiSelect
        options={finalOptions}
        value={multiValue}
        onValueChange={handleValueChange}
        placeholder={placeholder || "Select options..."}
        variant={variant}
        disabled={disabled}
        className={cn(error ? "border-red-500" : "", className)}
        maxCount={maxCount}
        modalPopover={modalPopover}
        asChild={asChild}
      />
    );
  }

  // Quick-add modal success handler
  const handleQuickAddSuccess = async (result: any) => {
    const newItemId = result?.data?._id;

    if (moduleConfig && newItemId) {
      // Invalidate cache to refetch with new data
      await queryClient.invalidateQueries({
        queryKey: ["select-options", moduleConfig.optionsApiPath],
      });

      // Wait a tick for React to re-render with updated options
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Set the newly created item as selected
      handleValueChange(newItemId);
    }

    setIsModalOpen(false);
    form.reset();
  };

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
              if (newValue) handleValueChange(newValue);
            }}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                "w-full",
                error ? "border-red-500" : "",
                singleValue && !disabled && "[&>svg]:group-hover:opacity-0",
                className
              )}
            >
              <SelectValue placeholder={placeholder || "Select an option..."} />
            </SelectTrigger>
            <SelectContent>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
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

      {/* Quick-add modal */}
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

export default AdvancedSelect;
