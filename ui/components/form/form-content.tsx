// coding-standard: maintained
import { FC, useMemo } from "react";
import { cn } from "@ui/lib/utils";
import type { FormSection } from "./type";
import { FormField } from "./form-field";
import { FormSectionComponent } from "./form-section";

/**
 * Renders a form's body from its config — either titled sections or a plain
 * 12-column field grid. The layout half of DynamicForm (index.tsx owns the
 * container chrome, submit wiring, and modal/drawer modes).
 */
export const FormContent: FC<{
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
  sectionChrome?: "card" | "plain";
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
  sectionChrome = "card",
}) => {
    // Collect all fields from config (sections or plain fields)
    const allFields = useMemo(() => {
      if (config.sections) {
        return config.sections.flatMap((section: FormSection) => section.fields);
      }
      return config.fields || [];
    }, [config]);

    return (
      <div className={cn("space-y-3 sm:space-y-4", className)}>
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
              chrome={sectionChrome}
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
