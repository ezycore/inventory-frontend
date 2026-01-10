import { cn } from "@ui/lib/utils";
import { ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import React, { memo } from "react";
import { Controller, useWatch } from "react-hook-form";
import { AdvancedSelect } from "../advanced-select";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Checkbox } from "../checkbox";
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
import { ImageObject } from "@/types/DataTable";

// Helper function to get grid column classes with responsive breakpoints
const getColumnClass = (span: ColumnSpan): string => {
  const spanMap: Record<ColumnSpan, string> = {
    1: "col-span-12 sm:col-span-6 lg:col-span-1",
    2: "col-span-12 sm:col-span-6 lg:col-span-2",
    3: "col-span-12 sm:col-span-6 lg:col-span-3",
    4: "col-span-12 sm:col-span-6 lg:col-span-4",
    6: "col-span-12 sm:col-span-6 lg:col-span-6",
    12: "col-span-12",
  };
  return spanMap[span] || "col-span-12";
};

// Individual field components - Memoized for performance
const FormField: React.FC<{
  field: FormFieldConfig;
  control: any;
  formState: any;
  watch: any;
  setValue: any;
  onFieldChange?: (fieldName: string, value: any) => void;
  viewMode?: boolean;
}> = memo(({
  field,
  control,
  formState,
  watch,
  setValue,
  onFieldChange,
  viewMode = false,
}) => {
    const error = formState.errors[field.name]?.message;
    
    // Use useWatch for better performance - only subscribes to specific fields
    const fieldValue = useWatch({ control, name: field.name });
    const showWhenValue = useWatch({ 
      control, 
      name: field.showWhen?.field || field.name,
      disabled: !field.showWhen 
    });
    // Watch dependent field value at component level (for select fields)
    const dependsOnValue = useWatch({ 
      control, 
      name: field.dependsOn || field.name,
      disabled: !field.dependsOn 
    });

    // Check conditional display
    if (field.showWhen) {
      const { value, operator = "equals" } = field.showWhen;

      let shouldShow = false;
      switch (operator) {
        case "equals":
          shouldShow = showWhenValue === value;
          break;
        case "not-equals":
          shouldShow = showWhenValue !== value;
          break;
        case "includes":
          shouldShow = Array.isArray(showWhenValue)
            ? showWhenValue.includes(value)
            : false;
          break;
        case "not-includes":
          shouldShow = Array.isArray(showWhenValue)
            ? !showWhenValue.includes(value)
            : true;
          break;
      }

      if (!shouldShow) return null;
    }

    if (field.hidden) return null;

    const handleChange = (value: any) => {
      if (field.onChange) field.onChange(value);
      if (onFieldChange) onFieldChange(field.name, value);
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
                // BrandImage structure: { url: { thumbnail, medium, original }, publicId }
                if (file.url) {
                  displayUrl = file.url.thumbnail?.secureUrl || 
                              file.url.medium?.secureUrl || 
                              file.url.original?.secureUrl || 
                              file.url.thumbnail?.url || 
                              file.url.medium?.url || 
                              file.url.original?.url;
                }
                // Also check for direct URL properties
                else if (file.original?.url) {
                  displayUrl = file.original.url;
                }
                displayName = file.publicId?.split('/').pop() || 'Existing file';
              }

              if (!displayUrl) return null;
              
              return (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <img
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
                  disabled={field.disabled}
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
                  disabled={field.disabled}
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
          return(
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField })=>(
                <Password
                  {...controllerField}
                  type={"password"}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
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
                return (
                  <AdvancedSelect
                    value={controllerField.value}
                    onValueChange={(value) => {
                      controllerField.onChange(value);
                      handleChange(value);
                      if (field.onValueChange) field.onValueChange(value);
                    }}
                    className={error ? "border-red-500" : ""}
                    {...field}
                    dependsOnValue={dependsOnValue}
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
                    disabled={field.disabled}
                  />
                  <Label htmlFor={field.name}>{field.label}</Label>
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
                  disabled={field.disabled}
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
              render={({ field: controllerField }) => (
                <Input
                  value={controllerField.value ?? ""}
                  {...controllerField}
                  type="date"
                  disabled={field.disabled}
                  onChange={(e) => {
                    controllerField.onChange(e.target.value);
                    handleChange(e.target.value);
                  }}
                  className={cn("w-full min-w-0", error ? "border-red-500" : "")}
                />
              )}
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
                
                // Convert BrandImage objects to displayable format
                if(Array.isArray(files) && files.length) {
                  const modifiedFiles = files.map(file => {
                    if (typeof file === "string") {
                      return file; // existing URL string
                    } else if (file instanceof File) {
                      return file; // new File object
                    } else if (file && typeof file === "object") {
                      // BrandImage structure: { url: { thumbnail, medium, original }, publicId }
                      if (file.url) {
                        return file; // Keep the full BrandImage object
                      }
                      // Legacy format check
                      else if (file.original?.url) {
                        return file.original.url;
                      }
                    }
                    return file;
                  });
                  files = modifiedFiles;
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
                            // BrandImage structure: { url: { thumbnail, medium, original }, publicId }
                            fileKey = `${file.publicId || index}-${index}`;
                            fileName = file.publicId?.split('/').pop() || 'Existing file';
                            fileSize = 'Uploaded';
                            previewUrl = file.url?.thumbnail?.secureUrl || 
                                        file.url?.medium?.secureUrl || 
                                        file.url?.original?.secureUrl || 
                                        file.url?.thumbnail?.url || 
                                        file.url?.medium?.url || 
                                        file.url?.original?.url || 
                                        null;
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
                                <img 
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
        )}
        <div className="w-full min-w-0 flex-1">
          {viewMode ? renderViewMode() : renderField()}
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
const FormSectionComponent: React.FC<{
  section: FormSection;
  control: any;
  formState: any;
  watch: any;
  setValue: any;
  onFieldChange?: (fieldName: string, value: any) => void;
  maxColumns: number;
  viewMode?: boolean;
}> = ({
  section,
  control,
  formState,
  watch,
  setValue,
  onFieldChange,
  maxColumns,
  viewMode = false,
}) => {
    const [isOpen, setIsOpen] = React.useState(section.defaultOpen ?? true);

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
const FormContent: React.FC<{
  config: any;
  control: any;
  formState: any;
  watch: any;
  setValue: any;
  onFieldChange?: any;
  className?: string;
  viewMode?: boolean;
}> = ({
  config,
  control,
  formState,
  watch,
  setValue,
  onFieldChange,
  className,
  viewMode = false,
}) => {
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
              />
            ))}
          </div>
        )}
      </div>
    );
  };

export { FormContent };
