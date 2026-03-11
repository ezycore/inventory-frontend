import { cn } from "@ui/lib/utils";
import { ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import { FC, memo, useMemo, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import Link from "next/link";
import { AdvancedSelect } from "../advanced-select";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Checkbox } from "../checkbox";
import { DatePicker } from "../date-picker";
import { Switch } from "../switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemPreview,
  FileUploadList,
} from "../file-upload";
import { Input } from "../input";
import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Textarea } from "../textarea";

import type {
  ColumnSpan,
  FormFieldConfig,
  FormSection,
} from "@/ui/components/form/type";
import { Password } from "../input-password";
import { SafeImage } from '@/ui/components/safeImage';
import { evaluateFieldDependency, resolveApiTemplate } from "./dependency-utils";
import { useSelectOptions } from "@/services/api";

// Helper to get a nested value from an object by dot-separated path
const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
};

// Helper function to get grid column classes with responsive breakpoints
const getColumnClass = (span: ColumnSpan): string => {
  const spanMap: Record<ColumnSpan, string> = {
    1: "col-span-12 sm:col-span-6 lg:col-span-1",
    2: "col-span-12 sm:col-span-6 lg:col-span-2",
    3: "col-span-12 sm:col-span-6 lg:col-span-3",
    4: "col-span-12 sm:col-span-6 lg:col-span-4",
    6: "col-span-12 sm:col-span-6 lg:col-span-6",
    8: "col-span-12 sm:col-span-6 lg:col-span-8",
    12: "col-span-12",
  };
  return spanMap[span] || "col-span-12";
};

