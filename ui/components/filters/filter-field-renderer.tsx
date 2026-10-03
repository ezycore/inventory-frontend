"use client";

import { FilterField } from '@/types/filter';
import { resolveApiTemplate } from '@ui/components/form/dependency-utils';
import { Input } from '@ui/components/input';
import { NumberField } from '@ui/components/number-field';
import { Label } from '@ui/components/label';
import { AdvancedSelect } from '@ui/components/advanced-select';
import { FuseAdvancedSelect } from '@ui/components/fuse-advanced-select';
import { shouldUseSearchableSelect } from '@ui/components/select-strategy';
import { Checkbox } from '@ui/components/checkbox';
import { DatePicker } from '@ui/components/date-picker';
import { DateRangePicker } from '@ui/components/date-range-picker';
import { format, parseISO } from 'date-fns';
import { cn } from '@ui/lib/utils';

/** A range bound for the calendar: `YYYY-MM-DD` as that local day; a Date as is. */
const toCalendarDay = (value: string | Date): Date =>
  typeof value === 'string' ? parseISO(value) : value;

interface FilterFieldRendererProps {
  field: FilterField;
  value: any;
  onChange: (value: any) => void;
  /**
   * All current filter values — only needed to resolve a `{{template}}`
   * `optionsApi` against a sibling filter. Both entry points pass it.
   */
  values?: Record<string, any>;
  /** Hide the field label — for inline bar controls where the placeholder labels it. */
  hideLabel?: boolean;
  /** Extra classes for the underlying text/number/select control (e.g. `h-8` inline). */
  controlClassName?: string;
}

/**
 * A `{{fieldName}}` optionsApi resolved against the sibling filter it names —
 * the same `resolveApiTemplate` the form selects use, so the two surfaces
 * cannot drift. `null` means the dependency has no value yet: the caller must
 * then fetch nothing and disable the control, because the unresolved URL would
 * either 404 or (worse) return every row unfiltered.
 */
function resolveOptionsApi(
  field: FilterField,
  values: Record<string, any> | undefined,
): string | null {
  if (!field.optionsApi?.includes('{{')) return field.optionsApi ?? null;
  return resolveApiTemplate(field.optionsApi, values ?? {});
}

export function FilterFieldRenderer({
  field,
  value,
  onChange,
  values,
  hideLabel = false,
  controlClassName,
}: FilterFieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(controlClassName)}
          />
        );

      case 'number':
        return (
          <NumberField
            placeholder={field.placeholder}
            value={value === '' || value == null ? null : Number(value)}
            onChange={(v) => onChange(v ?? '')}
            min={field.min}
            max={field.max}
            className={cn(controlClassName)}
          />
        );

      case 'select': {
        // Convert FilterOption[] to SelectOption[] format
        const selectOptions = field.options?.map((option) => ({
          label: option.label,
          value: String(option.value),
          disabled: false,
        })) || [];

        // A multi-select emits an array; the single case keeps coercing to a
        // string so existing filters are untouched.
        const isMulti = field.mode === 'multiple';

        // A dependent select (`?parentId={{categoryId}}`) is inert until the
        // filter it names has a value — disabled rather than hidden, matching
        // how the form renders the same pair, so the filter stays discoverable
        // instead of appearing out of nowhere.
        const optionsApi = resolveOptionsApi(field, values);
        const awaitingDependency = optionsApi === null && !!field.optionsApi;

        // Same auto-strategy as DynamicForm selects (see select-strategy.ts): a
        // remote or long list renders the searchable Fuse combobox; a short
        // static enum stays a plain dropdown.
        //
        // `mode` is load-bearing and was missing. The helper only returns
        // "searchable" for SINGLE selects — Fuse has no multi path, so a
        // multi-select must stay on AdvancedSelect (which delegates to
        // MultiSelect). Omitting `mode` defaulted it to "single", and since
        // every multi filter here is remote (`optionsApi` ⇒ true) they all
        // rendered as plain single-pick dropdowns: no checkboxes, and picking a
        // second value replaced the first. The declared `mode: "multiple"` on
        // the products and inventory tag filters had no effect at all.
        const SelectComponent: typeof FuseAdvancedSelect = shouldUseSearchableSelect({
          mode: isMulti ? 'multiple' : 'single',
          optionsApi: field.optionsApi,
          optionCount: selectOptions.length,
        })
          ? FuseAdvancedSelect
          : AdvancedSelect;

        return (
          <SelectComponent
            mode={isMulti ? 'multiple' : 'single'}
            value={
              isMulti
                ? (Array.isArray(value) ? value.map(String) : [])
                : value
                  ? String(value)
                  : ''
            }
            onValueChange={onChange}
            placeholder={field.placeholder || 'Select...'}
            options={selectOptions}
            optionsApi={optionsApi ?? undefined}
            disabled={awaitingDependency}
            // A filter is undone as often as it is set: the placeholder ("All
            // brands") heads the menu as the way back, and the ✕ stays visible
            // because a touch screen never hovers to reveal it.
            clearOptionLabel={isMulti ? undefined : field.placeholder}
            alwaysShowClear={!isMulti}
            className={cn(controlClassName)}
          />
        );
      }

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const isChecked = selectedValues.includes(option.value);
              return (
                <div key={String(option.value)} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...selectedValues, option.value]);
                      } else {
                        onChange(selectedValues.filter((v) => v !== option.value));
                      }
                    }}
                  />
                  <label
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'number-range':
        return (
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              placeholder="Min"
              value={value?.min ?? null}
              onChange={(v) => onChange({ ...value, min: v ?? undefined })}
              min={field.min}
            />
            <NumberField
              placeholder="Max"
              value={value?.max ?? null}
              onChange={(v) => onChange({ ...value, max: v ?? undefined })}
              max={field.max}
            />
          </div>
        );

      case 'date':
        return (
          <DatePicker
            // `YYYY-MM-DD` in, `YYYY-MM-DD` out. Round-tripping through
            // `new Date("YYYY-MM-DD")` (UTC midnight) shifted the day back one
            // in any browser west of UTC.
            date={value || undefined}
            onSelect={(date) => onChange(date || undefined)}
            placeholder={field.placeholder || 'Select date'}
          />
        );

      case 'date-range':
        return (
          <DateRangePicker
            value={
              value?.from || value?.to
                ? {
                    // `parseISO` reads a bare `YYYY-MM-DD` as that LOCAL day, which
                    // is what the calendar shows; `new Date()` would read UTC.
                    from: value.from ? toCalendarDay(value.from) : undefined,
                    to: value.to ? toCalendarDay(value.to) : undefined,
                  }
                : undefined
            }
            onChange={(range) =>
              onChange(
                range?.from || range?.to
                  ? {
                      from: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                      to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
                    }
                  : undefined
              )
            }
            placeholder={field.placeholder || 'Select date range'}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={!!value}
              onCheckedChange={onChange}
            />
            <label
              htmlFor={field.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {!hideLabel && field.type !== 'boolean' && (
        <Label htmlFor={field.name}>{field.label}</Label>
      )}
      {renderField()}
    </div>
  );
}
