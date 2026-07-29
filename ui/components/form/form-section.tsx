// coding-standard: maintained
import { FC, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@ui/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import type { FormFieldConfig, FormSection } from "./type";
import { evaluateFieldDependencies, normalizeDependencies } from "./dependency-utils";
import { getNestedValue } from "./form-utils";
import { FormField } from "./form-field";

/**
 * A titled group of fields, optionally collapsible and optionally hidden by a
 * section-level dependsOn. A section with a field error is force-open so React
 * Hook Form can't try to focus an unmounted field.
 */
export const FormSectionComponent: FC<{
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
  chrome?: "card" | "plain";
}> = ({
  section,
  control,
  formState,
  watch,
  setValue,
  onFieldChange,
  viewMode = false,
  disabledFieldsInEdit,
  isEditMode = false,
  allFields = [],
  chrome = "card",
}) => {
    const [isOpen, setIsOpen] = useState(section.defaultOpen ?? true);

    // Safety net: a collapsed section must never hide a validation error
    // (otherwise React Hook Form tries to focus an unmounted field). When any
    // field in this section has an error, force the section open — derived, so
    // the user also can't collapse the section while the error is unresolved.
    const hasSectionError = useMemo(() => {
      const errors = formState?.errors || {};
      return section.fields.some(
        (f) => getNestedValue(errors, f.name) !== undefined,
      );
    }, [formState?.errors, section.fields]);
    const effectiveOpen = isOpen || hasSectionError;

    // Section-level dependency evaluation — hide the whole section when the
    // condition (single or AND-group) is not met.
    const sectionDependencies = normalizeDependencies(section.dependsOn);
    const sectionDepValues = useWatch({
      control,
      name: sectionDependencies.length
        ? sectionDependencies.map((d) => d.field)
        : ['__none__'],
      disabled: sectionDependencies.length === 0,
    }) as any[];
    if (sectionDependencies.length) {
      const { shouldHide } = evaluateFieldDependencies(
        sectionDepValues,
        sectionDependencies
      );
      if (shouldHide) return null;
    }

    const content = (
      <CardContent className={cn("px-4 pt-3 pb-4 sm:px-6 sm:pb-5", section.className)}>
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
        <Collapsible open={effectiveOpen} onOpenChange={setIsOpen}>
          <Card className="gap-0 py-0">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors px-4 py-4 sm:px-6">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {section.icon && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
                <div className="flex shrink-0 items-center gap-3 ml-2">
                  {section.headerAction && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {section.headerAction({ control })}
                    </div>
                  )}
                  {effectiveOpen ? (
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

    // Plain chrome: no card, no padding — the section reads as one part of a
    // continuous column. Collapsible sections keep the card either way, since
    // the chevron affordance needs a surface to sit on.
    if (chrome === "plain") {
      return (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {section.description}
                </p>
              )}
            </div>
            {section.headerAction && (
              <div className="shrink-0">{section.headerAction({ control })}</div>
            )}
          </div>
          <div
            className={cn("grid grid-cols-12 gap-3 sm:gap-4 w-full", section.className)}
          >
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
        </section>
      );
    }

    return (
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 pt-4 pb-0 sm:px-6 sm:pt-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
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
            {section.headerAction && (
              <div className="shrink-0">{section.headerAction({ control })}</div>
            )}
          </div>
        </CardHeader>
        {content}
      </Card>
    );
  };