// Individual field components - Memoized for performance
const FormField: FC<{
  field: FormFieldConfig;
  control: any;
  formState: any;
  watch: any;
  setValue: any;
  onFieldChange?: (fieldName: string, value: any, allValues: any) => void;
  viewMode?: boolean;
  disabledFieldsInEdit?: string[];
  isEditMode?: boolean;
  allFields?: FormFieldConfig[]; // All fields to look up dependency field config
}> = memo(({
  field,
  control,
  formState,
  watch,
  setValue,
  onFieldChange,
  viewMode = false,
  disabledFieldsInEdit,
  isEditMode = false,
  allFields = [],
}) => {
  const error = getNestedValue(formState.errors, field.name)?.message;

  // Check if field should be disabled in edit mode
  const isFieldDisabledInEdit = isEditMode && disabledFieldsInEdit?.includes(field.name);

  // Use useWatch for better performance - only subscribes to specific fields
  const fieldValue = useWatch({ control, name: field.name });

  // Watch dependent field value if dependency exists
  const dependencyRawValue = useWatch({
    control,
    name: field.dependsOn?.field || field.name,
    disabled: !field.dependsOn
  });

  // Find the dependency field's configuration
  const dependencyField = useMemo(() => {
    if (!field.dependsOn) return null;
    return allFields.find(f => f.name === field.dependsOn!.field);
  }, [field.dependsOn, allFields]);

  // Fetch API options for dependency field if it uses optionsApi
  // This will use cached data from TanStack Query if already fetched
  const { data: dependencyApiOptions } = useSelectOptions(
    dependencyField?.optionsApi || null,
    dependencyField?.itemsCreateCallback
  );

  // Enrich dependency value with full option data if it's a select field
  const dependencyWatchedValue = useMemo(() => {
    if (!field.dependsOn || !dependencyRawValue) return dependencyRawValue;

    // If value is already an object with all the data we need, use it
    if (typeof dependencyRawValue === 'object' && dependencyRawValue !== null) {
      return dependencyRawValue;
    }

    // If dependency field has static options, look up from config
    if (dependencyField?.type === 'select' && dependencyField.options) {
      const fullOption = dependencyField.options.find(opt => opt.value === dependencyRawValue);
      return fullOption || dependencyRawValue;
    }

    // If dependency field has optionsApi, look up from API data
    if (dependencyField?.type === 'select' && dependencyApiOptions) {
      const fullOption = dependencyApiOptions.find(opt => opt.value === dependencyRawValue);
      return fullOption || dependencyRawValue;
    }

    return dependencyRawValue;
  }, [dependencyRawValue, field.dependsOn, dependencyField, dependencyApiOptions]);


  // Evaluate dependency and determine field state
  const { shouldHide, shouldDisable } = evaluateFieldDependency(
    dependencyWatchedValue,
    field.dependsOn
  );

  // Determine effective disabled state
  const effectiveDisabled = field.disabled || isFieldDisabledInEdit || shouldDisable;

  // Hide field if dependency condition requires it
  if (field.hidden || shouldHide) return null;

  const handleChange = (value: any) => {
    if (field.onChange) field.onChange(value);
    if (onFieldChange) {
      // Get all current form values
      const allValues = watch();
      onFieldChange(field.name, value, allValues);
    }
  };

  // Render read-only display in view mode
  const renderViewMode = () => {
    let displayValue = fieldValue;

    if (field.type === "select" && field.options) {
      const option = field.options.find((opt) => opt.value === fieldValue);
      displayValue = option?.label || fieldValue;
    } else if (field.type === "checkbox") {
      displayValue = fieldValue ? "Yes" : "No";
    } else if (field.type === "file-upload") {
      // Handle file-upload view mode
      if (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) {
        return <p className="text-sm text-muted-foreground">No file uploaded</p>;
      }

      let files = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

      return (
        <div className="space-y-2">
          {files.map((file: any, index: number) => {
            let displayUrl: string | null = null;
            let displayName = 'Uploaded file';

            if (typeof file === "string") {
              // Simple string URL
              displayUrl = file;
              displayName = file.split('/').pop() || 'Existing file';
            } else if (file instanceof File) {
              // File object (newly uploaded)
              displayUrl = URL.createObjectURL(file);
              displayName = file.name;
            } else if (file && typeof file === "object") {
              // Image interface: { url, thumbnailUrl?, mediumUrl?, publicId }
              displayUrl = file.thumbnailUrl || file.url;
              displayName = file.publicId?.split('/').pop() || 'Existing file';
            }

            if (!displayUrl) return null;

            return (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <SafeImage
                  src={displayUrl}
                  alt={displayName}
                  className="h-16 w-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                </div>
                {typeof file === "string" || (file && file.url) ? (
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <p className="text-sm text-muted-foreground">{displayValue || "-"}</p>
    );
  };

  const renderField = () => {
    switch (field.type) {
      case "input":
      case "number":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              min: field.validation?.min
                ? {
                  value: field.validation.min,
                  message: `Minimum value is ${field.validation.min}`,
                }
                : undefined,
              max: field.validation?.max
                ? {
                  value: field.validation.max,
                  message: `Maximum value is ${field.validation.max}`,
                }
                : undefined,
            }}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                value={controllerField.value ?? ""}
                type={field.type === "number" ? "number" : "text"}
                placeholder={field.placeholder}
                disabled={effectiveDisabled}
                min={field.validation?.min}
                max={field.validation?.max}
                step={field.step}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  let value;

                  if (field.type === "number") {
                    // Allow empty string for clearing the field
                    if (rawValue === "" || rawValue === null || rawValue === undefined) {
                      value = "";
                    } else {
                      const parsed = parseFloat(rawValue);
                      value = isNaN(parsed) ? "" : parsed;
                    }
                  } else {
                    value = rawValue;
                  }

                  controllerField.onChange(value);
                  handleChange(value);
                }}
                className={cn("w-full", error ? "border-red-500" : "")}
              />
            )}
          />
        );

      case "textarea":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
            }}
            render={({ field: controllerField }) => (
              <Textarea
                {...controllerField}
                value={controllerField.value ?? ""}
                placeholder={field.placeholder}
                disabled={effectiveDisabled}
                rows={field.rows || 3}
                onChange={(e) => {
                  controllerField.onChange(e.target.value);
                  handleChange(e.target.value);
                }}
                className={cn("w-full", error ? "border-red-500" : "")}
              />
            )}
          />
        );

      case "password":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <Password
                {...controllerField}
                type={"password"}
                placeholder={field.placeholder}
                disabled={effectiveDisabled}
                min={field.validation?.min}
                max={field.validation?.max}
                onChange={(e) => {
                  controllerField.onChange(e.target.value);
                  handleChange(e.target.value);
                }}
                className={cn("w-full", error ? "border-red-500" : "")}
              />
            )}
          />
        );

      case "select":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              validate: field.required
                ? (value: any) => {
                  if (
                    !value ||
                    value === "" ||
                    value === "__loading__" ||
                    value === "__error__"
                  ) {
                    return `${field.label} is required`;
                  }
                  return true;
                }
                : undefined,
            }}
            render={({ field: controllerField }) => {
              // Resolve API endpoint with dependency checking
              let resolvedOptionsApi = field.optionsApi;

              if (field.optionsApi && field.dependsOn && field.optionsApi.includes('{{')) {
                // Only process if there's a watched value
                if (dependencyWatchedValue) {
                  // Check if dependency condition is met
                  const { shouldDisable } = evaluateFieldDependency(
                    dependencyWatchedValue,
                    field.dependsOn
                  );

                  // Only resolve template if condition is met (shouldDisable = false means condition met)
                  if (!shouldDisable) {
                    resolvedOptionsApi = resolveApiTemplate(
                      field.optionsApi,
                      dependencyWatchedValue
                    );
                  } else {
                    // Condition not met, don't call API
                    resolvedOptionsApi = undefined;
                  }
                } else {
                  // No watched value yet, don't call API
                  resolvedOptionsApi = undefined;
                }
              }

              // Destructure field to exclude props that shouldn't be passed to AdvancedSelect
              const { dependsOn, autoFillFields, ...selectProps } = field;

              // Shared autofill handler used by both onMount and onValueChange
              const handleAutoFill = (value: any) => {
                const allValues = watch();
                if (autoFillFields && Array.isArray(autoFillFields) && value) {
                  const selectedOption = typeof value === 'object' && value !== null ? value : null;
                  if (selectedOption) {
                    autoFillFields.forEach((fieldName) => {
                      const valueToSet = (selectedOption as Record<string, any>)[fieldName];
                      if (valueToSet !== undefined) {
                        setValue(fieldName, valueToSet, {
                          shouldValidate: false,
                          shouldDirty: true,
                        });
                        if (onFieldChange) onFieldChange(fieldName, valueToSet, allValues);
                      }
                    });
                  }
                }
              };

              return (
                <AdvancedSelect
                  value={controllerField.value}
                  onMount={(mountedValue) => handleAutoFill(mountedValue)}
                  onValueChange={(value) => {
                    controllerField.onChange(value);
                    handleChange(value);
                    if (field.onValueChange) field.onValueChange(value);
                    handleAutoFill(value);
                  }}
                  className={error ? "border-red-500" : ""}
                  {...selectProps}
                  optionsApi={resolvedOptionsApi}
                  disabled={effectiveDisabled}
                  error={error}
                />
              )
            }}
          />
        );

      case "checkbox":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.name}
                  checked={controllerField.value}
                  onCheckedChange={(checked) => {
                    controllerField.onChange(checked);
                    handleChange(checked);
                  }}
                  disabled={effectiveDisabled}
                />
                <Label htmlFor={field.name}>{field.label}</Label>
              </div>
            )}
          />
        );
      case "switch":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.name}
                  checked={controllerField.value}
                  onCheckedChange={(checked) => {
                    controllerField.onChange(checked);
                    handleChange(checked);
                  }}
                  disabled={effectiveDisabled}
                />
                {/* <Label htmlFor={field.name}>{field.label}</Label> */}
              </div>
            )}
          />
        );
      case "radio-group":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
            }}
            render={({ field: controllerField }) => (
              <RadioGroup
                className="flex items-center gap-5"
                value={controllerField.value}
                onValueChange={(value) => {
                  controllerField.onChange(value);
                  handleChange(value);
                }}
                disabled={effectiveDisabled}
              >
                {field.options?.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center gap-2"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        );

      case "date":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
            }}
            render={({ field: controllerField }) => {
              return (
                <DatePicker
                  date={controllerField.value}
                  onSelect={(value) => {
                    controllerField.onChange(value);
                    handleChange(value);
                  }}
                  placeholder={field.placeholder || "Pick a date"}
                  disabled={effectiveDisabled}
                />
              );
            }}
          />
        );

      case "file-upload":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
            }}
            render={({ field: controllerField }) => {
              let files: (File | string | any)[] = controllerField.value || [];

              // Normalize to array format
              if (!Array.isArray(files)) {
                files = files ? [files] : [];
              }

              const acceptedTypes = field.accept || "*";
              const maxFiles = field.maxFiles || 1;
              const maxSize = field.maxSize || 5 * 1024 * 1024; // 5MB default
              const showPreview = field.showPreview !== false;
              const hasFiles = files.length > 0;
              const isSingleFileMode = maxFiles === 1;
              const shouldHideDropzone = isSingleFileMode && hasFiles;

              const handleFileChange = (selectedFiles: (File | string)[]) => {
                console.log("File upload changed:", selectedFiles); // Debug log
                controllerField.onChange(selectedFiles);
                handleChange(selectedFiles);
              };
              return (
                <FileUpload
                  value={files}
                  onValueChange={handleFileChange}
                  accept={acceptedTypes}
                  maxFiles={maxFiles}
                  maxSize={maxSize}
                  multiple={field.multiple}
                  disabled={field.disabled}
                >
                  {!shouldHideDropzone && (
                    <FileUploadDropzone className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="font-semibold text-primary">
                            Click to upload
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            or drag and drop
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {field.dropzoneText ||
                            `${acceptedTypes.toUpperCase()} up to ${(
                              maxSize /
                              1024 /
                              1024
                            ).toFixed(0)}MB ${maxFiles > 1 ? `(Max ${maxFiles} files)` : ""
                            }`}
                        </p>
                      </div>
                    </FileUploadDropzone>
                  )}

                  {shouldHideDropzone && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Remove the existing file to upload a new one
                    </div>
                  )}

                  {showPreview && files.length > 0 && (
                    <FileUploadList className="mt-4">
                      {files.map((file: any, index: number) => {
                        let fileKey: string;
                        let fileName: string;
                        let fileSize: string;
                        let previewUrl: string | null = null;

                        if (file instanceof File) {
                          // New File object
                          fileKey = `${file.name}-${index}`;
                          fileName = file.name;
                          fileSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                          previewUrl = URL.createObjectURL(file);
                        } else if (typeof file === "string") {
                          // Simple string URL
                          fileKey = `${file}-${index}`;
                          fileName = file.split('/').pop() || 'Existing file';
                          fileSize = 'Uploaded';
                          previewUrl = file;
                        } else if (file && typeof file === "object") {
                          // Image interface: { url, thumbnailUrl?, mediumUrl?, publicId }
                          fileKey = `${file.publicId || index}-${index}`;
                          fileName = file.publicId?.split('/').pop() || 'Existing file';
                          fileSize = 'Uploaded';
                          previewUrl = file.thumbnailUrl || file.url;
                        } else {
                          return null;
                        }

                        return (
                          <FileUploadItem
                            key={fileKey}
                            value={file}
                            className="flex items-center gap-3 p-3 border rounded-lg"
                          >
                            {previewUrl ? (
                              <SafeImage
                                src={previewUrl}
                                alt={fileName}
                                className="h-16 w-16 rounded object-cover bg-gray-100"
                              />
                            ) : (
                              <FileUploadItemPreview className="h-16 w-16 rounded overflow-hidden bg-gray-100" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fileSize}
                              </p>
                              {index === 0 && maxFiles > 1 && (
                                <span className="inline-block mt-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                  Primary
                                </span>
                              )}
                            </div>
                            <FileUploadItemDelete asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </FileUploadItemDelete>
                          </FileUploadItem>
                        );
                      })}
                    </FileUploadList>
                  )}
                </FileUpload>
              );
            }}
          />
        );

      case "custom":
        // First check for customComponent prop
        if (field.customComponent) {
          const CustomComponent = field.customComponent;
          return (
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <CustomComponent
                  {...controllerField}
                  {...field.customProps}
                  control={control}
                  onChange={(value: any) => {
                    controllerField.onChange(value);
                    handleChange(value);
                  }}
                  error={error}
                />
              )}
            />
          );
        }

        // Check for registered custom field renderer by field name
        if (
          typeof window !== "undefined" &&
          (window as any).__customFieldRenderers
        ) {
          const renderers = (window as any).__customFieldRenderers;
          const CustomRenderer = renderers[field.name];
          if (CustomRenderer) {
            return (
              <CustomRenderer
                control={control}
                name={field.name}
                maxCount={field.maxCount}
                error={error}
              />
            );
          }
        }
        return null;

      case "custom-fields":
        // Use a component registry approach - check if a custom field renderer is provided
        if (
          typeof window !== "undefined" &&
          (window as any).__customFieldRenderers
        ) {
          const renderers = (window as any).__customFieldRenderers;
          const CustomRenderer = renderers[field.name];
          if (CustomRenderer) {
            return (
              <CustomRenderer
                control={control}
                name={field.name}
                maxCount={field.maxCount}
                error={error}
              />
            );
          }
        }

        // Fallback to placeholder if no custom renderer found
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <div className="p-4 border-2 border-dashed border-muted rounded-lg">
                <p className="text-center text-muted-foreground">
                  Custom field: {field.name}
                </p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Type: {field.type} | Register a custom renderer to display
                  this field
                </p>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Current value: {JSON.stringify(controllerField.value) || "[]"}
                </p>
              </div>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        getColumnClass(field.columnSpan || 12),
        "w-full min-w-0 flex flex-col",
        field.className
      )}
    >
      {field.type !== "checkbox" && (
        <div className="flex items-center justify-between mb-2">
          <Label
            htmlFor={field.name}
            className="text-sm gap-1 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {field.label}
            {!viewMode && field.required && (
              <span className="text-red-500">*</span>
            )}
          </Label>
        </div>
      )}        <div className="w-full min-w-0 flex-1">
        {field.type === "select" && field.action ? (
          <div className="flex gap-2 w-full">
            {viewMode ? renderViewMode() : renderField()}
            {!viewMode && field.action.renderItem ? (
              field.action.renderItem()
            ) : field.action.href ? (
              <Link href={field.action.href}>
                <Button
                  type="button"
                  variant={field.action.variant || "outline"}
                  size="icon"
                  disabled={field.action.disabled}
                >
                  {field.action.icon}
                </Button>
              </Link>
            ) : field.action.onClick ? (
              <Button
                type="button"
                variant={field.action.variant || "outline"}
                size="icon"
                onClick={field.action.onClick}
                disabled={field.action.disabled}
              >
                {field.action.icon}
              </Button>
            ) : null}
          </div>
        ) : (
          viewMode ? renderViewMode() : renderField()
        )}
      </div>
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}
      {!viewMode && error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if these specific props change
  return (
    prevProps.field.name === nextProps.field.name &&
    prevProps.formState.errors[prevProps.field.name] === nextProps.formState.errors[nextProps.field.name] &&
    prevProps.viewMode === nextProps.viewMode
  );
});

