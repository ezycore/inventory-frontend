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
import type { SelectOption, FieldDependency } from "@/ui/components/form/type";
import { resolveApiTemplate, extractValue as extractValueFromObject } from "@/ui/components/form/dependency-utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { cn } from "@ui/lib/utils";
import { Loader2, Plus } from "lucide-react";
import React, { useState, useMemo } from "react";
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
  dependsOn?: FieldDependency;
  dependsOnValue?: string | null | LabelValueOption;

  // Multi-select specific props
  variant?: "default" | "secondary" | "destructive" | "inverted";
  maxCount?: number;
  modalPopover?: boolean;
  asChild?: boolean;

  // Quick-add functionality
  creatable?: boolean;
  quickAddModule?: string;
  itemsCreateCallback?: (response: any) => SelectOption[];
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
  dependsOnValue,
  variant = "default",
  maxCount,
  modalPopover,
  asChild,
  labelInValue = false,
  creatable = false,
  quickAddModule,
  itemsCreateCallback,
}) => {
  // Quick-add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  // Get quick-add config if creatable
  const moduleConfig =
    creatable && quickAddModule ? quickAddConfig[quickAddModule] : null;
  const { form } = useDynamicForm(moduleConfig?.formConfig || { fields: [] });
  const createMutation = moduleConfig?.useMutation();

  // Helper: Extract value string from dependsOnValue (handles labelInValue format)
  const extractDependsOnValue = (
    depValue: string | null | LabelValueOption | undefined,
  ): any => {
    if (!depValue) return null;
    if (typeof depValue === "object") {
      // Extract using matchWithProp if specified in dependency
      if (dependsOn?.matchWithProp) {
        return extractValueFromObject(depValue, dependsOn.matchWithProp);
      }
      // Default to value property
      return depValue.value || depValue;
    }
    return depValue;
  };

  // Helper: Extract actual value string(s) from SelectValue (handles labelInValue format)
  const extractValue = (val: SelectValue | undefined): string | string[] => {
    if (!val) return "";
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === "object" ? v.value : v));
    }
    return typeof val === "object" ? val.value : val;
  };

  // Helper: Find label for a value from options
  const findLabelForValue = (valueStr: string): string => {
    const option = finalOptions.find((opt) => opt.value === valueStr);
    return option?.label || valueStr;
  };

  // Helper: Convert value string(s) to labelInValue format if needed
  const formatValue = (rawValue: string | string[]): SelectValue => {
    if (!labelInValue) return rawValue;

    if (Array.isArray(rawValue)) {
      return rawValue.map((v) => ({ label: findLabelForValue(v), value: v }));
    }
    return { label: findLabelForValue(rawValue), value: rawValue };
  };

  // Resolve API endpoint with template placeholders
  const finalApiEndpoint = useMemo(() => {
    if (!optionsApi) return null;

    // Check if optionsApi contains template placeholders
    if (optionsApi.includes('{{')) {
      // Extract actual value from dependsOnValue
      const actualDependsOnValue = extractDependsOnValue(dependsOnValue);
      
      // Build values object for template resolution
      const templateValues: Record<string, any> = {};
      if (dependsOn?.field && actualDependsOnValue) {
        templateValues[dependsOn.field] = actualDependsOnValue;
      }
      
      // Resolve template
      return resolveApiTemplate(optionsApi, templateValues);
    }

    // No template, return as is
    return optionsApi;
  }, [optionsApi, dependsOn, dependsOnValue]);

  // Disable select if dependent field has no value (when using templates)
  const isDependentAndEmpty = optionsApi?.includes('{{') && !finalApiEndpoint;
  const isDisabled = disabled || isDependentAndEmpty;

  // Use the useSelectOptions hook for API-driven options
  const {
    data: apiOptions,
    isLoading: loading,
    error: queryError,
  } = useSelectOptions(finalApiEndpoint, itemsCreateCallback);
  // Determine which options to use
  const finalOptions = finalApiEndpoint ? apiOptions || [] : options || [];
  const apiError = queryError ? (queryError as Error).message : null;

  // Extract actual value strings for rendering
  const actualValue = extractValue(value);

  // Handle value changes for both single and multiple modes
  const handleValueChange = (newValue: string | string[]) => {
    const formattedValue = formatValue(newValue);
    if (onValueChange) onValueChange(formattedValue);
  };

  // Show waiting state if dependent field has no value
  if (isDependentAndEmpty) {
    const waitingPlaceholder = placeholder || (dependsOn?.field ? `Select ${dependsOn.field} first` : 'Waiting for dependency');
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
          placeholder={waitingPlaceholder}
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
          <SelectValue placeholder={waitingPlaceholder} />
        </SelectTrigger>
      </Select>
    );
  }

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
        disabled={isDisabled}
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
  return (
    <>
      <div className="flex gap-2 w-full">
        <Select
          value={singleValue}
          onValueChange={handleValueChange}
          disabled={isDisabled}
        >
          <SelectTrigger
            className={cn("w-full", error ? "border-red-500" : "", className)}
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

        {creatable && moduleConfig && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsModalOpen(true)}
            disabled={isDisabled}
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