FormField.displayName = 'FormField';

// Section component
const FormSectionComponent: FC<{
  section: FormSection;
  control: any;
  formState: any;
  watch: any;
  setValue: any;
  onFieldChange?: (fieldName: string, value: any) => void;
  maxColumns: number;
  viewMode?: boolean;
  disabledFieldsInEdit?: string[];
  isEditMode?: boolean;
  allFields?: FormFieldConfig[];
}> = ({
  section,
  control,
  formState,
  watch,
  setValue,
  onFieldChange,
  maxColumns,
  viewMode = false,
  disabledFieldsInEdit,
  isEditMode = false,
  allFields = [],
}) => {
    const [isOpen, setIsOpen] = useState(section.defaultOpen ?? true);

    const content = (
      <CardContent className={cn("space-y-4 pt-4", section.className)}>
        <div className="grid grid-cols-12 gap-3 sm:gap-4 w-full">
          {section.fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              control={control}
              formState={formState}
              watch={watch}
              setValue={setValue}
              onFieldChange={onFieldChange}
              viewMode={viewMode}
              disabledFieldsInEdit={disabledFieldsInEdit}
              isEditMode={isEditMode}
              allFields={allFields}
            />
          ))}
        </div>
      </CardContent>
    );

    if (section.collapsible) {
      return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors p-4 sm:p-6">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {section.icon && (
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      {section.icon}
                    </div>
                  )}
                  <div className="text-left min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">
                      {section.title}
                    </CardTitle>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>{content}</CollapsibleContent>
          </Card>
        </Collapsible>
      );
    }

    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            {section.icon && (
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                {section.icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg truncate">
                {section.title}
              </CardTitle>
              {section.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {section.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        {content}
      </Card>
    );
  };

// Main DynamicForm component
// Form content component (extracted for reuse)
const FormContent: FC<{
  config: any;
  control: any;
  formState: any;
  watch: any;
  setValue: any;
  onFieldChange?: any;
  className?: string;
  viewMode?: boolean;
  disabledFieldsInEdit?: string[];
  isEditMode?: boolean;
}> = ({
  config,
  control,
  formState,
  watch,
  setValue,
  onFieldChange,
  className,
  viewMode = false,
  disabledFieldsInEdit,
  isEditMode = false,
}) => {
    // Collect all fields from config (sections or plain fields)
    const allFields = useMemo(() => {
      if (config.sections) {
        return config.sections.flatMap((section: FormSection) => section.fields);
      }
      return config.fields || [];
    }, [config]);

    return (
      <div className={cn("space-y-4 sm:space-y-6", className)}>
        {/* Render sections if available */}
        {config.sections &&
          config.sections.map((section: any, index: number) => (
            <FormSectionComponent
              key={`${section.title}-${index}`}
              section={section}
              control={control}
              formState={formState}
              watch={watch}
              setValue={setValue}
              onFieldChange={onFieldChange}
              maxColumns={12}
              viewMode={viewMode}
              disabledFieldsInEdit={disabledFieldsInEdit}
              isEditMode={isEditMode}
              allFields={allFields}
            />
          ))}

        {/* Render plain fields if no sections */}
        {config.fields && !config.sections && (
          <div className="grid grid-cols-12 gap-3 sm:gap-4 w-full">
            {config.fields.map((field: any) => (
              <FormField
                key={field.name}
                field={field}
                control={control}
                formState={formState}
                watch={watch}
                setValue={setValue}
                onFieldChange={onFieldChange}
                viewMode={viewMode}
                disabledFieldsInEdit={disabledFieldsInEdit}
                isEditMode={isEditMode}
                allFields={allFields}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

export { FormContent };
